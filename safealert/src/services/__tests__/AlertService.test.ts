/* ============================================================================
* Archivo         : AlertService.test.ts
* Descripción     : Tests unitarios de AlertService: orquestación del envío SOS,
*                   contacto único por pago vencido, ubicación fallida y
*                   recuperación de alertas pendientes.
* Autor           : oafon
* Fecha           : 2026-08-22
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9 / Jest
* Uso             : npx jest src/services/__tests__/AlertService.test.ts
* ============================================================================ */

import { AlertService, recoverIncompleteAlerts } from '../AlertService';
import { LocationService } from '../LocationService';
import { AudioRecordingService } from '../AudioRecordingService';
import { useGuardStore } from '../../stores/useGuardStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useContactsStore } from '../../stores/useContactsStore';
import { useAlertMachineStore } from '../AlertStateMachine';
import { AlertQueue } from '../AlertQueue';

// ─── Mocks ────────────────────────────────────────────────────────────────

jest.mock('../LocationService', () => ({
  LocationService: {
    getCurrentLocation: jest.fn(),
    buildMapsLink: jest.fn(() => 'https://maps.google.com/?q=-34.6,-58.38'),
    getManualLocation: jest.fn(),
    startBackgroundUpdates: jest.fn().mockResolvedValue(undefined),
    stopBackgroundUpdates: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../AudioRecordingService', () => ({
  AudioRecordingService: {
    recordAndUpload: jest.fn().mockResolvedValue(null),
    recordSnippet: jest.fn().mockResolvedValue(null),
    cancelSnippetRecording: jest.fn().mockResolvedValue(undefined),
    configure: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock('../AudioAlertApiService', () => ({
  AudioAlertApiService: {
    uploadSecurityRecording: jest.fn().mockResolvedValue(true),
    detectAlertFromFile: jest.fn(),
    isConfigured: jest.fn().mockReturnValue(false),
  },
}));

jest.mock('../IAProcessingService', () => ({
  IAProcessingService: {
    processAlertAudio: jest.fn().mockResolvedValue({ ok: true }),
  },
}));

// Mock de firebase: alertsCol devuelve una colección con add/doc
const mockAdd = jest.fn();
const mockDocUpdate = jest.fn().mockResolvedValue(undefined);
const mockDoc = jest.fn(() => ({
  update: mockDocUpdate,
  onSnapshot: jest.fn(() => jest.fn()),
}));

jest.mock('../../config/firebase', () => ({
  alertsCol: jest.fn(() => ({
    add: mockAdd,
    doc: mockDoc,
    orderBy: jest.fn(),
    limit: jest.fn(),
    onSnapshot: jest.fn(() => jest.fn()),
  })),
  contactsCol: jest.fn(() => ({
    doc: mockDoc,
    get: jest.fn(),
  })),
  ensureAuthenticated: jest.fn().mockResolvedValue('uid-anon-test'),
  firestoreFieldValue: { serverTimestamp: () => ({}) },
  userDoc: jest.fn(),
  settingsDoc: jest.fn(),
  auth: jest.fn(() => ({ currentUser: { uid: 'uid-anon-test', getIdToken: jest.fn().mockResolvedValue('token') } })),
  storage: jest.fn(() => ({ ref: jest.fn(() => ({ putFile: jest.fn(), getDownloadURL: jest.fn() })) })),
  functions: jest.fn(() => ({ httpsCallable: jest.fn(() => jest.fn()) })),
  getIdToken: jest.fn().mockResolvedValue('token'),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────

const CONTACT_1 = {
  id: 'c1',
  name: 'Ana',
  phone: '+5491111111111',
  active: true,
  priority: 0,
  addedAt: 1000,
};

const CONTACT_2 = {
  id: 'c2',
  name: 'Luis',
  phone: '+5492222222222',
  active: true,
  priority: 1,
  addedAt: 2000,
};

describe('AlertService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AlertQueue.clear();
    useGuardStore.getState().resetAlertState();
    useGuardStore.setState({ isArmed: false, lastAlert: null, lastLocation: null });
    useSettingsStore.setState({
      userId: 'uid-test',
      hasSubscription: true,
      paymentOverdue: false,
      audioEnabled: false,
      messageTemplate: '{name} necesita ayuda! {location}',
      triggerWords: ['ayuda', 'socorro'],
    });
    useContactsStore.setState({ contacts: [], loading: false });
    useAlertMachineStore.getState().reset();
    mockAdd.mockReset();
    mockDocUpdate.mockReset();
    mockDoc.mockReset();
    mockDoc.mockImplementation(() => ({
      update: mockDocUpdate,
      onSnapshot: jest.fn(() => jest.fn()),
    }));
    mockAdd.mockResolvedValue({ id: 'alert-123' });
    (LocationService.getCurrentLocation as jest.Mock).mockResolvedValue({
      lat: -34.6037,
      lon: -58.3816,
      accuracy: 5,
      timestamp: Date.now(),
      isStale: false,
      source: 'GPS',
      permissionStatus: 'GRANTED',
    });
  });

  describe('send', () => {
    it('should throw when there are no active contacts', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1, CONTACT_2] });
      useContactsStore.setState((s) => ({ contacts: [] }));

      await expect(AlertService.send('manual')).rejects.toThrow(
        'No hay contactos activos'
      );
    });

    it('should create an alert document with all contacts', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1, CONTACT_2] });

      const result = await AlertService.send('manual');

      expect(result.alertId).toBe('alert-123');
      expect(mockAdd).toHaveBeenCalledTimes(1);

      const alertData = mockAdd.mock.calls[0][0];
      expect(alertData.triggerWord).toBe('manual');
      expect(alertData.contacts).toHaveLength(2);
      expect(alertData.status).toBe('pending');
      expect(alertData.location.source).toBe('GPS');
      expect(alertData.isTest).toBe(false);
    });

    it('should send only to main contact when subscription overdue', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1, CONTACT_2] });
      useSettingsStore.setState({ hasSubscription: false, paymentOverdue: true });

      const result = await AlertService.send('manual');

      expect(useGuardStore.getState().showOverdueAlert).toBe(true);
      const alertData = mockAdd.mock.calls[0][0];
      expect(alertData.contacts).toHaveLength(1);
      expect(alertData.contacts[0].phone).toBe('+5491111111111');
      // El contacto principal es el de menor prioridad (priority 0)
      expect(result.assistedCallPhone).toBe('+5491111111111');
    });

    it('should mark test alerts with isTest flag', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1] });

      await AlertService.send('test', true);

      const alertData = mockAdd.mock.calls[0][0];
      expect(alertData.isTest).toBe(true);
      expect(alertData.triggerWord).toBe('test');
    });

    it('should continue when location fails (locationFailed)', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1] });
      (LocationService.getCurrentLocation as jest.Mock).mockRejectedValue(
        new Error('GPS unavailable')
      );

      const result = await AlertService.send('manual');

      expect(result.alertId).toBe('alert-123');
      const alertData = mockAdd.mock.calls[0][0];
      expect(alertData.location.isStale).toBe(true);
      expect(alertData.mapsLink).toBe('');
    });

    it('should enqueue the alert for retry', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1] });

      await AlertService.send('manual');
      // AlertQueue.enqueue es fire-and-forget; esperar el microtask
      await new Promise((r) => setTimeout(r, 10));

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('alert-123');
      await AlertQueue.clear();
    });

    it('should set phase to sent and store lastAlert', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1] });

      await AlertService.send('manual');

      expect(useGuardStore.getState().alertPhase).toBe('sent');
      expect(useGuardStore.getState().lastAlert?.id).toBe('alert-123');
    });

    it('should record and upload audio when enabled', async () => {
      useContactsStore.setState({ contacts: [CONTACT_1] });
      useSettingsStore.setState({ audioEnabled: true });
      (AudioRecordingService.recordAndUpload as jest.Mock).mockResolvedValue({
        audioUrl: 'https://storage/audio.m4a',
        audioPath: 'users/u/alerts/a/voice.m4a',
        localUri: 'file:///tmp/audio.m4a',
      });

      await AlertService.send('manual');

      expect(AudioRecordingService.recordAndUpload).toHaveBeenCalledWith(
        'uid-test',
        'alert-123'
      );
      // Esperar microtask de post-upload
      await new Promise((r) => setTimeout(r, 10));
      expect(mockDocUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ audioUrl: 'https://storage/audio.m4a' })
      );
    });
  });

  describe('recoverIncompleteAlerts', () => {
    it('should process queued alerts', async () => {
      // Encolar una alerta pendiente
      await AlertQueue.enqueue({
        id: 'old-alert',
        userId: 'uid-test',
        triggerWord: 'manual',
        messageText: 'msg',
        contacts: [{ name: 'Ana', phone: '+5491111111111' }],
        location: { lat: -34.6, lon: -58.38 },
        locationFailed: false,
        createdAt: Date.now(),
      });

      const sendFn = jest.fn().mockResolvedValue(true);
      await recoverIncompleteAlerts(sendFn);

      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(sendFn.mock.calls[0][0].id).toBe('old-alert');
      // Tras éxito, la cola queda vacía
      expect(await AlertQueue.getAll()).toHaveLength(0);
    });
  });
});
