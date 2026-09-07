# 3. Informe técnico

## 6.1. Resumen arquitectónico

SafeAlert es un sistema compuesto por varios componentes que cooperan:

```
                      ┌──────────────────────────────────────────────┐
                      │              USUARIO (ciudadano)             │
                      └──────────────┬───────────────────────────────┘
                                     │  voz / botón SOS / gestión
                                     ▼
        ┌──────────────────────────────────────────────────────────────┐
        │  APP MOVIL (Expo SDK 55 / React Native 0.83 / TS)           │
        │  expo-router (app/) · Zustand (stores) · servicios (src/)   │
        │  · WakeWordService (react-native-wakeword, modelo ES)       │
        │  · AlertService + cola + máquina de estados                 │
        │  · LocationService · ContactsService · PaymentService       │
        └──────┬───────────────┬───────────────────┬──────────────────┘
               │               │                   │
               │ HTTPS (SDK)   │ HTTPS (SDK)       │ HTTPS + API keys
               ▼               ▼                   ▼
   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐
   │ FIREBASE AUTH    │  │ FIRESTORE        │  │ BACKEND FLASK (API REST) │
   │ (anónima +       │  │ users/{uid}/     │  │ · SQLite (principal)     │
   │  fallback telf.) │  │  contacts/alerts │  │ · /api/v1/* telemetría   │
   │                  │  │                  │  │ · /api/tel/* (legado     │
   │                  │  │ STORAGE          │  │   PythonAnywhere DB)     │
   │                  │  │  selfies/, voice │  │ Desplegable Cloud Run    │
   └──────────────────┘  └────────┬─────────┘  └───────────┬──────────────┘
                                  │                        │
                                  ▼                        ▼
                     ┌────────────────────────┐   ┌─────────────────────────┐
                     │ CLOUD FUNCTIONS (TS)   │   │ PANEL ADMIN WEB        │
                     │ · sendAlertSMS (Twilio)│   │ (React + Vite)         │
                     │ · createPaymentOrder   │   │ consulta/simulación     │
                     │ · mpWebhook (MP)       │   │ / administración        │
                     │ · syncUserToPA ·       │   └─────────────────────────┘
                     │   cleanupOldAlerts     │
                     └────────────────────────┘
```

Componentes detectados y su rol:

1. **App móvil principal** (`app/`, `src/`, raíz del repo): aplicación
   Expo/React Native con expo-router. Es el componente con más código del
   proyecto.
2. **Variante `iphone/`**: segunda aplicación expo-router (Anexo B) cuya
   relación con la app principal se analiza en su anexo.
3. **Cloud Functions de Firebase** (`functions/`, TypeScript): lógica de
   servidor serverless (SMS, pagos Mercado Pago, sincronización y limpieza).
4. **Backend Flask** (`backend/`, Python): API REST de administración,
   telemetría, consentimientos, accesos y pagos, sobre SQLite; desplegable en
   Cloud Run; con legado PythonAnywhere (`wsgi.py`).
5. **Panel admin** (`admin/`, React + Vite + TS): interfaz web de
   administración.
6. **Web PWA** (`public/`, build web de Expo): versión web con service worker.
7. **Publicación/CI** (`Publicar/`, `scripts/`, `.github/`): publicación a
   Google Play y CI.

## 6.2. Tecnologías principales

| Capa | Tecnología | Versión detectada |
| --- | --- | --- |
| App móvil | Expo (React Native) | Expo SDK ~55.0.6, RN 0.83.2 |
| UI | React + React Native + expo-router | React 19.2.0, expo-router ~55.0.7 |
| Estado | Zustand | ^5.0.12 |
| Backend en la nube | Firebase (Auth, Firestore, Storage, Functions) | firebase ^12.12.1 + @react-native-firebase ^23.8.8 |
| Voz | react-native-wakeword (+ modelos ONNX en assets) | ^1.1.82 |
| Pagos | Mercado Pago (API) | vía backend y Cloud Functions |
| SMS | Twilio | credenciales en functions/.env |
| Crash/telemetría | Sentry | @sentry/react-native ~7.11.0 |
| Backend REST | Python Flask | requirements.txt de backend/ |
| Panel admin | Vite + React | admin/package.json |
| Despliegue backend | Docker + Cloud Run + Secret Manager | cloud-run/ |

## 6.3. Estructura de directorios (resumen)

[[RESUMEN_DIRECTORIOS_TABLA]]

Detalle completo archivo por archivo: inventario en el capítulo 8 y anexos A–G.

## 6.4. Estado global (Zustand)

- **useGuardStore** (`guard-storage`): `isArmed`, `alertPhase`
  (`idle|countdown|capturing|sending|sent|error`), `countdownSeconds`,
  `detectedKeyword`, `lastLocation`, `lastAlert`, `showOverdueAlert`.
- **useSettingsStore** (`safealert-settings`): `userId`, `isOnboarded`,
  `userName`, `userPhone`, `triggerWords`, `messageTemplate`, `audioEnabled`,
  `hasSubscription`, `paymentOverdue`, `wakeWordSensitivity`,
  `alertCountdownSeconds`.
