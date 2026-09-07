# Archivo: app.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| app.json | 159 | JSON (config Expo) | 5073 | Configuración de la app Expo (prebuild/config plugins) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Manifiesto de configuración de Expo SDK 55 para SafeAlert. Define identidad de la app (nombre, slug, scheme, versiones), recursos visuales (icono, splash, iconos adaptativos), configuración por plataforma (iOS `infoPlist`, Android permisos y `googleServicesFile`), configuración web PWA, plugins de configuración nativa (Firebase, router, AV, notificaciones, permisos, Sentry, etc.) y metadatos `extra` (router y EAS). Es consumido por `expo prebuild`, `eas build` y el servidor de desarrollo para generar los proyectos nativos y el bundle.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Es la configuración activa: `package.json` scripts usan `expo start`, `expo run:*` y `eas build`, todos ellos leen `app.json`. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

No importa módulos (archivo de datos). Relaciones con paquetes instalados en `package.json`:

| Clave de app.json | Paquete relacionado en package.json | Nota |
| --- | --- | --- |
| plugins `@react-native-firebase/app` | `@react-native-firebase/app` | Config plugin oficial RNFirebase |
| plugin `expo-router` | `expo-router` | Define rutas en `app/` |
| plugin `expo-location` | `expo-location` | Permisos de ubicación |
| plugin `expo-av` | `expo-av` | Micrófono / audio |
| plugin `expo-notifications` | `expo-notifications` | Notificaciones push |
| plugin `react-native-permissions` | `react-native-permissions` | Permisos iOS declarativos |
| plugin `./plugins/withManifestConflictFix` | — (archivo local) | Config plugin propio (ver su .md) |
| plugins `expo-font`, `@sentry/react-native`, `expo-secure-store`, `expo-localization` | mismos paquetes | Config nativa asociada |

## Componentes que dependen de este archivo

- `package.json`: `"main": "index.ts"` + scripts `expo start/run:*` y EAS.
- `eas.json`: perfiles de build (los builds EAS leen `app.json` para versión/ids si `appVersionSource: remote`).
- `metro.config.js` y `babel.config.js`: parte del ciclo de build de Expo.
- `google-services.json` (referenciado en línea 79) y `assets/` (iconos).
- `android/` e `ios/` generados por prebuild a partir de estas claves (no analizados aquí).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `expo.name` | `SafeAlert` | string | Nombre visible de la app | Línea 3 |
| `expo.slug` | `alertas` | string | Identificador URL en Expo/EAS | Línea 4 |
| `expo.scheme` | `safealert` | string | Esquema de deep linking | Línea 5 |
| `expo.version` | `1.2.0` | string | Versión semántica de la app | Línea 6 |
| `expo.ios.bundleIdentifier` | `com.safealert.app` | string | Bundle id iOS | Línea 17 |
| `expo.android.package` | `com.safealert.app` | string | Application ID Android | Línea 77 |
| `expo.android.versionCode` | `4` | number | Código de versión Android | Línea 78 |
| `expo.extra.eas.projectId` | `0f073eab-fccb-4bb2-91d6-86998ab38939` | string | Id de proyecto EAS (identificador de build, no credencial) | Línea 154 |
| `expo.owner` | `oafontanas-team` | string | Cuenta/organización de EAS | Línea 157 |
| `expo.web.themeColor` / `backgroundColor` | `#DC2626` / `#F9FAFB` | string | Colores PWA | Líneas 103-104 |
| `expo.android.adaptiveIcon.backgroundColor` | `#DC2626` | string | Color de icono adaptativo | Línea 84 |
| `expo.experiments.baseUrl` | `/` | string | Base URL del bundle web | Línea 112 |

Valores mágicos: `C617.1`, `E174.1`, `CA92.1`, `35F9.1` (líneas 27, 33, 39, 45...) son códigos de razón obligatorios de Apple para `NSPrivacyAccessedAPITypes` (declaración de privacidad requerida desde iOS 17). `ITSAppUsesNonExemptEncryption: false` declara que la app no usa cifrado exento/no exento según la normativa de exportación.

