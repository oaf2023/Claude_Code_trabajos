import firestore from '@react-native-firebase/firestore';
import * as Linking from 'expo-linking';
import { Alert as AppAlert, AlertContact } from '../types/Alert';
import { Contact } from '../types/Contact';
import { LocationService } from './LocationService';
import { AudioRecordingService } from './AudioRecordingService';
import { alertsCol } from '../config/firebase';
import { SMS_PREFIX, SMS_TEST_PREFIX } from '../config/constants';
import { useGuardStore } from '../stores/useGuardStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useContactsStore } from '../stores/useContactsStore';

function buildMessage(
  template: string,
  mapsLink: string,
  isStale: boolean,
  staleMinutes?: number
): string {
  const time = new Date().toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  let locationText = mapsLink;
  if (isStale && staleMinutes) {
    locationText = `${mapsLink} (ubicación de hace ${staleMinutes} min)`;
  }

  return template
    .replace('{location}', locationText)
    .replace('{time}', time)
    .replace('{name}', 'Tu contacto');
}

export const AlertService = {
  /**
   * Ciclo principal de alerta:
   * 1. Capturar ubicación GPS
   * 2. Iniciar grabación de audio (asíncrono)
   * 3. Escribir alerta en Firestore → dispara Cloud Function → Twilio SMS
   * 4. Subir audio asíncronamente → segundo SMS con link de audio
   * 5. Llamada telefónica automática al primer contacto
   */
  async send(
    triggerWord: string,
    isTest = false
  ): Promise<{ alertId: string }> {
    const guardStore = useGuardStore.getState();
    const settings = useSettingsStore.getState();
    const contacts = useContactsStore.getState().activeContacts();

    if (contacts.length === 0) {
      throw new Error('No hay contactos activos');
    }

    guardStore.setAlertPhase('capturando');

    // Fase 1: Capturar ubicación
    let location;
    try {
      location = await LocationService.getCurrentLocation();
    } catch (e) {
      guardStore.setAlertPhase('error');
      throw new Error('No se pudo obtener la ubicación');
    }

    const mapsLink = LocationService.buildMapsLink(location);
    const userId = settings.userId!;

    const alertContacts: AlertContact[] = contacts.map((c: Contact) => ({
      name: c.name,
      phone: c.phone,
      smsStatus: 'pending',
    }));

    const messageText = buildMessage(
      settings.messageTemplate,
      mapsLink,
      location.isStale ?? false,
      location.staleMinutes
    );

    const prefix = isTest ? SMS_TEST_PREFIX : SMS_PREFIX;
    const finalMessage = `${prefix} ${messageText}`;

    // Fase 2: Escribir doc de alerta en Firestore (dispara Cloud Function → SMS)
    guardStore.setAlertPhase('enviando');

    const alertData: Omit<AppAlert, 'id'> = {
      userId,
      triggeredAt: Date.now(),
      triggerWord,
      location,
      mapsLink,
      audioUrl: null, // se completa en fase asíncrona
      messageTemplate: finalMessage,
      contacts: alertContacts,
      status: 'pending',
      isTest,
    };

    const ref = await alertsCol(userId).add(alertData);
    const alertId = ref.id;

    guardStore.setAlertPhase('enviado');
    guardStore.setLastAlert({ id: alertId, ...alertData });

    // Fase 3: Grabar y subir audio asíncronamente (NO bloquea el SMS)
    if (settings.audioEnabled && !isTest) {
      AudioRecordingService.recordAndUpload(alertId)
        .then(async (audioUrl) => {
          if (audioUrl) {
            // Actualizar documento con URL de audio
            await alertsCol(userId).doc(alertId).update({ audioUrl });
          }
        })
        .catch((e) =>
          console.warn('[AlertService] Error al subir audio:', e)
        );
    }

    // Fase 4: Llamada automática al primer contacto de emergencia
    if (contacts.length > 0 && !isTest) {
      const firstContact = contacts[0];
      try {
        await Linking.openURL(`tel:${firstContact.phone}`);
      } catch (e) {
        console.warn('[AlertService] Error al iniciar llamada:', e);
      }
    }

    return { alertId };
  },
};
