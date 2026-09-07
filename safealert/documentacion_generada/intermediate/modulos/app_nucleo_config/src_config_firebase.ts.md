# Archivo: src/config/firebase.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/config/firebase.ts | 523 | TypeScript 5.9 | 15695 | Configuración / Capa de acceso a Firebase (híbrida) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Constituye la capa de abstracción única de acceso a Firebase de SafeAlert, con
estrategia híbrida según plataforma:

- **Android nativo**: delega en los módulos nativos de `@react-native-firebase`
  (auth, firestore, storage, functions), que se cargan con `require` dinámico solo
  cuando el runtime es Android.
- **Apple (iOS) y web**: usa los SDK modulares de Firebase JS (`firebase/app`,
  `firebase/auth`, `firebase/firestore`, `firebase/storage`, `firebase/functions`)
  inicializados a partir de la configuración derivada de `google-services.json`.

Para unificar la experiencia entre ambas vías, el archivo declara un conjunto de
interfaces "Like" mínimas (p. ej. `AuthLike`, `FirestoreDocumentReferenceLike`) y
envuelve las APIs modulares web dentro de objetos que cumplen esas interfaces. De este
modo, los servicios de la app (`AlertService`, `ContactsService`,
`AudioRecordingService`, etc.) consumen una única API y el archivo decide internamente
qué motor usar.

También exporta helpers de acceso por usuario (`userDoc`, `contactsCol`, `alertsCol`,
`settingsDoc`), un `firestoreFieldValue` (serverTimestamp), autenticación anónima
garantizada (`ensureAuthenticated`) y obtención de ID token (`getIdToken`).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — ampliamente consumido (ver dependientes). Es
pieza crítica del núcleo: casi todos los servicios de datos y varias pantallas pasan
por esta capa.

Subestados puntuales:
- `DESHABILITADA` por diseño: la capa web/Apple se usa solo cuando no es Android.
- El getter `currentUser` del shim `auth()` para web siempre devuelve `null`
  (detalle en Observaciones técnicas, líneas 367-370): comportamiento incompleto
  [NIVEL DE CERTEZA: Confirmado por código].

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `AsyncStorage` de `@react-native-async-storage/async-storage` | externa | Línea 11 | NO — importada pero sin uso en el cuerpo del archivo |
| `Platform` de `react-native` | externa | isAndroidNativeRuntime, getWebDb, getWebAuth | Sí |
| `firebase/app` (FirebaseApp, getApp, getApps, initializeApp) | externa | getWebApp | Sí |
| `firebase/auth` (User, browserLocalPersistence, getAuth, initializeAuth, setPersistence, signInAnonymously) | externa | getWebAuth, auth(), ensureAuthenticated, getIdToken | Sí |
| `firebase/firestore` (tipos y funciones de colecciones/consultas) | externa | Toda la capa de envoltura web de Firestore | Sí |
| `firebase/storage` (FirebaseStorage, getDownloadURL, getStorage, ref, uploadBytes) | externa | storage() | Sí |
| `firebase/functions` (Functions, getFunctions, httpsCallable) | externa | functions() | Sí |
| `google-services.json` (require) | interna (recurso Android) | firebaseConfig (líneas 132-151) | Sí |

[OBSERVACIÓN TÉCNICA] El import de `AsyncStorage` (línea 11) no tiene ningún uso
posterior en el archivo: probable residuo de una intención de persistencia de sesión
que terminó implementándose con `browserLocalPersistence`/persistencia nativa.
[NIVEL DE CERTEZA: Confirmado por código] (grep interno: única aparición en línea 11).

## Componentes que dependen de este archivo

Consumidores detectados por grep en `src/` y `app/`:

