# Archivo: src/services/TrialService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/TrialService.ts | 138 | TypeScript 5.9 | 5954 | Cliente HTTP (sincronización de contactos con PythonAnywhere y verificación de prueba gratuita) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Cliente HTTP que sincroniza los contactos de emergencia con la base `safealert_tel.db` alojada en PythonAnywhere (backend Flask) y consulta el estado del período de prueba gratuita de 10 días por equipo/device. Participa del ciclo comercial de dos formas: el alta del primer contacto puede disparar el inicio de la prueba en el backend, y `checkPrueba` decide en el arranque de la app si debe mostrarse el aviso de prueba vencida. También implementa borrado lógico de contactos en el backend remoto.

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE` — implementada y conectada.
- Referencias reales encontradas:
  - `app/_layout.tsx` (línea 37 import; línea 153 `TrialService.checkPrueba(deviceId)` en el arranque; según resultado muestra el modal de prueba vencida si `estado.activo && estado.expirado && !estado.pago`).
  - `src/services/ContactsService.ts` (línea 16 import; línea 157 `syncContacto` al agregar contacto; línea 215 `borrarContacto` al eliminar contacto).
- [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `PA_API_URL` de `../config/features` | interna | Base de todas las URLs de fetch | Sí |
| `AUDIO_ALERT_API_KEY` de `../config/features` | interna | Header `X-API-Key` en `buildHeaders` | Sí (ver [OBSERVACIÓN TÉCNICA] en Observaciones) |

## Componentes que dependen de este archivo

- `app/_layout.tsx`: verifica el período de prueba al iniciar la app.
- `src/services/ContactsService.ts`: sincroniza altas/borrados de contactos (fire & forget).
- No se encontraron tests para este servicio. [NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `PA_API_URL` | Importado de features.ts (fallback `https://oaf.pythonanywhere.com`) | string | Base URL del backend | Líneas 61, 89, 120 |
| `AUDIO_ALERT_API_KEY` | [SECRETO OCULTO] (env `EXPO_PUBLIC_AUDIO_ALERT_API_KEY`) | string | Header `X-API-Key` | Líneas 13, 29 |
| Header `'Content-Type': 'application/json'` | literal | string | Tipo de contenido | Línea 28 |
| Header `'X-API-Key'` | valor de `AUDIO_ALERT_API_KEY` | string | Autenticación de API | Línea 29 |

Endpoints consumidos:
- `POST {PA_API_URL}/api/tel/contacto` (línea 61).
- `PUT {PA_API_URL}/api/tel/contacto/borrar` (línea 89).
- `GET {PA_API_URL}/api/tel/prueba/{device_id}` (líneas 119–121, con `encodeURIComponent`).

## Estructura (funciones / clases / tipos)

- Función privada `buildHeaders(): Record<string, string>` (líneas 26–31).
- Interfaz exportada `EstadoPrueba` (líneas 33–38).
- Objeto exportado `TrialService` (líneas 40–137):
  - `syncContacto(device_id, nombre, telefono, principal): Promise<void>` (líneas 54–73).
  - `borrarContacto(device_id, telefono): Promise<void>` (líneas 87–101).
  - `checkPrueba(device_id): Promise<EstadoPrueba>` (líneas 117–137).

## Análisis línea por línea

**Bloque 1 (líneas 1–38): cabecera, importaciones, `buildHeaders` y tipo `EstadoPrueba`.**

```ts
/* ============================================================================
* Archivo         : TrialService.ts
* Descripción     : Cliente HTTP para sincronización de contactos de emergencia
*                   con safealert_tel.db en PythonAnywhere y verificación del
*                   período de prueba de 10 días.
* Autor           : oafon
* Fecha           : 2026-04-10
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : TrialService.syncContacto(...) / TrialService.checkPrueba(...)
* ============================================================================ */

import { PA_API_URL, AUDIO_ALERT_API_KEY } from '../config/features';

/* ============================================================================
* Función         : buildHeaders
* Descripción     : Construye los headers comunes para las llamadas a la API.
* Fecha           : 2026-04-10
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : TrialService
* Ingesta         : void
* Devolución      : Record<string, string>
* Uso             : Interno
* ============================================================================ */
function buildHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-Key': AUDIO_ALERT_API_KEY || '',
  };
}

export interface EstadoPrueba {
  activo: boolean;
  expirado: boolean;
  pago: boolean;
  fechaExpiracion: string | null;
}
```

