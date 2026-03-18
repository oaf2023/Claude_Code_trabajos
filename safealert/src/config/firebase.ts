// Firebase is initialized automatically by @react-native-firebase/app
// when google-services.json (Android) and GoogleService-Info.plist (iOS) are present.
//
// To set up Firebase:
// 1. Create a project at https://console.firebase.google.com
// 2. Add Android app (com.safealert.app) → download google-services.json → place in android/app/
// 3. Add iOS app (com.safealert.app) → download GoogleService-Info.plist → place in ios/
// 4. Enable Authentication (Anonymous), Firestore, Storage, Functions in Firebase Console

import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

export { firestore, auth, storage };

// Sign in anonymously on first launch
export async function ensureAuthenticated(): Promise<string> {
  const currentUser = auth().currentUser;
  if (currentUser) return currentUser.uid;

  const credential = await auth().signInAnonymously();
  return credential.user.uid;
}

// Firestore path helpers
export const userDoc = (uid: string) =>
  firestore().collection('users').doc(uid);

export const contactsCol = (uid: string) =>
  userDoc(uid).collection('contacts');

export const alertsCol = (uid: string) =>
  userDoc(uid).collection('alerts');

export const settingsDoc = (uid: string) =>
  userDoc(uid).collection('settings').doc('app');
