# Archivo: src/services/LocationApiClient.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/LocationApiClient.ts | 128 | TypeScript 5.9 | 4150 | Cliente HTTP de API REST (ubicaciones/consentimientos/accesos) | FUNCIONALIDAD EXISTENTE (con partes potencialmente sin uso) | Confirmado por código |

## Objetivo

Cliente HTTP del cliente móvil encargado de comunicarse con los endpoints `/api/v1/*` de un backend externo de tipo REST. Envía ubicaciones (automáticas y manuales), registros de acceso y consentimientos de privacidad, y permite consultar la última ubicación de un usuario y revocar consentimientos. Complementa el canal principal Firestore (`alertsCol`/`contactsCol` de `src/config/firebase.ts`) con un **segundo canal hacia la API Flask** que el proyecto asocia a PythonAnywhere (ver `PA_API_URL` en `src/config/features.ts`, líneas 165–168). La autenticación se realiza con el ID token de Firebase Authentication en la cabecera `Authorization: Bearer`.

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — El cliente se importa y usa desde `src/services/PrivacyService.ts` (registrar/revocar consentimiento), `src/services/AccesoRegistroService.ts` (registrar acceso) y `app/ubicacion/manual.tsx` (enviar ubicación manual). No obstante, dos de sus métodos no tienen consumidores localizados en `src/` ni `app/`: `enviarUbicacion` y `obtenerUltimaUbicacion`, por lo que se marcan como `APARENTEMENTE NO UTILIZADO` con `[POTENCIALMENTE NO UTILIZADO]`. La cabecera del archivo lo describe como cliente del "backend PythonAnywhere", coherente con el fallback de `PA_API_URL`, pero el contexto general del proyecto (sección 8 de convenciones) indica que la API Flask fue desplegada en Cloud Run; se documenta la inconsistencia como observación técnica.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `PA_API_URL` de `../config/features` | interna | Base URL del backend (`API_BASE`) | Sí |
| `LocationPayload`, `ConsentPayload`, `AccesoPayload` de `../types/Location` | interna | Tipado de los cuerpos de petición | Sí |
| `getIdToken` de `../config/firebase` (import dinámico) | interna | Cabecera de autorización Bearer | Sí |
| `fetch` (global) | estándar (runtime) | Todas las llamadas HTTP | Sí |

## Componentes que dependen de este archivo

- `src/services/PrivacyService.ts` (líneas 14, 82, 105): `registrarConsentimiento` y `revocarConsentimiento`.
- `src/services/AccesoRegistroService.ts` (líneas 13, 58): `registrarAcceso`.
- `app/ubicacion/manual.tsx` (líneas 16, 54): `enviarUbicacionManual`.
- Sin consumidores encontrados para `enviarUbicacion` ni `obtenerUltimaUbicacion` (grep en `src/`, `app/`, `iphone/` y `public/` sin coincidencias fuera del propio archivo).

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `API_BASE` | `${PA_API_URL}/api/v1` | string | Base común de todos los endpoints | Línea 18 y todas las llamadas |

`PA_API_URL` proviene de `src/config/features.ts` (líneas 165–168): lee `EXPO_PUBLIC_PA_API_URL` y si está vacío usa el fallback `https://oaf.pythonanywhere.com` — dominio público de PythonAnywhere (no es secreto, pero es un endpoint de datos personales).

## Estructura (funciones / clases / tipos)

Función auxiliar:

- `getAuthHeaders()` (20–34)

Objeto exportado `LocationApiClient` con métodos:

- `enviarUbicacion(payload)` (37–54)
- `enviarUbicacionManual(payload)` (56–73)
- `registrarAcceso(payload)` (75–87)
- `registrarConsentimiento(payload)` (89–102)
- `revocarConsentimiento(usuario_id, tipo_permiso, sesion_id?)` (104–116)
- `obtenerUltimaUbicacion(usuario_id)` (118–127)

