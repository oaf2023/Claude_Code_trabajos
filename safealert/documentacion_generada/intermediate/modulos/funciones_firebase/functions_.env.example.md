# Archivo: functions/.env.example

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| functions/.env.example | 17 | texto (dotenv) | 713 | Plantilla de variables de entorno (ejemplo) | FUNCIONALIDAD EXISTENTE (plantilla de referencia) | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Plantilla de ejemplo de las variables de entorno que las Cloud Functions
pueden consumir en local (emuladores) y cuyo despliegue se gestiona en
producción vía variables de entorno de Firebase y Firebase Secret Manager.
Su propósito es documentar los NOMBRES de variables y su uso, sin valores
reales. Los valores mostrados son marcadores sintéticos
(`[SECRETO OCULTO]` conceptualmente; los literales que aparecen son de
ejemplo: prefijos `AC...`, `TEST-...`, `+1555...`).

[NOTA] El archivo NO contiene secretos reales; los valores literales
(`ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`, `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`,
`+15551234567`, `TEST-xxxx`) son marcadores de ejemplo. No obstante, por
política de la auditoría, todo valor se trata como `[SECRETO OCULTO]`.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` (como plantilla documental).

La plantilla refleja parte de las variables consumidas por el código real,
pero NO todas (ver Observaciones técnicas): el código de `sendAlertSMS.ts`
también usa `TWILIO_API_KEY_SID` y `TWILIO_API_SECRET`, y `users.ts` usa
`PYTHONANYWHERE_API_URL` y `SYNC_SECRET_KEY`, que no figuran en esta plantilla.

## Dependencias e importaciones

No aplica (archivo de entorno, no de código).

## Componentes que dependen de este archivo

| Componente | Variable | Relación |
| --- | --- | --- |
| sendAlertSMS.ts | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY_SID, TWILIO_API_SECRET, TWILIO_PHONE_NUMBER | Declaradas como `secrets` del trigger `sendAlertSMS` y leídas de `process.env` en `createTwilioClient` |
| createPaymentOrder.ts | MP_ACCESS_TOKEN, PAYMENTS_ENABLED, PA_API_URL, PA_INTERNAL_KEY (Secret Manager vía `defineSecret`) | Lectura de `process.env` + `defineSecret('PA_INTERNAL_KEY')` |
| mpWebhook.ts | MP_ACCESS_TOKEN | Lectura de `process.env` con fallback sintético |
| users.ts | PYTHONANYWHERE_API_URL, SYNC_SECRET_KEY | Lectura de `process.env` con valores por defecto |
| PythonAnywhere (backend) | PA_INTERNAL_KEY / SYNC_SECRET_KEY | Autenticación interna de las llamadas HTTP a `oaf.pythonanywhere.com` |

## Variables globales y constantes

Solo documenta NOMBRES de variables de entorno (los valores son
`[SECRETO OCULTO]`):

| Nombre de variable | Valor documentado | Tipo esperado | Finalidad | ¿La usa el código? | Referencias |
| --- | --- | --- | --- | --- | --- |
| TWILIO_ACCOUNT_SID | [SECRETO OCULTO] | string | SID de cuenta Twilio para SMS | Sí | sendAlertSMS.ts (103, 124, 128) |
| TWILIO_AUTH_TOKEN | [SECRETO OCULTO] | string | Token de autenticación de cuenta Twilio | Sí | sendAlertSMS.ts (104, 124) |
| TWILIO_PHONE_NUMBER | [SECRETO OCULTO] | string (E.164) | Remitente por defecto de los SMS | Sí | sendAlertSMS.ts (107, 153) |
| MP_ACCESS_TOKEN | [SECRETO OCULTO] | string | Access token de Mercado Pago (TEST- o APP_USR-) | Sí | createPaymentOrder.ts (22), mpWebhook.ts (15) |
| PAYMENTS_ENABLED | [SECRETO OCULTO] | boolean como string | Habilita/deshabilita la pasarela de pagos | Sí | createPaymentOrder.ts (24) |
| PA_API_URL | [SECRETO OCULTO] | string (URL) | URL base del backend PythonAnywhere | Sí | createPaymentOrder.ts (25) |
| PA_INTERNAL_KEY | [SECRETO OCULTO] | string | Clave interna para comunicación Firebase → PythonAnywhere | Sí (Secret Manager) | createPaymentOrder.ts (20) |
| TWILIO_API_KEY_SID | [SECRETO OCULTO] | string | SID de API Key Twilio (alternativa a AUTH_TOKEN) | Sí pero NO documentada en .env.example | sendAlertSMS.ts (105, 128) |
| TWILIO_API_SECRET | [SECRETO OCULTO] | string | Secreto de API Key Twilio | Sí pero NO documentada en .env.example | sendAlertSMS.ts (106, 128) |
| PYTHONANYWHERE_API_URL | [SECRETO OCULTO] | string (URL) | Endpoint de sincronización de usuarios en PythonAnywhere | Sí pero NO documentada en .env.example | users.ts (15) |
| SYNC_SECRET_KEY | [SECRETO OCULTO] | string | Clave de sincronización de perfiles (cabecera X-Sync-Secret) | Sí pero NO documentada en .env.example | users.ts (16, 56) |

## Estructura (funciones / clases / tipos)

Sin funciones, clases ni tipos.

## Análisis línea por línea

```text
# Proveedor SMS opcional para Cloud Functions
# Si no completas estos valores, SafeAlert usa un fallback interno en Firestore.
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+15551234567
```

**Explicación de las líneas 1–5:**

- **Línea 1**: comentario que describe el bloque: proveedor SMS opcional.
- **Línea 2**: indica que si no se completan los valores, la app usa un
  "fallback interno en Firestore"; coincide con la rama de error de
  `sendNotification` en `sendAlertSMS.ts` (líneas 177–195), que persiste el
  mensaje no enviado en la colección `pendingNotifications`.
- **Líneas 3–5**: nombres de variables Twilio con valores de ejemplo
  `[SECRETO OCULTO]` (el prefijo `AC` identifica Account SID; `+1555...` es un
  número de prueba norteamericano estándar de Twilio).

```text
# MercadoPago
MP_ACCESS_TOKEN=TEST-xxxx   # o APP_USR-xxxx en producción
PAYMENTS_ENABLED=true
PA_API_URL=https://oaf.pythonanywhere.com
```

**Explicación de las líneas 7–10:**

- **Línea 7**: comentario de cabecera del bloque Mercado Pago.
- **Línea 8**: `MP_ACCESS_TOKEN` con prefijo `TEST-` (entorno sandbox) o
  `APP_USR-` (producción). El código distingue el entorno con
  `MP_ACCESS_TOKEN.startsWith('TEST-')` en `createPaymentOrder.ts` (línea
  115). Valor `[SECRETO OCULTO]`.
- **Línea 9**: `PAYMENTS_ENABLED=true`; el código lo normaliza en
  `createPaymentOrder.ts` (línea 24): solo `'true'` (minúsculas, sin espacios)
  habilita la pasarela. La Cloud Function rechaza con
  `failed-precondition` si no está en `true`.
- **Línea 10**: `PA_API_URL`, base del backend PythonAnywhere
  (`https://oaf.pythonanywhere.com`). Valor visible en comentario de ejemplo;
  no es secreto en sí, pero se documenta como [SECRETO OCULTO] por política.