| Archivo dependiente | Símbolos usados |
| --- | --- |
| src/hooks/useContacts.ts | ensureAuthenticated |
| src/services/AlertService.ts | alertsCol, ensureAuthenticated |
| src/services/AudioRecordingService.ts | auth, ensureAuthenticated, storage |
| src/services/ContactsService.ts | contactsCol, firestore |
| src/services/SubscriptionService.ts | firestore |
| src/services/IAProcessingService.ts | alertsCol |
| src/services/LocationApiClient.ts | getIdToken (import dinámico, línea 25) |
| src/components/PaymentModal.tsx | functions |
| app/_layout.tsx | ensureAuthenticated, alertsCol |
| app/bienvenida.tsx | firestore, firestoreFieldValue, storage |
| app/(tabs)/history.tsx | alertsCol |
| src/services/__tests__/AlertService.test.ts | jest.mock de '../../config/firebase' |

Además `settingsDoc`, `firestoreFieldValue`, `userDoc`, `contactsCol`, `alertsCol` y
`getIdToken` se consumen indirectamente a través de los servicios.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| googleServicesConfig | Contenido de `google-services.json` | Objeto tipado (project_info, client) | Configuración de Firebase del proyecto Android | firebaseConfig |
| firebaseConfig | Objeto con apiKey, appId, projectId, storageBucket, messagingSenderId, authDomain | FirebaseOptions | Config del SDK web/Apple | getWebApp |
| webDocRegistry | WeakMap de envoltura -> referencia real | WeakMap | Resolver refs reales para writeBatch | createWebDocumentReference, firestore() |
| webApp | null inicial | FirebaseApp \| null | Singleton app web | getWebApp |
| webDb | null inicial | Firestore \| null | Singleton Firestore web | getWebDb |
| webStorage | null inicial | FirebaseStorage \| null | Singleton Storage web | getWebStorage |
| webFunctions | null inicial | Functions \| null | Singleton Functions web | getWebFunctions |
| webAuthPromise | null inicial | Promise<Auth> \| null | Singleton de Auth web | getWebAuth, auth(), ensureAuthenticated, getIdToken |

[SECRETO OCULTO] No se documentan aquí los valores reales de `project_id`,
`project_number`, `storage_bucket`, `mobilesdk_app_id` ni `current_key`
(apiKey) que contiene `google-services.json`. El código los lee de ese archivo en
tiempo de carga (`require('../../google-services.json')`) y los inyecta en
`firebaseConfig`; sus valores concretos son datos de proyecto sensibles que no deben
reproducirse en documentación. Se documentan únicamente los nombres de los campos y
su propósito.

## Estructura (funciones / clases / tipos)

Funciones privadas:
- `isAndroidNativeRuntime(): boolean` (172-174).
- `getWebApp(): FirebaseApp` (187-193).
- `getWebDb(): Firestore` (195-207).
- `getWebStorage(): FirebaseStorage` (209-215).
- `getWebFunctions(): Functions` (217-223).
- `getWebAuth(): Promise<Auth>` (225-241).
- `wrapWebDocumentSnapshot<T>(snapshot)` (243-251).
- `wrapWebQuerySnapshot<T>(snapshot)` (253-264).
- `buildWebQuery(baseQuery, filters, sort?, max?)` (266-287).
- `createWebDocumentReference<T>(reference)` (289-315).
- `createWebQueryLike<T>(baseQuery, filters, sort?, max?)` (317-342).
- `createWebCollectionReference<T>(reference)` (344-355).

Exportaciones:
- `firestoreFieldValue` (357-359): `{ serverTimestamp() }`.
- `auth(): AuthLike` (361-385).
- `firestore(): FirestoreLike` (387-413).
- `storage(): StorageLike` (415-435).
- `functions(): FunctionsLike` (437-453).
- `ensureAuthenticated(): Promise<string>` (455-483).
- `getIdToken(forceRefresh?): Promise<string | null>` (498-515).
- Helpers: `userDoc(uid)`, `contactsCol(uid)`, `alertsCol(uid)`, `settingsDoc(uid)`
  (517-523).

Interfaces (sección "Clases / interfaces / tipos") y tipo `Direction` (línea 56).

