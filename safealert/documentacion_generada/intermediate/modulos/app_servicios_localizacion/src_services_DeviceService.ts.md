# Archivo: src/services/DeviceService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/DeviceService.ts | 175 | TypeScript 5.9 | 7000 | Servicio de identificación de dispositivo (ID estable, MAC, unique ID, emulador) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Servicio de identificación del dispositivo en el cliente móvil SafeAlert. Genera y persiste un **ID de dispositivo estable** (UUID v4 con prefijo `sa-`) en AsyncStorage que sobrevive a reinicios de la app (vida de la instalación), con caché en memoria y protección contra llamadas concurrentes. Además expone la obtención de la dirección MAC, el identificador único del dispositivo (ANDROID_ID/identifierForVendor) y la detección de emulador, datos usados por los servicios de pago, sincronización de contactos/prueba y telemetría de audio/ubicación hacia backends.

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — Ampliamente consumido: `ContactsService` (getDeviceId), `AudioAlertApiService` (getDeviceUniqueId), `PaymentService` (getMacAddress + getDeviceUniqueId), `app/_layout.tsx` (getDeviceId), `app/(tabs)/index.tsx` (getDeviceId), `app/contacts/[id].tsx` (getDeviceId), `src/components/PaymentModal.tsx` (isEmulator) y mockeado en `PaymentService.test.ts`. `getMacAddress` está declarado como conexión con `PaymentService` en su cabecera.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `AsyncStorage` de `@react-native-async-storage/async-storage` | externa | Persistencia del device ID | Sí |
| `Platform` de `react-native` | externa | Rama web (no aplica IDs nativos) | Sí |
| `DeviceInfo` de `react-native-device-info` | externa | `getMacAddress`, `getUniqueId`, `isEmulator` | Sí |

## Componentes que dependen de este archivo

- `src/services/ContactsService.ts` (líneas 15, 156, 214): `getDeviceId()` para sincronizar contactos con `safealert_tel.db`.
- `src/services/AudioAlertApiService.ts` (líneas 19, 159): `getDeviceUniqueId()` para identificar el dispositivo en envíos de audio.
- `src/services/PaymentService.ts` (líneas 17, 58–59): `getMacAddress()` y `getDeviceUniqueId()` para el registro de usuario en el backend de pagos.
- `src/components/PaymentModal.tsx` (líneas 35, 72): `isEmulator()`.
- `app/_layout.tsx` (líneas 36, 117), `app/(tabs)/index.tsx` (líneas 28, 116), `app/contacts/[id].tsx` (líneas 29, 74): `getDeviceId()` para UI y lógica de prueba/modal.
- `src/services/__tests__/PaymentService.test.ts` (líneas 18–19): mock del módulo.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `STORAGE_KEY` | `'@safealert/device_id'` | string | Clave AsyncStorage del device ID | Líneas 19, 77, 83 |
| `cachedDeviceId` | `null` inicial | string \| null | Caché en memoria del device ID | Líneas 20, 67–68, 79–80, 84, 90, 91 |
| `pendingDeviceIdPromise` | `null` inicial | Promise<string> \| null | Promesa compartida para concurrencia | Líneas 21, 71–75, 93, 97 |

Prefijo de ID: `'sa-'` (línea 37). Template UUID v4: `'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'` (línea 38).

## Estructura (funciones / clases / tipos)

Funciones auxiliares no exportadas:

- `generateUUID()` (35–51)
- `getDeviceId()` (66–98)
- `getMacAddress()` (114–123)
- `getDeviceUniqueId()` (138–146)
- `isEmulator()` (160–168)