**Explicación de las líneas 1–38:**
- **Líneas 1–11**: cabecera documental. Esclarece el doble propósito (sync de contactos con `safealert_tel.db` y verificación de la prueba de 10 días).
- **Línea 13**: importa la URL base PA y la clave de API de alerta de audio (ver Observaciones).
- **Líneas 15–25**: cabecera documental de `buildHeaders`.
- **Líneas 26–31**: función privada que construye los headers comunes: `Content-Type: application/json` y `X-API-Key` con el valor de `AUDIO_ALERT_API_KEY` (vacío si no está configurado). [OBSERVACIÓN TÉCNICA] Reutiliza la clave destinada al servicio de audio/guardia (`AudioAlertApiService`) para autenticar llamadas al backend de teléfonos PA.
- **Líneas 33–38**: interfaz `EstadoPrueba` con cuatro campos booleanos/fecha:
  - `activo`: el período de prueba está vigente.
  - `expirado`: el período ya venció.
  - `pago`: el equipo/usuario ya pagó.
  - `fechaExpiracion`: fecha de vencimiento ISO o `null`.

**Bloque 2 (líneas 40–73): apertura de `TrialService` y `syncContacto`.**

```ts
export const TrialService = {
  /* ============================================================================
  * Función         : syncContacto
  * Descripción     : Sincroniza un contacto de emergencia con safealert_tel.db.
  *                   Se llama al agregar un contacto en la app. Si es el primer
  *                   contacto del equipo, el backend inicia el período de prueba.
  * Fecha           : 2026-04-10
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : flask_app.py /api/tel/contacto
  * Ingesta         : device_id, nombre, telefono, principal
  * Devolución      : Promise<void>
  * Uso             : await TrialService.syncContacto(deviceId, 'Ana', '+5491155...', true)
  * ============================================================================ */
  async syncContacto(
    device_id: string,
    nombre: string,
    telefono: string,
    principal: boolean
  ): Promise<void> {
    try {
      const response = await fetch(`${PA_API_URL}/api/tel/contacto`, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({ device_id, nombre, telefono, principal }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.warn('[TrialService] syncContacto error HTTP', response.status, body);
      }
    } catch (error) {
      console.warn('[TrialService] syncContacto fallo de red:', error);
    }
  },
```

**Explicación de las líneas 40–73:**
- **Línea 40**: apertura del objeto exportado `TrialService`.
- **Líneas 41–53**: cabecera documental de `syncContacto`. Documenta que si el contacto es el primero del equipo, el backend inicia el período de prueba (10 días).
- **Líneas 54–59**: firma con `device_id`, `nombre`, `telefono`, `principal` (indica si es el contacto principal; en `ContactsService` se pasa `contact.priority === 0`).
- **Líneas 61–65**: POST a `/api/tel/contacto` con los headers comunes y el cuerpo JSON.
- **Líneas 66–69**: si la respuesta no es `ok`, lee el cuerpo como texto (con `catch` para no romper si no hay cuerpo) y lo registra como advertencia (incluye el cuerpo en el log — ver Seguridad).
- **Líneas 70–72**: ante error de red, advertencia en consola. La función nunca lanza (fire & forget intencionado).

**Bloque 3 (líneas 75–101): `borrarContacto`.**

```ts
  /* ============================================================================
  * Función         : borrarContacto
  * Descripción     : Marca un contacto como borrado (borrado=1) en safealert_tel.db.
  *                   El registro queda persistido pero inactivo (borrado lógico).
  * Fecha           : 2026-04-10
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : flask_app.py /api/tel/contacto/borrar
  * Ingesta         : device_id, telefono
  * Devolución      : Promise<void>
  * Uso             : await TrialService.borrarContacto(deviceId, '+5491155...')
  * ============================================================================ */
  async borrarContacto(device_id: string, telefono: string): Promise<void> {
    try {
      const response = await fetch(`${PA_API_URL}/api/tel/contacto/borrar`, {
        method: 'PUT',
        headers: buildHeaders(),
        body: JSON.stringify({ device_id, telefono }),
      });
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        console.warn('[TrialService] borrarContacto error HTTP', response.status, body);
      }
    } catch (error) {
      console.warn('[TrialService] borrarContacto fallo de red:', error);
    }
  },
```

**Explicación de las líneas 75–101:**
- **Líneas 75–86**: cabecera documental. Aclara que es un borrado lógico (`borrado=1`) en `safealert_tel.db`.
- **Líneas 87–92**: firma: `device_id` y `telefono`.
- **Líneas 89–93**: PUT a `/api/tel/contacto/borrar` con los headers comunes y el cuerpo `{ device_id, telefono }`.
- **Líneas 94–97**: si la respuesta no es `ok`, advertencia con estado HTTP y cuerpo.
- **Líneas 98–100**: ante error de red, advertencia. Nunca lanza.

**Bloque 4 (líneas 103–138): `checkPrueba` y cierre.**

