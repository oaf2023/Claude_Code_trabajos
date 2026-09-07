# Archivo: iphone/app.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/app.json | 64 | JSON | 2094 | Configuración de aplicación Expo | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Configuración de Expo del cliente Apple (`SafeAlert Apple` / `safealert-iphone`).
Define identidad de app, orientación, iconos y splash (apuntando a los assets del
proyecto padre `../assets/`), bloque iOS con `bundleIdentifier` propio y textos de
permisos, bloque Web, y la lista de plugins de Expo. Es la pieza que diferencia a la
variante `iphone/` de la app principal `app.json` de la raíz (que incluye Android,
Firebase nativo, Sentry, pago y PWA).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: configuración válida para generar un binario iOS/Web
independiente de la app Android principal. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| expo-router (plugin) | externa | Enrutado por archivos | Sí (ver `index.ts` y `app/`) |
| expo-location | externa | Permisos y ubicación compartida (`src/services/LocationService.ts`) | Sí, código compartido |
| expo-av | externa | Grabación/reproducción de audio (permiso de micrófono) | Sí, código compartido |
| expo-notifications | externa | Notificaciones locales/remotas | Sí, código compartido |
| react-native-permissions | externa | Permisos iOS (cámara, micrófono, ubicación, contactos, notificaciones) | Sí, código compartido |
| expo-font | externa | Carga de fuentes | Sí, código compartido |
| @react-native-firebase/app | NO incluido | Firebase nativa (solo Android en la raíz) | No en esta variante |
| expo-secure-store / expo-localization / @sentry/react-native | NO incluidos | Presentes en la app principal | No en esta variante |

## Componentes que dependen de este archivo

