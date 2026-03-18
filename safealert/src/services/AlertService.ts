import firestore from '@react-native-firebase/firestore';
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
   * Main alert flow:
   * 1. Capture GPS location
   * 2. Start audio recording (async, don't block SMS)
   * 3. Write alert to Firestore → triggers Cloud Function → Twilio SMS
   * 4. Upload audio asynchronously → second SMS with audio link
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

    guardStore.setAlertPhase('capturing');

    // Phase 1: Capture location
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

    // Phase 2: Write alert doc to Firestore (triggers Cloud Function → SMS)
    guardStore.setAlertPhase('sending');

    const alertData: Omit<AppAlert, 'id'> = {
      userId,
      triggeredAt: Date.now(),
      triggerWord,
      location,
      mapsLink,
      audioUrl: null, // filled in async phase
      messageTemplate: finalMessage,
      contacts: alertContacts,
      status: 'pending',
      isTest,
    };

    const ref = await alertsCol(userId).add(alertData);
    const alertId = ref.id;

    guardStore.setAlertPhase('sent');
    guardStore.setLastAlert({ id: alertId, ...alertData });

    // Phase 3: Record and upload audio asynchronously (does NOT block SMS)
    if (settings.audioEnabled && !isTest) {
      AudioRecordingService.recordAndUpload(alertId)
        .then(async (audioUrl) => {
          if (audioUrl) {
            // Update alert document with audio URL
            await alertsCol(userId).doc(alertId).update({ audioUrl });
            // Cloud Function will detect this update and send a follow-up SMS with audio link
          }
        })
        .catch((e) =>
          console.warn('[AlertService] Audio upload failed:', e)
        );
    }

    return { alertId };
  },
};
