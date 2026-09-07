# Documento: ARQUITECTURA.md

## Resumen
- Documento técnico de arquitectura y manejo de datos (versión 1.0.0, fecha 2026-04-10, autor oafon, marcado "Generado por GitHub Copilot"). Describe: visión general, estructura de directorios, stores Zustand, modelo de datos (Firestore, SQLite en PythonAnywhere, AsyncStorage, Firebase Storage), flujo de alerta SOS, servicios clave, navegación Expo Router, seguridad/privacidad y parámetros de build Android.
- Es la referencia arquitectónica de más alto nivel de la carpeta raíz y la mayoría de sus afirmaciones sobre la capa cliente siguen siendo verificables en el código; sin embargo, omite subsistemas incorporados después de su fecha (pagos por Cloud Functions, cola de reintentos, máquina de estados de alerta, telemetría backend) y contiene al menos una afirmación de flujo ya superada (envío de SMS por Flask).

## Contenido clave
- Visión: app de alertas SOS (Android, React Native + Expo Router + TypeScript) con detección por voz o disparo manual, captura de GPS y audio, y notificación SMS a contactos de emergencia. Backend REST Flask en PythonAnywhere y Firestore en la nube (sección 1, con diagrama ASCII).
- Estructura de directorios (sección 2): `app/` (rutas expo-router), `src/` (`config/`, `types/`, `stores/`, `services/`, `components/`, `utils/`), `android/` (no trackeado, con fix `abiFilters`), `functions/`.
- Stores Zustand (sección 3): `useGuardStore` (clave AsyncStorage `guard-storage`), `useSettingsStore` (clave `safealert-settings`; `userId` NO se persiste), `useContactsStore` (sin persistencia, carga desde Firestore; orden activos → prioridad 0 principal → fecha).
- Modelo de datos (sección 4): Firestore `users/{userId}/contacts/{contactId}` (Contact) y `users/{userId}/alerts/{alertId}` (Alert con location, mapsLink, audioUrl, contacts, status, iaAnalysis, isTest); SQLite `safealert_tel.db` con tablas `usuarios_emerg` y `periodo_prueba` (esquema SQL incluido); AsyncStorage con las dos claves; Storage `users/{userId}/alerts/{alertId}/audio.m4a`.
- Flujo SOS (sección 5): wake word (Porcupine, sensibilidad 0.7) → `AlertService.send()` → GPS (timeout 8 s) + grabación 60 s → doc Alert en Firestore → `AudioAlertApiService.send()` → "POST /api/alert al backend Flask → Flask envía SMS" → watcher Firestore para actualizar UI.
- Servicios clave (sección 6): `AlertService` (orquesta; si `paymentOverdue` envía solo al contacto principal), `TrialService` (endpoints `/api/tel/contacto`, `/api/tel/contacto/borrar`, `/api/tel/prueba/{device_id}`; resultado `EstadoPrueba`), `WakeWordService` (Porcupine en hilo nativo, keywords ayuda/socorro/auxilio/help), `LocationService` (fix fresco 8 s, fallback última conocida, refresco 5 min en guardia).
- Navegación (sección 7): `/`, `/bienvenida`, `/permissions`, `/como-funciona`, `/test-alert`, `/contacts/`, `/(tabs)/` con index/contacts/settings y modales globales en `_layout.tsx` (TrialExpiredModal, PaymentOverdueModal, PaymentModal).
- Seguridad y privacidad (sección 8): Firebase Auth anónima, reglas Firestore por usuario, header `X-API-Key`, audio en Storage privado por usuario, AsyncStorage sin cifrar, permisos runtime, borrado lógico, prueba por `device_id`.
- Build Android (sección 9): minSdk 24, target 34, NDK 27.1.12297006, ABI arm64-v8a + x86_64 (excluido armeabi-v7a por crash), aviso de que `expo prebuild` regenera `build.gradle` y pierde el fix.
- Variables (sección 10): `PA_API_URL`, `AUDIO_ALERT_API_KEY`, `AUTHENTICATION_TIMEOUT_MS`, configuradas en `src/config/features.ts`.