## Estructura (funciones / clases / tipos)

No aplica (documento de datos). Estructura JSON: raíz `expo` con secciones `ios`, `android`, `web`, `experiments`, `plugins`, `extra`.

## Análisis línea por línea

```json
{
  "expo": {
    "name": "SafeAlert",
    "slug": "alertas",
    "scheme": "safealert",
    "version": "1.2.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
```

**Explicación de las líneas 1–14:**

- **Línea 3**: nombre público de la app: `SafeAlert`.
- **Línea 4**: `slug: alertas` identifica el proyecto en el servicio EAS/Expo.
- **Línea 5**: `scheme: safealert` habilita deep links del tipo `safealert://`.
- **Línea 6**: versión de la app `1.2.0` (coincide con el flujo de versionado EAS remoto).
- **Línea 7**: orientación fija vertical (`portrait`).
- **Línea 8**: icono principal.
- **Línea 9**: estilo de interfaz claro (`light`).
- **Líneas 10-14**: splash screen con imagen contenida sobre fondo blanco.

```json
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.safealert.app",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "SafeAlert necesita acceso al micrófono para grabar mensajes de voz en caso de emergencia.",
        "NSLocationWhenInUseUsageDescription": "SafeAlert usa tu ubicación para enviarla a tus contactos de confianza en caso de emergencia.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "SafeAlert requiere acceso continuo a la ubicación para asegurar que tus contactos de confianza reciban datos actualizados en caso de emergencia prolongada.",
        "NSContactsUsageDescription": "SafeAlert accede a tus contactos por única vez para permitirte seleccionar tus contactos de confianza fácilmente.",
        "NSPrivacyAccessedAPITypes": [
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
            "NSPrivacyAccessedAPITypeReasons": [
              "C617.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryDiskSpace",
            "NSPrivacyAccessedAPITypeReasons": [
              "E174.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
            "NSPrivacyAccessedAPITypeReasons": [
              "CA92.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime",
            "NSPrivacyAccessedAPITypeReasons": [
              "35F9.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
            "NSPrivacyAccessedAPITypeReasons": [
              "C617.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryDiskSpace",
            "NSPrivacyAccessedAPITypeReasons": [
              "E174.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
            "NSPrivacyAccessedAPITypeReasons": [
              "CA92.1"
            ]
          },
          {
            "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime",
            "NSPrivacyAccessedAPITypeReasons": [
              "35F9.1"
            ]
          }
        ],
        "ITSAppUsesNonExemptEncryption": false
      }
    },
```

**Explicación de las líneas 15–75:**

- **Línea 16**: la app soporta iPad (`supportsTablet: true`).
- **Línea 17**: `bundleIdentifier: com.safealert.app` (id de paquete iOS).
- **Línea 18**: apertura de `infoPlist`, diccionario que se inyecta en el `Info.plist` nativo durante prebuild.
- **Líneas 19-22**: textos obligatorios de uso de permisos (micrófono, ubicación en uso, ubicación siempre, contactos). Son las cadenas que iOS muestra al usuario al solicitar cada permiso. La de ubicación "siempre" justifica el seguimiento continuo en emergencias prolongadas.
- **Línea 23**: `NSPrivacyAccessedAPITypes` declara el acceso a categorías de datos de privacidad exigido por Apple desde iOS 17.
- **Líneas 24-29**: declara acceso a timestamps de archivos con razón `C617.1`.
- **Líneas 30-35**: declara acceso a espacio en disco con razón `E174.1`.
- **Líneas 36-41**: declara acceso a `UserDefaults` con razón `CA92.1`.
- **Líneas 42-47**: declara acceso a tiempo de arranque del sistema con razón `35F9.1`.
- **Líneas 48-71**: repite los cuatro bloques anteriores. [OBSERVACIÓN TÉCNICA] El bloque `NSPrivacyAccessedAPITypes` aparece duplicado (líneas 23-47 y 48-71): posible copia/pega en la edición de `app.json`. Aunque no rompe prebuild (se fusionan o se declaran de más), es redundante y conviene revisar.
- **Línea 73**: `ITSAppUsesNonExemptEncryption: false` declara que la app no usa cifrado no exento, evitando el cuestionario de exportación en App Store Connect.

