# 5. Matrices, índices y diccionario de datos

## 7.1. Matriz de directorios (resumen de archivos relevantes)

[[RESUMEN_DIRECTORIOS_TABLA]]

## 7.2. Índice de funciones

Extracción estática por líneas de código (TypeScript/JS/Python). El análisis
autoritativo de cada función (ficha, parámetros, flujo) está en los anexos.

[[FUNCIONES_TABLA]]

## 7.3. Índice de clases

[[CLASES_TABLA]]

## 7.4. Índice de interfaces y tipos (TypeScript)

[[TIPOS_TABLA]]

## 7.5. Índice de endpoints (backend Flask + Cloud Functions)

Los endpoints detectados estáticamente en `backend/flask_app.py` (decoradores
`@flask_app.route`) y en `functions/src` (triggers y funciones v2). Tablas y
entradas/salidas detalladas en Anexos C y D.

[[ENDPOINTS_TABLA]]

### Endpoints del backend Flask (resumen por dominio)

| Dominio | Métodos | Uso |
| --- | --- | --- |
| `/api/health`, `/api/v1/estado` | GET | Salud y estado (público) |
| `/api/users/register`, `/api/users/status/<device_id>` | POST/GET | Registro/estado de usuarios por dispositivo |
| `/api/payments/confirm`, `/api/payments/webhook` | POST | Confirmación y webhook de pagos (Flask) |
| `/api/internal/link-preapproval` | POST | Enlace de preaprobación Mercado Pago |
| `/api/tickets/create` | POST | Creación de ticket de pago |
| `/api/security/upload-recording` | POST | Subida de grabación de seguridad |
| `/api/tel/contacto`, `/api/tel/contacto/borrar`, `/api/tel/prueba/<device_id>` | POST/PUT/GET | Canal legado `safealert_tel.db` (contactos y prueba) |
| `/api/v1/accesos` | POST | Registro de accesos técnicos |
| `/api/v1/ubicaciones*` | POST/GET | Telemetría de ubicaciones |
| `/api/v1/consentimientos*` | POST/GET | Consentimientos y revocación |
| `/api/v1/admin/*` | GET/POST | Administración (stats, usuarios, pagos simulados, purga) |

### Cloud Functions exportadas

| Función | Trigger | Propósito |
| --- | --- | --- |
| `sendAlertSMS` | `onDocumentWritten` (alerts) | Envía SMS de alerta (Twilio) |
| `sendAudioFollowUp` | `onDocumentUpdated` (alerts) | Envía mensaje de seguimiento con el audio |
| `sendLocationPulseUpdate` | `onDocumentUpdated` (alerts) | Actualización de ubicación (sin productor local detectado) |
| `cleanupOldAlerts` | `onSchedule` | Purga de alertas antiguas (30 días) |
| `createPaymentOrder` | `onCall` (HTTPS) | Crea orden de pago Mercado Pago |
| `mpWebhook` | `onRequest` (HTTP) | Recibe notificaciones de pago MP |
| `syncUserToPythonAnywhere` | `onDocumentCreated` (users) | Sincroniza usuario con backend externo |

## 7.6. Catálogo de variables de entorno

Valores nunca reproducidos; los que existen con valor real en el checkout se
marcan como ocultos.

[[ENV_TABLA]]

## 7.7. Dependencias externas

[[DEPENDENCIAS_TABLA]]

## 7.8. Diccionario de datos (SQL del backend)

[[BD_TABLA]]

### Colecciones Firestore y Storage

| Recurso | Estructura | Uso |
| --- | --- | --- |
| `users/{uid}` | perfil de usuario | Autenticación y perfil |
| `users/{uid}/contacts/{contactId}` | contactos de confianza | CRUD de contactos |
| `users/{uid}/alerts/{alertId}` | alertas SOS (ubicación, audio, contactos, estado) | Flujo de alertas |
| `users/{phoneE164}` | alta inicial desde bienvenida | Registro por teléfono (`[OBSERVACIÓN TÉCNICA]`: convive con users/{uid}) |
| `pendingNotifications` | notificaciones pendientes | Fallback interno de Functions (sin consumidor identificado) |
| `_functionEvents` | eventos de Functions | Interna de Firebase |
| `subscriptions` | suscripciones (según funciones) | Estado de suscripción |
| Storage `users/{uid}/alerts/{alertId}/voice.m4a` | audio de alerta | Mensaje de voz |
| Storage `selfies/…` | foto de perfil | Onboarding (`[OBSERVACIÓN TÉCNICA]`: sin retención visible) |

Reglas de Firestore/Storage analizadas en el Anexo F (firestore.rules,
storage.rules).

## 7.9. Ranking de archivos por criticidad

### Críticos (sin ellos la aplicación no funciona)

| Archivo | Por qué |
| --- | --- |
| `app/_layout.tsx` | Shell raíz: autenticación, navegación, modales globales |
| `src/services/AlertService.ts` + `AlertQueue.ts` + `AlertStateMachine.ts` | Motor de la alerta SOS |
| `src/services/WakeWordService.ts` | Detección por voz (modo guardia) |
| `src/config/firebase.ts` | Inicialización de Firebase y helpers de colecciones |
| `backend/flask_app.py` | Toda la API REST del backend |
| `functions/src/sendAlertSMS.ts`, `mpWebhook.ts`, `createPaymentOrder.ts` | SMS y ciclo de pago |
| `app.json`, `package.json` | Identidad y dependencias de la app |

### Importantes (afectan funciones principales)

`src/services/*` (Contacts, Location, Payment, Notification, Permissions,
Privacy, Trial, Subscription), `src/components/PaymentModal.tsx`, pantallas
`(tabs)/index.tsx`, `(tabs)/settings.tsx`, `(tabs)/contacts.tsx`,
`admin/src/lib/api.ts` y páginas del panel, `src/stores/*`, `firestore.rules` y
`storage.rules`.

### Auxiliares

`src/utils/*`, `src/types/*`, `src/theme/*`, shims web, scripts de
publicación, `public/sw.js`, plantillas de mensajes.

### Posiblemente obsoletos / legado

`App.tsx` (plantilla por defecto de Expo), `app/_layout.tsx.bak`,
`src/config/porcupine.ts`, `assets/keywords/*.ppn`, `diag*.mjs`,
`safealert_ui*.xml`, `informe_tecnico.html`, `wsgi.py` (PythonAnywhere),
funciones detectadas sin llamadores (detalle en capítulo 8 y anexos).

> Ningún archivo se eliminó ni modificó. La clasificación completa archivo por
> archivo está en los anexos (A–G).

## 7.10. Perfiles y permisos

| Perfil | Función | Accesos principales |
| --- | --- | --- |
| Usuario final | Usar SafeAlert | Su propio perfil, contactos, alertas, suscripción |
| Administrador | Operar el servicio | Panel web admin con `X-Admin-Key` (stats, usuarios, simulación de pagos, purga) |
| (Firebase Auth anónima) | Identidad de la app | UID generado; fallback por teléfono sin verificación (`[OBSERVACIÓN TÉCNICA]`) |