## Análisis línea por línea

**Bloque líneas 1-9 (cabecera):**

```ts
/* ============================================================================
* Archivo         : firebase.ts
* Descripción     : Capa Firebase híbrida para Android nativo y cliente Apple/web.
* Autor           : oafon
* Fecha           : 2026-04-21
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : ensureAuthenticated() y helpers de colecciones.
* ============================================================================ */
```

**Explicación de las líneas 1-9:**
- Cabecera estándar (v2.0.0, 2026-04-21). Declara la estrategia central del archivo:
  "capa híbrida para Android nativo y cliente Apple/web". Es la clave de lectura de
  todo el archivo: dos motores, una sola API pública.

**Bloque líneas 11-54 (importaciones):**

```ts
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
```

**Explicación de las líneas 11-54:**
- **Línea 11**: import de AsyncStorage SIN uso posterior (ver Observaciones).
- **Línea 12**: `Platform` para discriminar el runtime (Android vs Apple/web).
- **Línea 13**: APIs de inicialización de la app Firebase modular web.
- **Líneas 14-21**: APIs de autenticación modular. Nótese el alias
  `signInAnonymously as signInAnonymouslyWeb`, que evita colisión conceptual con el
  método homónimo expuesto por la capa nativa.
- **Líneas 22-46**: el grueso de la API modular de Firestore: tipos
  (`CollectionReference`, `DocumentData`, `DocumentReference`, `Query`,
  `QuerySnapshot`) y funciones (`addDoc`, `collection`, `deleteDoc`, `doc`, `getDoc`,
  `getDocs`, `getFirestore`, `initializeFirestore`, `onSnapshot`, `orderBy`,
  `query`, `serverTimestamp`, `setDoc`, `updateDoc`, `where`, `writeBatch`).
  `limit as applyLimit` renombra `limit` porque dentro de las envolturas hay objetos
  que también exponen un método `limit`.
- **Líneas 47-53**: APIs de Storage (`getDownloadURL`, `getStorage`, `ref`,
  `uploadBytes`).
- **Línea 54**: APIs de Cloud Functions (`getFunctions`, `httpsCallable`).

Todas las importaciones modulares se usan; la única sin uso es `AsyncStorage`.

**Bloque líneas 56-107 (interfaces Like, parte 1):**

```ts
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
```

**Explicación de las líneas 56-107:**
- **Línea 56**: tipo `Direction` ('asc' | 'desc') usado en ordenaciones.
- **Líneas 58-61**: `AuthUserLike` — forma mínima de usuario autenticado que la capa
  expone (uid + getIdToken).
- **Líneas 63-66**: `AuthLike` — fachada de autenticación (currentUser +
  signInAnonymously). Es la forma que devuelve `auth()` en ambas plataformas.
- **Líneas 68-72**: snapshot de documento con id/data()/exists().
- **Líneas 74-77**: snapshot de consulta (docs + empty).
- **Líneas 79-90**: referencia de documento con get/set/update/delete/onSnapshot y
  derivación de subcolecciones (`collection(path)`), permitiendo navegar a
  subcolecciones de un documento de forma encadenada (necesario para
  `users/{uid}/contacts`, etc.).
- **Líneas 92-101**: forma de consulta encadenable (where/orderBy/limit). Nótese que
  `where` solo admite el operador `'=='`, una limitación explícita de esta capa de
  compatibilidad.

**Bloque líneas 103-130 (interfaces Like, parte 2):**

```ts
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
```

**Explicación de las líneas 103-130:**
- **Líneas 103-107**: referencia de colección: extiende la consulta y añade
  `doc(id?)` y `add(data)`.
- **Líneas 109-112**: batch limitado a `update` + `commit` (suficiente para el uso de
  la app; no expone set/delete en batch).
- **Líneas 114-117**: `FirestoreLike`: fachada global con `collection(path)` y
  `batch()`.