```text
# Clave interna para comunicación Firebase → PythonAnywhere
# El valor real se gestiona en Firebase Secret Manager (no va aquí)
# Para crear/actualizar el secreto:
#   npx firebase functions:secrets:set PA_INTERNAL_KEY
# PA_INTERNAL_KEY=  ← gestionado por Secret Manager, no por .env
```

**Explicación de las líneas 12–17:**

- **Líneas 12–13**: describen `PA_INTERNAL_KEY` como clave interna de la
  comunicación Firebase → PythonAnywhere y aclaran que su valor real se
  gestiona en Firebase Secret Manager, no en `.env`.
- **Línea 15**: comando documentado para crear/actualizar el secreto con el
  CLI (`npx firebase functions:secrets:set PA_INTERNAL_KEY`).
- **Línea 16**: variable comentada (no se asigna valor): coherente con su uso
  en `createPaymentOrder.ts` mediante `defineSecret('PA_INTERNAL_KEY')`
  (línea 20), que resuelve el valor desde Secret Manager en runtime.

## Fichas de funciones y métodos

Sin lógica relevante.

## Clases / interfaces / tipos

Ninguna.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La plantilla NO documenta `TWILIO_API_KEY_SID` y
  `TWILIO_API_SECRET`, que `sendAlertSMS.ts` declara como secretos del trigger
  y usa como alternativa a `TWILIO_AUTH_TOKEN` (líneas 105–106, 128–130).
  La documentación de entorno está incompleta respecto al código real.
