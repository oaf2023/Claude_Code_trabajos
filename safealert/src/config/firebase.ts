/* ============================================================================
* Archivo         : firebase.ts
* Descripción     : Capa Firebase híbrida para Android nativo y cliente Apple/web.
* Autor           : oafon
* Fecha           : 2026-04-21
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : ensureAuthenticated() y helpers de colecciones.
* ============================================================================ */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  User,
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  setPersistence,
  signInAnonymously as signInAnonymouslyWeb,
} from 'firebase/auth';
import {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Firestore,
  Query,
  QuerySnapshot,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  initializeFirestore,
  limit as applyLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  FirebaseStorage,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage';
import { Functions, getFunctions, httpsCallable } from 'firebase/functions';

type Direction = 'asc' | 'desc';

interface AuthUserLike {
  uid: string;
  getIdToken(forceRefresh?: boolean): Promise<string>;
}

interface AuthLike {
  currentUser: AuthUserLike | null;
  signInAnonymously(): Promise<{ user: AuthUserLike | null }>;
}

interface FirestoreDocumentSnapshotLike<T = Record<string, unknown>> {
  id: string;
  data(): T | undefined;
  exists(): boolean;
}

interface FirestoreQuerySnapshotLike<T = Record<string, unknown>> {
  docs: Array<FirestoreDocumentSnapshotLike<T>>;
  empty: boolean;
}

interface FirestoreDocumentReferenceLike<T = Record<string, unknown>> {
  id: string;
  get(): Promise<FirestoreDocumentSnapshotLike<T>>;
  set(data: T | Partial<T>): Promise<void>;
  update(data: Partial<T>): Promise<void>;
  delete(): Promise<void>;
  onSnapshot(
    next: (snapshot: FirestoreDocumentSnapshotLike<T>) => void,
    error?: (error: Error) => void
  ): () => void;
  collection(path: string): FirestoreCollectionReferenceLike<Record<string, unknown>>;
}

interface FirestoreQueryLike<T = Record<string, unknown>> {
  get(): Promise<FirestoreQuerySnapshotLike<T>>;
  onSnapshot(
    next: (snapshot: FirestoreQuerySnapshotLike<T>) => void,
    error?: (error: Error) => void
  ): () => void;
  where(field: string, op: '==', value: unknown): FirestoreQueryLike<T>;
  orderBy(field: string, direction?: Direction): FirestoreQueryLike<T>;
  limit(count: number): FirestoreQueryLike<T>;
}

interface FirestoreCollectionReferenceLike<T = Record<string, unknown>>
  extends FirestoreQueryLike<T> {
  doc(id?: string): FirestoreDocumentReferenceLike<T>;
  add(data: T): Promise<{ id: string }>;
}

interface FirestoreBatchLike {
  update<T>(ref: FirestoreDocumentReferenceLike<T>, data: Partial<T>): void;
  commit(): Promise<void>;
}

interface FirestoreLike {
  collection(path: string): FirestoreCollectionReferenceLike<Record<string, unknown>>;
  batch(): FirestoreBatchLike;
}

interface StorageReferenceLike {
  putFile(localUri: string): Promise<void>;
  getDownloadURL(): Promise<string>;
}

interface StorageLike {
  ref(path: string): StorageReferenceLike;
}

interface FunctionsLike {
  httpsCallable(name: string): (payload: unknown) => Promise<{ data: unknown }>;
}

const googleServicesConfig = require('../../google-services.json') as {
  project_info: {
    project_id: string;
    project_number: string;
    storage_bucket: string;
  };
  client: Array<{
    client_info: { mobilesdk_app_id: string };
    api_key: Array<{ current_key: string }>;
  }>;
};

const firebaseConfig = {
  apiKey: googleServicesConfig.client[0]?.api_key[0]?.current_key ?? '',
  appId: googleServicesConfig.client[0]?.client_info.mobilesdk_app_id ?? '',
  projectId: googleServicesConfig.project_info.project_id,
  storageBucket: googleServicesConfig.project_info.storage_bucket,
  messagingSenderId: googleServicesConfig.project_info.project_number,
  authDomain: `${googleServicesConfig.project_info.project_id}.firebaseapp.com`,
};

const webDocRegistry = new WeakMap<object, DocumentReference<DocumentData>>();

let webApp: FirebaseApp | null = null;
let webDb: Firestore | null = null;
let webStorage: FirebaseStorage | null = null;
let webFunctions: Functions | null = null;
let webAuthPromise: Promise<ReturnType<typeof getAuth>> | null = null;

/* ============================================================================
* Función         : isAndroidNativeRuntime
* Descripción     : Determina si el runtime actual debe usar React Native Firebase nativo.
* Fecha           : 2026-04-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : auth, firestore, storage, functions
* Ingesta         : Sin argumentos
* Devolución      : boolean
* Uso             : if (isAndroidNativeRuntime()) {...}
* ============================================================================ */
function isAndroidNativeRuntime(): boolean {
  return Platform.OS === 'android';
}

/* ============================================================================
* Función         : getWebApp
* Descripción     : Inicializa la app Firebase modular para Apple y web reutilizando la config Android.
* Fecha           : 2026-04-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : getWebDb, getWebStorage, getWebFunctions, getWebAuth
* Ingesta         : Sin argumentos
* Devolución      : FirebaseApp
* Uso             : const app = getWebApp()
* ============================================================================ */
function getWebApp(): FirebaseApp {
  if (!webApp) {
    webApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }

  return webApp;
}

function getWebDb(): Firestore {
  if (!webDb) {
    const app = getWebApp();
    webDb =
      Platform.OS === 'web'
        ? getFirestore(app)
        : initializeFirestore(app, {
            experimentalForceLongPolling: true,
          });
  }

  return webDb;
}

function getWebStorage(): FirebaseStorage {
  if (!webStorage) {
    webStorage = getStorage(getWebApp());
  }

  return webStorage;
}

function getWebFunctions(): Functions {
  if (!webFunctions) {
    webFunctions = getFunctions(getWebApp());
  }

  return webFunctions;
}

async function getWebAuth() {
  if (!webAuthPromise) {
    webAuthPromise = (async () => {
      const app = getWebApp();

      if (Platform.OS === 'web') {
        const instance = getAuth(app);
        await setPersistence(instance, browserLocalPersistence).catch(() => {});
        return instance;
      }

      return initializeAuth(app);
    })();
  }

  return webAuthPromise;
}

function wrapWebDocumentSnapshot<T extends Record<string, unknown>>(
  snapshot: Awaited<ReturnType<typeof getDoc>>
): FirestoreDocumentSnapshotLike<T> {
  return {
    id: snapshot.id,
    data: () => snapshot.data() as T | undefined,
    exists: () => snapshot.exists(),
  };
}

function wrapWebQuerySnapshot<T extends Record<string, unknown>>(
  snapshot: QuerySnapshot<DocumentData>
): FirestoreQuerySnapshotLike<T> {
  return {
    docs: snapshot.docs.map((docSnapshot) => ({
      id: docSnapshot.id,
      data: () => docSnapshot.data() as T | undefined,
      exists: () => docSnapshot.exists(),
    })),
    empty: snapshot.empty,
  };
}

function buildWebQuery(
  baseQuery: Query<DocumentData> | CollectionReference<DocumentData>,
  filters: Array<{ field: string; value: unknown }>,
  sort?: { field: string; direction: Direction },
  max?: number
): Query<DocumentData> {
  let current: Query<DocumentData> | CollectionReference<DocumentData> = baseQuery;

  for (const filter of filters) {
    current = query(current, where(filter.field, '==', filter.value));
  }

  if (sort) {
    current = query(current, orderBy(sort.field, sort.direction));
  }

  if (typeof max === 'number') {
    current = query(current, applyLimit(max));
  }

  return current;
}

function createWebDocumentReference<T extends Record<string, unknown>>(
  reference: DocumentReference<DocumentData>
): FirestoreDocumentReferenceLike<T> {
  const wrapped: FirestoreDocumentReferenceLike<T> = {
    id: reference.id,
    get: async () => wrapWebDocumentSnapshot<T>(await getDoc(reference)),
    set: async (data) => {
      await setDoc(reference, data as DocumentData);
    },
    update: async (data) => {
      await updateDoc(reference, data as DocumentData);
    },
    delete: async () => {
      await deleteDoc(reference);
    },
    onSnapshot: (next, error) =>
      onSnapshot(
        reference,
        (snapshot) => next(wrapWebDocumentSnapshot<T>(snapshot)),
        error
      ),
    collection: (path) => createWebCollectionReference<Record<string, unknown>>(collection(reference, path)),
  };

  webDocRegistry.set(wrapped as object, reference);
  return wrapped;
}

function createWebQueryLike<T extends Record<string, unknown>>(
  baseQuery: Query<DocumentData> | CollectionReference<DocumentData>,
  filters: Array<{ field: string; value: unknown }> = [],
  sort?: { field: string; direction: Direction },
  max?: number
): FirestoreQueryLike<T> {
  return {
    get: async () => wrapWebQuerySnapshot<T>(await getDocs(buildWebQuery(baseQuery, filters, sort, max))),
    onSnapshot: (next, error) =>
      onSnapshot(
        buildWebQuery(baseQuery, filters, sort, max),
        (snapshot) => next(wrapWebQuerySnapshot<T>(snapshot)),
        error
      ),
    where: (field, op, value) => {
      if (op !== '==') {
        throw new Error('Solo se soporta el operador == en el cliente Apple/web actual.');
      }

      return createWebQueryLike<T>(baseQuery, [...filters, { field, value }], sort, max);
    },
    orderBy: (field, direction = 'asc') =>
      createWebQueryLike<T>(baseQuery, filters, { field, direction }, max),
    limit: (count) => createWebQueryLike<T>(baseQuery, filters, sort, count),
  };
}

function createWebCollectionReference<T extends Record<string, unknown>>(
  reference: CollectionReference<DocumentData>
): FirestoreCollectionReferenceLike<T> {
  return {
    ...createWebQueryLike<T>(reference),
    doc: (id) => createWebDocumentReference<T>(id ? doc(reference, id) : doc(reference)),
    add: async (data) => {
      const created = await addDoc(reference, data);
      return { id: created.id };
    },
  };
}

export const firestoreFieldValue = {
  serverTimestamp: () => serverTimestamp(),
};

export function auth(): AuthLike {
  if (isAndroidNativeRuntime()) {
    const nativeAuth = require('@react-native-firebase/auth').default as () => AuthLike;
    return nativeAuth();
  }

  return {
    get currentUser() {
      return webAuthPromise ? null : null;
    },
    async signInAnonymously() {
      const authInstance = await getWebAuth();
      const credential = await signInAnonymouslyWeb(authInstance);
      return {
        user: credential.user
          ? {
              uid: credential.user.uid,
              getIdToken: (forceRefresh?: boolean) =>
                credential.user.getIdToken(forceRefresh),
            }
          : null,
      };
    },
  } as AuthLike;
}

export function firestore(): FirestoreLike {
  if (isAndroidNativeRuntime()) {
    const nativeFirestore = require('@react-native-firebase/firestore').default as () => FirestoreLike;
    return nativeFirestore();
  }

  const db = getWebDb();
  return {
    collection: (path) => createWebCollectionReference<Record<string, unknown>>(collection(db, path)),
    batch: () => {
      const batch = writeBatch(db);
      return {
        update: (reference, data) => {
          const rawReference = webDocRegistry.get(reference as object);
          if (!rawReference) {
            throw new Error('No se pudo resolver la referencia Firestore para el batch.');
          }

          batch.update(rawReference, data as DocumentData);
        },
        commit: async () => {
          await batch.commit();
        },
      };
    },
  };
}

export function storage(): StorageLike {
  if (isAndroidNativeRuntime()) {
    const nativeStorage = require('@react-native-firebase/storage').default as () => StorageLike;
    return nativeStorage();
  }

  const storageInstance = getWebStorage();
  return {
    ref: (path) => {
      const storageReference = ref(storageInstance, path);
      return {
        putFile: async (localUri: string) => {
          const response = await fetch(localUri);
          const blob = await response.blob();
          await uploadBytes(storageReference, blob);
        },
        getDownloadURL: () => getDownloadURL(storageReference),
      };
    },
  };
}

export function functions(): FunctionsLike {
  if (isAndroidNativeRuntime()) {
    const nativeFunctions = require('@react-native-firebase/functions').default as () => FunctionsLike;
    return nativeFunctions();
  }

  const functionsInstance = getWebFunctions();
  return {
    httpsCallable: (name) => {
      const callable = httpsCallable(functionsInstance, name);
      return async (payload: unknown) => {
        const result = await callable(payload);
        return { data: result.data };
      };
    },
  };
}

export async function ensureAuthenticated(): Promise<string> {
  if (isAndroidNativeRuntime()) {
    const currentUser = auth().currentUser;
    if (currentUser) {
      return currentUser.uid;
    }

    const credential = await auth().signInAnonymously();
    if (!credential.user?.uid) {
      throw new Error('Firebase Authentication no devolvió un usuario válido.');
    }

    return credential.user.uid;
  }

  const authInstance = await getWebAuth();
  const currentUser = authInstance.currentUser as User | null;

  if (currentUser?.uid) {
    return currentUser.uid;
  }

  const credential = await signInAnonymouslyWeb(authInstance);
  if (!credential.user?.uid) {
    throw new Error('Firebase Authentication no devolvió un usuario válido.');
  }

  return credential.user.uid;
}

/* ============================================================================
* Función         : getIdToken
* Descripción     : Devuelve el ID token vigente del usuario autenticado o null
*                   si no hay sesión. Funciona en runtime Android nativo y en
*                   la capa modular (Apple/web).
* Fecha           : 2026-08-07
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : auth(), getWebAuth
* Ingesta         : forceRefresh?: boolean
* Devolución      : Promise<string | null>
* Uso             : const token = await getIdToken()
* ============================================================================ */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  if (isAndroidNativeRuntime()) {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      return null;
    }

    return currentUser.getIdToken(forceRefresh);
  }

  const authInstance = await getWebAuth();
  const currentUser = authInstance.currentUser as User | null;
  if (!currentUser) {
    return null;
  }

  return currentUser.getIdToken(forceRefresh);
}

export const userDoc = (uid: string) => firestore().collection('users').doc(uid);

export const contactsCol = (uid: string) => userDoc(uid).collection('contacts');

export const alertsCol = (uid: string) => userDoc(uid).collection('alerts');

export const settingsDoc = (uid: string) => userDoc(uid).collection('settings').doc('app');
