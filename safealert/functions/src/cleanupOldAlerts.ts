import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

/**
 * Elimina alertas con más de 30 días.
 * Se ejecuta todos los días a las 3:00 AM (Argentina).
 */
export const cleanupOldAlerts = onSchedule(
  { schedule: '0 3 * * *', timeZone: 'America/Argentina/Buenos_Aires' },
  async () => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const db = admin.firestore();

    const usersSnapshot = await db.collection('users').get();
    let totalDeleted = 0;

    for (const userDoc of usersSnapshot.docs) {
      const alertsRef = userDoc.ref.collection('alerts');
      const oldAlerts = await alertsRef
        .where('triggeredAt', '<', cutoff)
        .limit(100)
        .get();

      const batch = db.batch();
      oldAlerts.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      totalDeleted += oldAlerts.size;
    }

    console.log(`[cleanupOldAlerts] Eliminadas ${totalDeleted} alertas antiguas`);
  }
);
