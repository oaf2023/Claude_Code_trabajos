# Archivo: src/services/PrivacyService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/PrivacyService.ts | 186 | TypeScript 5.9 | 6635 | Servicio de privacidad y cumplimiento (consentimientos, almacenamiento seguro, exportación y borrado de datos) | FUNCIONALIDAD EXISTENTE (parcial) | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Servicio de privacidad/cumplimiento "Fase 4" del Prompt Maestro. Gestiona: consentimientos separados y revocables por funcionalidad (ubicación, audio, contactos, notificaciones, analítica) almacenados en AsyncStorage y sincronizados con el backend de PythonAnywhere vía `LocationApiClient`; almacenamiento con preferencia de SecureStore (con fallback a AsyncStorage); exportación de datos locales (con ventana anti-repetición de 1 hora y filtro de claves sensibles); y eliminación local de la cuenta (borrado de todas las claves `@safealert/*` de AsyncStorage).

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE` — implementada y conectada parcialmente:
  - Usado desde `app/(tabs)/settings.tsx` (import dinámico en línea 383; `requestDataExport` en línea 392 y `deleteAccount` en línea 409 en la sección Privacy).
  - Los métodos de consentimiento (`getConsents`, `getConsent`, `grantConsent`, `revokeConsent`) y de almacenamiento seguro (`storeSecure`, `readSecure`, `deleteSecure`) no tienen llamadores encontrados por grep fuera del propio archivo. [NIVEL DE CERTEZA: Altamente probable]
- No se encontraron tests para este servicio. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `AsyncStorage` de `@react-native-async-storage/async-storage` | externa | Persistencia de consents, exportación y borrado | Sí |
| `LocationApiClient` de `./LocationApiClient` | interna | `registrarConsentimiento`, `revocarConsentimiento` | Sí (cuando hay `userId`) |
| `ConsentPayload` de `../types/Location` | interna (tipo) | Tipado del payload de consentimiento | Sí (solo tipo) |
| `POLITICA_PRIVACIDAD_VERSION` de `../types/Location` | interna | Versión de política enviada al backend | Sí (valor `'1.0.0'`) |
| `expo-secure-store` (import dinámico) | externa | `storeSecure`/`readSecure`/`deleteSecure` | Sí (con fallback) |

## Componentes que dependen de este archivo

- `app/(tabs)/settings.tsx` (sección Privacy): solicitud de exportación de datos y borrado de cuenta.
- El resto de métodos (consentimientos y SecureStore) no tiene consumidores detectados. [NIVEL DE CERTEZA: Altamente probable]
- El flujo de permisos del sistema (audio, ubicación) lo gestionan otros servicios (p. ej. `PermissionsService`); no se halló invocación de `grantConsent` desde esos flujos.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `CONSENT_KEY` | `'@safealert/consents'` | string | Clave AsyncStorage del arreglo de consentimientos | Líneas 27, 40, 70, 100 |
| `EXPORT_KEY` | `'@safealert/export_request'` | string | Clave AsyncStorage de la solicitud de exportación | Líneas 28, 114, 121 |
| `FEATURE_TO_TIPO` | Mapa feature → tipo de permiso | Record | Traducción de features a `tipo_permiso` del backend | Líneas 30–36, 77, 107 |
| `POLITICA_PRIVACIDAD_VERSION` | `'1.0.0'` (de types/Location) | string | Versión de política enviada en consentimientos | Línea 80 |
| `3600000` | ms (1 hora) | number | Ventana anti-repetición de exportación | Línea 116 |

Valores mágicos:
- Mapa `FEATURE_TO_TIPO`: `location→UBICACION`, `audio→MICROFONO`, `contacts→CONTACTOS`, `notifications→NOTIFICACIONES`, `analytics→NOTIFICACIONES` (líneas 30–36). [OBSERVACIÓN TÉCNICA] `analytics` se mapea al mismo tipo que `notifications`, probablemente porque el union type del backend no contempla `ANALYTICS`; con `ConsentPayload['tipo_permiso']` no hay valor `ANALYTICS` posible. [NIVEL DE CERTEZA: Confirmado por código]

## Estructura (funciones / clases / tipos)

- Tipos exportados: `ConsentFeature` (línea 18), `ConsentRecord` (líneas 20–25).
- Constantes privadas: `CONSENT_KEY`, `EXPORT_KEY`, `FEATURE_TO_TIPO`.
- Objeto exportado `PrivacyService` (líneas 38–185):
  - `getConsents(): Promise<ConsentRecord[]>` (líneas 39–47).
  - `getConsent(feature): Promise<boolean>` (líneas 49–54).
  - `grantConsent(feature, userId?, textoMostrado?)` (líneas 56–84).
  - `revokeConsent(feature, userId?)` (líneas 86–110).
  - `requestDataExport(userId)` (líneas 112–143).
  - `deleteAccount(userId)` (líneas 145–158).
  - `storeSecure(key, value)` (líneas 160–167).
  - `readSecure(key)` (líneas 169–176).
  - `deleteSecure(key)` (líneas 178–185).

## Análisis línea por línea

**Bloque 1 (líneas 1–37): cabecera, imports, tipos y constantes.**

```ts
/* ============================================================================
* Archivo         : PrivacyService.ts
* Descripción     : Servicio de privacidad y cumplimiento (Fase 4).
*                   Consentimientos separados y revocables, cifrado local,
*                   exportación, eliminación de datos y sincronización
*                   con backend según Prompt Maestro.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* ============================================================================ */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationApiClient } from './LocationApiClient';
import { ConsentPayload } from '../types/Location';
import { POLITICA_PRIVACIDAD_VERSION } from '../types/Location';

