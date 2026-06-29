/* ============================================================================
* Archivo         : AlertStateMachine.test.ts
* Descripción     : Tests unitarios de la máquina de estados de alerta.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : npx jest src/services/__tests__/AlertStateMachine.test.ts
* ============================================================================ */

import {
  useAlertMachineStore,
  buildContactDeliveries,
  hasPendingDeliveries,
  getCompletedCount,
  canRetry,
} from '../AlertStateMachine';

describe('AlertStateMachine', () => {
  beforeEach(() => {
    useAlertMachineStore.getState().reset();
  });

  describe('transitions', () => {
    it('should start in idle state', () => {
      const state = useAlertMachineStore.getState().machine.state;
      expect(state).toBe('idle');
    });

    it('should transition from idle to locating', () => {
      useAlertMachineStore.getState().transition('locating', {
        userId: 'user-1',
        triggerWord: 'manual',
      });

      expect(useAlertMachineStore.getState().machine.state).toBe('locating');
    });

    it('should reject invalid transition from idle to sending', () => {
      useAlertMachineStore.getState().transition('sending');

      expect(useAlertMachineStore.getState().machine.state).toBe('idle');
    });

    it('should transition through valid path: idle → locating → sending → awaiting_confirmation → completed', () => {
      const store = useAlertMachineStore.getState();

      store.transition('locating', { userId: 'user-1', triggerWord: 'ayuda', createdAt: 1000 });
      expect(useAlertMachineStore.getState().machine.state).toBe('locating');

      store.transition('sending', { messageText: 'SOS: ...' });
      expect(useAlertMachineStore.getState().machine.state).toBe('sending');

      store.transition('awaiting_confirmation', { alertId: 'alert-1' });
      expect(useAlertMachineStore.getState().machine.state).toBe('awaiting_confirmation');

      store.transition('completed');
      expect(useAlertMachineStore.getState().machine.state).toBe('completed');
    });

    it('should allow retry from failed to locating', () => {
      const store = useAlertMachineStore.getState();

      store.transition('locating');
      store.transition('failed');

      expect(useAlertMachineStore.getState().machine.state).toBe('failed');

      store.transition('locating');
      expect(useAlertMachineStore.getState().machine.state).toBe('locating');
    });

    it('should preserve context across transitions', () => {
      const store = useAlertMachineStore.getState();
      store.transition('locating', { userId: 'user-42', triggerWord: 'socorro' });
      store.transition('failed', { errorMessage: 'Red caída' });

      const context = useAlertMachineStore.getState().machine.context;
      expect(context.userId).toBe('user-42');
      expect(context.triggerWord).toBe('socorro');
      expect(context.errorMessage).toBe('Red caída');
    });
  });

  describe('updateContext', () => {
    it('should partially update context', () => {
      useAlertMachineStore.getState().transition('locating', {
        userId: 'user-1',
        triggerWord: 'test',
      });
      useAlertMachineStore.getState().updateContext({
        location: { lat: -34.6, lon: -58.4, accuracy: 10, timestamp: Date.now() },
      });

      const ctx = useAlertMachineStore.getState().machine.context;
      expect(ctx.location?.lat).toBe(-34.6);
      expect(ctx.location?.lon).toBe(-58.4);
      expect(ctx.userId).toBe('user-1');
    });
  });

  describe('updateContactStatus', () => {
    it('should update delivery status for a contact', () => {
      const store = useAlertMachineStore.getState();
      store.transition('locating');
      store.updateContext({
        contacts: buildContactDeliveries([
          { name: 'Ana', phone: '+5411111111' },
          { name: 'Pedro', phone: '+5422222222' },
        ]),
      });

      store.updateContactStatus('+5411111111', 'sent');

      const contacts = useAlertMachineStore.getState().machine.context.contacts;
      expect(contacts[0].status).toBe('sent');
      expect(contacts[1].status).toBe('pending');
    });

    it('should set confirmedAt when status is confirmed', () => {
      const store = useAlertMachineStore.getState();
      store.transition('locating');
      store.updateContext({
        contacts: buildContactDeliveries([{ name: 'Ana', phone: '+5411111111' }]),
      });

      const before = Date.now();
      store.updateContactStatus('+5411111111', 'confirmed');
      const after = Date.now();

      const contact = useAlertMachineStore.getState().machine.context.contacts[0];
      expect(contact.status).toBe('confirmed');
      expect(contact.confirmedAt).not.toBeNull();
      expect(contact.confirmedAt!).toBeGreaterThanOrEqual(before);
      expect(contact.confirmedAt!).toBeLessThanOrEqual(after);
    });
  });

  describe('reset', () => {
    it('should return to initial idle state', () => {
      const store = useAlertMachineStore.getState();
      store.transition('locating', { userId: 'user-1', triggerWord: 'ayuda' });
      store.reset();

      const machine = useAlertMachineStore.getState().machine;
      expect(machine.state).toBe('idle');
      expect(machine.context.userId).toBeNull();
      expect(machine.context.triggerWord).toBe('');
    });
  });
});

