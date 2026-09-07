# Archivo: functions/src/index.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| functions/src/index.ts | 10 | TypeScript | 403 | Punto de entrada de Cloud Functions (bootstrap) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Punto de entrada del paquete de Cloud Functions compilado a `lib/index.js`
(según `functions/package.json`). Inicializa Firebase Admin una única vez
(`admin.initializeApp()`) y reexporta todas las Cloud Functions del módulo
para que Firebase las registre y las exponga. Es el catálogo oficial de
funciones exportadas del proyecto:

- `sendAlertSMS`, `sendAudioFollowUp`, `sendLocationPulseUpdate` (desde
  `sendAlertSMS.ts`).
- `cleanupOldAlerts` (desde `cleanupOldAlerts.ts`).
- `createPaymentOrder` (desde `createPaymentOrder.ts`).
- `mpWebhook` (desde `mpWebhook.ts`).
- `syncUserToPythonAnywhere` (desde `users.ts`).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`.

Todas las funciones reexportadas existen como exportaciones reales con nombre
en sus archivos de origen (verificado por grep):
`users.ts` (línea 22), `cleanupOldAlerts.ts` (línea 14),
`createPaymentOrder.ts` (línea 87), `mpWebhook.ts` (línea 18) y
`sendAlertSMS.ts` (líneas 199, 271 y 305).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| firebase-admin | externa (npm) | Línea 4: `admin.initializeApp()` | Sí |

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| functions/package.json | `main: lib/index.js` → tras compilar, este archivo es el arranque del runtime |
| Firebase Functions (runtime) | Registra como funciones exportadas los símbolos reexportados aquí |
| Cliente móvil (Expo/React Native) | Consume `createPaymentOrder` como callable (`httpsCallable('createPaymentOrder')` en src/components/PaymentModal.tsx, línea 148) |
| Panel admin/backend PythonAnywhere | Puede consumir el webhook `mpWebhook` y el estado de Firestore generado por las funciones |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| admin (módulo firebase-admin) | instancia global | objeto | Inicializa el SDK de Admin | Todo el módulo |

## Estructura (funciones / clases / tipos)

No define funciones locales. Declara (reexporta) las Cloud Functions:

| Exportación | Origen | Trigger |
| --- | --- | --- |
| sendAlertSMS | sendAlertSMS.ts:199 | onDocumentWritten sobre users/{userId}/alerts/{alertId} |
| sendAudioFollowUp | sendAlertSMS.ts:271 | onDocumentUpdated sobre users/{userId}/alerts/{alertId} |
| sendLocationPulseUpdate | sendAlertSMS.ts:305 | onDocumentUpdated sobre users/{userId}/alerts/{alertId} |
| cleanupOldAlerts | cleanupOldAlerts.ts:14 | onSchedule (cron diario) |
| createPaymentOrder | createPaymentOrder.ts:87 | onCall HTTPS (callable) |
| mpWebhook | mpWebhook.ts:18 | onRequest HTTPS (webhook HTTP) |
| syncUserToPythonAnywhere | users.ts:22 | onDocumentCreated sobre users/{userId} |

## Análisis línea por línea

```ts
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

export { sendAlertSMS, sendAudioFollowUp, sendLocationPulseUpdate } from './sendAlertSMS';
export { cleanupOldAlerts } from './cleanupOldAlerts';
export { createPaymentOrder } from './createPaymentOrder';
export { mpWebhook } from './mpWebhook';
export { syncUserToPythonAnywhere } from './users';
```

**Explicación de las líneas 1–10:**

- **Línea 1** (`import * as admin`): importa el SDK Admin de Firebase.
- **Línea 4** (`admin.initializeApp()`): sin argumentos usa las credenciales
  por defecto del entorno (Application Default Credentials en Cloud Functions;
  o `GOOGLE_APPLICATION_CREDENTIALS` en local). Debe ejecutarse una sola vez
  por instancia; este archivo es el lugar correcto porque es el primero que
  carga el runtime.
- **Línea 6**: reexporta las tres funciones de SMS/audio/ubicación definidas en
  `sendAlertSMS.ts`; la exportación múltiple garantiza que las tres se
  registren como funciones independientes en el proyecto Firebase.
- **Línea 7**: reexporta el job programado de limpieza de alertas antiguas.
- **Línea 8**: reexporta la función callable de pago (Mercado Pago).
- **Línea 9**: reexporta el webhook HTTP de notificaciones de Mercado Pago.
- **Línea 10**: reexporta el trigger Firestore de sincronización de usuarios
  con PythonAnywhere.

[NOTA] Este archivo no contiene validación de entrada ni lógica de negocio:
es un bootstrap declarativo. Todo hallazgo de seguridad reside en los archivos
de origen de cada función.

## Fichas de funciones y métodos

Sin lógica local relevante (solo reexportaciones). Ver fichas en los archivos
de origen de cada función.

## Clases / interfaces / tipos

Ninguna.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Todas las funciones se registran en la región por
  defecto del proyecto Firebase, salvo `sendAlertSMS`, que fija
  `region: 'us-central1'` explícitamente en su definición. Si el proyecto
  estuviera en otra región, habría funciones en regiones distintas; el
  callable `createPaymentOrder` se invoca desde el cliente sin especificar
  región (`functions()`), por lo que el SDK del cliente debe apuntar a la
  región por defecto del proyecto. [NIVEL DE CERTEZA: Inferido]
- [NOTA] La carga diferida de módulos no se usa aquí (todos los `import`
  estáticos), por lo que el arranque en frío carga las 5 dependencias
  (firebase-admin, firebase-functions, mercadopago, twilio, zod) aunque una
  función concreta solo necesite algunas. Impacto: mayor latencia de cold
  start. [NIVEL DE CERTEZA: Altamente probable]

## Seguridad

- [INFORMATIVO] La inicialización única de Admin es correcta y no expone
  secretos. No hay hallazgos directos en este archivo.
- [INFORMATIVO] La superficie expuesta es de 7 funciones (2 HTTP públicas:
  `mpWebhook` como onRequest y `createPaymentOrder` como callable con auth; el
  resto son triggers internos de Firestore/Scheduler). Ver análisis de
  seguridad por archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Evaluar la carga perezosa (`import` dinámico dentro de cada
  función) para reducir el tamaño de arranque en frío, dado el import
  estático de todo el árbol de dependencias.
- [RECOMENDACIÓN] Fijar `region` de forma explícita y homogénea en todas las
  funciones para evitar funciones repartidas entre regiones por accidente.
