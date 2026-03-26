/* ============================================================================
* Archivo         : SubscriptionService.ts
* Descripción     : Servicio para gestionar el estado de suscripciones (Mercado Pago).
* Autor           : oafon
* Fecha           : 2026-03-23
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : SubscriptionService.getSubscription(userId)
* ============================================================================ */

import { firestore } from '../config/firebase';

export interface SubscriptionData {
  id: string;
  userId: string;
  phoneNumber: string;
  userName: string;
  initialPaymentDate: number;
  amount: number;
  paymentType: 'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito';
  billingType: 'Mensual' | 'Anual';
  status: 'Activa' | 'Vencida';
  mercadopagoOrderId?: string;
  createdAt: number;
  updatedAt: number;
}

const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

export const SubscriptionService = {
  /**
   * Obtiene la suscripción activa de un usuario
   */
  async getSubscription(userId: string): Promise<SubscriptionData | null> {
    try {
      const snapshot = await firestore()
        .collection(SUBSCRIPTIONS_COLLECTION)
        .where('userId', '==', userId)
        .where('status', '==', 'Activa')
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as SubscriptionData;
    } catch (error) {
      console.error('[SubscriptionService] Error obteniendo suscripción:', error);
      throw error;
    }
  },

  /**
   * Crea un registro inicial de suscripción (ej. pendiente de pago)
   */
  async createSubscription(data: Omit<SubscriptionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = firestore().collection(SUBSCRIPTIONS_COLLECTION).doc();
      const now = Date.now();
      
      const payload = {
        ...data,
        createdAt: now,
        updatedAt: now,
      };

      await docRef.set(payload);
      return docRef.id;
    } catch (error) {
      console.error('[SubscriptionService] Error creando suscripción:', error);
      throw error;
    }
  }
};
