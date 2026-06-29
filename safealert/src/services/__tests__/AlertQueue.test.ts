/* ============================================================================
* Archivo         : AlertQueue.test.ts
* Descripción     : Tests unitarios de la cola de reintentos de alertas.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : npx jest src/services/__tests__/AlertQueue.test.ts
* ============================================================================ */

import { AlertQueue, QueuedAlert } from '../AlertQueue';

// Mock AsyncStorage
const mockStorage = new Map<string, string>();
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (key: string) => mockStorage.get(key) ?? null),
  setItem: jest.fn(async (key: string, value: string) => { mockStorage.set(key, value); }),
  removeItem: jest.fn(async (key: string) => { mockStorage.delete(key); }),
}));

beforeEach(() => {
  mockStorage.clear();
});

function makeAlert(overrides: Partial<QueuedAlert> = {}): QueuedAlert {
  const createdAt = Date.now();
  return {
    id: 'alert-1',
    userId: 'user-1',
    triggerWord: 'manual',
    messageText: 'SOS test',
    contacts: [{ name: 'Ana', phone: '+5411111111' }],
    location: { lat: -34.6, lon: -58.4 },
    locationFailed: false,
    createdAt,
    retryCount: 0,
    lastAttemptAt: null,
    idempotencyKey: `user-1_alert-1_${createdAt}`,
    ...overrides,
  };
}

describe('AlertQueue', () => {
  describe('enqueue', () => {
    it('should add an alert to the queue', async () => {
      await AlertQueue.enqueue({
        id: 'alert-1',
        userId: 'user-1',
        triggerWord: 'manual',
        messageText: 'SOS',
        contacts: [{ name: 'Ana', phone: '+5411111111' }],
        location: { lat: -34.6, lon: -58.4 },
        locationFailed: false,
        createdAt: 1000,
      });

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].id).toBe('alert-1');
    });

    it('should not add duplicate alerts with same idempotencyKey', async () => {
      await AlertQueue.enqueue({
        id: 'alert-1',
        userId: 'user-1',
        triggerWord: 'manual',
        messageText: 'SOS',
        contacts: [],
        location: null,
        locationFailed: false,
        createdAt: 1000,
      });

      await AlertQueue.enqueue({
        id: 'alert-1',
        userId: 'user-1',
        triggerWord: 'manual',
        messageText: 'SOS',
        contacts: [],
        location: null,
        locationFailed: false,
        createdAt: 1000,
      });

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(1);
    });
  });

  describe('remove', () => {
    it('should remove an alert by idempotencyKey', async () => {
      const alert = makeAlert();
      await AlertQueue.enqueue(alert);
      await AlertQueue.remove(alert.idempotencyKey);

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(0);
    });
  });

  describe('incrementRetry', () => {
    it('should increment retryCount and set lastAttemptAt', async () => {
      const alert = makeAlert();
      await AlertQueue.enqueue(alert);

      const updated = await AlertQueue.incrementRetry(alert.idempotencyKey);
      expect(updated?.retryCount).toBe(1);
      expect(updated?.lastAttemptAt).not.toBeNull();
    });
  });

  describe('process', () => {
    it('should remove alert on successful send', async () => {
      const alert = makeAlert();
      await AlertQueue.enqueue(alert);

      const sendFn = jest.fn().mockResolvedValue(true);
      await AlertQueue.process(sendFn);

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(0);
      expect(sendFn).toHaveBeenCalledTimes(1);
      expect(sendFn).toHaveBeenCalledWith(expect.objectContaining({ id: 'alert-1' }));
    });

    it('should increment retry on failed send', async () => {
      const alert = makeAlert();
      await AlertQueue.enqueue(alert);

      const sendFn = jest.fn().mockResolvedValue(false);
      await AlertQueue.process(sendFn);

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].retryCount).toBe(1);
    });

    it('should discard alert after max retries', async () => {
      const alert = makeAlert();
      const withMaxRetries: QueuedAlert = { ...alert, retryCount: 5 };
      const raw = JSON.stringify([withMaxRetries]);
      (await import('@react-native-async-storage/async-storage')).default.setItem(
        '@safealert/alert_queue', raw
      );

      const sendFn = jest.fn().mockResolvedValue(false);
      await AlertQueue.process(sendFn);

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(0);
      expect(sendFn).not.toHaveBeenCalled();
    });

    it('should handle errors thrown by sendFn', async () => {
      const alert = makeAlert();
      await AlertQueue.enqueue(alert);

      const sendFn = jest.fn().mockRejectedValue(new Error('Red caída'));
      await AlertQueue.process(sendFn);

      const queue = await AlertQueue.getAll();
      expect(queue).toHaveLength(1);
      expect(queue[0].retryCount).toBe(1);
    });
  });

  describe('count', () => {
    it('should return the number of queued alerts', async () => {
      expect(await AlertQueue.count()).toBe(0);

      await AlertQueue.enqueue(makeAlert());
      expect(await AlertQueue.count()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all alerts from the queue', async () => {
      await AlertQueue.enqueue(makeAlert());
      await AlertQueue.clear();

      expect(await AlertQueue.count()).toBe(0);
    });
  });
});
