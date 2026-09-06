# SafeAlert — Arquitectura y Manejo de Datos

**Versión**: 2.0.0 | **Fecha**: 2026-09-06 | **Autor**: oafon

---

## 1. Visión General

SafeAlert es una aplicación Android/iOS de alertas SOS construida con **React Native + Expo Router + TypeScript**. Detecta palabras de activación por voz o disparo manual, captura ubicación GPS y audio, y envía notificaciones SMS a contactos de emergencia. El backend es una API REST Flask alojada en PythonAnywhere, con Firestore como base de datos en la nube y Cloud Functions para pagos y notificaciones.

```
┌──────────────────────────────────────────────────────────────────┐
│                     DISPOSITIVO ANDROID/iOS                       │
│                                                                  │
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐   │
│  │  Expo Router│    │  Zustand     │    │  Servicios        │   │
│  │  (UI/Pages) │◄──►│  (Estado)    │◄──►│  (Lógica nativa) │   │
│  └─────────────┘    └──────────────┘    └───────────────────┘   │
│                              │                    │             │
└──────────────────────────────┼────────────────────┼─────────────┘
                               │                    │
               ┌───────────────▼──┐    ┌────────────▼──────────────┐
               │   Firestore      │    │  Firebase Cloud Functions  │
               │   (alertas,      │    │  - createPaymentOrder      │
               │    contactos,    │    │  - mpWebhook (firma MP)    │
               │    usuarios)     │    │  - paProxy (secreto PA)    │
               └──────────────────┘    └────────────┬──────────────┘
                                                    │
                                       ┌────────────▼──────────────┐
                                       │  PythonAnywhere (Flask)    │
                                       │  safealert_tel.db          │
                                       │  - usuarios_emerg (uid)    │
                                       │  - periodo_prueba (uid)    │
                                       └───────────────────────────┘
```

---

## 2. Cambios Recientes (Plan de Remediación 2026-09-06)

### Fase 0 — Congelación de Pagos
- `PAYMENTS_ENABLED=false` y `PAYMENTS_DEMO_ENABLED=false` en producción
- Pagos deshabilitados hasta completar Fase 2+4

### Fase 1 — Verificación de Firma Webhook MP
- **Archivos**: `functions/src/mpWebhook.ts`, `functions/src/mpSignature.ts`
- HMAC-SHA256 sobre plantilla `id:{dataId};request-id:{xRequestId};ts:{ts}`
- Ventana anti-replay de 5 minutos
- Tests unitarios en `functions/src/__tests__/mpSignature.test.ts`

### Fase 2 — Unificación de IDs de Pago
- **Archivos**: `functions/src/createPaymentOrder.ts`, `functions/src/mpWebhook.ts`
- `external_reference` ahora usa formato `uid:{uid}:deviceId:{deviceId}`
- Webhook parsea el formato y vincula pago con usuario correctamente

### Fase 3 — Protección de Secretos
- **Archivos**: `functions/src/paProxy.ts`, `src/services/PaymentService.ts`
- `PA_INTERNAL_KEY` ahora se inyecta server-side (Secret Manager)
- Cloud Functions proxy: `paProxyCreateTicket`, `paProxyConfirmPayment`

### Fase 4 — Eliminación de Bypass
- **Archivo**: `src/components/PaymentModal.tsx`
- Bypass solo permitido en `__DEV__ && PAYMENTS_DEMO_ENABLED`
- Gating server-side en `handleDevBypass`

### Fase 5 — Soft-delete en Purga
- **Archivo**: `backend/flask_app.py`
- Backup previo a CSV antes de purgar
- Soft-delete con `borrado_logico` y `borrado_en`
- Tabla `purga_backups` para auditoría

### Fase 6 — Migración device_id → uid
- **Archivos**: `backend/flask_app.py`, `src/services/TrialService.ts`, `src/services/ContactsService.ts`
- Endpoints `/api/tel/*` ahora usan `uid` (Firebase Auth) como identificador principal
- Compatibilidad con `device_id` legacy para migración gradual

---

## 2. Estructura de Directorios

