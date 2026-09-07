# Archivo: functions/src/users.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| functions/src/users.ts | 83 | TypeScript | 3128 | Cloud Function de sincronización (trigger Firestore) | FUNCIONALIDAD EXISTENTE (con riesgos de diseño) | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define `syncUserToPythonAnywhere`, una Cloud Function de tipo
`onDocumentCreated` que se dispara al crearse un documento en la colección
Firestore `users/{userId}`. Su responsabilidad es propagar los datos básicos
del perfil del usuario recién registrado (nombre, teléfono, URL de selfie,
tipo de autenticación) a la base de datos central del backend PythonAnywhere
(`home/oaf/ayudame`), mediante un POST HTTP al endpoint
`/api/v1/sync-user`, autenticado con la cabecera `X-Sync-Secret`. Tras la
respuesta marca en Firestore el resultado de la sincronización
(`syncStatus: 'synced' | 'error'`).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`.

La función está exportada desde `index.ts` (línea 10) y el flujo de creación de
perfil del cliente (`app/bienvenida.tsx`, línea 158–164) escribe el documento
de usuario en Firestore con el comentario explícito "Guardar en Firestore para
activar el trigger de PythonAnywhere", confirmando que el disparador está
conectado en el diseño. Sin embargo existen desalineaciones (ver
Observaciones y Seguridad).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| onDocumentCreated (firebase-functions/v2/firestore) | externa | Línea 22: definición del trigger | Sí |
| firebase-admin | externa | Líneas 12, 47, 71, 80 (FieldValue) y 34–46 (snapshot) | Sí |

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| functions/src/index.ts | Reexporta `syncUserToPythonAnywhere` (línea 10) |
| Cliente móvil app/bienvenida.tsx | Crea el documento `users/{phoneE164}` que dispara el trigger (líneas 158–164) |
| Backend PythonAnywhere | Recibe el POST a `/api/v1/sync-user` (contrato externo) |
| Colección Firestore `users` | Origen de datos del evento y destino del estado de sincronización |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| PYTHONANYWHERE_API_URL | process.env.PYTHONANYWHERE_API_URL o 'https://oaf.pythonanywhere.com/api/v1/sync-user' | string | Endpoint de sincronización | Líneas 15, 52 |
| SYNC_SECRET_KEY | process.env.SYNC_SECRET_KEY o '' | string [SECRETO OCULTO] | Clave compartida en cabecera X-Sync-Secret | Líneas 16, 29, 56 |

[NOTA] La URL por defecto contiene un dominio con subdominio de autor
(`oaf.pythonanywhere.com`). No es un secreto, pero se documenta enmascarado por
política. El valor por defecto del endpoint coincide con la ruta que usa el
cliente móvil (`PythonAnywhereSync.ts`: `PA_API_URL/api/v1/sync-user`).

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| syncUserToPythonAnywhere | Cloud Function onDocumentCreated | 22–83 |
| payload (objeto local) | variable | 41–49 |

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : users.ts
* Descripción     : Cloud Function para sincronizar perfiles de usuario con PythonAnywhere.
* Autor           : oafon
* Fecha           : 2020-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.3
* Uso             : Se dispara al crear un nuevo documento en la colección 'users'.
* ============================================================================ */

import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';

// URL de la API en PythonAnywhere (home/oaf/ayudame)
const PYTHONANYWHERE_API_URL = process.env.PYTHONANYWHERE_API_URL || 'https://oaf.pythonanywhere.com/api/v1/sync-user';
const SYNC_SECRET_KEY = process.env.SYNC_SECRET_KEY || '';
```

**Explicación de las líneas 1–16:**

- **Líneas 1–9**: cabecera documental del archivo (autor, versión, uso). La
  fecha indicada (2020-03-30) es anterior a las fechas de otros archivos del
  módulo (2026); probablemente es una fecha errónea o heredada de una copia
  inicial. [OBSERVACIÓN TÉCNICA]
- **Línea 11**: importa el helper de trigger v2 de Firestore para documentos
  creados.
- **Línea 12**: importa firebase-admin (inicializado en `index.ts`).
- **Línea 15**: URL del endpoint de sincronización con valor por defecto si no
  existe la variable de entorno.
