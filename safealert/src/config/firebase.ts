/* ============================================================================
* Archivo         : firebase.ts
* Descripción     : Inicialización y autenticación segura de Firebase para SafeAlert.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : ensureAuthenticated() y helpers de colecciones.
* ============================================================================ */

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

export { firestore, auth, storage };

export async function ensureAuthenticated(): Promise<string> {
  const currentUser = auth().currentUser;
  if (currentUser) return currentUser.uid;

  const credential = await auth().signInAnonymously();
  if (!credential.user?.uid) {
    throw new Error('Firebase Authentication no devolvió un usuario válido.');
  }

  return credential.user.uid;
}

export const userDoc = (uid: string) =>
  firestore().collection('users').doc(uid);

export const contactsCol = (uid: string) =>
  userDoc(uid).collection('contacts');

export const alertsCol = (uid: string) =>
  userDoc(uid).collection('alerts');

export const settingsDoc = (uid: string) =>
  userDoc(uid).collection('settings').doc('app');