```json
    "android": {
      "package": "com.safealert.app",
      "versionCode": 4,
      "googleServicesFile": "./google-services.json",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundImage": "./assets/android-icon-background.png",
        "monochromeImage": "./assets/android-icon-monochrome.png",
        "backgroundColor": "#DC2626"
      },
      "permissions": [
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.RECORD_AUDIO",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.VIBRATE",
        "android.permission.READ_CONTACTS",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.MODIFY_AUDIO_SETTINGS"
      ]
    },
```

**Explicación de las líneas 76–95:**

- **Línea 77**: `package: com.safealert.app`, application ID de Android (mismo dominio que iOS).
- **Línea 78**: `versionCode: 4` (entero que sube con cada release de Play Store).
- **Línea 79**: `googleServicesFile` apunta al archivo de credenciales de Firebase Android (ver `google-services.json.md`).
- **Líneas 80-85**: icono adaptativo Android: foreground, background, monocromo y color de fondo `#DC2626` (rojo característico de la marca SafeAlert).
- **Líneas 86-94**: lista de permisos Android solicitados: ubicación fina (GPS), grabación de audio (SOS por voz), notificaciones push (Android 13+), vibración (alertas), lectura de contactos (contactos de confianza), ubicación aproximada y ajuste de audio. [INFORMATIVO] `READ_CONTACTS` es un permiso sensible en Play Console (política de contactos) y `POST_NOTIFICATIONS` requiere solicitud en runtime.

```json
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/favicon.png",
      "name": "SafeAlert",
      "shortName": "SafeAlert",
      "description": "SafeAlert — Alerta SOS por voz y ubicación para tus contactos de confianza.",
      "themeColor": "#DC2626",
      "backgroundColor": "#F9FAFB",
      "lang": "es",
      "orientation": "portrait",
      "scope": "/",
      "startUrl": "/",
      "display": "standalone"
    },
    "experiments": {
      "baseUrl": "/"
    },
```

**Explicación de las líneas 96–113:**

- **Línea 97**: `bundler: metro` (se usa Metro también para web, no Webpack).
- **Línea 98**: `output: single` genera un único bundle HTML (SPA de una página) para la PWA.
- **Líneas 99-110**: metadatos PWA: favicon, nombre, nombre corto, descripción, colores de tema/fondo, idioma `es`, orientación, `scope` y `startUrl` `/`, y `display: standalone` (la PWA se abre sin barra de navegador).
- **Líneas 111-113**: `experiments.baseUrl: "/"` fija la base URL del bundle (relevante para desplegar la PWA en subcarpetas; aquí raíz).

```json
    "plugins": [
      "@react-native-firebase/app",
      "expo-router",
      "expo-location",
      [
        "expo-av",
        {
          "microphonePermission": "SafeAlert usa el micrófono para grabar mensajes de voz durante una emergencia."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#DC2626"
        }
      ],
      [
        "react-native-permissions",
        {
          "iosPermissions": [
            "Microphone",
            "LocationWhenInUse",
            "LocationAlways",
            "Contacts",
            "Notifications"
          ]
        }
      ],
      "./plugins/withManifestConflictFix",
      "expo-font",
      "@sentry/react-native",
      "expo-secure-store",
      "expo-localization"
    ],
```

**Explicación de las líneas 114–148:**