```
safealert/
├── app/                        # Rutas de Expo Router (file-based routing)
│   ├── _layout.tsx             # Shell raíz: auth, onboarding, modales globales
│   ├── bienvenida.tsx          # Pantalla de onboarding inicial
│   ├── permissions.tsx         # Solicitador de permisos Android
│   ├── como-funciona.tsx       # Pantalla informativa de uso
│   ├── test-alert.tsx          # Pantalla de prueba de alerta
│   ├── (tabs)/                 # Grupo de navegación con tabs
│   │   ├── _layout.tsx         # Configuración de tabs (icons, labels)
│   │   ├── index.tsx           # Tab principal — Modo Guardia (home)
│   │   ├── contacts.tsx        # Tab de contactos de emergencia
│   │   └── settings.tsx        # Tab de ajustes y configuración
│   └── contacts/               # Rutas anidadas de gestión de contactos
│
├── src/
│   ├── config/
│   │   ├── constants.ts        # Constantes de la app (colores, timings, colecciones)
│   │   ├── features.ts         # Variables de entorno y feature flags
│   │   └── firebase.ts         # Inicialización Firebase + helpers de colecciones
│   │
│   ├── types/                  # Interfaces TypeScript del dominio
│   │   ├── Alert.ts            # Alert, AlertContact, AlertLocation, AlertStatus
│   │   ├── Contact.ts          # Contact, ContactFormData
│   │   ├── Settings.ts         # AppSettings, DEFAULT_SETTINGS
│   │   └── IAAnalysis.ts       # Resultado del análisis de IA
│   │
│   ├── stores/                 # Estado global con Zustand
│   │   ├── useGuardStore.ts    # Estado del modo guardia y alerta activa
│   │   ├── useSettingsStore.ts # Configuración del usuario (persistida)
│   │   └── useContactsStore.ts # Lista de contactos (en memoria)
│   │
│   ├── services/               # Lógica de negocio y acceso a APIs nativas/externas
│   │   ├── AlertService.ts         # Orquestación del flujo de alerta SOS
│   │   ├── AudioAlertApiService.ts # Envío de alertas al backend Flask
│   │   ├── AudioRecordingService.ts# Grabación y subida de audio a Firebase Storage
│   │   ├── ContactsService.ts      # CRUD de contactos en Firestore
│   │   ├── DeviceService.ts        # Identificador único de dispositivo
│   │   ├── IAProcessingService.ts  # Análisis de audio con IA
│   │   ├── LocationService.ts      # GPS (CoreLocation / FusedLocation)
│   │   ├── NotificationService.ts  # Notificaciones locales programadas
│   │   ├── PaymentService.ts       # Lógica de suscripción y pagos
│   │   ├── PermissionsService.ts   # Solicitud y verificación de permisos
│   │   ├── PythonAnywhereSync.ts   # Sync general con API PythonAnywhere
│   │   ├── SubscriptionService.ts  # Estado de suscripción activa
│   │   ├── TrialService.ts         # Período de prueba + sync contactos a Flask
│   │   └── WakeWordService.ts      # Detección de palabra de activación (Porcupine)
│   │
│   ├── components/             # Componentes React Native reutilizables
│   │   ├── M3Button.tsx            # Botón Material 3
│   │   ├── PaymentModal.tsx        # Modal de pago de suscripción
│   │   ├── PaymentOverdueModal.tsx # Modal de pago vencido
│   │   ├── PaymentTicket.tsx       # Comprobante de pago
│   │   └── TrialExpiredModal.tsx   # Modal de período de prueba expirado
│   │
│   └── utils/
│       └── MessageFormatter.ts # Interpolación de plantillas de mensaje SMS
│
├── android/                    # Proyecto Android nativo (NO trackeado en git)
│   └── app/
│       └── build.gradle        # ⚠️ Contiene fix abiFilters arm64-v8a+x86_64
│
└── functions/                  # Cloud Functions Firebase
    └── src/
        └── (funciones de backend Firestore)
```

---

## 3. Estado Global (Zustand Stores)

### `useGuardStore` — Modo Guardia
Persiste en `AsyncStorage` con clave `guard-storage`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `isArmed` | `boolean` | Si el modo guardia está activo |
| `alertPhase` | `AlertPhase` | `idle \| countdown \| capturing \| sending \| sent \| error` |
| `countdownSeconds` | `number` | Segundos hasta envío (configurable, default 3) |
| `detectedKeyword` | `string \| null` | Palabra que disparó la alerta |
| `lastLocation` | `AlertLocation \| null` | Última ubicación GPS capturada |
| `lastAlert` | `Alert \| null` | Última alerta enviada |
| `showOverdueAlert` | `boolean` | Flag de alerta enviada solo al principal por pago vencido |

### `useSettingsStore` — Configuración de Usuario
Persiste en `AsyncStorage` con clave `safealert-settings`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | `string \| null` | UID Firebase (NO se persiste) |
| `isOnboarded` | `boolean` | Si completó el onboarding |
| `userName` | `string` | Nombre del usuario |
| `userPhone` | `string` | Teléfono del usuario |
| `triggerWords` | `string[]` | Palabras de activación (default: ayuda, socorro, auxilio, help) |
| `messageTemplate` | `string` | Plantilla del SMS con variables `{name}`, `{location}`, `{time}` |
| `audioEnabled` | `boolean` | Si graba audio durante la alerta |
| `hasSubscription` | `boolean` | Si tiene suscripción activa |
| `paymentOverdue` | `boolean` | Si hay un pago vencido |
| `wakeWordSensitivity` | `number` | Sensibilidad Porcupine (0.0 - 1.0, default 0.7) |
| `alertCountdownSeconds` | `number` | Segundos de cuenta regresiva antes de enviar |