- **Líneas 119-126**: `StorageReferenceLike` con `putFile(localUri)` (subida desde
  archivo local) y `getDownloadURL()`; `StorageLike` con `ref(path)`.
- **Líneas 128-130**: `FunctionsLike` con `httpsCallable(name)` que devuelve una
  función llamable con payload y resultado `{ data }`.

Estas interfaces "Like" replican un subconjunto de las APIs nativas de
react-native-firebase, de modo que el require dinámico nativo (que tipa como esas
interfaces) y las envolturas web sean intercambiables para los servicios.

**Bloque líneas 132-159 (config desde google-services.json y estado singleton):**

```ts
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
```

**Explicación de las líneas 132-159:**
- **Líneas 132-142**: carga síncrona con `require` del archivo `google-services.json`
  (recurso de Android en la raíz del proyecto). Tipa la estructura esperada:
  `project_info` (project_id, project_number, storage_bucket) y `client[]`
  (mobilesdk_app_id, api_key[].current_key). [SECRETO OCULTO]: los valores de esos
  campos son datos de proyecto; aquí se documentan solo nombres y forma.
  [OBSERVACIÓN TÉCNICA] El `require` rompería el bundle en tiempo de ejecución si el
  archivo no existiera o cambiara de estructura; la tipificación es solo declarativa
  (sin validación en runtime).
- **Líneas 144-151**: construcción de `firebaseConfig` (formato de Firebase JS) a
  partir del JSON de Android: apiKey, appId, projectId, storageBucket,
  messagingSenderId (del project_number) y authDomain derivado
  (`{project_id}.firebaseapp.com`). El uso de `?.` con `?? ''` evita el crash si
  falta el primer cliente, a costa de apiKey/appId vacíos.
- **Línea 153**: `webDocRegistry`, WeakMap que guarda la correspondencia entre cada
  envoltura de documento web y su referencia real, necesaria para resolver
  operaciones batch.
- **Líneas 155-159**: variables de estado singleton para la capa web (app, db,
  storage, functions y la promesa de auth). El patrón singleton evita inicializar
  varias veces en hot reloads/llamadas repetidas.

**Bloque líneas 161-207 (isAndroidNativeRuntime, getWebApp, getWebDb):**

```ts
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
```

**Explicación de las líneas 161-207:**
- **Líneas 161-174**: `isAndroidNativeRuntime` devuelve true solo en Android: en esa
  plataforma se usan los módulos nativos; en el resto (iOS/Apple, web) la capa
  modular.
- **Líneas 176-193**: `getWebApp` inicializa (una vez) la app modular con
  `firebaseConfig`; si ya existe una app inicializada (`getApps().length > 0`),
  reutiliza `getApp()`.
- **Líneas 195-207**: `getWebDb` obtiene Firestore: en web usa `getFirestore(app)`; en
  Apple (RN) usa `initializeFirestore` con `experimentalForceLongPolling: true` para
  forzar transporte por long-polling (evita problemas de websockets en React Native).

**Bloque líneas 209-241 (getWebStorage, getWebFunctions, getWebAuth):**

```ts
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
```

**Explicación de las líneas 209-241:**
- **Líneas 209-215**: `getWebStorage` (singleton de Storage).
- **Líneas 217-223**: `getWebFunctions` (singleton de Functions).
- **Líneas 225-241**: `getWebAuth` (singleton en forma de promesa): en web usa
  `getAuth` + `setPersistence(browserLocalPersistence)` para mantener sesión entre
  recargas, con `.catch(() => {})` que silencia fallos de persistencia; en Apple usa
  `initializeAuth(app)` sin persistencia explícita (depende del comportamiento por
  defecto del SDK). Guardar la promesa evita inicializaciones concurrentes.

**Bloque líneas 243-287 (wrappers de snapshots y buildWebQuery):**

```ts
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
```