export type ConsentFeature = 'location' | 'audio' | 'contacts' | 'notifications' | 'analytics';

export type ConsentRecord = {
  feature: ConsentFeature;
  granted: boolean;
  grantedAt: number | null;
  revokedAt: number | null;
};

const CONSENT_KEY = '@safealert/consents';
const EXPORT_KEY = '@safealert/export_request';

const FEATURE_TO_TIPO: Record<ConsentFeature, ConsentPayload['tipo_permiso']> = {
  location: 'UBICACION',
  audio: 'MICROFONO',
  contacts: 'CONTACTOS',
  notifications: 'NOTIFICACIONES',
  analytics: 'NOTIFICACIONES',
};
```

**Explicación de las líneas 1–37:**
- **Líneas 1–11**: cabecera documental (v2.0.0, 2026-07-30). Declara consentimientos separados/revocables, cifrado local, exportación y eliminación.
- **Línea 13**: importa AsyncStorage (persistencia local).
- **Línea 14**: importa el cliente HTTP del Prompt Maestro.
- **Líneas 15–16**: importa el tipo `ConsentPayload` y la constante `POLITICA_PRIVACIDAD_VERSION`.
- **Línea 18**: union type `ConsentFeature` con las cinco funcionalidades sobre las que se puede consentir.
- **Líneas 20–25**: `ConsentRecord` con feature, `granted`, y marcas de tiempo de concesión/revocación.
- **Líneas 27–28**: claves de AsyncStorage.
- **Líneas 30–36**: mapa de traducción feature → tipo de permiso del backend. `analytics` reutiliza `NOTIFICACIONES`.

**Bloque 2 (líneas 38–84): `getConsents`, `getConsent` y `grantConsent`.**

```ts
export const PrivacyService = {
  async getConsents(): Promise<ConsentRecord[]> {
    const raw = await AsyncStorage.getItem(CONSENT_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as ConsentRecord[];
    } catch {
      return [];
    }
  },

  async getConsent(feature: ConsentFeature): Promise<boolean> {
    const consents = await this.getConsents();
    const record = consents.find((c) => c.feature === feature);
    if (!record) return false;
    return record.granted;
  },

  async grantConsent(feature: ConsentFeature, userId?: string, textoMostrado?: string): Promise<void> {
    const consents = await this.getConsents();
    const existing = consents.findIndex((c) => c.feature === feature);
    const record: ConsentRecord = {
      feature,
      granted: true,
      grantedAt: Date.now(),
      revokedAt: null,
    };
    if (existing >= 0) {
      consents[existing] = record;
    } else {
      consents.push(record);
    }
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consents));
    console.log(`[Privacy] Consentimiento concedido: ${feature}`);

    /* Sincronizar con backend si hay userId */
    if (userId) {
      const payload: ConsentPayload = {
        usuario_id: userId,
        tipo_permiso: FEATURE_TO_TIPO[feature],
        estado: 'OTORGADO',
        texto_mostrado: textoMostrado,
        version_politica: POLITICA_PRIVACIDAD_VERSION,
      };
      LocationApiClient.registrarConsentimiento(payload).catch(() => {});
    }
  },
