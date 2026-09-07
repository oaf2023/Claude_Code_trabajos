# Archivo: src/services/PythonAnywhereSync.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/PythonAnywhereSync.ts | 87 | TypeScript 5.9 | 3793 | Sincronización legada de perfiles con PythonAnywhere (cliente) | [CÓDIGO LEGADO] / [POTENCIALMENTE NO UTILIZADO] | [NIVEL DE CERTEZA: Altamente probable] |

## Objetivo

Servicio cliente para sincronizar el perfil real del usuario (userId, nombre, teléfono, selfie) con la base central de PythonAnywhere y para recuperar logs remotos. La propia cabecera del archivo advierte del riesgo: **la clave de sincronización se expone en el cliente** y recomienda migrar a una Firebase Function como proxy.

Estado real verificado: la migración recomendada **ya existe** en `functions/src/users.ts` (`syncUserToPythonAnywhere`, trigger `onDocumentCreated('users/{userId}')`) que realiza la misma llamada al endpoint `/api/v1/sync-user` con el secreto en el entorno del servidor. El servicio cliente no tiene importadores encontrados.

## Clasificación y estado

- [CÓDIGO LEGADO] / [POTENCIALMENTE NO UTILIZADO]:
  - Grep en todo el repositorio de `PythonAnywhereSync`, `syncProfileToBackend` y `getRemoteLogs`: solo aparecen dentro del propio archivo. Sin importadores en la app ni en tests. [NIVEL DE CERTEZA: Altamente probable]
  - La funcionalidad equivalente está implementada server-side en `functions/src/users.ts` (Cloud Function `syncUserToPythonAnywhere`), con el secreto en variable de entorno del servidor — el patrón exacto que la cabecera recomienda. [NIVEL DE CERTEZA: Confirmado por código]
- La cabecera (v1.2.0, 2026-06-29) documenta el riesgo de exponer la clave y la intención de migrar; esa migración ya está hecha en Functions, lo que refuerza la clasificación de legado. [NIVEL DE CERTEZA: Altamente probable]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `PA_API_URL` de `../config/features` | interna | Construir `PYTHONANYWHERE_API_URL` | Sí (solo en `syncProfileToBackend`) |
| `process.env.EXPO_PUBLIC_PA_SYNC_SECRET` | variable de entorno (bundle) | Header `X-Sync-Secret` | Sí |

Nota: `getRemoteLogs` no usa `PA_API_URL`; fija la URL de logs con el dominio literal `https://oaf.pythonanywhere.com` (línea 79), ignorando la configuración. [OBSERVACIÓN TÉCNICA]

## Componentes que dependen de este archivo