**Explicación de las líneas 243-287:**
- **Líneas 243-251**: `wrapWebDocumentSnapshot` adapta el snapshot modular a la forma
  `FirestoreDocumentSnapshotLike<T>` (id/data/exists).
- **Líneas 253-264**: `wrapWebQuerySnapshot` mapea `docs` y expone `empty`.
- **Líneas 266-287**: `buildWebQuery` construye una Query encadenando filtros
  `where ==` (en orden), un `orderBy` opcional y un `limit` opcional. Centraliza la
  composición para `createWebQueryLike`.

**Bloque líneas 289-342 (createWebDocumentReference y createWebQueryLike):**

```ts
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
```

**Explicación de las líneas 289-342:**
- **Líneas 289-315**: crea la envoltura de referencia de documento web. Cada método
  delega en la API modular. `onSnapshot` registra el listener real y devuelve la
  función de cancelación. `collection(path)` permite encadenar subcolecciones. La
  envoltura se registra en `webDocRegistry` para poder resolverla luego en batch.
- **Líneas 317-342**: `createWebQueryLike` produce una consulta inmutable/encadenable
  propia de la capa: `where` añade un filtro acumulado (y lanza error si el operador
  no es '=='), `orderBy` fija ordenación (default asc), `limit` fija el máximo.
  `get`/`onSnapshot` materializan la query compuesta vía `buildWebQuery`.

**Bloque líneas 344-359 (createWebCollectionReference y firestoreFieldValue):**

```ts
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
```

**Explicación de las líneas 344-359:**
- **Líneas 344-355**: envoltura de colección: hereda el comportamiento de consulta
  (`...createWebQueryLike`) y añade `doc(id?)` (con id opcional para auto-generar) y
  `add(data)` que devuelve `{ id }` del documento creado.
- **Líneas 357-359**: `firestoreFieldValue.serverTimestamp` expone el marcador de
  servidor de Firestore para que los servicios escriban `createdAt` con hora del
  servidor sin conocer la implementación subyacente.

**Bloque líneas 361-413 (auth() y firestore()):**

```ts
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
```

**Explicación de las líneas 361-413:**
- **Líneas 361-365**: `auth()` en Android carga dinámicamente el módulo nativo
  (`@react-native-firebase/auth`) y lo devuelve; el tipado lo fuerza a cumplir
  `AuthLike`.
- **Líneas 367-384**: rama no-Android. El objeto devuelto:
  - **Líneas 368-370**: `currentUser` SIEMPRE devuelve `null`
    (`webAuthPromise ? null : null` es tautológico). [OBSERVACIÓN TÉCNICA] Cualquier
    consumidor de `auth().currentUser` en Apple/web recibe null aunque haya sesión;
    la sesión real se consulta con `getWebAuth()` (usado internamente por
    `ensureAuthenticated` y `getIdToken`, que sí funcionan).
  - **Líneas 371-383**: `signInAnonymously` resuelve la auth real, llama a
    `signInAnonymouslyWeb`, y reduce el usuario a `AuthUserLike` (uid +
    getIdToken). Si no hay usuario, devuelve `user: null`.
- **Líneas 387-413**: `firestore()` en Android delega en el módulo nativo. En web
  construye la fachada con `collection(path)` (envoltura) y `batch()`. El batch
  resuelve la referencia real desde `webDocRegistry` y lanza un error claro si no la
  encuentra (p. ej. si se pasa una referencia nativa a un batch web).

**Bloque líneas 415-453 (storage() y functions()):**

```ts
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
```

**Explicación de las líneas 415-453:**
- **Líneas 415-435**: `storage()`. En web/Apple, `putFile(localUri)` descarga el
  archivo local vía `fetch(localUri)` y lo sube como blob con `uploadBytes`.
  `getDownloadURL` devuelve la URL de descarga. [OBSERVACIÓN TÉCNICA] El uso de
  `fetch` sobre `file://` URIs no está garantizado en todas las plataformas/versiones
  de React Native; si fallara en Apple, la subida de audios de alerta se rompería en
  esa plataforma.
