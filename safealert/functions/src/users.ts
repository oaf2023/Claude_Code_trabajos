/* ============================================================================
* Archivo         : users.ts
* Descripción     : Cloud Function para sincronizar perfiles de usuario con PythonAnywhere.
* Autor           : oafon
* Fecha           : 2020-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Uso             : Se dispara al crear un nuevo documento en la colección 'users'.
* ============================================================================ */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// URL de la API en PythonAnywhere (home/oaf/ayudame)
const PYTHONANYWHERE_API_URL = process.env.PYTHONANYWHERE_API_URL || 'https://oaf.pythonanywhere.com/api/v1/sync-user';
const SYNC_SECRET_KEY = process.env.SYNC_SECRET_KEY || 'TEMP_SECRET_123';

/**
 * Trigger que se activa cuando un nuevo usuario completa su registro en la App.
 * Envía los datos básicos (nombre, teléfono, selfie_url) a la DB central en PythonAnywhere.
 */
export const syncUserToPythonAnywhere = onDocumentCreated('users/{userId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log('No hay datos en el evento de creación de usuario.');
    return;
  }

  const userData = snapshot.data();
  const userId = event.params.userId;

  console.log(`[Sync] Iniciando sincronización para el usuario: ${userId}`);

  try {
    // Preparar el payload para la base de datos central (home/oaf/ayudame/db.sqlite3)
    const payload = {
      userId: userId,
      userName: userData.userName || 'Usuario Sin Nombre',
      userPhone: userData.userPhone || '',
      selfieUrl: userData.selfieUrl || '',
      authType: userData.authType || 'anonymous',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending_verification'
    };

    // Realizar la petición POST al backend en PythonAnywhere
    const response = await fetch(PYTHONANYWHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': SYNC_SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la API de PythonAnywhere: ${response.status} - ${errorText}`);
    }

    console.log(`[Sync] Usuario ${userId} sincronizado exitosamente con PythonAnywhere.`);

    // Opcional: Marcar en Firestore que la sincronización fue exitosa
    await snapshot.ref.update({
      syncStatus: 'synced',
      syncedAt: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error(`[Sync] Error sincronizando usuario ${userId}:`, error);
    
    // Reintentar o marcar error para auditoría
    await snapshot.ref.update({
      syncStatus: 'error',
      syncError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});