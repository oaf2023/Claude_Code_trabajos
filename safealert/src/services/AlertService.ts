/* ============================================================================
* Archivo         : AlertService.ts
* Descripción     : Orquestación local del envío de alertas del MVP.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AlertService.send('manual')
* ============================================================================ */

import { Alert as AppAlert, AlertContact } from '../types/Alert';
import { Contact } from '../types/Contact';
import { LocationService } from './LocationService';
import { AudioRecordingService } from './AudioRecordingService';
import { alertsCol } from '../config/firebase';
import { SMS_PREFIX, SMS_TEST_PREFIX } from '../config/constants';
import { useGuardStore } from '../stores/useGuardStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useContactsStore } from '../stores/useContactsStore';
import { MessageFormatter } from '../utils/MessageFormatter';
import { IAProcessingService } from './IAProcessingService';

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

export const AlertService = {
  async send(
    triggerWord: string,
    isTest = false
  ): Promise<{ alertId: string; assistedCallPhone: string | null }> {
    const guardStore = useGuardStore.getState();
    const settings = useSettingsStore.getState();
    const contacts = getActiveContacts();
    const userId = settings.userId;

    if (contacts.length === 0) {
      throw new Error('No hay contactos activos');
    }

    if (!userId) {
      guardStore.setAlertPhase('error');
      throw new Error('La sesión no está lista. Reintenta en unos segundos.');
    }

    guardStore.setDetectedKeyword(isTest ? 'test' : triggerWord);
    guardStore.setAlertPhase('capturing');

    let location;
    try {
      location = await LocationService.getCurrentLocation();
      guardStore.setLastLocation(location);
    } catch (e: any) {
      guardStore.setAlertPhase('error');
      throw new Error(e?.message || 'No se pudo obtener la ubicación');
    }

    const mapsLink = LocationService.buildMapsLink(location);
    const alertContacts = buildAlertContacts(contacts);

    const messageText = MessageFormatter.format(settings.messageTemplate, {
      mapsLink,
      isStale: location.isStale ?? false,
      staleMinutes: location.staleMinutes,
    });

    const prefix = isTest ? SMS_TEST_PREFIX : SMS_PREFIX;
    const finalMessage = `${prefix} ${messageText}`;

    guardStore.setAlertPhase('sending');

    const alertData: Omit<AppAlert, 'id'> = {
      userId,
      triggeredAt: Date.now(),
      triggerWord,
      location,
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

    guardStore.setLastAlert({ id: alertId, ...alertData });
    guardStore.setAlertPhase('sent');
    startAlertWatcher(userId, alertId);

    if (settings.audioEnabled && !isTest) {
      AudioRecordingService.recordAndUpload(userId, alertId)
        .then(async (audioUpload) => {
          if (audioUpload) {
            await alertsCol(userId).doc(alertId).update({
              audioUrl: audioUpload.audioUrl,
              audioPath: audioUpload.audioPath,
            });

            // Escalabilidad Fase 2: Iniciar análisis de IA una vez que el audio está disponible
            IAProcessingService.processAlertAudio(userId, alertId, audioUpload.audioUrl)
              .catch(error => console.warn('[AlertService] Error en disparador IA post-upload:', error));
          }
        })
        .catch((error) => {
          console.warn('[AlertService] Error al subir audio:', error);
        });
    }

    return {
      alertId,
      assistedCallPhone: isTest ? null : contacts[0]?.phone ?? null,
    };
  },
};