Tipos usados (definidos en `../types/Location.ts`): `LocationPayload`, `ConsentPayload`, `AccesoPayload`.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : LocationApiClient.ts
* Descripción     : Cliente HTTP para los endpoints de ubicación del
*                   Prompt Maestro. Envía ubicaciones, accesos y
*                   consentimientos al backend PythonAnywhere.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : flask_app.py (endpoints /api/v1/)
* Ingesta         : Payloads de ubicación, acceso y consentimiento
* Devolución      : Promises con respuesta del servidor
* ============================================================================ */
```

**Explicación de las líneas 1–13:**

- Cabecera estándar del proyecto. La descripción declara explícitamente el destino "backend PythonAnywhere" y la conexión con `flask_app.py`, mientras que el contexto actual del proyecto (API Flask en Cloud Run) sugiere migración. `[OBSERVACIÓN TÉCNICA]`: la referencia a PythonAnywhere en el encabezado y en el fallback de `PA_API_URL` apunta a infraestructura legada; conviene confirmar cuál es el backend vigente.

```ts
import { PA_API_URL } from '../config/features';
import { LocationPayload, ConsentPayload, AccesoPayload } from '../types/Location';

const API_BASE = `${PA_API_URL}/api/v1`;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  try {
    const { getIdToken } = await import('../config/firebase');
    const token = await getIdToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    /* Sin autenticación */
  }
  return headers;
}
```

**Explicación de las líneas 15–34:**

- **Línea 15**: Importa la URL base del backend desde feature flags/entorno.
- **Línea 16**: Importa los tipos de payload del dominio de ubicaciones.
- **Línea 18**: Compone la base de API `/api/v1`.
- **Línea 20**: Declara la función que construye las cabeceras HTTP de cada petición.
- **Líneas 21–23**: Inicializa cabeceras con `Content-Type: application/json`.
- **Líneas 24–29**: Importa dinámicamente `getIdToken` (evita acoplar el módulo completo de Firebase en el arranque) y, si hay sesión, añade `Authorization: Bearer <token>`.
- **Líneas 30–32**: Si la autenticación falla (p. ej., sin sesión) continúa sin cabecera de autorización. `[OBSERVACIÓN TÉCNICA]`: el fallo silencioso implica que las peticiones pueden salir **sin autenticar** y el backend podría rechazarlas o aceptarlas dependiendo de sus reglas; no hay reintento ni señal al llamador.
- **Línea 33**: Devuelve cabeceras. No se registra el token en logs (correcto).

```ts
export const LocationApiClient = {
  async enviarUbicacion(payload: LocationPayload): Promise<{ success: boolean; id?: number }> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/ubicaciones`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        console.warn('[LocationApi] Error enviando ubicación:', resp.status);
        return { success: false };
      }
      return await resp.json();
    } catch (err) {
      console.warn('[LocationApi] Error de red:', err);
      return { success: false };
    }
  },
```

**Explicación de las líneas 36–54:**

- **Línea 37**: Método para enviar una ubicación automática (origen GPS/NAVEGADOR/IP) a `POST /api/v1/ubicaciones`. Retorna `{ success, id? }`.
- **Línea 38**: Obtiene cabeceras con token.
- **Líneas 39–44**: Petición POST con el payload serializado.
- **Líneas 45–48**: Si la respuesta no es OK registra el código HTTP en consola y devuelve `success: false`.
- **Línea 49**: Si es OK, interpreta el cuerpo JSON como `{ success, id }` del servidor.
- **Líneas 50–53**: Ante error de red, registra advertencia y devuelve `success: false`.
- **[RIESGO]**: Envía datos personales de geolocalización y metadatos de dispositivo a un backend externo. No hay reintento, cola ni validación del payload antes del envío. El consumidor puede no detectar el fallo si solo mira `success`.
- `[POTENCIALMENTE NO UTILIZADO]`: no se encontraron llamadas a `enviarUbicacion` en `src/`, `app/`, `iphone/` ni `public/`.

```ts
  async enviarUbicacionManual(payload: LocationPayload): Promise<{ success: boolean; id?: number }> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/ubicaciones/manual`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        console.warn('[LocationApi] Error enviando ubicación manual:', resp.status);
        return { success: false };
      }
      return await resp.json();
    } catch (err) {
      console.warn('[LocationApi] Error de red:', err);
      return { success: false };
    }
  },
```

**Explicación de las líneas 56–73:**

- **Línea 56**: Método para registrar una ubicación introducida manualmente por el usuario (origen `MANUAL`) en `POST /api/v1/ubicaciones/manual`.
- **Líneas 57–72**: Mismo patrón de la función anterior (cabeceras → fetch → manejo de error → respuesta JSON). Es el método usado por `app/ubicacion/manual.tsx`.
- **[RIESGO]**: El payload manual también puede contener `latitud`/`longitud` y `direccion_confirmada`; si el usuario escribe una dirección, esos datos salen del dispositivo hacia el backend.

```ts
  async registrarAcceso(payload: AccesoPayload): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/accesos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      return { success: resp.ok };
    } catch {
      return { success: false };
    }
  },