Objeto exportado `DeviceService` (170–175) exponiendo las cuatro funciones.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : DeviceService.ts
* Descripción     : Genera y persiste un ID de dispositivo estable basado en UUID v4
*                   almacenado en AsyncStorage. Incluye obtención de MAC address
*                   y unique ID del dispositivo para registro en backend.
* Autor           : oafon
* Fecha           : 2026-04-07
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { DeviceService } from '../services/DeviceService';
*                   const id = await DeviceService.getDeviceId();
*                   const mac = await DeviceService.getMacAddress();
* ============================================================================ */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const STORAGE_KEY = '@safealert/device_id';
let cachedDeviceId: string | null = null;
let pendingDeviceIdPromise: Promise<string> | null = null;
```

**Explicación de las líneas 1–21:**

- **Líneas 1–13**: Cabecera estándar del proyecto. Documenta el propósito: ID estable + MAC + unique ID para el backend.
- **Línea 15**: AsyncStorage para persistencia.
- **Línea 16**: `Platform` para detectar web.
- **Línea 17**: `react-native-device-info` (módulo nativo).
- **Línea 19**: Clave de almacenamiento.
- **Línea 20**: Caché en memoria del ID resuelto.
- **Línea 21**: Promesa compartida para evitar doble generación ante llamadas concurrentes (patrón de "promesa pendiente").

```ts
/* ============================================================================
* Función         : generateUUID
...
* ============================================================================ */
function generateUUID(): string {
  const hex = '0123456789abcdef';
  let uuid = 'sa-';
  const template = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

  for (let i = 0; i < template.length; i++) {
    const ch = template[i];
    if (ch === 'x') {
      uuid += hex[Math.floor(Math.random() * 16)];
    } else if (ch === 'y') {
      uuid += hex[(Math.floor(Math.random() * 4) + 8)];
    } else {
      uuid += ch;
    }
  }
  return uuid;
}
```

**Explicación de las líneas 35–51:**

- **Línea 36**: Alfabeto hexadecimal.
- **Línea 37**: Inicia con el prefijo `sa-` (identifica IDs SafeAlert en AsyncStorage y en backends).
- **Línea 38**: Plantilla UUID v4 (la versión `4` y la variante `y` en 8–b).
- **Líneas 40–49**: Itera la plantilla: `x` → dígito hex aleatorio; `y` → dígito entre 8 y 11 (variante); resto se copia literal (guiones y el `4`).
- **Línea 50**: Devuelve el UUID.
- `[OBSERVACIÓN TÉCNICA]` (línea 43): usa `Math.random()`, que **no es criptográficamente seguro**. Para un identificador de dispositivo no secreto es aceptable; no debe usarse como token de autenticación. Un RFC 4122 estricto exigiría 4 bits de versión y 2 de variante (aquí `y` toma 2 bits de 4 opciones: 8,9,a,b — correcto en la práctica).

```ts
/* ============================================================================
* Función         : getDeviceId
...
* ============================================================================ */
async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  if (pendingDeviceIdPromise) {
    return pendingDeviceIdPromise;
  }

  pendingDeviceIdPromise = (async () => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored && stored.startsWith('sa-')) {
      cachedDeviceId = stored;
      return stored;
    }
    const newId = generateUUID();
    await AsyncStorage.setItem(STORAGE_KEY, newId);
    cachedDeviceId = newId;
    return newId;
  } catch (error) {
    console.error('[DeviceService] Error accediendo AsyncStorage:', error);
    // Fallback temporal: no persiste pero evita crash
    const fallbackId = generateUUID();
    cachedDeviceId = fallbackId;
    return fallbackId;
  } finally {
    pendingDeviceIdPromise = null;
  }
  })();

  return pendingDeviceIdPromise;
}
```

**Explicación de las líneas 66–98:**

- **Líneas 67–69**: Si ya hay caché, devuelve el ID sin tocar AsyncStorage.
- **Líneas 71–73**: Si hay una promesa en curso (primera llamada concurrente), la comparte (evita generar dos IDs).
- **Líneas 75–95**: Define la IIFE async que hace el trabajo real y la asigna a `pendingDeviceIdPromise`.
- **Líneas 76–81**: Lee AsyncStorage; si existe un ID con prefijo `sa-`, lo cachea y retorna (valida el prefijo para descartar claves corruptas de versiones viejas).
- **Líneas 82–85**: Si no hay ID persistido, genera uno, lo persiste y lo cachea.
- **Líneas 86–91**: Si AsyncStorage falla (error de lectura/escritura), registra el error y genera un ID temporal **no persistido** para evitar el crash (el ID cambiará en el siguiente arranque).
- **Líneas 92–94**: En `finally` limpia `pendingDeviceIdPromise` para permitir futuras llamadas.
- **Línea 97**: Retorna la promesa compartida.
- **[NOTA]**: El ID es estable "durante la vida de la instalación": si el usuario borra datos de la app o reinstala, se genera uno nuevo.

```ts
/* ============================================================================
* Función         : getMacAddress
...
* ============================================================================ */
async function getMacAddress(): Promise<string> {
  if (Platform.OS === 'web') return '';
  try {
    const mac = await DeviceInfo.getMacAddress();
    return mac ?? '';
  } catch (error) {
    console.warn('[DeviceService] getMacAddress no disponible:', error);
    return '';
  }
}
```

**Explicación de las líneas 114–123:**

- **Línea 115**: En web no hay MAC → cadena vacía.
- **Líneas 116–118**: Obtiene la MAC vía `react-native-device-info`.
- **Línea 118**: Si el valor es `null`, devuelve `''`.
- **Líneas 119–122**: Ante error (API no disponible), registra advertencia y devuelve `''`.
- `[OBSERVACIÓN TÉCNICA]`: la cabecera de la función (líneas 100–113) afirma que en Android 6+ (API 23+) la API retorna `"02:00:00:00:00:00"` por restricciones de privacidad y que "en ese caso devuelve vacío para que el backend use device_unique_id"; sin embargo, el **código no filtra** ese valor centinela: si `DeviceInfo.getMacAddress()` retorna `"02:00:00:00:00:00"`, se propagará tal cual al llamador (`PaymentService`). Documentación vs implementación divergen.

```ts
/* ============================================================================
* Función         : getDeviceUniqueId
...
* ============================================================================ */
async function getDeviceUniqueId(): Promise<string> {
  if (Platform.OS === 'web') return '';
  try {
    return await DeviceInfo.getUniqueId();
  } catch (error) {
    console.warn('[DeviceService] getDeviceUniqueId no disponible:', error);
    return '';
  }
}
```

**Explicación de las líneas 138–146:**

- **Línea 139**: En web devuelve vacío.
- **Líneas 140–141**: `DeviceInfo.getUniqueId()`: en Android retorna ANDROID_ID; en iOS retorna `identifierForVendor`.
- **Líneas 142–145**: Ante error devuelve `''`.
- **[NOTA]**: `getUniqueId` puede devolver ANDROID_ID como identificador persistente; es dato personal según normativas (identificador de dispositivo estable), aunque no permite identificar a una persona directamente.

```ts
/* ============================================================================
* Función         : isEmulator
...
* ============================================================================ */
async function isEmulator(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await DeviceInfo.isEmulator();
  } catch (error) {
    console.warn('[DeviceService] isEmulator check error:', error);
    return false;
  }
}
```

**Explicación de las líneas 160–168:**

- **Línea 161**: Web → `false`.
- **Líneas 162–163**: Consulta nativa `DeviceInfo.isEmulator()`.
- **Líneas 164–167**: Ante error, asume dispositivo real (`false`). Riesgo: si la detección falla en un emulador, la app podría no aplicar restricciones de pago/prueba pensadas para emuladores.

```ts
export const DeviceService = {
  getDeviceId,
  getMacAddress,
  getDeviceUniqueId,
  isEmulator,
};
```

**Explicación de las líneas 170–175:**

- **Líneas 170–175**: Exporta las cuatro funciones como métodos del objeto `DeviceService`.

## Fichas de funciones y métodos

### generateUUID (líneas 35–51)

- Firma: `function generateUUID(): string`
- Propósito: generar UUID v4 con prefijo `sa-` sin dependencias nativas.
- Retorno: `string` (p. ej. `sa-550e8400-e29b-41d4-a716-446655440000`).
- Riesgo: `Math.random` no criptográfico (aceptable para ID no secreto).

### getDeviceId (líneas 66–98)

- Firma: `async function getDeviceId(): Promise<string>`
- Propósito: recuperar (o crear y persistir) el ID estable de dispositivo.
- Retorno: `Promise<string>`. Excepciones: no lanza (fallback interno).
- Dependencias: `AsyncStorage`, `generateUUID`.
- Llamada desde: `ContactsService`, `_layout.tsx`, `index.tsx`, `contacts/[id].tsx`.
- Efectos: escritura en AsyncStorage la primera vez; log de error si falla el almacenamiento.
- Riesgo: el fallback temporal no persiste (ID inestable entre arranques si AsyncStorage falla de forma permanente).

### getMacAddress (líneas 114–123)

- Firma: `async function getMacAddress(): Promise<string>`
- Propósito: obtener MAC; retorna `''` en web/errores. Llamada desde: `PaymentService`.
- `[OBSERVACIÓN TÉCNICA]`: no filtra el valor centinela `02:00:00:00:00:00`.

### getDeviceUniqueId (líneas 138–146)

- Firma: `async function getDeviceUniqueId(): Promise<string>`
- Propósito: obtener ANDROID_ID (Android) / identifierForVendor (iOS). Llamada desde: `PaymentService`, `AudioAlertApiService`.

### isEmulator (líneas 160–168)

- Firma: `async function isEmulator(): Promise<boolean>`
- Propósito: detectar emulador. Llamada desde: `PaymentModal.tsx` (línea 72).

## Clases / interfaces / tipos

No declara clases ni interfaces propias. `DeviceInfo` de `react-native-device-info` expone `getMacAddress(): Promise<string>`, `getUniqueId(): Promise<string>` e `isEmulator(): Promise<boolean>` (API del módulo).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 100–123): la documentación de `getMacAddress` dice que el valor centinela `"02:00:00:00:00:00"` (Android 6+) debería devolverse como vacío, pero la implementación no lo comprueba; `PaymentService` podría enviar la MAC centinela al backend de pagos. `[NIVEL DE CERTEZA: Confirmado por código]`.
- `[OBSERVACIÓN TÉCNICA]` (líneas 35–51): `generateUUID` usa `Math.random`; si en el futuro el device ID se usara como parte de un mecanismo de seguridad (firma, validación), debería migrarse a un CSPRNG (`expo-crypto` `randomUUID` o `Crypto.randomUUID`).
- `[OBSERVACIÓN TÉCNICA]` (líneas 66–98): el ID no está vinculado al usuario de Firebase; cada instalación tiene un ID propio que se asocia a backends externos (PythonAnywhere, pagos) mediante `device_id`/`device_id_app`. No hay rotación ni mecanismo de anonimización.
- `[NIVEL DE CERTEZA: Confirmado por código]` En web, `getMacAddress`/`getDeviceUniqueId`/`isEmulator` son no-op con valores vacíos/falsos.
- `[NIVEL DE CERTEZA: Inferido]` `DeviceInfo.getMacAddress()` suele requerir permisos/versión; el catch cubre el fallo devolviendo vacío.

## Seguridad

- `[MEDIO]` Identificadores de dispositivo como datos personales: `getMacAddress`, `getDeviceUniqueId` (ANDROID_ID/identifierForVendor) y el `device_id` estable (`sa-...`) se envían a backends (pagos, PythonAnywhere, telemetría de audio). ANDROID_ID es un identificador persistente por instalación+fabricante que puede servir para correlacionar actividad; debe declararse en la política de privacidad y minimizarse su uso.
- `[BAJO]` El device ID (`sa-UUID`) se genera con `Math.random` (no CSPRNG): aunque no es un secreto, una colisión o predicción teórica es posible; no usar como credencial.
- `[INFORMATIVO]` El fallback de `getDeviceId` genera un ID nuevo en memoria si AsyncStorage falla, lo que puede producir duplicados de "usuario dispositivo" en backends si ocurre repetidamente.
- `[INFORMATIVO]` No se registran secretos; los `console.warn`/`console.error` no imprimen el ID (solo mensajes y errores).
- `[INFORMATIVO]` No hay consentimiento explícito por este servicio para la lectura de identificadores; el flujo de consentimiento del MVP gestiona UBICACION/CAMARA/MICROFONO/CONTACTOS/NOTIFICACIONES (ver `ConsentPayload`), no "identificadores de dispositivo".

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Envío de MAC centinela o real a backends de pago: recomendar filtrar `"02:00:00:00:00:00"` y `''` antes de transmitir, y preferir `getDeviceUniqueId` como identificador (como indica la propia documentación).
- `[RIESGO]` Identificadores de dispositivo en múltiples backends sin gestión de ciclo de vida (borrado al desinstalar/reinstalar o al solicitar borrado de datos RGPD): recomendar mapear `device_id_app` ↔ `usuario_id` y soportar baja/anonimización en los backends.
- `[RECOMENDACIÓN]` Usar `expo-crypto.randomUUID()` para el ID si se requiere robustez criptográfica.
- `[RECOMENDACIÓN]` Evaluar si `getMacAddress` sigue siendo necesario (Android moderno no la expone de forma útil); si no, eliminarla para reducir superficie de datos.