- **useContactsStore** (sin persistencia): `contacts`, `loading`.

Detalles y estado real de persistencia en Anexo A.

## 6.5. Modelo de datos resumen

- **Firestore**: `users/{uid}` (perfil), `users/{uid}/contacts/{contactId}`,
  `users/{uid}/alerts/{alertId}`, `users/{phoneE164}` (alta desde
  bienvenida —ver Anexo A—), subcolección de settings.
- **Firebase Storage**: `users/{uid}/alerts/{alertId}/voice.m4a` (audio de
  alerta), `selfies/...` (foto de perfil), entre otros.
- **Backend Flask (SQLite)**: `ubicaciones_usuario` (53 columnas),
  `consentimientos_usuario` (10), `accesos_tecnicos` (35),
  `rate_limit_events` (referida por tests) y tablas legadas del canal
  `safealert_tel.db` (PythonAnywhere): `usuarios_emerg`, `periodo_prueba`.
- **AsyncStorage** (local): claves `safealert-settings`, `guard-storage`,
  `@safealert/alert_queue`, `alert-machine-storage`.

Diccionario de datos completo en el capítulo 7 y Anexo C.

## 6.6. Ciclo de vida de la aplicación (cliente)

1. Arranque (Expo): carga fuentes, splash.
2. `app/_layout.tsx`: asegura autenticación (Firebase anónima; fallback con
   teléfono), carga el estado, monta modales globales (pago, prueba expirada,
   pago vencido) y decide la navegación inicial (onboarding vs. tabs).
3. Registro/onboarding: alta del perfil del usuario.
4. Uso normal: pestañas Inicio/Historial/Contactos/Configuración; modo
   guardia con detección de palabra en primer plano.
5. Alerta SOS: captura ubicación (+audio), crea alerta en Firestore,
   watchers actualizan el estado, Cloud Functions envían SMS.
6. Cierre: cierre de sesión o eliminación de cuenta desde Configuración.

## 6.7. Flujo de datos de una alerta

```
Palabra de activación / botón SOS
   → useAlert (máquina de estados + cola)
   → AlertService.send(triggerWord)
       → LocationService (GPS o última conocida)
       → AudioRecordingService (grabación opcional → Storage)
   → Firestore: users/{uid}/alerts/{id}
       → Cloud Function sendAlertSMS → Twilio → SMS a contactos
       → sendAudioFollowUp / sendLocationPulseUpdate (seguimiento)
   → Watcher local actualiza la UI (estado del envío por contacto)
```

Detalles, estados y excepciones reales en Anexo A (servicios de alerta) y
Anexo D.

## 6.8. Trazabilidad componente a componente

| Acción | Componentes que intervienen |
| --- | --- |
| Onboarding (nombre/teléfono/foto) | `app/bienvenida.tsx` → `AccountService` → Firestore `users/{phoneE164}` + Storage `selfies/` |
| Añadir contacto | `app/(tabs)/contacts.tsx` → `ContactsService` → Firestore `users/{uid}/contacts` + canal externo `/api/tel/contacto` |
| Alerta SOS | `app/(tabs)/index.tsx` → `useAlert`/`AlertService` → cola + máquina → Firestore → Cloud Function `sendAlertSMS` |
| Pago | `PaymentModal` → `createPaymentOrder` (CF) → backend Flask (tickets/link MP) → `mpWebhook` (CF) → estado suscripción |
| Consulta admin | `admin/` → backend Flask `/api/v1/admin/*` → SQLite |
| Registro de consentimiento | `PrivacyService` → `LocationApiClient` → POST `/api/v1/consentimientos` |

## 6.9. Arquitectura de pago detectada

El pago usa Mercado Pago con una cadena mixta:
- La Cloud Function `createPaymentOrder` (httpsCallable) inicia la orden.
- El backend Flask genera el ticket/link (`/api/tickets/create`,
  `/api/internal/link-preapproval`) y registra la orden.
- El webhook `mpWebhook` (Cloud Function) recibe la notificación de pago.
- La app confirma manualmente ("Ya completé el pago") y el estado queda en
  `pending_verification` hasta confirmación del backend.
- Existen flags `PAYMENTS_ENABLED` / `PAYMENTS_DEMO_ENABLED` y un **bypass de
  pago en modo demo** (hallazgo de seguridad, ver capítulo 4).

Detalles en Anexos A, C y D.

## 6.10. Concurrencia y asincronía

- **Cliente móvil**: código asíncrono (async/await), colas y watchers de
  Firestore (`onSnapshot`), tareas en segundo plano vía `expo-task-manager`
  (condicionadas a flags; por defecto desactivadas). Detección de voz en hilo
  nativo (react-native-wakeword).
- **Backend Flask**: servidor WSGI (gunicorn 2 workers en Cloud Run);
  `threading`/locks utilizados para rate limiting (según análisis del Anexo C).
- **Cloud Functions**: ejecución serverless v2 de Firebase.
- Compatibilidad Python: el código analizado usa Python 3.12/3.13 en ejecución
  convencional; no se detectaron bloqueos de concurrencia que exijan Python
  >3.13.