```ts
  /* ============================================================================
  * Función         : checkPrueba
  * Descripción     : Consulta el estado del período de prueba del equipo.
  *                   Retorna si el período está activo, expirado y si el usuario pagó.
  *                   Si hay error de red o el device no tiene período registrado,
  *                   retorna activo=false, expirado=false para no bloquear al usuario.
  * Fecha           : 2026-04-10
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : flask_app.py /api/tel/prueba/<device_id>
  * Ingesta         : device_id: string
  * Devolución      : Promise<EstadoPrueba>
  * Uso             : const estado = await TrialService.checkPrueba(deviceId)
  * ============================================================================ */
  async checkPrueba(device_id: string): Promise<EstadoPrueba> {
    try {
      const response = await fetch(
        `${PA_API_URL}/api/tel/prueba/${encodeURIComponent(device_id)}`,
        { headers: buildHeaders() }
      );
      if (!response.ok) {
        return { activo: false, expirado: false, pago: false, fechaExpiracion: null };
      }
      const data = await response.json();
      return {
        activo: !!data.activo,
        expirado: !!data.expirado,
        pago: !!data.pago,
        fechaExpiracion: data.fecha_expiracion ?? null,
      };
    } catch (error) {
      console.warn('[TrialService] checkPrueba fallo de red:', error);
      return { activo: false, expirado: false, pago: false, fechaExpiracion: null };
    }
  },
};
```

**Explicación de las líneas 103–138:**
- **Líneas 103–116**: cabecera documental. Punto clave: ante error de red o ausencia de período registrado devuelve `activo=false, expirado=false` para **no bloquear al usuario** (política fail-open).
- **Líneas 117–121**: GET a `/api/tel/prueba/{device_id}` con el id codificado (`encodeURIComponent`) y los headers comunes.
- **Líneas 123–125**: si la respuesta no es `ok`, retorna el estado neutro (fail-open) sin lanzar.
- **Líneas 126–132**: parsea el JSON y normaliza con coerción booleana (`!!`): `activo`, `expirado`, `pago`, y `fecha_expiracion` con `?? null`.
- **Líneas 133–136**: ante error de red, advertencia y retorno del estado neutro.
- **Línea 137**: cierre del objeto `TrialService`.

## Fichas de funciones y métodos

### buildHeaders (líneas 26–31)
- Firma: `function buildHeaders(): Record<string, string>`.
- Propósito técnico: reutilizar los headers de autenticación en las tres llamadas del servicio.
- Parámetros: ninguno.
- Retorno: objeto con `Content-Type` y `X-API-Key`.
- Dependencias: `AUDIO_ALERT_API_KEY`.
- Efectos secundarios: ninguno.
- Riesgos: envía la clave `AUDIO_ALERT_API_KEY` (diseñada para el servicio de audio) a endpoints de contactos PA; además si la clave no está configurada el header viaja vacío (el backend decidirá).

### syncContacto (líneas 54–73)
- Firma: `async syncContacto(device_id: string, nombre: string, telefono: string, principal: boolean): Promise<void>`.
- Propósito técnico/funcional: sincronizar el alta de un contacto con `safealert_tel.db`; en el primer contacto del equipo, el backend inicia la prueba gratuita de 10 días.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| device_id | string | Id del dispositivo (equipo). |
| nombre | string | Nombre del contacto. |
| telefono | string | Teléfono del contacto. |
| principal | boolean | Si es el contacto principal (priority 0). |

- Retorno: `Promise<void>`.
- Excepciones: nunca lanza (captura interna).
- Dependencias: `fetch`, `buildHeaders`, `PA_API_URL`.
- Flujo interno: POST → si `!ok` loguea advertencia con cuerpo → fin.
- Desde dónde se llama: `ContactsService.add` (línea 157) tras guardar en Firestore, con `principal: contact.priority === 0`.
- Efectos secundarios: escritura en la BD remota PA; puede disparar el inicio del período de prueba en el backend.
- Riesgos: la sincronización depende de que `DeviceService.getDeviceId()` resuelva; fallos se tragan silenciosamente (consistencia eventual, el contacto local ya está guardado).

### borrarContacto (líneas 87–101)
- Firma: `async borrarContacto(device_id: string, telefono: string): Promise<void>`.
- Propósito técnico/funcional: marcar `borrado=1` en la BD remota (borrado lógico) al eliminar un contacto local.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| device_id | string | Id del dispositivo. |
| telefono | string | Teléfono del contacto a marcar borrado. |

- Retorno: `Promise<void>`.
- Excepciones: nunca lanza.
- Dependencias: `fetch` PUT, `buildHeaders`, `PA_API_URL`.
- Flujo interno: PUT → si `!ok` advertencia → fin.
- Desde dónde se llama: `ContactsService.remove` (línea 215), si el contacto eliminado tenía teléfono.
- Efectos secundarios: borrado lógico remoto.
- Riesgos: al ser fire & forget, si el borrado remoto falla quedan contactos "fantasma" en `safealert_tel.db`.

