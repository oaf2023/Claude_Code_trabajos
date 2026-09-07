# 7. Instalación, ejecución y operación

## 5.1. Requisitos previos

Detectados en los manifiestos y la documentación existente (SETUP.md,
DEPLOY.md):

| Componente | Requisito |
| --- | --- |
| Node.js | 20+ (repositorio probado con Node 24) |
| npm | incluido con Node |
| Python | 3.12+ (backend Flask; imagen Docker `python:3.12-slim`) |
| Expo / EAS | CLI de Expo y `eas-cli` para builds en la nube |
| Firebase CLI | para desplegar reglas y Cloud Functions |
| Android Studio / Xcode | para builds nativos locales |
| Cuentas | Firebase (Auth anónima, Firestore, Storage, Functions), Mercado Pago, proveedor SMS (Twilio), Google Cloud (Cloud Run / Artifact Registry / Secret Manager) |

## 5.2. Estructura de instalación del código

```
safealert/            → App principal Expo/React Native + web PWA
safealert/functions/  → Cloud Functions de Firebase (npm install aparte)
safealert/backend/    → Backend Flask (pip install -r requirements.txt)
safealert/admin/      → Panel admin React/Vite (npm install aparte)
safealert/iphone/     → Variante expo-router (npm install aparte)
```

## 5.3. Instalación de la app principal

```bash
cd C:\Claude_Code_trabajos\safealert
npm install
npm run typecheck
```

- `npm install`: instala las dependencias de la app (Expo SDK 55, React
  Native 0.83, Firebase, react-native-wakeword, etc.).
- `npm run typecheck`: valida tipos TypeScript (`tsc --noEmit`).

### Archivos obligatorios no versionados (Firebase)

- `android/app/google-services.json` (Android) — hay un `google-services.json`
  en la raíz del checkout analizado.
- `ios/GoogleService-Info.plist` (iOS) — no presente en el checkout analizado.
- `.env` raíz: copiar `.env.example` y rellenar valores
  (`EXPO_PUBLIC_*`; los valores reales se ocultan en este documento).

## 5.4. Instalación de Cloud Functions

```bash
cd functions
npm install
npm run build
cd ..
```

- `npm run build`: compila TypeScript a `functions/lib`.

### Variables de Functions

Copiar `functions/.env.example` a `functions/.env` con las credenciales de
Twilio y claves (valores ocultos en este documento). Despliegue:

```bash
firebase login
firebase deploy --only functions
firebase deploy --only firestore:rules,storage
```

## 5.5. Instalación del backend Flask

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Copiar `.env.example` a `.env` (define rutas de BD, claves internas y
parámetros de retención). El backend real detectado usa **SQLite**
(`SAFEALERT_DB_PATH`); el esquema se crea automáticamente en el arranque y
también existe en `backend/sql/`.

### Ejecución local del backend

```bash
python flask_app.py          # o con Flask run
# En producción (Cloud Run): gunicorn --bind :8080 --workers 2 flask_app:flask_app
```

## 5.6. Instalación del panel admin

```bash
cd admin
npm install
npm run dev        # desarrollo (Vite)
npm run build      # producción (salida en admin/dist)
```

## 5.7. Ejecución de la app en desarrollo

```bash
npx expo start            # menú de plataformas (Expo Go / emulador)
npx expo run:android      # build nativo Android
npx expo run:ios          # build nativo iOS
npm run web               # versión web (expo start --web)
```

### Web PWA (salida estática)

```bash
npm run web:build     # expo export --platform web + patch-import-meta
npm run web:serve     # sirve dist/ en http://localhost:5800
```

### Tests de la app

```bash
npm test              # jest
npm run test:coverage # con cobertura
```

## 5.8. Despliegue

### Firebase (reglas + Functions)

```bash
firebase deploy --only firestore:rules,storage
firebase deploy --only functions
```

Validación: `firebase functions:list` y
`firebase functions:log --only sendAlertSMS`.

### Backend en Google Cloud Run