```

**Explicación de las líneas 75–87:**

- **Línea 75**: Registra un evento de acceso (telemetría de sesión/página) en `POST /api/v1/accesos`.
- **Líneas 76–82**: Envío POST con payload.
- **Línea 83**: Devuelve `success` según el estado HTTP; sin log de error.
- **Líneas 84–86**: Ante error de red devuelve `success: false` en silencio (no hay `console.warn`, a diferencia de los métodos de ubicación).
- **[RIESGO]**: El payload `AccesoPayload` puede incluir `usuario_id`, idiomas, zona horaria, dimensiones de pantalla y método de autenticación; es telemetría que identifica sesión y dispositivo.

```ts
  async registrarConsentimiento(payload: ConsentPayload): Promise<{ success: boolean; id?: number }> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/consentimientos`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (!resp.ok) return { success: false };
      return await resp.json();
    } catch {
      return { success: false };
    }
  },
```

**Explicación de las líneas 89–102:**

- **Línea 89**: Registra en el backend el consentimiento otorgado/rechazado/revocado para un tipo de permiso (`UBICACION`, `CAMARA`, `MICROFONO`, `CONTACTOS`, `NOTIFICACIONES`) en `POST /api/v1/consentimientos`.
- **Líneas 90–101**: Patrón idéntico: cabeceras con token, POST, verificación de respuesta.
- **Línea 97**: Ante respuesta no-OK retorna `success: false`.
- **[NOTA]**: Este método conecta el flujo de privacidad del cliente (`PrivacyService.grantConsent`) con el backend. El `ConsentPayload` incluye `texto_mostrado` y `version_politica`, lo que permite trazabilidad del consentimiento.

```ts
  async revocarConsentimiento(usuario_id: string, tipo_permiso: string, sesion_id?: string): Promise<{ success: boolean }> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/consentimientos/revocar`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ usuario_id, tipo_permiso, sesion_id }),
      });
      return { success: resp.ok };
    } catch {
      return { success: false };
    }
  },
