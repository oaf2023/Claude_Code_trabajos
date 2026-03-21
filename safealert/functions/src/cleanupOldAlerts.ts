/* ============================================================================
* Archivo         : cleanupOldAlerts.ts
* Descripción     : Limpieza programada de alertas antiguas y sus audios asociados.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Uso             : Trigger scheduler diario.
* ============================================================================ */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as admin from 'firebase-admin';

export const cleanupOldAlerts = onSchedule(
  { schedule: '0 3 * * *', timeZone: 'America/Argentina/Buenos_Aires' },
  async () => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const db = admin.firestore();
    const bucket = admin.storage().bucket();

    const usersSnapshot = await db.collection('users').get();
    let totalDeleted = 0;

    for (const userDoc of usersSnapshot.docs) {
      const alertsRef = userDoc.ref.collection('alerts');
      const oldAlerts = await alertsRef
        .where('triggeredAt', '<', cutoff)
        .limit(100)
        .get();

      const batch = db.batch();

      for (const alertDoc of oldAlerts.docs) {
        const alertData = alertDoc.data() as { audioPath?: string | null; audioUrl?: string | null };
        const audioPath =
          alertData.audioPath ??
          (alertData.audioUrl ? `users/${userDoc.id}/alerts/${alertDoc.id}/voice.m4a` : null);

        if (audioPath) {
          await bucket
            .file(audioPath)
            .delete()
            .catch((error: any) => {
              if (error?.code !== 404) {
                console.error(`[cleanupOldAlerts] Error borrando audio ${audioPath}:`, error);
              }
            });
        }

        batch.delete(alertDoc.ref);
      }

      await batch.commit();
      totalDeleted += oldAlerts.size;
    }

    console.log(`[cleanupOldAlerts] Eliminadas ${totalDeleted} alertas antiguas`);
  }
);