- **Línea 16**: clave secreta de sincronización leída de `process.env` con
  valor por defecto vacío `''`. [RIESGO] La clave NO se gestiona por Secret
  Manager en este archivo (a diferencia de `createPaymentOrder.ts`), y el
  cliente móvil usa la misma clase de clave en su bundle
  (`EXPO_PUBLIC_PA_SYNC_SECRET`, ver PythonAnywhereSync.ts). Si ambas claves
  coinciden, el "secreto" es público de facto. [NIVEL DE CERTEZA: Altamente probable]

```ts
/**
 * Trigger que se activa cuando un nuevo usuario completa su registro en la App.
 * Envía los datos básicos (nombre, teléfono, selfie_url) a la DB central en PythonAnywhere.
 */
export const syncUserToPythonAnywhere = onDocumentCreated('users/{userId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log('No hay datos en el evento de creación de usuario.');
    return;
  }

  if (!SYNC_SECRET_KEY) {
    console.error('[Sync] SYNC_SECRET_KEY no configurada — abortando sincronización.');
    return;
  }
```

**Explicación de las líneas 18–32:**

- **Líneas 18–21**: docstring del trigger: dispara al completar el registro.
- **Línea 22**: definición del trigger sobre `users/{userId}`; `userId` queda
  disponible en `event.params.userId`.
- **Líneas 23–27**: si el evento no trae snapshot (borrado u otro caso sin
  datos), registra y retorna sin actuar.
- **Líneas 29–32**: si `SYNC_SECRET_KEY` está vacía, aborta la sincronización
  con un error en consola. Es un cortocircuito defensivo correcto, pero sin
  configurar la variable la función queda inoperante (y sin marcar nada en
  Firestore).

```ts
  const userData = snapshot.data();
  const userId = event.params.userId;

  console.log(`[Sync] Iniciando sincronización para el usuario: ${userId}`);

  try {
    // Preparar el payload para la base de datos central (home/oaf/ayudame/db.sqlite3)
    const payload = {
      userId: userId,
      userName: userData.userName || 'Usuario Sin Nombre',
      userPhone: userData.userPhone || '',
      selfieUrl: userData.selfieUrl || '',
      authType: userData.authType || 'anonymous',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'pending_verification'
    };
```

**Explicación de las líneas 34–49:**

- **Línea 34**: obtiene los datos del documento creado.
- **Línea 35**: obtiene el id del documento (`userId`).
- **Línea 37**: log de inicio (contiene `userId`, no datos sensibles
  adicionales).
- **Línea 41–49**: construye el payload JSON que se enviará a PythonAnywhere.
  - `userId`: id del documento Firestore (ver Observaciones: el cliente usa el
    teléfono E.164 como id de documento, no el uid de Firebase Auth).
  - `userName`/`userPhone`/`selfieUrl`: campos con valores por defecto vacíos o
    de texto si faltan. No se valida formato (p. ej. teléfono E.164).
  - `authType`: por defecto `'anonymous'` si el documento no lo trae (el flujo
    `app/bienvenida.tsx` no escribe `authType`, por lo que siempre llegará
    `'anonymous'` aunque el usuario use otro método de Auth). [OBSERVACIÓN TÉCNICA]
  - **Línea 47**: [OBSERVACIÓN TÉCNICA IMPORTANTE] `createdAt` usa
    `admin.firestore.FieldValue.serverTimestamp()` DENTRO del payload que se
    serializa con `JSON.stringify` y se envía por HTTP. Un `FieldValue` no es
    serializable como timestamp: al convertirlo a JSON no produce un valor de
    fecha real que PythonAnywhere pueda interpretar; el backend recibirá un
    objeto sin semántica de fecha. Debería enviarse un número (epoch) o un
    string ISO. [NIVEL DE CERTEZA: Confirmado por código]
  - `status: 'pending_verification'`: estado inicial esperado por el backend
    central.