- **Líneas 437-453**: `functions()` expone `httpsCallable(name)`; cada llamada recibe
  un payload y normaliza la respuesta a `{ data }`.

**Bloque líneas 455-483 (ensureAuthenticated):**

```ts
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
```

**Explicación de las líneas 455-483:**
- **Líneas 456-468** (Android): si hay usuario nativo devuelve su uid; si no, firma
  anónimamente y valida el uid resultante; error claro si Firebase no devuelve
  usuario.
- **Líneas 470-482** (Apple/web): obtiene la auth real (`getWebAuth`), consulta
  `currentUser` real (nótese que aquí SÍ se usa la instancia real, no el shim
  defectuoso), y firma anónimamente si no hay sesión. Devuelve siempre un uid válido
  o lanza error.
- Garantiza una sesión anónima antes de cualquier operación de datos: es la puerta de
  entrada de identidad de la app.

**Bloque líneas 485-515 (getIdToken):**

```ts
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
```

**Explicación de las líneas 485-515:**
- **Líneas 498-506** (Android): obtiene el usuario nativo y devuelve su ID token (o
  null sin sesión). `forceRefresh` permite forzar la renovación.
- **Líneas 508-514** (Apple/web): igual con la instancia real de auth.
- Uso: `LocationApiClient` lo importa dinámicamente (línea 25) para autenticar
  llamadas al backend PythonAnywhere. El token NO se registra en logs en este
  archivo (ver Seguridad).

**Bloque líneas 517-523 (helpers de colecciones por usuario):**

```ts
export const userDoc = (uid: string) => firestore().collection('users').doc(uid);

export const contactsCol = (uid: string) => userDoc(uid).collection('contacts');

export const alertsCol = (uid: string) => userDoc(uid).collection('alerts');

export const settingsDoc = (uid: string) => userDoc(uid).collection('settings').doc('app');
```

**Explicación de las líneas 517-523:**
- **Línea 517**: `userDoc(uid)` referencia el documento `users/{uid}`.
- **Línea 519**: `contactsCol(uid)` referencia `users/{uid}/contacts`.
- **Línea 521**: `alertsCol(uid)` referencia `users/{uid}/alerts`.
- **Línea 523**: `settingsDoc(uid)` referencia `users/{uid}/settings/app` (documento
  fijo 'app' por usuario).
- Estos helpers son la "fuente de verdad" de la estructura de datos en Firestore
  (subcolecciones bajo el documento de usuario), coherente con la segmentación por
  uid exigida por las reglas de seguridad (security rules por path de usuario).

## Fichas de funciones y métodos

Resumen de las fichas más relevantes (las envolturas internas se describen en el
análisis línea por línea):

### isAndroidNativeRuntime (líneas 172-174)

- Firma: `function isAndroidNativeRuntime(): boolean`
- Propósito: decidir el motor Firebase según `Platform.OS`.
- Parámetros: ninguno. Retorno: `Platform.OS === 'android'`. Excepciones: ninguna.
- Dependencias: `Platform`. Efectos: ninguno. Riesgos: si el proyecto se ampliara a
  iOS nativo con react-native-firebase, esta función debería evolucionar.

### getWebAuth (líneas 225-241)

- Firma: `async function getWebAuth(): Promise<Auth>`
- Propósito: singleton de autenticación modular con persistencia local en web.
- Parámetros: ninguno. Retorno: promesa de Auth. Excepciones: fallos de
  `setPersistence` silenciados con `.catch(() => {})`.
- Efectos secundarios: inicialización única de la auth. Riesgos: silenciar errores de
  persistencia puede provocar pérdida de sesión no detectada.

### auth() / firestore() / storage() / functions() (líneas 361-453)

- Firmas: `export function auth(): AuthLike`, etc.
- Propósito: fachadas públicas que enrutan a nativo (Android) o a envolturas
  modulares (Apple/web).