Lo consume Expo CLI/prebuild y el plugin expo-router al resolver rutas en
`iphone/app/`. No hay imports en código. [NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| expo.name | SafeAlert Apple | string | Nombre visible | Línea 3 |
| expo.slug | safealert-iphone | string | Slug EAS/Expo | Línea 4 |
| expo.scheme | safealert | string | Esquema de deep links | Línea 5 |
| expo.version | 1.0.0 | string | Versión de la app | Línea 6 |
| expo.orientation | portrait | string | Orientación | Línea 7 |
| expo.icon | ../assets/icon.png | string | Icono (assets del padre) | Línea 8 |
| expo.userInterfaceStyle | light | string | Tema | Línea 9 |
| expo.splash | imagen + resizeMode + color | object | Splash | Líneas 10-14 |
| expo.ios.supportsTablet | true | boolean | Soporte iPad | Línea 16 |
| expo.ios.bundleIdentifier | com.safealert.apple | string | Identificador de bundle iOS | Línea 17 |
| expo.ios.infoPlist | NSCamera/Microphone/Location/Contacts Usage... | object | Textos de permisos iOS | Líneas 18-24 |
| expo.web | bundler/output/favicon/name | object | Configuración Web | Líneas 26-31 |
| expo.plugins | lista de plugins | array | Plugins de prebuild | Líneas 32-62 |

## Estructura (funciones / clases / tipos)

No aplica: objeto JSON de configuración.

## Análisis línea por línea

```json
{
  "expo": {
    "name": "SafeAlert Apple",
    "slug": "safealert-iphone",
    "scheme": "safealert",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "../assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "../assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

**Explicación de las líneas 1-14:**

- **Línea 3**: nombre comercial del cliente Apple: `SafeAlert Apple`, distinto de
  `SafeAlert` (raíz).
- **Línea 4**: slug `safealert-iphone` (la raíz usa `alertas`). Evita colisión con el
  proyecto Android en EAS.
- **Línea 5**: scheme `safealert` compartido con la raíz: los deep links
  `safealert://` podrían colisionar entre ambas apps instaladas.
  [OBSERVACIÓN TÉCNICA]
- **Línea 6**: versión 1.0.0 (la app principal declara 1.2.0). Ambas conviven con el
  mismo backend sin correlación de versiones.
- **Línea 7**: portrait únicamente.
- **Línea 8**: el icono se toma de `../assets/icon.png`, es decir, los assets de la
  raíz del proyecto; la variante no posee carpeta `assets` propia (confirmado en el
  sistema de archivos).
- **Líneas 10-14**: splash blanco con el asset compartido del padre.
- [OBSERVACIÓN TÉCNICA] Referencias a assets fuera de la carpeta del proyecto
  (`../assets/...`): funcional cuando se compila desde el monorepo, pero rompería un
  build aislado de `iphone/` sin la raíz.

```json
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.safealert.apple",
      "infoPlist": {
        "NSCameraUsageDescription": "SafeAlert necesita acceder a la camara para registrar tu selfie de seguridad.",
        "NSMicrophoneUsageDescription": "SafeAlert necesita acceso al microfono para grabar mensajes de voz en caso de emergencia.",
        "NSLocationWhenInUseUsageDescription": "SafeAlert usa tu ubicacion para enviarla a tus contactos de confianza en caso de emergencia.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "SafeAlert requiere acceso continuo a la ubicacion para mantener actualizadas las alertas prolongadas.",
        "NSContactsUsageDescription": "SafeAlert accede a tus contactos por unica vez para permitirte seleccionar tus contactos de confianza facilmente."
      }
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "../assets/favicon.png",
      "name": "SafeAlert Apple"
    },
```

**Explicación de las líneas 15-31:**

- **Línea 17**: `bundleIdentifier` propio `com.safealert.apple` (la raíz usa
  `com.safealert.app`). Permite coexistir en el mismo dispositivo iOS.
- **Líneas 18-24**: `infoPlist` con los textos de uso de cámara, micrófono, ubicación
  (cuando está en uso y siempre/en uso) y contactos. [NOTA] Los textos carecen de
  acentos ("camara", "ubicacion", "unica vez"), a diferencia de los textos con
  ortografía cuidada del `app.json` raíz; es solo calidad de redacción, no funcional.
- **Línea 19**: incluye `NSCameraUsageDescription`, que la app principal no declara en
  su `app.json` raíz (la raíz no solicita cámara); la variante Apple sí la declara
  porque su lista de permisos de `react-native-permissions` incluye `Camera`.
- [NOTA] A diferencia del `app.json` raíz, aquí NO se declaran
  `NSPrivacyAccessedAPITypes` ni `ITSAppUsesNonExemptEncryption`: si se publica en
  App Store, Apple puede exigir la declaración de APIs de privacidad accedidas.
  [OBSERVACIÓN TÉCNICA]
- **Líneas 26-31**: Web con Metro, salida `static` (la raíz usa `output: "single"`).
  Favicon y nombre propios.

```json
    "plugins": [
      "expo-router",
      "expo-location",
      [
        "expo-av",
        {
          "microphonePermission": "SafeAlert usa el microfono para grabar mensajes de voz durante una emergencia."
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "../assets/notification-icon.png",
          "color": "#DC2626"
        }
      ],
      [
        "react-native-permissions",
        {
          "iosPermissions": [
            "Camera",
            "Microphone",
            "LocationWhenInUse",
            "LocationAlways",
            "Contacts",
            "Notifications"
          ]
        }
      ],
      "expo-font"
    ]
  }
}
```

**Explicación de las líneas 32-64:**

- **Línea 33**: plugin expo-router, imprescindible para el enrutado por archivos.
- **Línea 34**: expo-location, necesario para la lógica de ubicación compartida.
- **Líneas 35-40**: expo-av con permiso de micrófono personalizado.
- **Líneas 41-47**: expo-notifications con icono del padre y color `#DC2626` (rojo
  corporativo de alerta).
- **Líneas 48-60**: react-native-permissions declarando permisos iOS: Camera,
  Microphone, LocationWhenInUse, LocationAlways, Contacts, Notifications. Incluye
  `Camera`, que la lista de la raíz no tiene. [OBSERVACIÓN TÉCNICA] La raíz declara
  exactamente los mismos salvo `Camera`.
- **Línea 61**: expo-font.
- [OBSERVACIÓN TÉCNICA] La lista de plugins es más corta que la de la raíz: no hay
  `@react-native-firebase/app`, `@sentry/react-native`, `expo-secure-store`,
  `expo-localization`, `expo-splash-screen` ni el plugin local
  `./plugins/withManifestConflictFix`. El código compartido que use Sentry o
  expo-secure-store tendrá que degradarse o depender de los módulos JS equivalentes;
  Firebase se sirve de la capa modular `src/config/firebase.ts` (híbrida por
  `Platform`).
- [NOTA] No hay sección `android` ni `extra.eas.projectId`/`owner` (presentes en la
  raíz): esta variante no se orienta a EAS Android.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Dependencia de assets externos (`../assets/*`) en icon,
  splash, favicon y notificaciones; la carpeta `iphone/` no tiene `assets/` propia.
- [OBSERVACIÓN TÉCNICA] Falta la declaración `NSPrivacyAccessedAPITypes` /
  `ITSAppUsesNonExemptEncryption` presente en la raíz; requerible para revisión de App
  Store.
- [OBSERVACIÓN TÉCNICA] Scheme `safealert` idéntico al de la app principal: colisión
  potencial de deep links si ambas apps se instalan juntas.
- [NIVEL DE CERTEZA: Confirmado por código] Diferencias reales frente al `app.json`
  raíz: sin Android, bundleIdentifier distinto, versión 1.0.0 vs 1.2.0, web output
  `static` vs `single`, plugins reducidos y permisos iOS con cámara adicional.

## Seguridad

- [INFORMATIVO] Los textos de permisos revelan el alcance de datos (cámara, micrófono,
  ubicación, contactos, notificaciones). La recopilación de ubicación continua
  (`LocationAlways`) y contactos exige justificación de cara a la revisión de App
  Store (privacidad/Data Governance).
- [INFORMATIVO] No se incluyen credenciales ni claves API en este archivo.
  [NIVEL DE CERTEZA: Confirmado por código]
- [MEDIO] Falta declaración de APIs de privacidad accedidas (NSPrivacyAccessedAPITypes)
  requerida por Apple para `UserDefaults`, timestamps de archivos, etc.; la app usa
  AsyncStorage/UserDefaults en código compartido. Riesgo de rechazo o revisión
  extendida en App Store.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] ALTO: publicación en App Store sin `NSPrivacyAccessedAPITypes` puede
  provocar rechazo (Apple exige declarar APIs de privacidad desde mayo de 2024).
- [RIESGO] MEDIO: textos de permisos sin acentos y algo imprecisos (privacidad
  legible); recomendación de revisión de redacción.
- [RECOMENDACIÓN] Revisar si el flujo de selfie de seguridad (cámara) existe en esta
  variante o si el permiso de cámara quedó copiado sin uso real; si no se usa, debe
  retirarse para minimizar superficie de permisos (principio de mínimo privilegio).
- [INFORMATIVO] No se recomienda ejecutar builds aislados de `iphone/` sin la raíz por
  las referencias a `../assets`.
