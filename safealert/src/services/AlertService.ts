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

function getActiveContacts(): Contact[] {
  return useContactsStore.getState().activeContacts();
}

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
    } catch (e) {
      guardStore.setAlertPhase('error');
      throw new Error('No se pudo obtener la ubicación');
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

    guardStore.setAlertPhase('sent');
    guardStore.setLastAlert({ id: alertId, ...alertData });

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