```

**Explicación de las líneas 104–116:**

- **Línea 104**: Revoca un consentimiento previo. Recibe parámetros sueltos en vez de un payload tipado (inconsistencia de diseño respecto de los demás métodos). `tipo_permiso` se tipa como `string` genérico, no como la unión de `ConsentPayload['tipo_permiso']`.
- **Líneas 105–115**: Envío POST a `/consentimientos/revocar`; respuesta `success` según HTTP. Sin logs.
- **[OBSERVACIÓN TÉCNICA]**: aceptar `string` para `tipo_permiso` permite valores inválidos; mejor reutilizar el tipo unión de `ConsentPayload`.

```ts
  async obtenerUltimaUbicacion(usuario_id: string): Promise<any> {
    const headers = await getAuthHeaders();
    try {
      const resp = await fetch(`${API_BASE}/ubicaciones/ultima/${usuario_id}`, { headers });
      if (!resp.ok) return null;
      return await resp.json();
    } catch {
      return null;
    }
  },
};
```

**Explicación de las líneas 118–127:**

- **Línea 118**: Consulta la última ubicación registrada de un usuario en `GET /api/v1/ubicaciones/ultima/:usuario_id`.
- **Línea 119**: Cabeceras con token.
- **Líneas 120–123**: GET sin cuerpo; ante respuesta no-OK devuelve `null`; si OK devuelve el JSON crudo.
- **Línea 124**: Ante error de red devuelve `null`.
- **[OBSERVACIÓN TÉCNICA]**: El tipo de retorno `Promise<any>` pierde el tipado (no hay interfaz del documento de ubicación del backend). El `usuario_id` viaja en la ruta URL; si contiene caracteres especiales podría requerir `encodeURIComponent`.
- `[POTENCIALMENTE NO UTILIZADO]`: no se encontraron llamadas a `obtenerUltimaUbicacion` fuera de este archivo.

## Fichas de funciones y métodos

### getAuthHeaders (líneas 20–34)

- Firma: `async function getAuthHeaders(): Promise<Record<string, string>>`
- Propósito técnico: construir cabeceras JSON con token Bearer de Firebase si existe sesión.
- Parámetros: ninguno. Retorno: `Record<string, string>`. Excepciones: ninguna (captura interna).
- Dependencias: import dinámico `../config/firebase` → `getIdToken`.
- Flujo: fija `Content-Type`; intenta obtener token; si existe, añade `Authorization`. Si falla, continúa sin token.
- Efectos secundarios: import dinámico (carga de módulo) la primera vez. Riesgo: peticiones sin autenticar ante sesión expirada sin señal al llamador.

### LocationApiClient.enviarUbicacion (líneas 37–54)

- Firma: `async enviarUbicacion(payload: LocationPayload): Promise<{ success: boolean; id?: number }>`
- Propósito: enviar ubicación automática al backend. `[POTENCIALMENTE NO UTILIZADO]`.
- Parámetros: `payload: LocationPayload` (lat/lon, origen, permiso, metadatos).
- Retorno: `{ success }` o `{ success, id }` del servidor.
- Efectos: escritura en base de datos del backend. Riesgos: sin reintento; fallo silencioso parcial.

### LocationApiClient.enviarUbicacionManual (líneas 56–73)

- Firma: `async enviarUbicacionManual(payload: LocationPayload): Promise<{ success: boolean; id?: number }>`
- Propósito: registrar ubicación manual del usuario (origen `MANUAL`).
- Llamado desde: `app/ubicacion/manual.tsx` (línea 54).

### LocationApiClient.registrarAcceso (líneas 75–87)

- Firma: `async registrarAcceso(payload: AccesoPayload): Promise<{ success: boolean }>`
- Propósito: telemetría de acceso. Llamado desde: `AccesoRegistroService.registrarAccesoInicial` (línea 58, fire-and-forget con `.catch`).

### LocationApiClient.registrarConsentimiento (líneas 89–102)

- Firma: `async registrarConsentimiento(payload: ConsentPayload): Promise<{ success: boolean; id?: number }>`
- Propósito: registrar consentimiento de privacidad en el backend. Llamado desde: `PrivacyService.grantConsent` (línea 82, fire-and-forget).

### LocationApiClient.revocarConsentimiento (líneas 104–116)

- Firma: `async revocarConsentimiento(usuario_id: string, tipo_permiso: string, sesion_id?: string): Promise<{ success: boolean }>`
- Propósito: revocar consentimiento. Llamado desde: `PrivacyService.revokeConsent` (línea 105).

### LocationApiClient.obtenerUltimaUbicacion (líneas 118–127)

- Firma: `async obtenerUltimaUbicacion(usuario_id: string): Promise<any>`
- Propósito: consultar última ubicación del usuario. `[POTENCIALMENTE NO UTILIZADO]`.

## Clases / interfaces / tipos

No se declaran clases ni interfaces en este archivo. Tipos externos usados (definidos en `src/types/Location.ts`):

| Tipo | Responsabilidad | Campos destacados |
| --- | --- | --- |
| `LocationPayload` | Payload de envío de ubicación | `usuario_id`, `latitud`, `longitud`, `origen`, `permiso_ubicacion`, `precision_metros`, `altitud_metros`, `velocidad_metros_segundo`, `rumbo_grados`, `direccion_estimada`, `direccion_confirmada`, `metadatos` |
| `ConsentPayload` | Registro de consentimiento | `usuario_id`, `tipo_permiso` (`UBICACION|CAMARA|MICROFONO|CONTACTOS|NOTIFICACIONES`), `estado` (`OTORGADO|RECHAZADO|REVOCADO|NO_SOLICITADO`), `texto_mostrado`, `version_politica` |
| `AccesoPayload` | Telemetría de acceso | `usuario_id?`, `sesion_id?`, `pagina_consultada`, datos de navegador/dispositivo/idioma/pantalla, `metodo_autenticacion?` |

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` **Doble canal de datos de ubicación**: la alerta SOS con ubicación se persiste en Firestore (`alertsCol`, ver `AlertService.ts`), mientras que este cliente envía ubicaciones/accesos/consentimientos a la API Flask `/api/v1/*` (PythonAnywhere/Cloud Run). Dos sistemas reciben información geográfica del usuario con modelos distintos (`AlertLocation` vs `LocationPayload`), lo que puede producir inconsistencias de trazabilidad entre Firestore y la base MySQL del backend.
- `[OBSERVACIÓN TÉCNICA]` **Referencia a PythonAnywhere**: la cabecera (líneas 1–13) y el fallback `PA_API_URL = 'https://oaf.pythonanywhere.com'` (`src/config/features.ts`, líneas 165–168) apuntan a PythonAnywhere, infraestructura legada, mientras el despliegue actual de la API Flask se describe como Cloud Run en la sección 8 de convenciones. Se debe confirmar el valor real de `EXPO_PUBLIC_PA_API_URL` en el entorno de despliegue.
- `[POTENCIALMENTE NO UTILIZADO]` `enviarUbicacion` (líneas 37–54) y `obtenerUltimaUbicacion` (líneas 118–127) no tienen llamadores en `src/`, `app/`, `iphone/` ni `public/`. `[NIVEL DE CERTEZA: Altamente probable]`.
- `[OBSERVACIÓN TÉCNICA]` Los métodos devuelven `{ success: false }` o `null` sin propagar errores; los consumidores (`PrivacyService`, `AccesoRegistroService`) usan fire-and-forget con `.catch`, por lo que un fallo del backend de consentimiento/acceso es invisible para el usuario.
- `[OBSERVACIÓN TÉCNICA]` `revocarConsentimiento` y `obtenerUltimaUbicacion` no reutilizan tipos fuertes (parámetro `string` genérico / retorno `any`).
- `[NIVEL DE CERTEZA: Confirmado por código]` No existe timeout de red en `fetch`: una petición colgada puede dejar promesas pendientes indefinidamente (aunque no bloquean la UI porque no se esperan en flujos críticos).