### checkPrueba (líneas 117–137)
- Firma: `async checkPrueba(device_id: string): Promise<EstadoPrueba>`.
- Propósito técnico/funcional: consultar el estado de la prueba gratuita del equipo para decidir avisos de vencimiento en la UI.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| device_id | string | Id del dispositivo consultado. |

- Retorno: `EstadoPrueba` normalizado; ante error, estado neutro fail-open.
- Excepciones: nunca lanza.
- Dependencias: `fetch` GET, `buildHeaders`, `PA_API_URL`, `encodeURIComponent`.
- Flujo interno: GET → si `!ok` neutro → parseo → coerción booleana → retorno.
- Desde dónde se llama: `app/_layout.tsx` línea 153 en el arranque de la app (post-onboarding).
- Efectos secundarios: ninguno en cliente; la UI decide mostrar el modal de prueba vencida con `estado.activo && estado.expirado && !estado.pago`.
- Riesgos: política fail-open: ante caída del backend o device sin período, la app no bloquea; esto es intencional según la cabecera pero implica que un usuario con prueba vencida podría seguir operando si el backend no responde.

## Clases / interfaces / tipos

### `EstadoPrueba` (líneas 33–38)
- Responsabilidad: modelar la respuesta del endpoint `/api/tel/prueba/{id}`.
- Campos:

| Campo | Tipo | Descripción |
| --- | --- | --- |
| activo | boolean | Período de prueba vigente. |
| expirado | boolean | Período vencido. |
| pago | boolean | Existe pago registrado. |
| fechaExpiracion | string \| null | Fecha de expiración (ISO) o null. |

- Relaciones: consumido por `_layout.tsx` para decidir el modal de prueba vencida.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `checkPrueba` es una verificación informativa para la UI: el control real de "prueba vencida" lo aplican otros puntos (p. ej. bloqueos por `hasSubscription` en `AlertService`/`index.tsx`); este servicio no bloquea por sí mismo salvo que la UI decida mostrar el modal. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] La prueba gratuita "de 10 días" se menciona en la cabecera, pero la duración concreta y su lógica viven en el backend Flask (`flask_app.py`/`safealert_tel.db`), no en este archivo. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] Reutilización de `AUDIO_ALERT_API_KEY` como `X-API-Key` para endpoints de contactos: semánticamente la clave pertenece al servicio de audio (guardia por voz). Si el backend `/api/tel/*` espera una clave distinta, estas llamadas fallarían o autenticarían con una credencial equivocada. [NIVEL DE CERTEZA: Inferido]
- [OBSERVACIÓN TÉCNICA] No existen tests unitarios para `TrialService` (no se encontró `TrialService.test.ts`). [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] Logueo del cuerpo de respuesta en errores HTTP (`syncContacto`/`borrarContacto`): si el backend incluyera datos sensibles en el cuerpo de error, quedarían en consola/logs. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [ALTO] La clave `AUDIO_ALERT_API_KEY` (env `EXPO_PUBLIC_AUDIO_ALERT_API_KEY`) viaja en el bundle de la app por el prefijo `EXPO_PUBLIC_` y se envía como header en cada llamada; es legible por cualquiera que descompile el APK. [NIVEL DE CERTEZA: Confirmado por código]
- [MEDIO] Autenticación basada solo en `X-API-Key` estática compartida: todos los dispositivos comparten la misma clave; no hay autenticación por usuario en los endpoints de contacto/prueba, solo `device_id` (identificador de instalación predecible/enumerable). [NIVEL DE CERTEZA: Confirmado por código]
- [MEDIO] Datos personales (nombre y teléfono de contactos de emergencia) enviados en claro (HTTPS asumido por URL, pero sin pinning ni cifrado adicional) a un backend de terceros (PythonAnywhere) y persistidos en `safealert_tel.db`; aplica marco de privacidad (RGPD/DAMMA). [NIVEL DE CERTEZA: Inferido]
- [BAJO] Logs de advertencia incluyen el cuerpo HTTP de errores, que podría contener datos reflejados. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Separar la clave de API de contactos/prueba de la de audio (o migrar estas llamadas a una Cloud Function proxy que use secretos de servidor) para no exponer una única clave maestra en el APK. [RECOMENDACIÓN]
- [RIESGO] Evaluar la política fail-open de `checkPrueba`: es amigable con el usuario pero permite elusión de la prueba vencida si el backend no está disponible; si el requisito es duro, el enforcement debería ser server-side. [RECOMENDACIÓN]
- [INFORMATIVO] Añadir tests unitarios con fetch mockeado (patrón de `PaymentService.test.ts`) para cubrir normalización, fail-open y errores HTTP. [RECOMENDACIÓN]
- [INFORMATIVO] Centralizar la definición de los endpoints `/api/tel/*` en la documentación de API para que el mantenimiento del contrato con Flask sea explícito. [RECOMENDACIÓN]