```

**Explicación de las líneas 38–84:**
- **Línea 38**: apertura del objeto `PrivacyService`.
- **Líneas 39–47**: `getConsents`: lee el JSON de AsyncStorage; si no existe devuelve `[]`; si el JSON está corrupto devuelve `[]` (catch silencioso).
- **Líneas 49–54**: `getConsent`: busca el registro de la feature; devuelve `record.granted` o `false` si no existe. Nota: usa `this.getConsents()` dentro del objeto literal, lo que depende del enlace de `this` en la invocación (`PrivacyService.getConsent(...)` lo respeta).
- **Líneas 56–84**: `grantConsent`: registra la concesión:
  - Líneas 57–58: carga el arreglo actual y busca la feature existente.
  - Líneas 59–64: construye el registro con `granted: true`, `grantedAt: Date.now()` y `revokedAt: null`.
  - Líneas 65–69: reemplaza si existe o agrega si no.
  - Línea 70: persiste en AsyncStorage.
  - Línea 71: log de la concesión.
  - Líneas 74–83: si hay `userId`, sincroniza con el backend el payload `ConsentPayload` con `estado: 'OTORGADO'`, el texto mostrado y la versión de política. El envío es fire & forget (`.catch(() => {})`).
  - `textoMostrado` solo se envía en la concesión, no en la revocación.

**Bloque 3 (líneas 86–110): `revokeConsent`.**

```ts
  async revokeConsent(feature: ConsentFeature, userId?: string): Promise<void> {
    const consents = await this.getConsents();
    const existing = consents.findIndex((c) => c.feature === feature);
    const record: ConsentRecord = {
      feature,
      granted: false,
      grantedAt: null,
      revokedAt: Date.now(),
    };
    if (existing >= 0) {
      consents[existing] = record;
    } else {
      consents.push(record);
    }
    await AsyncStorage.setItem(CONSENT_KEY, JSON.stringify(consents));
    console.log(`[Privacy] Consentimiento revocado: ${feature}`);

    /* Sincronizar revocación con backend */
    if (userId) {
      LocationApiClient.revocarConsentimiento(
        userId,
        FEATURE_TO_TIPO[feature]
      ).catch(() => {});
    }
  },
```

**Explicación de las líneas 86–110:**
- **Líneas 87–95**: patrón análogo a `grantConsent` pero con `granted: false`, `grantedAt: null` y `revokedAt: Date.now()`.
- **Línea 100**: persiste.
- **Línea 101**: log de revocación.
- **Líneas 104–109**: si hay `userId`, llama a `LocationApiClient.revocarConsentimiento(userId, tipo)` (endpoint `POST /api/v1/consentimientos/revocar`). Fire & forget.

**Bloque 4 (líneas 112–143): `requestDataExport`.**

```ts
  async requestDataExport(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const raw = await AsyncStorage.getItem(EXPORT_KEY);
      const existing = raw ? JSON.parse(raw) : null;
      if (existing && Date.now() - existing.requestedAt < 3600000) {
        return { success: false, message: 'Ya solicitaste una exportación hace menos de 1 hora.' };
      }

      const request = { userId, requestedAt: Date.now(), status: 'pending' };
      await AsyncStorage.setItem(EXPORT_KEY, JSON.stringify(request));

      const allKeys = await AsyncStorage.getAllKeys();
      const safeKeys = allKeys.filter(
        (k) => !k.includes('secret') && !k.includes('token') && !k.includes('key')
      );
      const data: Record<string, unknown> = {};
      for (const key of safeKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) data[key] = JSON.parse(value);
        } catch {
          data[key] = '(error al leer)';
        }
      }

      console.log(`[Privacy] Exportación solicitada para ${userId}. ${safeKeys.length} claves.`);
      return { success: true, message: 'Solicitud de exportación registrada.' };
    } catch (error: any) {
      console.error('[Privacy] Error en exportación:', error);
      return { success: false, message: error?.message || 'Error al solicitar exportación.' };
    }
  },