## Seguridad

- `[INFORMATIVO]` Datos personales enviados: geolocalización precisa (`latitud`, `longitud`, `altitud`, `velocidad`, `rumbo`), dirección (manual), identificador de usuario (`usuario_id`), consentimiento con texto mostrado y versión de política, telemetría de sesión/dispositivo. Todo viaja por HTTPS al backend.
- `[BAJO]` Si `getIdToken` falla o la sesión expiró, las peticiones salen **sin cabecera `Authorization`** (líneas 30–32) y el servidor podría rechazarlas; no hay señal de autenticación requerida para el llamador. No es una fuga en sí, pero puede provocar escrituras no autenticadas si el backend no valida el token estrictamente.
- `[INFORMATIVO]` Autorización delegada: el backend (`flask_app.py`) debe validar el Bearer token de Firebase y aplicar reglas por usuario; este cliente no implementa control alguno.
- `[INFORMATIVO]` No se registran secretos ni tokens en logs (solo códigos de estado y errores de red en `console.warn`). Correcto.
- `[BAJO]` Validación de entrada inexistente en el cliente: los payloads se serializan tal cual; se depende de la validación del backend (riesgo de datos inválidos/volumen).
- `[BAJO]` `usuario_id` interpolado en la URL sin `encodeURIComponent` en `obtenerUltimaUbicacion` (línea 121).
- `[INFORMATIVO]` Consentimiento: la gestión de consentimiento la disparan `PrivacyService` (cliente) y este cliente la propaga al backend; existe versión de política (`POLITICA_PRIVACIDAD_VERSION` en `types/Location.ts`).

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` **Duplicidad de canales (Firestore + API)**: definir un único canal canónico de ubicaciones para evitar divergencias de datos y costes duplicados, o documentar el rol exacto de cada canal.
- `[RIESGO]` Fallos silenciosos de consentimiento/acceso: recomendar reintentos con backoff o cola local para registros de consentimiento (relevante para auditoría RGPD/DAMMA) y exponer estado al usuario cuando falle.
- `[RECOMENDACIÓN]` Eliminar o conectar los métodos sin uso (`enviarUbicacion`, `obtenerUltimaUbicacion`) tras confirmar que no hay consumidores en desarrollo futuro.
- `[RECOMENDACIÓN]` Confirmar y centralizar la URL del backend vigente (PythonAnywhere vs Cloud Run) y eliminar la referencia legada del fallback si no corresponde.
- `[RECOMENDACIÓN]` Añadir timeout con `AbortController` a todos los `fetch` y tipar la respuesta de `obtenerUltimaUbicacion`.