- **Línea 115**: `@react-native-firebase/app` aplica la configuración nativa de Firebase (necesita `google-services.json` en Android).
- **Línea 116**: `expo-router` activa el enrutado por archivos (directorio `app/`).
- **Línea 117**: `expo-location` añade permisos nativos de ubicación a ambas plataformas.
- **Líneas 118-123**: plugin `expo-av` con la cadena de permiso de micrófono en Android (la de iOS ya está en `infoPlist`).
- **Líneas 124-130**: plugin `expo-notifications` con icono y color de notificaciones Android (`#DC2626`).
- **Líneas 131-142**: plugin `react-native-permissions` que declara en iOS los permisos `Microphone`, `LocationWhenInUse`, `LocationAlways`, `Contacts`, `Notifications` (añade las claves `NS*UsageDescription` restantes al `Info.plist`).
- **Línea 143**: `./plugins/withManifestConflictFix` es un config plugin local del proyecto (ver su análisis propio) que inyecta `xmlns:tools` y `tools:replace` en el manifiesto Android para resolver conflictos de `meta-data`.
- **Líneas 144-147**: `expo-font` (fuentes), `@sentry/react-native` (crash reporting nativo), `expo-secure-store` (almacén seguro) y `expo-localization` (idioma/región).

```json
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "0f073eab-fccb-4bb2-91d6-86998ab38939"
      }
    },
    "owner": "oafontanas-team"
  }
}
```

**Explicación de las líneas 149–159:**

- **Línea 150-152**: `extra.router.origin: false` desactiva el origen absoluto del router (relativo), usado en builds web/híbridas para evitar problemas de base URL.
- **Líneas 153-155**: `extra.eas.projectId` identifica el proyecto en EAS para builds y actualizaciones remotas. [INFORMATIVO] Es un identificador de proyecto (necesario para `eas build`), no una credencial.
- **Línea 157**: `owner: oafontanas-team` vincula el proyecto a la organización/cuenta de EAS.

## Fichas de funciones y métodos

No aplica (archivo de configuración sin lógica).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Las líneas 23-71 duplican íntegramente el bloque `NSPrivacyAccessedAPITypes` (ocho entradas repetidas dos veces). Revisar si es intencional o un error de edición; en el `Info.plist` final podría quedar duplicado.
- [OBSERVACIÓN TÉCNICA] El config plugin local `./plugins/withDaVoiceMaven` (repositorio Maven de DaVoice) NO está listado en `plugins`; ver análisis de `plugins_withDaVoiceMaven.js.md`.
- [OBSERVACIÓN TÉCNICA] `expo-av` está deprecado (el propio proyecto lo silencia en `index.ts`); se mantiene por la funcionalidad de audio existente.
- [NOTA] `android.permission.READ_CONTACTS` y el acceso a contactos iOS declarados exigen cumplir la política de datos de contactos de Google Play y App Store (declaración de privacidad).

## Seguridad

- [INFORMATIVO] Los textos `NS*UsageDescription` y `microphonePermission` son cadenas visibles al usuario; no exponen secretos.
- [INFORMATIVO] `googleServicesFile` referencia un archivo con credenciales de Firebase Android (API key de Android); es un archivo de cliente, no un secreto de servidor (ver su .md).
- [INFORMATIVO] `ACCESS_FINE_LOCATION` + `LocationAlways` implican datos de ubicación precisos y continuos: dato personal sensible sujeto a las políticas de privacidad de las stores (la app ya declara `Politica de privacidad` en el proyecto).
- [INFORMATIVO] No se detectan secretos embebidos en este archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Revisar y eliminar la duplicación de `NSPrivacyAccessedAPITypes` (líneas 48-71) si se confirma que es redundante.
- [RECOMENDACIÓN] Verificar que la versión `1.2.0` y `versionCode: 4` son coherentes con el historial real de releases y con el `appVersionSource: remote` de `eas.json`.
- [RECOMENDACIÓN] Considerar la migración de `expo-av` a `expo-audio` antes de que la deprecación deje de tener soporte.
- [RECOMENDACIÓN] Mantener sincronizados `bundleIdentifier`/`package` con las consolas de Firebase, Apple y Google, y con `google-services.json`.