```

**Explicación de las líneas 112–143:**
- **Líneas 114–117**: lee la última solicitud; si existe y es menor a 1 hora (`3600000` ms), rechaza con mensaje.
- **Líneas 120–121**: persiste la nueva solicitud con `status: 'pending'`.
- **Líneas 123–126**: obtiene todas las claves y **filtra** las que contienen `secret`, `token` o `key` (evita exportar credenciales).
- **Líneas 127–135**: recorre las claves seguras e intenta parsear su JSON; si una clave no es JSON válido, guarda `'(error al leer)'`.
- **Líneas 137–138**: log de la exportación (cantidad de claves) y retorno de éxito.
- **Líneas 139–142**: ante error, log y retorno de fallo.
- [OBSERVACIÓN TÉCNICA] El objeto `data` recopilado **no se envía a ningún backend ni se muestra al usuario**: solo queda en memoria y se descarta. La "exportación" registra la solicitud pero no materializa los datos exportables. [NIVEL DE CERTEZA: Confirmado por código]

**Bloque 5 (líneas 145–158): `deleteAccount`.**

```ts
  async deleteAccount(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const appKeys = allKeys.filter((k) => k.startsWith('@safealert/'));
      if (appKeys.length > 0) {
        await AsyncStorage.multiRemove(appKeys);
      }
      console.log(`[Privacy] Cuenta eliminada localmente para ${userId}. ${appKeys.length} claves.`);
      return { success: true, message: 'Cuenta eliminada. Todos los datos locales han sido borrados.' };
    } catch (error: any) {
      console.error('[Privacy] Error al eliminar cuenta:', error);
      return { success: false, message: error?.message || 'Error al eliminar cuenta.' };
    }
  },
