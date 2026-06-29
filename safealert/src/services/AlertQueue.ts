/* ============================================================================
* Archivo         : AlertQueue.ts
* Descripción     : Cola local persistente para reintentos de alertas SOS.
*                   Almacena alertas pendientes en AsyncStorage, reintenta
*                   con exponential backoff y garantiza idempotencia.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AlertQueue.enqueue(alertData).then(() => AlertQueue.process())
* ============================================================================ */

import AsyncStorage from '@react-native-async-storage/async-storage';

const QUEUE_KEY = '@safealert/alert_queue';

export interface QueuedAlert {
  id: string;
  userId: string;
  triggerWord: string;
  messageText: string;
  contacts: Array<{ name: string; phone: string }>;
  location: { lat: number; lon: number } | null;
  locationFailed: boolean;
  createdAt: number;
  retryCount: number;
  lastAttemptAt: number | null;
  idempotencyKey: string;
}

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;
const MAX_DELAY_MS = 60000;

function getBackoffDelay(attempt: number): number {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
  return delay + Math.random() * 1000;
}

export const AlertQueue = {
  async enqueue(alert: Omit<QueuedAlert, 'retryCount' | 'lastAttemptAt' | 'idempotencyKey'>): Promise<void> {
    const queue = await this.getAll();
    const idempotencyKey = `${alert.userId}_${alert.id}_${alert.createdAt}`;
    const exists = queue.some((q) => q.idempotencyKey === idempotencyKey);
    if (exists) return;

    queue.push({
      ...alert,
      retryCount: 0,
      lastAttemptAt: null,
      idempotencyKey,
    });
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`[AlertQueue] Alerta ${alert.id} encolada. Total: ${queue.length}`);
  },

  async getAll(): Promise<QueuedAlert[]> {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as QueuedAlert[];
    } catch {
      return [];
    }
  },

  async remove(idempotencyKey: string): Promise<void> {
    const queue = await this.getAll();
    const filtered = queue.filter((q) => q.idempotencyKey !== idempotencyKey);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  },

  async incrementRetry(idempotencyKey: string): Promise<QueuedAlert | null> {
    const queue = await this.getAll();
    const index = queue.findIndex((q) => q.idempotencyKey === idempotencyKey);
    if (index === -1) return null;

    queue[index].retryCount += 1;
    queue[index].lastAttemptAt = Date.now();
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    return queue[index];
  },

  async process(
    sendFn: (alert: QueuedAlert) => Promise<boolean>
  ): Promise<void> {
    const queue = await this.getAll();
    const now = Date.now();

    for (const alert of queue) {
      if (alert.retryCount >= MAX_RETRIES) {
        console.warn(`[AlertQueue] Alerta ${alert.id} alcanzó máximo de reintentos. Descartando.`);
        await this.remove(alert.idempotencyKey);
        continue;
      }

      const lastAttempt = alert.lastAttemptAt ?? 0;
      const delay = getBackoffDelay(alert.retryCount);
      if (now - lastAttempt < delay) continue;

      try {
        const success = await sendFn(alert);
        if (success) {
          console.log(`[AlertQueue] Alerta ${alert.id} enviada exitosamente.`);
          await this.remove(alert.idempotencyKey);
        } else {
          await this.incrementRetry(alert.idempotencyKey);
          console.warn(
            `[AlertQueue] Alerta ${alert.id} reintento ${alert.retryCount + 1}/${MAX_RETRIES}`
          );
        }
      } catch (error: any) {
        await this.incrementRetry(alert.idempotencyKey);
        console.error(
          `[AlertQueue] Error procesando alerta ${alert.id}: ${error?.message}`
        );
      }
    }
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  },

  async count(): Promise<number> {
    const queue = await this.getAll();
    return queue.length;
  },
};