- No se encontraron componentes que lo importen (grep en todo el proyecto). [NIVEL DE CERTEZA: Altamente probable]
- Sustituto funcional server-side: `functions/src/users.ts` (`syncUserToPythonAnywhere`), exportada en `functions/src/index.ts` línea 10. [NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `PYTHONANYWHERE_API_URL` | `{PA_API_URL}/api/v1/sync-user` | string | Endpoint de sincronización de perfiles | Líneas 16, 41 |
| `SYNC_SECRET_KEY` | `process.env.EXPO_PUBLIC_PA_SYNC_SECRET \|\| ''` → [SECRETO OCULTO] | string | Header `X-Sync-Secret` | Líneas 17, 45 |
| URL de logs | `https://oaf.pythonanywhere.com/api/v1/logs?limit={n}` | string | Endpoint de logs (hardcodeado) | Línea 79 |
| `limit` por defecto | `50` | number | Cantidad de logs a pedir | Línea 75 |

La variable `EXPO_PUBLIC_PA_SYNC_SECRET` se incrusta en el bundle de la app (prefijo EXPO_PUBLIC_), por lo que su valor es extraíble del APK. [NIVEL DE CERTEZA: Confirmado por código]

## Estructura (funciones / clases / tipos)

- Interfaz exportada: `UserProfileSync` (líneas 19–24).
- Funciones exportadas:
  - `syncProfileToBackend(data: UserProfileSync): Promise<{ success: boolean; message: string }>` (líneas 37–62).
  - `getRemoteLogs(limit = 50): Promise<string[]>` (líneas 75–86).

## Análisis línea por línea

**Bloque 1 (líneas 1–36): cabecera, constantes e interfaz.**

```ts
/* ============================================================================
* Archivo         : PythonAnywhereSync.ts
* Descripción     : Servicio para sincronización de perfiles con PythonAnywhere.
*                   ⚠️  Esta sincronización expone la clave en el cliente.
*                   Migrar a Firebase Function como proxy para eliminar
*                   este riesgo. Por ahora la clave se lee de variable de entorno.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { syncProfileToBackend } from './PythonAnywhereSync';
* ============================================================================ */

import { PA_API_URL } from '../config/features';

const PYTHONANYWHERE_API_URL = `${PA_API_URL}/api/v1/sync-user`;
const SYNC_SECRET_KEY = process.env.EXPO_PUBLIC_PA_SYNC_SECRET || '';

export interface UserProfileSync {
  userId: string;
  userName: string;
  userPhone: string;
  selfieUrl: string;
}

/* ============================================================================
* Función         : syncProfileToBackend
* Descripción     : Envía los datos reales del perfil a la DB central.
* Fecha           : 2026-03-30
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : API Endpoint: https://oaf.pythonanywhere.com/api/v1/sync-user
* Ingesta         : data: UserProfileSync
* Devolución      : Promise<{success: boolean, message: string}>
* Uso             : await syncProfileToBackend(profileData);
* ============================================================================ */
```

**Explicación de las líneas 1–36:**
- **Líneas 1–12**: cabecera con advertencia explícita de seguridad: "⚠️ Esta sincronización expone la clave en el cliente. Migrar a Firebase Function como proxy...". Documenta la deuda técnica conocida.
- **Línea 14**: importa la URL base PA.
- **Línea 16**: compone la URL del endpoint de sincronización: `{PA_API_URL}/api/v1/sync-user`.
- **Línea 17**: lee el secreto de sincronización de la variable `EXPO_PUBLIC_PA_SYNC_SECRET` (incrustada en el bundle).
- **Líneas 19–24**: interfaz `UserProfileSync`: `userId`, `userName`, `userPhone`, `selfieUrl` (URL del selfie del usuario).
- **Líneas 26–36**: cabecera documental de `syncProfileToBackend`: documenta el endpoint `https://oaf.pythonanywhere.com/api/v1/sync-user`, la ingesta (`data: UserProfileSync`), el retorno `{success, message}` y el uso.

**Bloque 2 (líneas 37–62): `syncProfileToBackend`.**

```ts
export const syncProfileToBackend = async (data: UserProfileSync): Promise<{success: boolean, message: string}> => {
  console.log(`[PythonAnywhereSync] Sincronizando perfil real para usuario: ${data.userId}`);
  
  try {
    const response = await fetch(PYTHONANYWHERE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sync-Secret': SYNC_SECRET_KEY
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      console.log('[PythonAnywhereSync] Sincronización exitosa.');
      return { success: true, message: 'Perfil sincronizado correctamente.' };
    } else {
      const errorMsg = await response.text();
      console.error(`[PythonAnywhereSync] Error backend: ${response.status} - ${errorMsg}`);
      return { success: false, message: `Error de servidor: ${response.status}` };
    }
  } catch (error) {
    console.error('[PythonAnywhereSync] Error de red:', error);
    return { success: false, message: 'Error de red al conectar con PythonAnywhere.' };
  }
};
```

**Explicación de las líneas 37–62:**
- **Línea 37**: exporta la arrow function `syncProfileToBackend`.
- **Línea 38**: log con el `userId` (PII en logs).
- **Líneas 41–48**: POST a `PYTHONANYWHERE_API_URL` con `Content-Type: application/json` y el header `X-Sync-Secret` con la clave del bundle; el cuerpo es el perfil completo (`JSON.stringify(data)`, incluye la URL del selfie).
- **Líneas 50–52**: si `response.ok`, log de éxito y retorno positivo.
- **Líneas 53–57**: si no, lee el cuerpo del error como texto, lo loguea (puede contener datos reflejados) y retorna `false` con el código de estado.
- **Líneas 58–61**: ante error de red, log y retorno negativo.

**Bloque 3 (líneas 64–87): `getRemoteLogs`.**

```ts
/* ============================================================================
* Función         : getRemoteLogs
* Descripción     : Obtiene logs remotos desde PythonAnywhere.
* Fecha           : 2026-03-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : API Endpoint: https://oaf.pythonanywhere.com/api/logs
* Ingesta         : limit: number
* Devolución      : Promise<string[]>
* Uso             : const logs = await getRemoteLogs(20);
* ============================================================================ */
export const getRemoteLogs = async (limit: number = 50): Promise<string[]> => {
  console.log(`[PythonAnywhereSync] Recuperando últimos ${limit} logs...`);
  
  try {
    const response = await fetch(`https://oaf.pythonanywhere.com/api/v1/logs?limit=${limit}`);
    if (response.ok) {
      return await response.json();
    }
    return ['Error al obtener logs remotos'];
  } catch (error) {
    return ['Error de conexión al obtener logs'];
  }
};
```

**Explicación de las líneas 64–87:**
- **Líneas 64–74**: cabecera documental. La URL documentada en la cabecera (`/api/logs`) no coincide exactamente con la usada en el código (`/api/v1/logs`). [OBSERVACIÓN TÉCNICA]
- **Línea 75**: exporta `getRemoteLogs(limit = 50)`.
- **Línea 76**: log del límite solicitado.
- **Líneas 79–81**: GET a la URL de logs **hardcodeada** con el dominio literal; sin headers de autenticación. Si responde `ok`, devuelve el JSON como `string[]`.
- **Líneas 82–83**: si no es `ok`, devuelve un arreglo con un mensaje de error.
- **Líneas 84–86**: ante error de conexión, devuelve mensaje de error en un arreglo. [OBSERVACIÓN TÉCNICA] Devuelve cadenas de error mezcladas con logs reales: el llamador no puede distinguir un fallo de una entrada de log.

## Fichas de funciones y métodos

### syncProfileToBackend (líneas 37–62)
- Firma: `export const syncProfileToBackend = async (data: UserProfileSync): Promise<{success: boolean, message: string}>`.
- Propósito técnico/funcional: enviar el perfil real a la DB central de PythonAnywhere.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| data | UserProfileSync | Perfil: userId, userName, userPhone, selfieUrl. |

- Retorno: `{ success, message }`.
- Excepciones: controladas internamente (nunca lanza).
- Dependencias: `fetch`, `PYTHONANYWHERE_API_URL`, `SYNC_SECRET_KEY`.
- Flujo interno: POST con `X-Sync-Secret` → según `ok` retorno positivo o negativo → catch de red.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Efectos secundarios: escritura del perfil en la BD central de PA (si el endpoint lo acepta).
- Riesgos: la clave `X-Sync-Secret` viaja en el bundle; el cuerpo incluye la URL del selfie (dato personal).

### getRemoteLogs (líneas 75–86)
- Firma: `export const getRemoteLogs = async (limit: number = 50): Promise<string[]>`.
- Propósito: herramienta de depuración para leer logs remotos desde el cliente.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| limit | number | Máximo de logs a recuperar (default 50). |

- Retorno: `Promise<string[]>` (logs o mensajes de error como cadenas).
- Excepciones: controladas internamente.
- Dependencias: `fetch` a URL hardcodeada sin auth.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Efectos secundarios: ninguno.
- Riesgos: expone logs remotos si el endpoint no autentica; URL fija al dominio de PythonAnywhere ignorando la configuración.

## Clases / interfaces / tipos

### `UserProfileSync` (líneas 19–24)
- Responsabilidad: tipar el payload del perfil a sincronizar.
- Campos:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| userId | string | UID de Firebase del usuario. |
| userName | string | Nombre del usuario. |
| userPhone | string | Teléfono. |
| selfieUrl | string | URL del selfie (Storage). |

- Relaciones: mismo contrato que el payload de `syncUserToPythonAnywhere` en `functions/src/users.ts` (que además añade `authType`, `createdAt`, `status`). [NIVEL DE CERTEZA: Confirmado por código]

## Observaciones técnicas

- [CÓDIGO LEGADO] / [POTENCIALMENTE NO UTILIZADO] — sin importadores en el repositorio; la sincronización de perfiles ya está implementada server-side por `syncUserToPythonAnywhere` (functions/src/users.ts), que usa `SYNC_SECRET_KEY` como variable de entorno del servidor y dispara el envío al crear el documento `users/{userId}`. Este archivo cliente queda como versión legada con el riesgo de exponer el secreto. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] Riesgo conocido y documentado en la propia cabecera: la clave de sincronización se expone en el cliente (variable `EXPO_PUBLIC_PA_SYNC_SECRET` incrustada en el APK). La migración a Cloud Function ya se realizó en Functions, por lo que mantener este archivo no aporta valor y mantiene el riesgo latente si alguien lo reintroduce. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `getRemoteLogs` usa dominio hardcodeado (`https://oaf.pythonanywhere.com/api/v1/logs`) y no envía autenticación; si el endpoint del servidor no valida credenciales, cualquiera podría leer logs remotos. La cabecera documenta `/api/logs` pero el código llama a `/api/v1/logs`. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `getRemoteLogs` mezcla en el mismo arreglo logs reales y mensajes de error ("Error al obtener logs remotos"), impidiendo al llamador distinguirlos. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] No hay tests para este archivo. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [CRÍTICO] Secreto de sincronización (`EXPO_PUBLIC_PA_SYNC_SECRET`) incrustado en el bundle móvil y enviado como header `X-Sync-Secret` desde el cliente: cualquier atacante puede extraerlo del APK y falsificar sincronizaciones o, si el backend lo acepta para otras operaciones, escalar. El propio archivo lo reconoce con ⚠️. [NIVEL DE CERTEZA: Confirmado por código]
- [ALTO] `getRemoteLogs` sin autenticación contra un endpoint de logs: exposición potencial de logs (posible PII o datos internos) si el servidor no protege el endpoint. [NIVEL DE CERTEZA: Inferido]
- [MEDIO] PII en logs del cliente: `console.log` con `userId` (línea 38) y log del cuerpo de error del backend (línea 55) que podría reflejar datos del perfil. [NIVEL DE CERTEZA: Confirmado por código]
- [MEDIO] Envío de la URL del selfie (dato biométrico de imagen) a un backend de terceros; la selfie debe tratarse como dato sensible conforme al marco de privacidad (RGPD/DAMMA). [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Eliminar o archivar este servicio cliente: la funcionalidad está migrada a `syncUserToPythonAnywhere` en Functions y mantener la variante cliente conserva el riesgo de exponer el secreto. Si se conserva temporalmente, no debe usarse en producción. [RECOMENDACIÓN]
- [RIESGO] Proteger el endpoint `/api/v1/logs` en el servidor (o eliminarlo) y nunca leer logs remotos desde el cliente. [RECOMENDACIÓN]
- [INFORMATIVO] Centralizar el dominio PA en `PA_API_URL` (evitar URL hardcodeadas). [RECOMENDACIÓN]
- [INFORMATIVO] Añadir tests si el archivo se mantiene, o documentar su retirada en el changelog del proyecto. [RECOMENDACIÓN]
