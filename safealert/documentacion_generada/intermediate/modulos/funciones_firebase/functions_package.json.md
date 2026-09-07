# Archivo: functions/package.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| functions/package.json | 28 | JSON | 685 | Manifiesto npm (configuración de paquete Node) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define el manifiesto npm del paquete `safealert-functions`, que agrupa todas las
Cloud Functions de Firebase (v2) del proyecto SafeAlert. Declara nombre, versión,
punto de entrada compilado (`lib/index.js`), scripts de compilación y despliegue,
motor de Node exigido por Firebase y las dependencias de producción
(`firebase-admin`, `firebase-functions`, `mercadopago`, `twilio`, `zod`) y de
desarrollo (`typescript`, `@types/node`). Es el archivo que el CLI de Firebase
(`firebase deploy --only functions`) usa para instalar dependencias, compilar y
empaquetar el módulo `functions/`.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`.

El manifiesto es coherente con el código real del módulo: `main` apunta a
`lib/index.js` (salida de `tsc` según `tsconfig.json`, que usa `outDir: "lib"`),
el script `build` ejecuta `tsc` y las dependencias declaradas coinciden con los
imports observados en `functions/src/*.ts` (ver sección Dependencias). Es un
archivo de configuración puro: no contiene lógica ejecutable.

## Dependencias e importaciones

No aplica a un manifiesto JSON en el sentido de imports de código. En su lugar se
analizan las dependencias declaradas:

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| firebase-admin ^12.0.0 | externa (npm) | index.ts (initializeApp), users.ts, cleanupOldAlerts.ts, mpWebhook.ts, sendAlertSMS.ts | Sí |
| firebase-functions ^6.0.0 | externa (npm) | index.ts (reexport), sendAlertSMS.ts, cleanupOldAlerts.ts, createPaymentOrder.ts, mpWebhook.ts, users.ts | Sí |
| mercadopago ^2.12.0 | externa (npm) | createPaymentOrder.ts (PreApproval, Preference), mpWebhook.ts (Payment) | Sí |
| twilio ^5.3.0 | externa (npm) | sendAlertSMS.ts (vía `require('twilio')` dentro de createTwilioClient) | Sí |
| zod ^3.23.0 | externa (npm) | sendAlertSMS.ts (esquemas AlertSchema y derivados) | Sí |
| @types/node ^20.0.0 | externa (devDependency) | Tipos de Node en el compilador TypeScript | Sí |
| typescript ^5.3.0 | externa (devDependency) | Compilación (`npm run build` → `tsc`) | Sí |

[NOTA] El campo `"engines": { "node": "20" }` es el motor exigido por Firebase
para ejecutar las funciones; es coherente con funciones v2.

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| functions/tsconfig.json | Configura la compilación del paquete declarado aquí (`outDir: "lib"` coincide con `main`) |
| functions/src/index.ts | Es el punto de entrada que `main` referencia tras compilar |
| firebase.json | Declara `"source": "functions"` y el predeploy `npm --prefix "$RESOURCE_DIR" run build` para este paquete |
| Firebase CLI (firebase deploy) | Usa `package.json` para instalar y compilar antes de desplegar las funciones |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| name | safealert-functions | string | Identidad del paquete | Firebase CLI |
| version | 1.0.0 | string | Versión del paquete | metadata |
| main | lib/index.js | string | Punto de entrada compilado | runtime |
| engines.node | 20 | string | Versión de Node exigida | Firebase deploy |
| scripts.build | tsc | string | Compilar TypeScript | desarrollo |
| scripts.deploy | firebase deploy --only functions | string | Desplegar funciones | desarrollo |
| private | true | boolean | Evita publicación accidental a npm | npm |

## Estructura (funciones / clases / tipos)

Sin funciones, clases ni tipos: es un manifiesto JSON declarativo.

## Análisis línea por línea

```json
{
  "name": "safealert-functions",
  "version": "1.0.0",
  "description": "SafeAlert Firebase Cloud Functions",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "serve": "npm run build && firebase emulators:start --only functions",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "20"
  },
```

**Explicación de las líneas 1–15:**

Encabezado y metadatos del paquete más los scripts de desarrollo/despliegue.

- **Línea 2** (`"name": "safealert-functions"`): nombre interno del paquete; solo
  se usa localmente (campo `private: true`).
- **Línea 3**: versión semántica 1.0.0 del paquete.
- **Línea 4**: descripción textual.
- **Línea 5** (`"main": "lib/index.js"`): punto de entrada a la compilación; exige
  que el resultado de `tsc` termine en la carpeta `lib/`, como configura
  `tsconfig.json` (`outDir: "lib"`).
- **Línea 7** (`"build": "tsc"`): compila todo `src/` según `tsconfig.json`.
- **Línea 8**: compilación en modo vigilancia (watch) para desarrollo.
- **Línea 9**: compila y levanta el emulador local de Firebase solo para
  funciones (útil para pruebas locales con `firebase.json` → `emulators`).
- **Línea 10**: despliega exclusivamente las funciones en el proyecto Firebase.
- **Línea 11**: muestra los logs de funciones desplegadas.
- **Líneas 13–15**: `engines.node = "20"`; informa a Firebase qué runtime usar.
  Compatible con firebase-functions v2.

```json
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^6.0.0",
    "mercadopago": "^2.12.0",
    "twilio": "^5.3.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  },
  "private": true
}
```

**Explicación de las líneas 16–28:**

Dependencias de producción y desarrollo.

- **Línea 17** (firebase-admin): SDK de administración de Firebase; se usa en
  todos los archivos fuente para acceder a Firestore, Storage, etc., con
  privilegios de Admin (ignora reglas de seguridad).
- **Línea 18** (firebase-functions): SDK v2 de funciones (firestore, https,
  scheduler, params); necesario para los triggers.
- **Línea 19** (mercadopago): SDK oficial de Mercado Pago; usado por
  `createPaymentOrder.ts` (PreApproval, Preference) y `mpWebhook.ts` (Payment).
- **Línea 20** (twilio): SDK de Twilio para envío de SMS; usado en
  `sendAlertSMS.ts`.
- **Línea 21** (zod): validación de esquemas; usado en `sendAlertSMS.ts` para
  validar la estructura de la alerta antes de enviar SMS.
- **Línea 24** (@types/node): tipos de Node para el compilador.
- **Línea 25** (typescript): compilador TS en versión 5.3.
- **Línea 27** (`"private": true`): evita la publicación accidental a registros
  npm.

## Fichas de funciones y métodos

Sin lógica relevante (archivo declarativo).

## Clases / interfaces / tipos

Ninguna.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La dependencia `twilio` se importa en runtime mediante
  `require('twilio')` dentro de la función `createTwilioClient`
  (sendAlertSMS.ts, líneas 121–133) en lugar de un `import` estático; el
  paquete sí está declarado aquí, por lo que no hay inconsistencia de
  dependencias, pero el estilo mezcla CommonJS dinámico con el resto de
  imports estáticos.
- [OBSERVACIÓN TÉCNICA] El campo `engines.node: 20` debe coincidir con el
  runtime que Firebase asigna al proyecto; si el proyecto estuviera en un plan
  con runtime distinto, Firebase podría rechazar el despliegue o usar Node 20
  por defecto. [NIVEL DE CERTEZA: Inferido]
- [NOTA] No se declara la versión de la API de funciones explícitamente más
  allá de `^6.0.0` (v2 de firebase-functions), coherente con los imports
  `firebase-functions/v2/...` de los archivos fuente.

## Seguridad

- No se hallan secretos ni credenciales en este archivo: solo nombres de
  paquetes y scripts. Hallazgo: ninguno (INFORMATIVO).
- [INFORMATIVO] Dependencias con rangos amplios (`^`): `firebase-admin ^12`,
  `firebase-functions ^6`, `mercadopago ^2.12`, `twilio ^5.3`, `zod ^3.23`.
  Las actualizaciones menores automáticas pueden introducir cambios de
  comportamiento; se recomienda lockfile (`package-lock.json`) versionado y
  revisión de dependencias (npm audit) antes de cada despliegue.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Mantener el `package-lock.json` bajo control de versiones y
  ejecutar auditorías de dependencias periódicas para detectar
  vulnerabilidades en las cadenas transitivas de firebase-admin, twilio o
  mercadopago.
- [RECOMENDACIÓN] Verificar que la versión real instalada de
  `firebase-functions` (v6) sea compatible con el plan de precios y el runtime
  Node 20 del proyecto Firebase, pues afecta a límites de tiempo, memoria y
  región por defecto.
- [RECOMENDACIÓN] Añadir un script `typecheck` o `lint` explícito en `scripts`
  para endurecer el ciclo de calidad previo al deploy.