## Relación con el código real
- Coincidencias verificadas por inspección:
  - Todos los `src/services/*` citados existen (AlertService, AudioAlertApiService, AudioRecordingService, ContactsService, DeviceService, IAProcessingService, LocationService, NotificationService, PaymentService, PermissionsService, PythonAnywhereSync, SubscriptionService, TrialService, WakeWordService).
  - Rutas de `app/` citadas existen (`_layout.tsx`, `bienvenida.tsx`, `permissions.tsx`, `como-funciona.tsx`, `test-alert.tsx`, `(tabs)/{_layout,index,contacts,settings}.tsx`).
  - Backend Flask + SQLite en PythonAnywhere: confirmado (`backend/flask_app.py` usa `sqlite3`; `backend/wsgi.py` fija `SAFEALERT_DB_PATH` a una ruta de PythonAnywhere; tablas `usuarios_emerg` y `periodo_prueba` creadas en `flask_app.py` líneas 525/539).
  - Endpoints de `TrialService` citados: `/api/tel/contacto`, `/api/tel/contacto/borrar` y `/api/tel/prueba/<device_id>` confirmados en `flask_app.py` y en `src/services/TrialService.ts`.
  - Reglas Firestore "cada usuario solo su `users/{userId}`": confirmado en `firestore.rules` (match `/users/{userId}/{document=**}` con `request.auth.uid == userId`).
  - `AUTHENTICATION_TIMEOUT_MS = 8000` en `src/config/features.ts`; timeout GPS de 8 s confirmado (`GPS_FRESH_FIX_TIMEOUT_MS = 8000` en `src/config/constants.ts`).
  - Scripts de npm `build:android:preview`/`production` y perfiles EAS preview (APK) / production (app-bundle): confirmados en `package.json` y `eas.json`.
- Discrepancias y omisiones:
  - [OBSERVACIÓN TÉCNICA] La sección 5 afirma "Flask envía SMS vía proveedor" tras `POST /api/alert`. El código real no muestra ese flujo: el SMS lo envía la Cloud Function `sendAlertSMS` (trigger `onDocumentWritten` en `functions/src/sendAlertSMS.ts`) con fallback interno en la colección `pendingNotifications`; SETUP.md, DEPLOY.md y los runbooks describen ese mismo flujo por Functions. ARQUITECTURA.md describe aquí una etapa previa o un diseño no aplicado. [NIVEL DE CERTEZA: Altamente probable]
  - [OBSERVACIÓN TÉCNICA] Path de audio en Storage: ARQUITECTURA.md usa `audio.m4a`; el código real genera `users/{userId}/alerts/{alertId}/voice.m4a` (`buildAlertAudioStoragePath` en `src/config/features.ts` línea 185). SETUP.md coincide con el código.
  - [OBSERVACIÓN TÉCNICA] El documento omite componentes ya presentes: `src/services/AlertQueue.ts`, `AlertStateMachine.ts`, `AccountService.ts`, `AccesoRegistroService.ts`, `DeviceDiagnostic.ts`, `LocationApiClient.ts`, `PrivacyService.ts`; carpetas `src/hooks/`, `src/theme/`, `src/shims/`; `src/utils/formatPhone.ts`, `triggerWords.ts`, `googleMapsLink.ts`; rutas `(tabs)/history.tsx`, `ubicacion/manual.tsx`, `contacts/[id].tsx`, `+html.tsx`; configs `porcupine.ts`, `sentry.ts`, `webBanner.ts`.
  - [OBSERVACIÓN TÉCNICA] No menciona `functions/` de pagos (`createPaymentOrder.ts`, `mpWebhook.ts`), ni la variante Cloud Run (`cloud-run/`) ni los scripts SQL de MySQL (`backend/sql/*.sql`) presentes en el repositorio.
  - [OBSERVACIÓN TÉCNICA] El slug real de Expo en `app.json` es `alertas` (nombre visible SafeAlert); el documento no declara slug, pero TUTORIAL-DISTRIBUCION-AYUDAME.md sí lo declara erróneamente como `safealert`.
  - [OBSERVACIÓN TÉCNICA] `useSettingsStore.userId` "NO se persiste": no contrastado en detalle; la afirmación es coherente con la política del documento (AsyncStorage sin datos de sesión), pero no se verificó el código del store. [NIVEL DE CERTEZA: No determinado]
- Sin verificar (fuera de alcance de este módulo): parámetros reales de `android/app/build.gradle` (carpeta `android/` excluida del análisis por instrucción de la auditoría).

## Estado y uso
- VIGENTE EN PARTE / PARCIALMENTE DESACTUALIZADO: sirve como mapa base de la capa cliente y del modelo de datos, pero refleja un corte anterior a la incorporación de la cola de reintentos, la máquina de estados, los pagos por Cloud Functions y la telemetría `/api/v1/*`. Debe contrastarse y actualizarse antes de usarlo como fuente única de arquitectura.
- [NIVEL DE CERTEZA: Altamente probable]

## Seguridad
- INFORMATIVO: el documento no contiene secretos; describe correctamente mecanismos reales: auth anónima, reglas Firestore por UID, header `X-API-Key`, Storage privado por usuario y ausencia de cifrado en AsyncStorage (aviso adecuado).
- [NOTA] El documento declara el header `X-API-Key` y las variables de entorno por nombre sin valores: cumplimiento correcto de gobierno de datos.
