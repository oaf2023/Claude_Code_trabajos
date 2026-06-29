/* ============================================================================
* Archivo         : AlertService.ts
* Descripción     : Orquestación local del envío de alertas SOS con máquina
*                   de estados persistente, cola de reintentos y tolerancia
*                   a fallos de ubicación.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AlertService.send('manual')
* ============================================================================ */

import { Alert as AppAlert, AlertContact } from '../types/Alert';
import { Contact } from '../types/Contact';
import { LocationService } from './LocationService';
import { AudioRecordingService } from './AudioRecordingService';
import { alertsCol, ensureAuthenticated } from '../config/firebase';
import { SMS_PREFIX, SMS_TEST_PREFIX } from '../config/constants';
import { useGuardStore } from '../stores/useGuardStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useContactsStore } from '../stores/useContactsStore';
import { MessageFormatter } from '../utils/MessageFormatter';
import { IAProcessingService } from './IAProcessingService';
import { AudioAlertApiService } from './AudioAlertApiService';
import {
  useAlertMachineStore,
  buildContactDeliveries,
} from './AlertStateMachine';
import { AlertQueue, QueuedAlert } from './AlertQueue';

const alertWatchers = new Map<string, () => void>();

/* ============================================================================
* Función         : stopAlertWatcher
* Descripción     : Libera la suscripción activa asociada a una alerta concreta.
* Fecha           : 2026-03-25
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : startAlertWatcher
* Ingesta         : alertId: string
* Devolución      : void
* Uso             : stopAlertWatcher(alertId)
* ============================================================================ */
function stopAlertWatcher(alertId: string): void {
  const unsubscribe = alertWatchers.get(alertId);
  if (unsubscribe) {
    unsubscribe();
    alertWatchers.delete(alertId);
  }
}

/* ============================================================================
* Función         : startAlertWatcher
* Descripción     : Escucha el documento de alerta para reflejar el resultado real del backend en la UI.
* Fecha           : 2026-03-25
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : alertsCol, useGuardStore
* Ingesta         : userId: string, alertId: string
* Devolución      : void
* Uso             : startAlertWatcher(userId, alertId)
* ============================================================================ */
function startAlertWatcher(userId: string, alertId: string): void {
  stopAlertWatcher(alertId);

  const unsubscribe = alertsCol(userId)
    .doc(alertId)
    .onSnapshot(
      (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        const updatedAlert = {
          id: snapshot.id,
          ...(snapshot.data() as Omit<AppAlert, 'id'>),
        } as AppAlert;

        useGuardStore.getState().setLastAlert(updatedAlert);

        if (updatedAlert.status === 'failed') {
          useGuardStore.getState().setAlertPhase('error');
          stopAlertWatcher(alertId);
          return;
        }

        if (updatedAlert.status === 'sent' || updatedAlert.status === 'partial') {
          useGuardStore.getState().setAlertPhase('sent');
          stopAlertWatcher(alertId);
        }
      },
      (error) => {
        console.warn('[AlertService] No se pudo seguir el estado de la alerta:', error);
        stopAlertWatcher(alertId);
      }
    );

  alertWatchers.set(alertId, unsubscribe);
}

function getActiveContacts(): Contact[] {
  return useContactsStore.getState().activeContacts();
}

/* ============================================================================
* Función         : buildAlertContacts
* Descripción     : Proyecta los contactos activos al contrato persistido de alertas SMS.
* Fecha           : 2026-03-26
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : Contact, AlertContact
* Ingesta         : contacts: Contact[]
* Devolución      : AlertContact[]
* Uso             : const alertContacts = buildAlertContacts(contacts)
* ============================================================================ */
function buildAlertContacts(contacts: Contact[]): AlertContact[] {
  return contacts.map((contact) => ({
    name: contact.name,
    phone: contact.phone,
    smsStatus: 'pending',
    provider: null,
    providerMessageId: null,
    attempts: 0,
    lastError: null,
  }));
}

/* ============================================================================
* Función         : recoverIncompleteAlerts
* Descripción     : Recupera alertas incompletas desde la máquina de estados
*                   y la cola local después de un cierre o reinicio.
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : AlertStateMachine, AlertQueue
* Ingesta         : sendFn: (alert: QueuedAlert) => Promise<boolean>
* Devolución      : Promise<void>
* Uso             : recoverIncompleteAlerts(mySendFn)
* ============================================================================ */
export async function recoverIncompleteAlerts(
  sendFn: (alert: QueuedAlert) => Promise<boolean>
): Promise<void> {
  const machine = useAlertMachineStore.getState().machine;
  if (machine.state === 'sending' || machine.state === 'awaiting_confirmation') {
    console.log('[AlertService] Recuperando alerta pendiente:', machine.context.alertId);
  }
  await AlertQueue.process(sendFn);
}