describe('buildContactDeliveries', () => {
  it('should create delivery entries from contact array', () => {
    const contacts = [
      { name: 'Ana', phone: '+5411111111' },
      { name: 'Pedro', phone: '+5422222222' },
    ];

    const deliveries = buildContactDeliveries(contacts);

    expect(deliveries).toHaveLength(2);
    expect(deliveries[0].name).toBe('Ana');
    expect(deliveries[0].status).toBe('pending');
    expect(deliveries[0].attempts).toBe(0);
  });
});

describe('hasPendingDeliveries', () => {
  it('should return true when some contacts are pending', () => {
    const deliveries = buildContactDeliveries([
      { name: 'A', phone: '1' },
      { name: 'B', phone: '2' },
    ]);
    deliveries[0].status = 'sent';

    expect(hasPendingDeliveries(deliveries)).toBe(true);
  });

  it('should return false when all contacts are done', () => {
    const deliveries = buildContactDeliveries([
      { name: 'A', phone: '1' },
    ]);
    deliveries[0].status = 'confirmed';

    expect(hasPendingDeliveries(deliveries)).toBe(false);
  });
});

describe('getCompletedCount', () => {
  it('should count sent and confirmed contacts', () => {
    const deliveries = buildContactDeliveries([
      { name: 'A', phone: '1' },
      { name: 'B', phone: '2' },
      { name: 'C', phone: '3' },
    ]);
    deliveries[0].status = 'sent';
    deliveries[1].status = 'confirmed';

    expect(getCompletedCount(deliveries)).toBe(2);
  });
});

describe('canRetry', () => {
  it('should return true if failed with fewer than 3 retries', () => {
    const machine = {
      state: 'failed' as const,
      context: { retryCount: 2, contacts: [], createdAt: 0, updatedAt: 0, alertId: null, userId: null, triggerWord: '', isTest: false, location: null, locationFailed: false, messageText: '', audioUrl: null, audioPath: null, errorMessage: null },
    };

    expect(canRetry(machine)).toBe(true);
  });

  it('should return false if failed with 3 or more retries', () => {
    const machine = {
      state: 'failed' as const,
      context: { retryCount: 3, contacts: [], createdAt: 0, updatedAt: 0, alertId: null, userId: null, triggerWord: '', isTest: false, location: null, locationFailed: false, messageText: '', audioUrl: null, audioPath: null, errorMessage: null },
    };

    expect(canRetry(machine)).toBe(false);
  });

  it('should return false if not in failed state', () => {
    const machine = {
      state: 'completed' as const,
      context: { retryCount: 0, contacts: [], createdAt: 0, updatedAt: 0, alertId: null, userId: null, triggerWord: '', isTest: false, location: null, locationFailed: false, messageText: '', audioUrl: null, audioPath: null, errorMessage: null },
    };

    expect(canRetry(machine)).toBe(false);
  });
});
