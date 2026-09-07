# Archivo: google-services.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| google-services.json | 29 | JSON (Google Services) | 677 | Configuración de cliente Android de Firebase | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Archivo de configuración del cliente Android de Firebase (generado por la consola de Firebase). Lo consume el plugin de Gradle `com.google.gms.google-services` durante el build Android (referenciado en `app.json` línea 79 como `googleServicesFile`) para inicializar Firebase (proyecto, app id, API key, bucket) en la app nativa. Contiene solo credenciales de CLIENTE (no secretos de servidor).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Referenciado por `app.json` (`android.googleServicesFile`) y necesario para el plugin `@react-native-firebase/app`. [NIVEL DE CERTEZA: Confirmado por código]

## Política de secretos aplicada

Por directiva de la auditoría, en este documento se describen SOLO los nombres de las claves y su propósito. TODOS los valores reales se representan como [SECRETO OCULTO], aunque técnicamente sean credenciales de cliente Android (ver Observaciones de seguridad).

## Dependencias e importaciones

No importa módulos. Relacionado con:

| Clave | Relación |
| --- | --- |
| `app.json` línea 79 | `android.googleServicesFile: "./google-services.json"` |
| `@react-native-firebase/app` | Plugin nativo que lee la config en build |
| `.firebaserc` / `firebase.json` | Mismo proyecto Firebase |

## Componentes que dependen de este archivo

- Build de Gradle Android (plugin google-services).
- La app Android en runtime (inicialización de Firebase).
- Debe ser coherente con el `package` de `app.json` (`com.safealert.app`).

## Variables globales y constantes (solo nombres y propósito)

| Clave JSON | Propósito | Valor |
| --- | --- | --- |
| `project_info.project_number` | Número de proyecto (identificador numérico de Google Cloud) | [SECRETO OCULTO] |
| `project_info.project_id` | Identificador del proyecto Firebase | [SECRETO OCULTO] |
| `project_info.storage_bucket` | Bucket por defecto de Cloud Storage | [SECRETO OCULTO] |
| `client[].client_info.mobilesdk_app_id` | App ID del SDK móvil (formato `1:número:android:hash`) | [SECRETO OCULTO] |
| `client[].client_info.android_client_info.package_name` | Nombre del paquete Android (`com.safealert.app`) | `com.safealert.app` (valor no secreto, funcional) |
| `client[].oauth_client` | Lista de clientes OAuth (vacía en este archivo) | `[]` |
| `client[].api_key[].current_key` | API key de Android (clave de cliente) | [SECRETO OCULTO] |
| `client[].services.appinvite_service` | Configuración de App Invites (sin clientes OAuth) | objeto con listas vacías |
| `configuration_version` | Versión del formato del archivo (`1`) | `1` |

## Análisis línea por línea

```json
{
  "project_info": {
    "project_number": "[SECRETO OCULTO]",
    "project_id": "[SECRETO OCULTO]",
    "storage_bucket": "[SECRETO OCULTO]"
  },
```

**Explicación de las líneas 1–6 (valores reales omitidos):**

- **Línea 2**: apertura de `project_info`.
- **Línea 3**: `project_number` — identificador numérico del proyecto Google Cloud. Valor real: [SECRETO OCULTO].
- **Línea 4**: `project_id` — identificador del proyecto Firebase; debe coincidir con `.firebaserc` y la consola. Valor real: [SECRETO OCULTO].
- **Línea 5**: `storage_bucket` — bucket por defecto de Storage (formato `<proyecto>.firebasestorage.app`); es el bucket al que aplican `storage.rules`. Valor real: [SECRETO OCULTO].

```json
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "[SECRETO OCULTO]",
        "android_client_info": {
          "package_name": "com.safealert.app"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "[SECRETO OCULTO]"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
}
```

**Explicación de las líneas 7–29:**

- **Línea 7**: apertura del array `client` (un solo cliente Android).
- **Líneas 9-14**: `client_info`:
  - **Línea 10**: `mobilesdk_app_id` — App ID del SDK (compone el `applicationId` de Firebase). Valor real: [SECRETO OCULTO].
  - **Líneas 11-13**: `android_client_info.package_name` = `com.safealert.app` — debe coincidir con el `android.package` de `app.json`.
- **Línea 15**: `oauth_client: []` — sin clientes OAuth declarados.
- **Líneas 16-20**: `api_key` con una única `current_key`: la API key de Android. Valor real: [SECRETO OCULTO]. Es una clave de cliente que identifica el proyecto ante los servicios de Google; no autentica usuarios.
- **Líneas 21-26**: `services.appinvite_service.other_platform_oauth_client: []` — App Invites sin clientes de otras plataformas (config por defecto).
- **Línea 28**: `configuration_version: "1"` — formato del archivo.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El archivo contiene una sola entrada `client` (Android). No hay entradas iOS (el proyecto iOS usa `GoogleService-Info.plist` aparte, no presente en la raíz analizada) ni web (la PWA usa la config JS de Firebase). [NIVEL DE CERTEZA: Inferido]
- [OBSERVACIÓN TÉCNICA] La API key de Android es una credencial de cliente: Google la acepta como pública en el archivo, pero conviene restringirla por paquete/firma en la consola de Google Cloud (Android app restrictions).
- [NOTA] Cualquier cambio de paquete (`com.safealert.app`) o de proyecto Firebase exige regenerar este archivo desde la consola; una divergencia rompe la inicialización de Firebase en Android.

## Seguridad

- [INFORMATIVO] Las credenciales de google-services.json son de CLIENTE: no son secretos de autenticación de servidor y su presencia en el repositorio es el patrón oficial de Firebase Android.
- [MEDIO] La `api_key` (current_key) puede usarse para llamar a APIs públicas de Google asociadas al proyecto si no está restringida por paquete y SHA-1. [RECOMENDACIÓN] Configurar en Google Cloud las restricciones de la API key de Android (nombre de paquete + huellas de firma).
- [INFORMATIVO] El `project_id` y el `storage_bucket` identifican el backend; combinados con reglas incorrectas permitirían accesos, pero la protección real está en `firestore.rules`/`storage.rules` (ver sus .md).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Restringir la API key de Android en la consola (paquete + SHA-1 de release y debug).
- [RECOMENDACIÓN] No tratar este archivo como "secreto" en CI (es necesario en build), pero mantenerlo sincronizado con el proyecto Firebase correcto por entorno.
- [RECOMENDACIÓN] Revisar que el `.gitignore`/repositorio no contenga además `GoogleService-Info.plist` de iOS con valores de otro entorno.