```

**Explicación de las líneas 145–158:**
- **Línea 147**: obtiene todas las claves de AsyncStorage.
- **Línea 148**: filtra solo las que empiezan por `@safealert/` (dominio de la app).
- **Líneas 149–151**: las elimina con `multiRemove`.
- **Línea 152**: log con el userId y la cantidad de claves borradas.
- **Líneas 153–157**: retorno de éxito/error.
- [OBSERVACIÓN TÉCNICA] La eliminación es **solo local** (AsyncStorage): no borra la cuenta de Firebase Authentication, ni los datos en Firestore, ni los del backend PA; el mensaje "Cuenta eliminada" puede inducir a error respecto al alcance real. [NIVEL DE CERTEZA: Confirmado por código]

**Bloque 6 (líneas 160–186): `storeSecure`, `readSecure`, `deleteSecure` y cierre.**

```ts
  async storeSecure(key: string, value: string): Promise<void> {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(`@safealert/${key}`, value);
    } catch {
      await AsyncStorage.setItem(`@safealert/secure_${key}`, value);
    }
  },

  async readSecure(key: string): Promise<string | null> {
    try {
      const SecureStore = await import('expo-secure-store');
      return await SecureStore.getItemAsync(`@safealert/${key}`);
    } catch {
      return AsyncStorage.getItem(`@safealert/secure_${key}`);
    }
  },

  async deleteSecure(key: string): Promise<void> {
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(`@safealert/${key}`);
    } catch {
      await AsyncStorage.removeItem(`@safealert/secure_${key}`);
    }
  },
};
```

**Explicación de las líneas 160–186:**
- **Líneas 160–167**: `storeSecure`: intenta guardar en SecureStore (Keystore/Keychain) bajo la clave `@safealert/{key}`; si la importación dinámica o la escritura falla, **degrada a AsyncStorage** bajo `@safealert/secure_{key}` (sin cifrado). [RIESGO de seguridad: datos sensibles en claro en el fallback].
- **Líneas 169–176**: `readSecure`: lee de SecureStore y cae a AsyncStorage en error.
- **Líneas 178–185**: `deleteSecure`: borra de SecureStore con fallback a AsyncStorage.
- **Línea 186**: cierre del objeto `PrivacyService`.
- Nota: en el fallback la clave difiere (`@safealert/secure_` vs `@safealert/`), por lo que si un valor se escribió en SecureStore y luego el módulo deja de estar disponible, `readSecure` buscaría en la clave equivocada. [OBSERVACIÓN TÉCNICA]

## Fichas de funciones y métodos

### getConsents (líneas 39–47)
- Firma: `async getConsents(): Promise<ConsentRecord[]>`.
- Propósito: leer todos los consentimientos persistidos.
- Retorno: arreglo de `ConsentRecord` (vacío si no hay datos o JSON inválido).
- Dependencias: AsyncStorage, `CONSENT_KEY`.
- Efectos secundarios: ninguno.
- Riesgos: parseo sin validación de esquema (un JSON válido pero con forma distinta rompería asunciones de los consumidores).

### getConsent (líneas 49–54)
- Firma: `async getConsent(feature: ConsentFeature): Promise<boolean>`.
- Propósito: consultar si una funcionalidad está consentida.
- Retorno: booleano.
- Dependencias: `getConsents` (vía `this`).
- Riesgos: depende del enlace de `this`; si se desestructura el método y se invoca suelto, fallaría.

### grantConsent (líneas 56–84)
- Firma: `async grantConsent(feature: ConsentFeature, userId?: string, textoMostrado?: string): Promise<void>`.
- Propósito: registrar y sincronizar la concesión de consentimiento.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| feature | ConsentFeature | Funcionalidad consentida. |
| userId | string (opcional) | UID; si existe, sincroniza con el backend. |
| textoMostrado | string (opcional) | Texto de la política mostrado al usuario. |

- Retorno: `Promise<void>`.
- Excepciones: controladas (catch silencioso del envío); la escritura local podría lanzar si AsyncStorage falla (no está envuelta en try/catch). [OBSERVACIÓN TÉCNICA]
- Dependencias: AsyncStorage, `LocationApiClient.registrarConsentimiento`, `FEATURE_TO_TIPO`, `POLITICA_PRIVACIDAD_VERSION`.
- Efectos secundarios: escritura local + POST a `/api/v1/consentimientos`.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]

### revokeConsent (líneas 86–110)
- Firma: `async revokeConsent(feature: ConsentFeature, userId?: string): Promise<void>`.
- Propósito: registrar y sincronizar la revocación de consentimiento.
- Retorno: `Promise<void>`.
- Dependencias: AsyncStorage, `LocationApiClient.revocarConsentimiento`, `FEATURE_TO_TIPO`.
- Efectos secundarios: escritura local + POST a `/api/v1/consentimientos/revocar`.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Riesgos: la revocación del permiso nativo del SO (ubicación, micrófono) no la realiza este método; solo registra el consentimiento comercial. [NIVEL DE CERTEZA: Inferido]

### requestDataExport (líneas 112–143)
- Firma: `async requestDataExport(userId: string): Promise<{ success: boolean; message: string }>`.
- Propósito: registrar la solicitud de exportación con ventana de 1 h y recopilar (en memoria) los datos locales no sensibles.
- Retorno: `{ success, message }`.
- Dependencias: AsyncStorage (`EXPORT_KEY`, `getAllKeys`).
- Desde dónde se llama: `settings.tsx` línea 392.
- Efectos secundarios: escritura local de la solicitud.
- Riesgos: los datos exportados se recopilan y descartan sin entregarse; cumplimiento RGPD de "portabilidad" incompleto.

### deleteAccount (líneas 145–158)
- Firma: `async deleteAccount(userId: string): Promise<{ success: boolean; message: string }>`.
- Propósito: borrado local de los datos `@safealert/*`.
- Retorno: `{ success, message }`.
- Dependencias: AsyncStorage.
- Desde dónde se llama: `settings.tsx` línea 409.
- Efectos secundarios: elimina claves locales.
- Riesgos: alcance solo local (no elimina cuenta Firebase/backend).

### storeSecure / readSecure / deleteSecure (líneas 160–185)
- Firmas: `async (key: string, value?: string)`.
- Propósito: almacenamiento cifrado (SecureStore) con fallback a AsyncStorage.
- Dependencias: `expo-secure-store` (import dinámico), AsyncStorage.
- Desde dónde se llama: sin llamadores encontrados. [POTENCIALMENTE NO UTILIZADO]
- Riesgos: el fallback a AsyncStorage almacena en claro; divergencia de prefijos entre modos de almacenamiento.

## Clases / interfaces / tipos

### `ConsentFeature` (línea 18)
- Valores: `'location' | 'audio' | 'contacts' | 'notifications' | 'analytics'`.
- Responsabilidad: enumerar las funcionalidades sobre las que se pide consentimiento.

### `ConsentRecord` (líneas 20–25)
- Campos:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| feature | ConsentFeature | Funcionalidad. |
| granted | boolean | Concedido o no. |
| grantedAt | number \| null | Epoch ms de concesión. |
| revokedAt | number \| null | Epoch ms de revocación. |

- Relaciones: se serializa bajo `@safealert/consents`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `requestDataExport` recopila los datos en memoria y **no los entrega ni los envía**: la promesa de portabilidad del Prompt Maestro queda incompleta (solo registra la solicitud). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `deleteAccount` es solo local (AsyncStorage): no elimina la cuenta de Firebase Authentication, Firestore ni el backend de PythonAnywhere. El mensaje devuelto ("Todos los datos locales han sido borrados") es exacto en lo local, pero la función no cumple un "borrado de cuenta" integral. [NIVEL DE CERTEZA: Confirmado por código]
- [POTENCIALMENTE NO UTILIZADO] Métodos de consentimiento (`getConsents`, `getConsent`, `grantConsent`, `revokeConsent`) y de SecureStore (`storeSecure`, `readSecure`, `deleteSecure`) sin llamadores encontrados; solo `requestDataExport` y `deleteAccount` están conectados a la UI (settings.tsx). [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] Mapeo `analytics → NOTIFICACIONES`: la telemetría de analítica se reporta como permiso de notificaciones por limitación del union type del backend; la traza de consentimiento resultante es semánticamente incorrecta. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Divergencia de claves en el fallback de SecureStore (`@safealert/{key}` vs `@safealert/secure_{key}`): un valor puede quedar inaccesible si cambia la disponibilidad del módulo entre escritura y lectura. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] La cabecera promete "cifrado local"; solo `storeSecure/readSecure/deleteSecure` cifran (y solo cuando SecureStore está disponible), el resto de datos (consentimientos, exportaciones) viaja en AsyncStorage en claro. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `grantConsent`/`revokeConsent` no envuelven la escritura AsyncStorage en try/catch (a diferencia de `requestDataExport`); un fallo de persistencia propagaría la excepción. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] El campo `version_politica` solo se envía en la concesión (`grantConsent`), no en la revocación vía `revocarConsentimiento` (método de `LocationApiClient` que solo recibe `usuario_id`, `tipo_permiso`, `sesion_id`). [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [ALTO] Fallback de `storeSecure` a AsyncStorage en claro: si SecureStore no está disponible (p. ej. web o fallo de inicialización), los valores que se pretendían cifrados se persisten sin cifrar bajo `@safealert/secure_*`. [NIVEL DE CERTEZA: Confirmado por código]
- [MEDIO] Filtro de exportación por subcadena (`secret`, `token`, `key`) es heurístico: claves que no contengan esas palabras pero sí datos sensibles (p. ej. `@safealert/consents` o datos biométricos) se incluirían en la recopilación. El dato recopilado, además, no se entrega de forma segura. [NIVEL DE CERTEZA: Confirmado por código]
- [MEDIO] `deleteAccount` puede dar falsa sensación de cumplimiento de derecho al olvido: los datos remotos (Firestore/PA) y la cuenta Firebase permanecen. [NIVEL DE CERTEZA: Confirmado por código]
- [BAJO] Logs con `userId` en consola (`requestDataExport`, `deleteAccount`) — PII en logs. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] No se incluyen secretos ni valores reales de tokens en este archivo; las claves de AsyncStorage son nombres de dominio de la app. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] La sincronización de consentimientos al backend incluye el `texto_mostrado` (texto de la política visto por el usuario), dato útil para auditoría pero que debe tratarse conforme a la política de retención. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Completar `requestDataExport` entregando realmente los datos al usuario (archivo/mail/enlace firmado) para satisfacer el derecho de portabilidad (RGPD/DAMMA). [RECOMENDACIÓN]
- [RIESGO] Extender `deleteAccount` para borrar datos remotos (Firestore del usuario, backend PA) y la cuenta Firebase, o renombrar la acción en la UI a "Borrar datos locales". [RECOMENDACIÓN]
- [RIESGO] Evitar el fallback silencioso a AsyncStorage en `storeSecure` para valores verdaderamente sensibles; mejor fallar explícitamente o documentar la degradación. [RECOMENDACIÓN]
- [RIESGO] Conectar `grantConsent`/`revokeConsent` con los flujos de permisos reales (o eliminarlos si no se usan) y corregir el mapeo de `analytics`. [RECOMENDACIÓN]
- [INFORMATIVO] Envolver todas las escrituras AsyncStorage en try/catch y añadir tests de persistencia/serialización. [RECOMENDACIÓN]