```ts
    // Realizar la petición POST al backend en PythonAnywhere
    const response = await fetch(PYTHONANYWHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': SYNC_SECRET_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en la API de PythonAnywhere: ${response.status} - ${errorText}`);
    }

    console.log(`[Sync] Usuario ${userId} sincronizado exitosamente con PythonAnywhere.`);

    // Opcional: Marcar en Firestore que la sincronización fue exitosa
    await snapshot.ref.update({
      syncStatus: 'synced',
      syncedAt: admin.firestore.FieldValue.serverTimestamp()
    });
```

**Explicación de las líneas 51–72:**

- **Líneas 52–59**: POST HTTP nativo (fetch, disponible en Node 20) al backend
  PythonAnywhere con la cabecera `X-Sync-Secret`. No hay timeout explícito;
  depende del timeout general de la Cloud Function.
- **Líneas 61–64**: si la respuesta no es 2xx, lee el cuerpo de error y lanza
  una excepción cuyo mensaje incluye el status y el texto devuelto por el
  backend. [RIESGO] El texto de error del backend se incorpora al mensaje y
  posteriormente se persiste en Firestore (`syncError`), pudiendo filtrar
  detalles internos del backend a un documento legible por el propio usuario.
  Impacto: BAJO (la información es del propio usuario), pero conviene acotar.
- **Línea 66**: log de éxito con `userId`.
- **Líneas 68–72**: actualiza el documento del usuario marcando
  `syncStatus: 'synced'` y `syncedAt` con timestamp de servidor.

```ts
  } catch (error) {
    console.error(`[Sync] Error sincronizando usuario ${userId}:`, error);

    // Reintentar o marcar error para auditoría
    await snapshot.ref.update({
      syncStatus: 'error',
      syncError: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

**Explicación de las líneas 74–83:**

- **Línea 74**: abre el bloque catch del try anterior.
- **Líneas 75**: log de error con el objeto completo (puede incluir detalles
  de la respuesta HTTP).
- **Líneas 77–81**: marca el documento con `syncStatus: 'error'` y almacena el
  mensaje de error (incluido el cuerpo de error del backend) en `syncError`.
- **Línea 82**: cierra la función; si el `snapshot.ref.update` del catch
  fallara, la excepción propagaría y Firebase reintentaría el evento según la
  política de reintentos del trigger (retry por defecto desactivado en v2
  salvo configuración). No hay lógica de reintento automático del POST.

## Fichas de funciones y métodos

### syncUserToPythonAnywhere (líneas 22–83)

- Firma (código original):
  `export const syncUserToPythonAnywhere = onDocumentCreated('users/{userId}', async (event) => {...})`
- Propósito técnico: trigger Firestore v2 que reacciona a la creación de un
  documento en `users/{userId}` y ejecuta una integración HTTP saliente.
- Propósito funcional: replicar el perfil del usuario recién registrado en la
  BD central de PythonAnywhere y reflejar el estado de la operación en
  Firestore.
- Parámetros: `event` (objeto de evento Firestore v2 con `data` y
  `params.userId`).
- Retorno: `Promise<void>` (sin valor; efectos en backend remoto y Firestore).
- Excepciones: ninguna propagada al exterior; todas se capturan y registran en
  el documento (`syncError`).
- Dependencias: firebase-admin, fetch de Node, endpoint PythonAnywhere,
  `SYNC_SECRET_KEY`.
- Flujo interno: 1) validar snapshot; 2) validar clave configurada; 3) construir
  payload; 4) POST; 5) en éxito marcar `synced`; 6) en error marcar `error`.
- Desde dónde se llama: registrada automáticamente por Firebase (export en
  index.ts); disparada por escrituras del cliente en `users/*`.
- Efectos secundarios: escritura remota en PythonAnywhere y actualización del
  documento Firestore origen.
- Riesgos: fallo de serialización de `createdAt`, ausencia de reintentos,
  clave posiblemente expuesta en el cliente, sin validación de entrada.

## Clases / interfaces / tipos