El pipeline está definido en `cloud-run/cloudbuild.yaml` (Cloud Build):
construye la imagen Docker (`cloud-run/Dockerfile`), la sube a Artifact
Registry y despliega el servicio `safealert-backend` con secretos de Secret
Manager (`SAFEALERT_INTERNAL_KEY`, `AUDIO_ALERT_API_KEY`, `MP_WEBHOOK_SECRET`,
`SAFEALERT_DB_PATH`). El servicio escucha en el puerto 8080 y se expone con
`--allow-unauthenticated` (protegido por claves internas en cabeceras).

### Publicación Android (Google Play)

Builds vía EAS:

```bash
npm run build:android:preview     # APK instalable (perfil preview)
npm run build:android:production  # AAB para Play (perfil production)
```

Firma release: keystore configurado por variables `MYAPP_RELEASE_*`; utilidades
en `Publicar/scripts/*.ps1` y `scripts/New-AndroidReleaseKeystore.ps1` (ver
Anexo F). Publicación manual en Play Console (Internal Testing primero). Los
artefactos existentes (`Publicar/artefactos/*.apk|*.aab`) no forman parte del
código fuente.

## 5.9. Detención

| Servicio | Detención |
| --- | --- |
| Expo dev (`npx expo start`) | `Ctrl+C` en la terminal |
| `web:serve` (serve de dist) | `Ctrl+C` |
| Backend local Flask | `Ctrl+C` |
| Cloud Run / Functions | Gestionados por Google Cloud (no hay proceso local) |

## 5.10. Operación normal

- **Inicio**: arrancar los servicios según las secciones anteriores.
- **Comprobación de funcionamiento**: endpoint público de salud del backend
  `GET /api/health` (Flask) y `GET /api/v1/estado`.
- **Logs**: Cloud Run y Cloud Functions en Cloud Logging; Firebase Functions vía
  `firebase functions:log`.
- **Respaldo**: no se detectó un mecanismo de backup implementado en el código
  analizado. `[NIVEL DE CERTEZA: Confirmado por código]` (ver 5.11).
- **Reinicio**: redeploy o escala gestionada automáticamente.

## 5.11. Backup y restauración

> No se detectó un mecanismo de backup implementado en el código analizado.
> Las bases de datos (SQLite del backend, Firestore, Storage) no tienen rutinas
> de respaldo en el repositorio.

## 5.12. Mantenimiento guiado

| Si quieres... | Archivos a modificar (referencia) |
| --- | --- |
| Agregar una pantalla a la app | `app/` (expo-router) + navegación en `app/_layout.tsx` y `app/(tabs)/_layout.tsx` |
| Agregar un endpoint al backend | `backend/flask_app.py` (decorador `@flask_app.route`) |
| Agregar una Cloud Function | `functions/src/` + registrar en `functions/src/index.ts` |
| Agregar una tabla/campo | `backend/sql/` + arranque de `flask_app.py` (esquema duplicado: ver Anexo C) |
| Cambiar textos/permisos de la app | `app.json` (permisos nativos) y pantallas/componentes |
| Cambiar la configuración | `.env` (raíz, `functions/`, `backend/`), `src/config/features.ts`, `src/config/constants.ts` |
| Crear un usuario administrador | Panel admin (`admin/`) + endpoint `/api/v1/admin/*` |
| Ajustar retención de datos | Variables `RETENCION_*` del backend + `backend/sql/002_retencion_purga.sql` |

## 5.13. Puertos y servicios

| Servicio | Puerto | Protocolo | Función |
| --- | ---: | --- | --- |
| App web dev (Expo) | 8081 (Metro) / el que asigne Expo | HTTP | Desarrollo |
| Web estática (`npm run web:serve`) | 5800 | HTTP | PWA estática |
| Backend Flask local | 5000 (Flask por defecto) | HTTP | API REST |
| Backend Cloud Run | 8080 | HTTP | API REST en producción |
| Firebase (Auth/Firestore/Storage/Functions) | 443 | HTTPS | Backend en la nube |

> Solo se listan puertos confirmados por configuración o código.