export const AlertService = {
  async send(
    triggerWord: string,
    isTest = false
  ): Promise<{ alertId: string; assistedCallPhone: string | null }> {
    const guardStore = useGuardStore.getState();
    const settings = useSettingsStore.getState();
    const allActiveContacts = getActiveContacts();
    const userId = settings.userId || (await ensureAuthenticated());
    const machineStore = useAlertMachineStore.getState();

    if (allActiveContacts.length === 0) {
      throw new Error('No hay contactos activos');
    }

    // Si no tiene suscripción vigente y no es alerta de prueba:
    // enviar ÚNICAMENTE al contacto principal (priority mínimo) y señalizar
    // que se debe mostrar el aviso de pago vencido.
    let contacts: ReturnType<typeof getActiveContacts>;
    if (!settings.hasSubscription && !isTest) {
      const sorted = [...allActiveContacts].sort((a, b) => a.priority - b.priority);
      contacts = [sorted[0]];
      guardStore.setShowOverdueAlert(true);
    } else {
      contacts = allActiveContacts;
    }

    if (!userId) {
      guardStore.setAlertPhase('error');
      throw new Error('La sesión no está lista. Reintenta en unos segundos.');
    }

    if (settings.userId !== userId) {
      useSettingsStore.getState().setUserId(userId);
    }

    guardStore.setDetectedKeyword(isTest ? 'test' : triggerWord);
    guardStore.setAlertPhase('capturing');

    // Transición a locating en la máquina de estados
    machineStore.transition('locating', {
      userId,
      triggerWord,
      isTest,
      createdAt: Date.now(),
    });

    // Intentar obtener ubicación — nunca bloquear el envío
    let location: any = null;
    let locationFailed = false;
    try {
      location = await LocationService.getCurrentLocation();
      guardStore.setLastLocation(location);
      machineStore.updateContext({ location, locationFailed: false });
    } catch (e: any) {
      console.warn('[AlertService] Ubicación no disponible, enviando sin coordenadas:', e?.message);
      locationFailed = true;
      machineStore.updateContext({ location: null, locationFailed: true });
    }

    const mapsLink = location
      ? LocationService.buildMapsLink(location)
      : '';
    const alertContacts = buildAlertContacts(contacts);

    const messageText = MessageFormatter.format(settings.messageTemplate, {
      mapsLink: mapsLink || '[Ubicación no disponible]',
      isStale: location?.isStale ?? false,
      staleMinutes: location?.staleMinutes,
    });

    const prefix = isTest ? SMS_TEST_PREFIX : SMS_PREFIX;
    const finalMessage = `${prefix} ${messageText}`;

    guardStore.setAlertPhase('sending');
    machineStore.transition('sending', {
      messageText: finalMessage,
      contacts: buildContactDeliveries(contacts),
    });

    // Datos imprescindibles para la alerta
    const alertData: Omit<AppAlert, 'id'> = {
      userId,
      triggeredAt: Date.now(),
      triggerWord,
      location: location || {
        lat: 0,
        lon: 0,
        accuracy: 0,
        timestamp: Date.now(),
        isStale: true,
        staleMinutes: 0,
      },
      mapsLink,
      audioUrl: null,
      audioPath: null,
      messageTemplate: finalMessage,
      contacts: alertContacts,
      status: 'pending',
      isTest,
    };

    const ref = await alertsCol(userId).add(alertData);
    const alertId = ref.id;

    machineStore.updateContext({ alertId });

    // Encolar para reintentos en segundo plano
    AlertQueue.enqueue({
      id: alertId,
      userId,
      triggerWord,
      messageText: finalMessage,
      contacts: contacts.map((c) => ({ name: c.name, phone: c.phone })),
      location: location ? { lat: location.lat, lon: location.lon } : null,
      locationFailed,
      createdAt: Date.now(),
    });

    guardStore.setLastAlert({ id: alertId, ...alertData });
    guardStore.setAlertPhase('sent');
    machineStore.transition('awaiting_confirmation', { alertId });
    startAlertWatcher(userId, alertId);

    // Audio: opcional, no bloquea
    if (settings.audioEnabled) {
      AudioRecordingService.recordAndUpload(userId, alertId)
        .then(async (audioUpload) => {
          if (audioUpload) {
            await alertsCol(userId).doc(alertId).update({
              audioUrl: audioUpload.audioUrl,
              audioPath: audioUpload.audioPath,
            });

            AudioAlertApiService.uploadSecurityRecording(
              audioUpload.localUri,
              alertId,
              userId
            ).catch((err) =>
              console.warn('[AlertService] Error en subida a PythonAnywhere:', err)
            );

            IAProcessingService.processAlertAudio(userId, alertId, audioUpload.audioUrl).catch(
              (error) =>
                console.warn('[AlertService] Error en disparador IA post-upload:', error)
            );
          }
        })
        .catch((error) => {
          console.warn('[AlertService] Error al grabar/subir audio:', error);
        });
    }

    return {
      alertId,
      assistedCallPhone: isTest ? null : contacts[0]?.phone ?? null,
    };
  },

  async retryFailed(): Promise<void> {
    const machineStore = useAlertMachineStore.getState();
    const machine = machineStore.machine;
    if (machine.state === 'failed' && machine.context.alertId) {
      machineStore.transition('locating', { retryCount: machine.context.retryCount + 1 });
      await AlertQueue.process(async (alert) => {
        try {
          await alertsCol(alert.userId).doc(alert.id).update({ status: 'pending' });
          return true;
        } catch {
          return false;
        }
      });
    }
  },
};