### `useContactsStore` — Contactos de Emergencia
**Sin persistencia** — se carga desde Firestore en cada sesión.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `contacts` | `Contact[]` | Lista ordenada por prioridad y estado activo |
| `loading` | `boolean` | Estado de carga |

Los contactos se ordenan: activos primero → por prioridad (0 = principal) → por fecha de agregado.

---

## 4. Modelo de Datos

### Firestore (en la nube)

**Colección `/users/{userId}/contacts/{contactId}`**
```typescript
interface Contact {
  id: string;
  name: string;
  phone: string;         // Formato E.164: +15551234567
  active: boolean;
  priority: number;      // 0 = principal, mayor número = menor prioridad
  addedAt: number;       // timestamp en ms
}
```

**Colección `/users/{userId}/alerts/{alertId}`**
```typescript
interface Alert {
  id: string;
  userId: string;
  triggeredAt: number;
  triggerWord: string;   // 'manual' | 'ayuda' | 'socorro' | etc.
  location: {
    lat: number;
    lon: number;
    accuracy: number;
    timestamp: number;
    isStale?: boolean;   // true si se usa última ubicación conocida
    staleMinutes?: number;
  };
  mapsLink: string;
  audioUrl: string | null;
  messageTemplate: string;
  contacts: AlertContact[];
  status: 'pending' | 'sent' | 'partial' | 'failed';
  iaAnalysis?: IAAnalysis;
  isTest?: boolean;
}
```

### SQLite en PythonAnywhere (`safealert_tel.db`)

**Tabla `usuarios_emerg`** — Espejo de contactos de emergencia por dispositivo
```sql
CREATE TABLE usuarios_emerg (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id   TEXT NOT NULL,
  nombre      TEXT NOT NULL,
  telefono    TEXT NOT NULL,
  principal   BOOLEAN DEFAULT 0,
  borrado     BOOLEAN DEFAULT 0,    -- borrado lógico
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Tabla `periodo_prueba`** — Control del período de prueba de 10 días
```sql
CREATE TABLE periodo_prueba (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id     TEXT UNIQUE NOT NULL,
  fecha_inicio  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_fin     TIMESTAMP,           -- inicio + 10 días
  pago          BOOLEAN DEFAULT 0    -- true si ya pagó
);
```

### AsyncStorage (local en dispositivo)

| Clave | Contenido |
|-------|-----------|
| `safealert-settings` | `useSettingsStore` serializado (sin userId) |
| `guard-storage` | `useGuardStore` serializado |

### Firebase Storage

Archivos de audio de alertas:
```
gs://{bucket}/users/{userId}/alerts/{alertId}/audio.m4a
```

---

## 5. Flujo de Alerta SOS

```
Usuario activa alerta (voz / botón manual)
         │
         ▼
  WakeWordService detecta keyword
  (Porcupine SDK, sensibilidad: 0.7)
         │
         ▼
  AlertService.send(triggerWord)
         │
    ┌────┴────────────────────┐
    │                         │
    ▼                         ▼
LocationService          AudioRecordingService
(GPS 8s timeout)         (graba 60s en segundo plano)
    │                         │
    └────────────┬────────────┘
                 ▼
         Construye Alert doc
         Guarda en Firestore
                 │
                 ▼
      AudioAlertApiService.send()
      → POST /api/alert al backend Flask
      → Flask envía SMS vía proveedor
                 │
                 ▼
       startAlertWatcher() escucha
       cambios en Firestore para
       actualizar estado SMS en UI