Ninguna (solo objetos tipados implícitamente por el SDK).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El id de documento `userId` que recibe el trigger NO es
  necesariamente el uid de Firebase Auth: el alta en `app/bienvenida.tsx`
  (línea 159) crea el documento con `firestore().collection('users').doc(phoneE164)`
  (teléfono E.164 como id). Por tanto `payload.userId` es el teléfono E.164.
  Además, las reglas `firestore.rules` exigen `request.auth.uid == userId`
  para `users/{userId}/**`, lo que entraría en conflicto con documentos cuyo
  id es un teléfono (la escritura sería denegada salvo que el uid coincida).
  Esta desalineación sugiere que el trigger podría no dispararse en producción
  tal como se espera, o que la colección `users` contiene ids heterogéneos.
  [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] `authType` siempre cae en `'anonymous'` con el flujo
  actual del cliente, porque `app/bienvenida.tsx` no escribe ese campo.
  [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Envío de `FieldValue.serverTimestamp()` dentro de un
  payload JSON por HTTP (línea 47): no se serializa como fecha; ver Explicación
  de líneas 41–49.
- [OBSERVACIÓN TÉCNICA] La fecha de cabecera del archivo (2020-03-30) es
  incoherente con el resto del módulo (2026) y con la creación real del
  proyecto: probablemente errónea. [NIVEL DE CERTEZA: Inferido]
- [OBSERVACIÓN TÉCNICA] El trigger se dispara con CUALQUIER documento creado en
  `users/*`, incluidos documentos raíz de usuario con datos parciales o
  documentos creados por otros mecanismos; no hay filtro de "registro
  completado" (p. ej. presencia de `userPhone`).
- [OBSERVACIÓN TÉCNICA] Sin reintentos ni colas: un fallo transitorio de red
  deja `syncStatus: 'error'` de forma permanente hasta que algo lo vuelva a
  intentar. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [ALTO] Secreto de sincronización potencialmente expuesto en el cliente: el
  mismo contrato (`X-Sync-Secret`) lo usa el cliente móvil con
  `EXPO_PUBLIC_PA_SYNC_SECRET` (src/services/PythonAnywhereSync.ts, que además
  documenta textualmente el riesgo en su cabecera: "Esta sincronización expone
  la clave en el cliente... Migrar a Firebase Function como proxy"). Si
  `SYNC_SECRET_KEY` de las funciones coincide con la clave pública del bundle,
  el endpoint `/api/v1/sync-user` queda abierto a escritura por cualquiera que
  extraiga la clave de la app. [NIVEL DE CERTEZA: Altamente probable]
- [MEDIO] Ausencia de validación de entrada: los campos del documento
  (`userName`, `userPhone`, `selfieUrl`) se reenvían sin validar formato ni
  longitud; un documento manipulado (el dueño puede escribir su propio doc
  según reglas) permite inyectar datos arbitrarios en la BD central.
- [BAJO] El cuerpo de error del backend se persiste en el campo `syncError`
  del documento del usuario; si el backend devolviera trazas internas, quedarían
  almacenadas en Firestore. [NIVEL DE CERTEZA: Inferido]
- [INFORMATIVO] No se registran secretos en logs: las líneas de log solo
  incluyen `userId` y mensajes genéricos. Correcto.
- [INFORMATIVO] El trigger no expone endpoints HTTP directos; la superficie de
  ataque es la escritura permitida en la colección `users`.
- [BAJO] Sin autenticación ni autorización propias dentro de la función: se
  confía plenamente en que las reglas de Firestore y el diseño del cliente
  generen documentos válidos.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Migrar `SYNC_SECRET_KEY` a Firebase Secret Manager
  (`defineSecret`) y eliminar la sincronización directa desde el cliente para
  que el secreto no viaje en el bundle; rotar la clave actual.
- [RECOMENDACIÓN] Sustituir `FieldValue.serverTimestamp()` del payload por un
  número epoch (`Date.now()`) o string ISO antes de enviarlo por HTTP.
- [RECOMENDACIÓN] Validar el esquema del documento con zod (ya incluido en el
  proyecto) antes de propagarlo al backend.
- [RECOMENDACIÓN] Unificar los ids: decidir si la colección `users` usa uid de
  Firebase o teléfono E.164 como id de documento y alinear `firestore.rules`
  (hoy exigen `uid == userId`).
- [RECOMENDACIÓN] Corregir la fecha de la cabecera del archivo (2020-03-30) y
  añadir lógica de reintento (p. ej. cola de tareas o estado `pending` con
  reproceso programado) para los fallos transitorios.