- [OBSERVACIÓN TÉCNICA] La plantilla NO documenta `PYTHONANYWHERE_API_URL` ni
  `SYNC_SECRET_KEY`, usadas por `users.ts` (líneas 15–16) para sincronizar
  perfiles contra el endpoint `/api/v1/sync-user` de PythonAnywhere. Además,
  el cliente móvil usa una clave con el mismo propósito
  (`EXPO_PUBLIC_PA_SYNC_SECRET`), lo que sugiere que la misma clave viaja en el
  bundle del cliente: ver análisis de `users.ts`. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] En el código hay DOS claves de comunicación distintas
  hacia el mismo backend PythonAnywhere: `PA_INTERNAL_KEY` (cabecera
  `X-Internal-Key`, Secret Manager) y `SYNC_SECRET_KEY` (cabecera
  `X-Sync-Secret`, entorno). Es una duplicidad de mecanismos de autenticación
  que conviene unificar. [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] El `.env.example` documenta el valor `https://oaf.pythonanywhere.com`
  (URL de ejemplo del backend). No constituye secreto, pero se mantiene como
  [SECRETO OCULTO] en el análisis por política de la auditoría.

## Seguridad

- [INFORMATIVO] El archivo es una plantilla y no contiene secretos reales;
  sin embargo, copiar `.env.example` a `.env` con valores reales y subirlo al
  repositorio sería una fuga CRÍTICA. Se recomienda verificar que `.env` esté
  en `.gitignore`.
- [MEDIO] La existencia de la clave `SYNC_SECRET_KEY` (usada también desde el
  cliente móvil como `EXPO_PUBLIC_PA_SYNC_SECRET`) implica que el secreto de
  sincronización está comprometido por diseño en el bundle de la app: debe
  rotarse y migrarse la sincronización de perfiles exclusivamente a una Cloud
  Function que use Secret Manager (ver `users.ts`).
- [INFORMATIVO] `PA_INTERNAL_KEY` está correctamente gestionada por Firebase
  Secret Manager según la documentación del propio archivo y el código
  (`defineSecret`), lo que es la práctica recomendada.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Ampliar la plantilla con TODAS las variables reales:
  `TWILIO_API_KEY_SID`, `TWILIO_API_SECRET`, `PYTHONANYWHERE_API_URL` y
  `SYNC_SECRET_KEY`, indicando cuáles viven en Secret Manager y cuáles en
  configuración de entorno del proyecto Firebase.
- [RECOMENDACIÓN] Mover `SYNC_SECRET_KEY` a Firebase Secret Manager y eliminar
  su uso desde el cliente móvil para no exponerla en el bundle.
- [RECOMENDACIÓN] Revisar que `MP_ACCESS_TOKEN` de producción (`APP_USR-`) no
  esté en variables de entorno de código, sino en Secret Manager, igual que
  `PA_INTERNAL_KEY`; el código actual lo lee de `process.env` con un fallback
  sintético (ver `createPaymentOrder.ts` y `mpWebhook.ts`).