```

---

## 6. Servicios Clave

### `AlertService.ts`
- **Responsabilidad**: Orquestar el flujo completo de una alerta SOS
- **Dependencias**: `LocationService`, `AudioRecordingService`, `AudioAlertApiService`, `IAProcessingService`, Firestore
- **Manejo de pago vencido**: Si `paymentOverdue=true`, envía solo al contacto principal (prioridad 0)

### `TrialService.ts`
- **Responsabilidad**: Sincronizar contactos y verificar período de prueba con PythonAnywhere
- **Endpoints**:
  - `POST /api/tel/contacto` — agrega/actualiza contacto
  - `POST /api/tel/contacto/borrar` — borrado lógico
  - `GET /api/tel/prueba/{device_id}` — verifica estado del período de prueba
- **Resultado**: `EstadoPrueba { activo, expirado, pago, fechaExpiracion }`

### `WakeWordService.ts`
- **Responsabilidad**: Escuchar en segundo plano con Porcupine
- **Palabras clave configuradas**: ayuda, socorro, auxilio, help (y variantes)
- **Threading**: Corre en hilo nativo; callbacks disparan actualizaciones de store en JS thread

### `LocationService.ts`
- **Responsabilidad**: Obtener coordenadas GPS
- **Comportamiento**: Intenta fix fresco en 8 segundos; usa última posición conocida si timeout
- **Actualización en background**: Cada 5 minutos cuando el modo guardia está activo

---

## 7. Navegación (Expo Router)

```
/ (RootLayout — _layout.tsx)
├─ /bienvenida          → Onboarding (solo si !isOnboarded)
├─ /permissions         → Solicitud de permisos
├─ /como-funciona       → Pantalla informativa
├─ /test-alert          → Enviar alerta de prueba
├─ /contacts/           → Gestión de contactos (CRUD)
└─ /(tabs)/             → Navegación principal con fondo
   ├─ /                 → Tab 1: Modo Guardia (home)
   ├─ /contacts         → Tab 2: Contactos de emergencia
   └─ /settings         → Tab 3: Ajustes
```

**Modales globales** (montados en `_layout.tsx`):
- `<TrialExpiredModal>` — Bloquea la app si el período de prueba expiró
- `<PaymentOverdueModal>` — Avisa sobre pago vencido (no bloquea)
- `<PaymentModal>` — Flujo de pago de suscripción

---

## 8. Seguridad y Privacidad (Data Governance)

| Aspecto | Implementación |
|---------|---------------|
| Autenticación | Firebase Auth anónima — UID como identificador principal en todos los servicios |
| Firma Webhook MP | HMAC-SHA256 con MP_WEBHOOK_SECRET (Secret Manager), ventana anti-replay 5min |
| Secretos en servidor | PA_INTERNAL_KEY, MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET en Firebase Secret Manager |
| Proxy de secretos | Cloud Functions `paProxyCreateTicket`, `paProxyConfirmPayment` protegen claves internas |
| Pago | Congelado hasta completar remediación. Bypass solo en __DEV__ explícito |
| Soft-delete | Purga con backup CSV previo, borrado_logico, auditoría en purga_backups |
| Identificación | uid (Firebase Auth) como primary key en contactos y suscripciones |
| API Key backend | Header `X-API-Key` en llamadas a PythonAnywhere (solo para endpoints públicos) |
| Audio | Se sube a Firebase Storage con path privado por userId/alertId |
| Datos locales | AsyncStorage no es cifrado — no almacena datos sensibles (sin tokens, sin contraseñas) |
| Permisos Android | Solicitados en runtime: RECORD_AUDIO, ACCESS_FINE_LOCATION, READ_CONTACTS |
| Borrado de contactos | Borrado lógico en SQLite (`borrado=1`), los datos no se eliminan físicamente |
| Período de prueba | Identificado por `uid` (Firebase Auth) con fallback a device_id para migración |

---

## 9. Build Android

| Parámetro | Valor |
|-----------|-------|
| SDK mínimo | Android 7.0 (API 24) |
| SDK target | Android 14 (API 34) |
| NDK | 27.1.12297006 |
| **ABI habilitados** | `arm64-v8a`, `x86_64` |
| **ABI excluido** | `armeabi-v7a` ⚠️ causa crash `0xC0000005` en Ninja/CMake en Windows |
| Gradle | 9.x |
| APK debug | `android/app/build/outputs/apk/debug/app-debug.apk` |

> **⚠️ Nota importante**: Si se ejecuta `npx expo prebuild`, el archivo `android/app/build.gradle` se regenera y el fix de `abiFilters` se pierde. Debe reaplicarse manualmente:
> ```groovy
> // En defaultConfig:
> ndk {
>     abiFilters "arm64-v8a", "x86_64"
> }
> ```

---

## 10. Variables de Entorno

Configuradas en `src/config/features.ts`:

| Variable | Descripción |
|----------|-------------|
| `PA_API_URL` | URL base de PythonAnywhere (`https://oaf.pythonanywhere.com`) |
| `AUDIO_ALERT_API_KEY` | Clave para el header `X-API-Key` del backend Flask |
| `AUTHENTICATION_TIMEOUT_MS` | Timeout para autenticación Firebase en startup |

---

*Generado por GitHub Copilot · SafeAlert v1.0 · 2026-04-10*