- Parámetros: ninguno. Retorno: interfaz Like correspondiente.
- Riesgo principal: el `currentUser` del shim web de `auth()` siempre devuelve null
  (líneas 368-370); los flujos que necesitan sesión deben usar
  `ensureAuthenticated`/`getIdToken` (que sí leen la instancia real).

### ensureAuthenticated (líneas 455-483)

- Firma: `export async function ensureAuthenticated(): Promise<string>`
- Propósito: garantizar sesión (anónima si hace falta) y devolver el uid.
- Retorno: uid. Excepciones: Error si Firebase no devuelve usuario válido.
- Efectos secundarios: puede crear una cuenta anónima nueva (costo de identidad).
- Riesgos: si las reglas de seguridad exigen usuarios verificados, la cuenta anónima
  no bastará; revisar política de cuenta.

### getIdToken (líneas 498-515)

- Firma: `export async function getIdToken(forceRefresh = false): Promise<string | null>`
- Propósito: obtener el ID token vigente para autenticar llamadas a backend.
- Parámetros: `forceRefresh` (renovar token). Retorno: string | null.
- Excepciones: delega las del SDK. Riesgo: el token es sensible; no debe loguearse.

## Clases / interfaces / tipos

### Interfaces "Like" (líneas 58-130)

- Responsabilidad colectiva: definir el subconjunto de API que la capa expone de
  forma uniforme (auth, Firestore, Storage, Functions), independiente del motor.
- `AuthUserLike` (58-61): uid + getIdToken.
- `AuthLike` (63-66): currentUser + signInAnonymously.
- `FirestoreDocumentSnapshotLike` (68-72): id/data/exists.
- `FirestoreQuerySnapshotLike` (74-77): docs/empty.
- `FirestoreDocumentReferenceLike` (79-90): get/set/update/delete/onSnapshot/collection.
- `FirestoreQueryLike` (92-101): get/onSnapshot/where(==)/orderBy/limit.
- `FirestoreCollectionReferenceLike` (103-107): consulta + doc/add.
- `FirestoreBatchLike` (109-112): update/commit.
- `FirestoreLike` (114-117): collection/batch.
- `StorageReferenceLike` (119-122) y `StorageLike` (124-126): putFile/getDownloadURL/ref.
- `FunctionsLike` (128-130): httpsCallable.
- Tipo `Direction` (56): 'asc' | 'desc'.
- Ciclo de vida: las envolturas web se crean por llamada pero se cachean los
  singletons subyacentes (app/db/storage/functions/auth). No hay ciclo de vida de
  limpieza explícito (los listeners onSnapshot se cierran devolviendo la función de
  cancelación al llamador).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` Líneas 367-370: el getter `currentUser` del shim `auth()`
  en Apple/web devuelve siempre `null` (expresión tautológica `webAuthPromise ? null
  : null`). Impacto: cualquier código que use `auth().currentUser` en no-Android
  obtiene null aunque haya sesión. Los flujos internos de este archivo evitan el
  problema usando `getWebAuth()`. [NIVEL DE CERTEZA: Confirmado por código]
- `[OBSERVACIÓN TÉCNICA]` Línea 11: import de `AsyncStorage` sin uso.
- `[OBSERVACIÓN TÉCNICA]` Líneas 132-142: `require('../../google-services.json')`
  sin validación de estructura en runtime: si el archivo falta o se reestructura, el
  bundle puede fallar con un error confuso.
- `[OBSERVACIÓN TÉCNICA]` El `require` de los módulos nativos
  (`@react-native-firebase/*`) se hace en runtime y solo en Android: si un bundler
  estático intentara resolverlos en otra plataforma, fallaría; el patrón require
  dinámico condicional es el mecanismo previsto para evitarlo.
- `[OBSERVACIÓN TÉCNICA]` La envoltura de consulta web solo soporta el operador '=='
  en `where` (lanza error para otros). Si un servicio futuro necesitara '>', '<',
  'array-contains', etc., la capa deberá ampliarse.
- `[OBSERVACIÓN TÉCNICA]` En web/Apple, `storage().ref().putFile` descarga el archivo
  local con `fetch(localUri)` y sube el blob; en Android nativo usa el `putFile`
  nativo. La ruta web/Apple es más frágil (depende del soporte de fetch sobre URIs de
  archivo locales).
- `[OBSERVACIÓN TÉCNICA]` Duplicidad de nombres de colección: `userDoc`, `contactsCol`,
  etc. usan literales ('users', 'contacts', 'alerts', 'settings') mientras
  `constants.ts` exporta `COLLECTION_*` que casi nadie usa (ver análisis de
  constants).
- `[INFORMATIVO]` Las reglas de seguridad reales (Firestore/Storage) no están en este
  archivo; la estructura por uid aquí definida debe alinearse con
  `firestore.rules`/`storage.rules`.

## Seguridad

- `[INFORMATIVO]` La `apiKey` de Firebase (leída de google-services.json) viaja en el
  bundle: en Firebase esta clave es pública por diseño; la seguridad real depende de
  las reglas de Firestore/Storage y de la autenticación, no del ocultamiento de la
  clave. Se recomienda revisar que las rules no permitan lecturas abiertas.
- `[MEDIO]` `google-services.json` contiene el identificador de proyecto y de app
  móvil; el archivo no debe exponerse en repositorios públicos ni en artefactos de
  distribución web sin control. (No se reproducen valores aquí.)
- `[INFORMATIVO]` Autenticación anónima: `ensureAuthenticated` crea usuarios anónimos
  silenciosamente. Si no hay vinculación posterior a cuenta (email/Google), los datos
  quedan atados a un uid que el usuario no puede recuperar; considerar estrategia de
  upgrade de cuenta.
- `[BAJO]` El ID token obtenido con `getIdToken` no se loguea aquí, pero fluye hacia
  `LocationApiClient` para llamadas al backend PythonAnywhere: verificar que el
  backend valida el token (audiencia, emisor) y que no se propague a terceros.
- `[BAJO]` `.catch(() => {})` en `setPersistence` silencia errores: no es un riesgo de
  seguridad directo, pero puede enmascarar fallos de sesión.
- `[INFORMATIVO]` Sin inyección SQL ni XSS aplicables (capa de cliente Firebase con
  parámetros tipados). Los paths de colección se construyen por interpolación de uid
  (p. ej. `users/${uid}/...`): el uid proviene de Firebase Auth (confiable), no de
  entrada de usuario directa.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Alto: dependencia de la exactitud de las security rules de Firestore y
  Storage; una regla mal escrita expone datos personales (contactos, ubicaciones,
  audios). [RECOMENDACIÓN] Auditoría de `firestore.rules` y `storage.rules`
  alineada con este archivo (paths `users/{uid}/...`).
- `[RIESGO]` Medio: frágil subida de archivos en Apple/web vía `fetch` + blob.
  [RECOMENDACIÓN] Probar la subida de audio en iOS y, si falla, usar una estrategia
  alternativa (base64 o el módulo nativo de storage en iOS).
- `[RIESGO]` Medio: el bug del `currentUser` del shim web puede inducir errores en
  consumidores futuros. [RECOMENDACIÓN] Corregir el getter para que devuelva la
  sesión real (`getWebAuth().then(a => a.currentUser)`), o eliminar el shim y forzar
  el uso de `ensureAuthenticated`.
- `[RECOMENDACIÓN]` Eliminar el import muerto de `AsyncStorage`.
- `[RECOMENDACIÓN]` Unificar nombres de colección: usar las constantes
  `COLLECTION_*` (o un enum dedicado) en los helpers para evitar divergencias.
- `[RECOMENDACIÓN]` Añadir validación de estructura de `google-services.json` en el
  arranque (p. ej. en CI) y documentar qué campos se requieren.
