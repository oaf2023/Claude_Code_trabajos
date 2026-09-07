# Archivo: admin/src/lib/api.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/lib/api.ts | 256 | TypeScript 5.9 | 7384 | Cliente HTTP / capa de acceso a datos (fetch + API v1) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Es la única capa de comunicación con el backend del panel admin. Centraliza: (1) la
URL base de la API con precedencia `localStorage` → variable de entorno
`VITE_API_URL` → URL por defecto; (2) la autenticación por cabecera `X-Admin-Key`
con la clave guardada en `localStorage`; (3) la construcción de peticiones `fetch`
con prefijo `/api/v1`; (4) el manejo unificado de errores (red, HTTP 401 y 429 con
mensajes en español); (5) el tipado de las respuestas mediante interfaces
exportadas; y (6) funciones de alto nivel por endpoint (usuarios, estadísticas,
estado, ubicaciones, consentimientos, accesos, pagos simulados y purga de datos).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Todas las funciones exportadas se referencian
desde las pantallas (grep real en `admin/src`): `fetchUsuarios` (Usuarios,
PagoSimulado, UsuarioDetalle), `fetchStats` (Dashboard, Login, Admin),
`fetchEstado` (Layout, Admin), `purgarDatos`, `get/setAdminKey`, `get/setBaseUrl`
(Login, Admin), `simularPago` (PagoSimulado), `fetchUbicacionesUsuario`,
`fetchConsentimientos`, `fetchAccesos` (UsuarioDetalle), `ApiError` (páginas para
inspeccionar `e.status`). [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| (sin importaciones) | — | — | Usa APIs nativas del navegador: `fetch`, `localStorage`, `URLSearchParams`, `encodeURIComponent`, `JSON` | Sí |

## Componentes que dependen de este archivo

Consumidores reales hallados por grep en `admin/src`:

- `components/Layout.tsx` (línea 15): `clearAdminKey, fetchEstado, type EstadoSistema`.
- `pages/Login.tsx` (línea 15): `getBaseUrl, setAdminKey, setBaseUrl, fetchStats, ApiError`.
- `pages/Admin.tsx` (línea 14): `fetchEstado, purgarDatos, setAdminKey, setBaseUrl, getAdminKey, getBaseUrl, type EstadoSistema`.
- `pages/Dashboard.tsx` (línea 30): `fetchStats, ApiError, type StatsAdmin`.
- `pages/Usuarios.tsx` (línea 15): `fetchUsuarios, ApiError, type UsuarioAdmin`.
- `pages/UsuarioDetalle.tsx` (líneas 15-25): `fetchAccesos, fetchConsentimientos, fetchUbicacionesUsuario, fetchUsuarios, ApiError, type AccesoTecnico, type Consentimiento, type UbicacionMapa, type UsuarioAdmin`.
- `pages/PagoSimulado.tsx` (líneas 16-22): `fetchUsuarios, simularPago, ApiError, type ResultadoPagoSimulado, type UsuarioAdmin`.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `STORAGE_KEY` | `"safealert_admin_key"` | string (const) | Clave del `localStorage` donde se persiste la clave de administrador | Líneas 118, 122, 126, 130 |
| `STORAGE_URL_KEY` | `"safealert_admin_url"` | string (const) | Clave del `localStorage` donde se persiste la URL base configurada por el operador | Líneas 119, 135, 142 |
| Variable de entorno `VITE_API_URL` | valor real no presente en el repositorio: `[SECRETO OCULTO]` | string (entorno, `import.meta.env`) | URL base de la API en builds de producción; si no existe, se usa la URL por defecto | Línea 136 |
| URL por defecto de `getBaseUrl` | `"https://[SECRETO OCULTO]"` (dominio de despliegue real redactado) | string | Fallback final de la URL base de la API | Línea 137 |
| Prefijo de ruta | `"/api/v1"` | string literal | Versión de la API antepuesta a cada `path` | Línea 154 |
| `"X-Admin-Key"` | cabecera HTTP | string literal | Cabecera de autenticación con la clave admin | Línea 160 |
| `"Content-Type": "application/json"` | cabecera HTTP | string literal | Tipo de contenido enviado en todas las peticiones | Línea 156 |

## Estructura (funciones / clases / tipos)

Interfaces de datos (tipos): `UsuarioAdmin`, `UbicacionMapa`, `Consentimiento`,
`AccesoTecnico`, `Kpis`, `StatsAdmin`, `EstadoSistema`, `PagoSimuladoTicket`,
`ResultadoPagoSimulado`.

Clases: `ApiError` (extiende `Error`).

Funciones exportadas: `getAdminKey`, `setAdminKey`, `clearAdminKey`, `getBaseUrl`,
`setBaseUrl`, `fetchUsuarios`, `simularPago`, `fetchStats`, `fetchEstado`,
`fetchUbicacionesUsuario`, `fetchConsentimientos`, `fetchAccesos`, `purgarDatos`.

Función interna: `request<T>(path, init)`.

## Análisis línea por línea

```ts
/* ============================================================================
 * Archivo         : api.ts
 * Descripción     : Cliente HTTP del dashboard admin de SafeAlert.
 *                   Maneja autenticación con X-Admin-Key, errores 401/429
 *                   y tipado de respuestas de la API v1.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9
 * Uso             : Interno - consumido por las páginas del dashboard
 * ========================================================================== */
```

**Explicación de las líneas 1–11:**

Cabecera documental del proyecto; describe el propósito (autenticación
`X-Admin-Key`, manejo de 401/429, tipado de la API v1).

- **Línea 6**: fecha 2026-07-31 (futura; coherente con el repositorio).

```ts
export interface UsuarioAdmin {
  device_id: string;
  name: string;
  phone: string;
  mac_address?: string;
  device_unique_id?: string;
  registered_at: string;
  subscription_status: string;
  plan_type: string | null;
  subscription_expires_at: string | null;
  updated_at: string;
  ultima_ubicacion_id: number | null;
  ultima_latitud: number | null;
  ultima_longitud: number | null;
  ultimo_origen: string | null;
  ultima_precision: number | null;
  ultima_fecha_hora: string | null;
  ultima_direccion: string | null;
  total_ubicaciones: number;
}
```

**Explicación de las líneas 13–32:**

Interfaz `UsuarioAdmin`: proyección admin de un usuario de la app (vista
consolidada del backend). Incluye identificadores de dispositivo, datos de
registro y suscripción, y la última ubicación conocida con su origen y precisión.
Varios campos opcionales o anulables reflejan datos que pueden no existir (MAC,
ubicación). Es espejo del JSON del endpoint `/admin/usuarios`.

- **Línea 14**: `device_id` actúa como identificador del usuario (es la clave
  referenciada por ubicaciones/consentimientos/accesos).
- **Líneas 16-17**: MAC y UUID de dispositivo opcionales.
- **Línea 20**: `subscription_status` (active/pending_verification/expired/...)
  alimenta `BadgeEstadoSuscripcion`.
- **Líneas 24-30**: último punto geográfico con origen y dirección estimada.
- **Línea 31**: contador total de ubicaciones del usuario.

```ts
export interface UbicacionMapa {
  id: number;
  usuario_id: string;
  fecha_hora_servidor: string;
  latitud: number | null;
  longitud: number | null;
  precision_metros: number | null;
  origen: string;
  permiso_ubicacion: string | null;
  ip?: string | null;
  pais_ip?: string | null;
  ciudad_ip?: string | null;
  proveedor?: string | null;
  direccion_estimada?: string | null;
  direccion_confirmada?: string | null;
}
```

**Explicación de las líneas 34–49:**

Interfaz `UbicacionMapa`: una fila del histórico de ubicaciones de un usuario.
Campos geográficos (lat/long/precisión), origen de captura, estado del permiso y
metadatos de red (IP, país, ciudad, proveedor) cuando la ubicación se derivó de IP.
Los campos de red son opcionales porque no siempre se obtienen.

- **Línea 40**: precisión en metros (consumido por `formatearDistancia`).
- **Línea 42**: estado del permiso de ubicación en ese momento.
- **Líneas 43-48**: metadatos de geolocalización por IP; [NOTA] estos campos
  contienen datos personales indirectos (IP, ciudad) y son datos sensibles según
  gobernanza de datos; el frontend solo los muestra en detalle de usuario.

```ts
export interface Consentimiento {
  id: number;
  tipo_permiso: string;
  estado: string;
  version_politica: string | null;
  fecha_hora: string;
}

export interface AccesoTecnico {
  id: number;
  fecha_hora: string;
  ip: string | null;
  metodo_http: string | null;
  ruta_consultada: string | null;
  endpoint: string | null;
  codigo_respuesta: number | null;
  user_agent: string | null;
  navegador_aproximado: string | null;
  sistema_operativo_aproximado: string | null;
  tipo_dispositivo: string | null;
  pais_ip: string | null;
  ciudad_ip: string | null;
  proveedor: string | null;
}
```

**Explicación de las líneas 51–74:**

`Consentimiento`: registro de consentimiento de un permiso (tipo, estado
OTORGADO/RECHAZADO/REVOCADO/..., versión de política y fecha). `AccesoTecnico`:
registro de auditoría de accesos técnicos con IP, método HTTP, ruta, endpoint,
código de respuesta, user-agent y geolocalización aproximada por IP; alimenta la
sección de accesos del detalle de usuario y sirve para auditoría/telemetría.

- **Líneas 53-54**: `tipo_permiso` y `estado` alimentan `BadgeConsentimiento`.
- **Líneas 59-74**: campos de auditoría; los valores aproximados (navegador, SO,
  dispositivo) sugieren que el backend los infiere del `user_agent`.

```ts
export interface Kpis {
  total_usuarios: number;
  usuarios_activos_24h: number;
  usuarios_activos_7d: number;
  total_ubicaciones: number;
  ubicaciones_24h: number;
  total_accesos: number;
  accesos_24h: number;
  total_consentimientos: number;
}

export interface StatsAdmin {
  kpis: Kpis;
  ubicaciones_por_origen: { origen: string; c: number }[];
  ubicaciones_por_dia: { dia: string; c: number }[];
  accesos_por_dispositivo: { tipo_dispositivo: string; c: number }[];
  usuarios_por_estado_suscripcion: { subscription_status: string; c: number }[];
  consentimientos_por_estado: { estado: string; c: number }[];
  ubicaciones_por_permiso: { permiso_ubicacion: string; c: number }[];
  usuarios_por_plan: { plan_type: string; c: number }[];
  generado_en: string;
}
```

**Explicación de las líneas 76–97:**

`Kpis`: ocho contadores agregados que alimentan las tarjetas `KpiCard` del
Dashboard. `StatsAdmin`: paquete estadístico completo del Dashboard, con los KPI y
siete desgloses (cada uno un array de pares `{clave, c}` listos para gráficos
Recharts) más el sello temporal `generado_en`. El nombre `c` como contador
abreviado es un convenio del backend.

- **Línea 89**: distribución de ubicaciones por origen (GPS/IP/Navegador/Manual).
- **Línea 90**: serie temporal por día para gráficos de área.
- **Líneas 91-96**: desgloses para gráficos de dona/barras del Dashboard.

```ts
export interface EstadoSistema {
  status: string;
  timestamp: string;
  base_datos: {
    conectada: boolean;
    ubicaciones: number;
    accesos: number;
    consentimientos: number;
  };
  servidor: { ip_publica: string; proveedor_geo: string };
  retencion: {
    accesos_dias: number;
    ubicaciones_dias: number;
    consentimientos_dias: number;
    logs_dias: number;
  };
  version_api: string;
}
```

**Explicación de las líneas 99–116:**

`EstadoSistema`: respuesta del endpoint de salud `/estado`, consumido por `Layout`
(indicador de conectividad y subtítulo) y por la pantalla Admin. Incluye estado
general, marca temporal, salud de la base de datos con conteos, datos del servidor
(IP pública y proveedor de geolocalización) y políticas de retención en días por
tipo de dato.

- **Líneas 102-107**: `base_datos` expone si está conectada y conteos por tabla.
- **Línea 108**: `servidor.ip_publica` es información de infraestructura;
  [INFORMATIVO] se muestra en la UI admin.
- **Líneas 109-114**: `retencion` (días) permite a la pantalla Admin informar las
  políticas de retención.
- **Línea 115**: `version_api` mostrada en el topbar del Layout.

```ts
const STORAGE_KEY = "safealert_admin_key";
const STORAGE_URL_KEY = "safealert_admin_url";

export function getAdminKey(): string {
  return localStorage.getItem(STORAGE_KEY) ?? "";
}

export function setAdminKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
}

export function clearAdminKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getBaseUrl(): string {
  return (
    localStorage.getItem(STORAGE_URL_KEY) ??
    (import.meta.env.VITE_API_URL as string | undefined) ??
    "https://[SECRETO OCULTO]"
  ).replace(/\/+$/, "");
}

export function setBaseUrl(url: string): void {
  localStorage.setItem(STORAGE_URL_KEY, url.replace(/\/+$/, ""));
}
```

**Explicación de las líneas 118–143:**

Gestión de persistencia en `localStorage` de la clave admin y de la URL base.

- **Línea 118**: constante con la clave de almacenamiento de la credencial.
- **Línea 119**: constante con la clave de almacenamiento de la URL configurada.
- **Líneas 121-123**: `getAdminKey` devuelve la clave o cadena vacía (ausencia de
  sesión); las páginas/`request` la usan para la cabecera.
- **Líneas 125-127**: `setAdminKey` persiste la clave tras un login exitoso.
- **Líneas 129-131**: `clearAdminKey` elimina la clave (cierre de sesión).
- **Líneas 133-139**: `getBaseUrl` resuelve la URL base con precedencia: (1)
  `localStorage.safealert_admin_url` si el operador la configuró en pantalla; (2)
  variable de entorno `VITE_API_URL` inyectada por Vite en build; (3) URL por
  defecto de despliegue `[SECRETO OCULTO]`. Termina eliminando las barras finales
  (`replace(/\/+$/, "")`) para evitar dobles `/` al concatenar.
- **Líneas 141-143**: `setBaseUrl` persiste una URL configurada por el operador,
  también normalizada sin barra final.

```ts
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
```

**Explicación de las líneas 145–151:**

`ApiError`: excepción tipada con el código HTTP (`status`). Las pantallas la usan
para distinguir, por ejemplo, un 401 (clave inválida) de un 429 (rate limit) o de
un 0 (sin conexión).

- **Línea 146**: campo público `status`.
- **Línea 148**: invoca al constructor base `Error` con el mensaje.
- **Línea 149**: asigna el código de estado HTTP (0 significa fallo de red).

```ts
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${getBaseUrl()}/api/v1${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const key = getAdminKey();
  if (key) headers["X-Admin-Key"] = key;

  let resp: Response;
  try {
    resp = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError(0, `Sin conexión con el servidor (${getBaseUrl()})`);
  }

  if (resp.status === 401) {
    throw new ApiError(401, "Clave de administrador inválida");
  }
  if (resp.status === 429) {
    throw new ApiError(429, "Demasiadas solicitudes (rate limit). Esperá un minuto.");
  }
  if (!resp.ok) {
    let detail = `Error ${resp.status}`;
    try {
      const body = await resp.json();
      detail = body.error ?? detail;
    } catch {
      /* sin cuerpo JSON */
    }
    throw new ApiError(resp.status, detail);
  }
  return (await resp.json()) as T;
}
```

**Explicación de las líneas 153–186:**

Función genérica privada `request<T>` que ejecuta todas las peticiones HTTP.

- **Línea 153**: genérica: tipa la respuesta; `init` es `RequestInit` de fetch con
  valores por defecto (`{}`).
- **Línea 154**: compone la URL final: `getBaseUrl()` + prefijo fijo `/api/v1` +
  ruta del endpoint. Todas las llamadas del módulo pasan rutas sin ese prefijo.
- **Líneas 155-158**: construye cabeceras: fija `Content-Type: application/json`
  por defecto y luego extiende con las cabeceras que el llamador haya provisto
  (spread). [NOTA] `Content-Type` se envía también en GET, innecesario pero
  inofensivo.
- **Líneas 159-160**: si hay clave admin persistida, añade la cabecera
  `X-Admin-Key` (mecanismo de autenticación por clave estática en cabecera).
- **Líneas 162-167**: ejecuta `fetch` con las opciones combinadas; si lanza
  (fallo de red/DNS/CORS bloqueado), la captura y la convierte en `ApiError(0,
  ...)` con mensaje "Sin conexión…". [INFORMATIVO] El mensaje incluye la URL base
  resuelta: si el operador tipeó mal la URL configurada, ayuda a diagnosticar.
- **Líneas 169-171**: 401 → `ApiError(401, "Clave de administrador inválida")`.
  La redirección al login la deciden las pantallas.
- **Líneas 172-174**: 429 → `ApiError(429, ...)` con mensaje de rate limit en
  español rioplatense ("Esperá un minuto").
- **Líneas 175-184**: para el resto de respuestas no OK, intenta leer el cuerpo
  JSON para extraer `body.error` (convenio del backend) y lo usa como detalle; si
  el cuerpo no es JSON, conserva `Error ${resp.status}`. Finalmente lanza
  `ApiError(status, detail)`.
- **Línea 185**: respuesta OK → devuelve el cuerpo parseado como JSON tipado `T`.
  [NOTA] Si el backend respondiera 204 (sin cuerpo), `resp.json()` fallaría; no hay
  endpoints 204 en este módulo.

```ts
/* --- Endpoints admin --- */
```

**Explicación de la línea 188:**

Comentario separador de la sección de funciones por endpoint.

```ts
export function fetchUsuarios(params: { busqueda?: string; mac?: string; plan?: string; limite?: number } = {}): Promise<{ total: number; usuarios: UsuarioAdmin[] }> {
  const qs = new URLSearchParams();
  if (params.busqueda) qs.set("busqueda", params.busqueda);
  if (params.mac) qs.set("mac", params.mac);
  if (params.plan) qs.set("plan", params.plan);
  if (params.limite) qs.set("limite", String(params.limite));
  const q = qs.toString();
  return request(`/admin/usuarios${q ? `?${q}` : ""}`);
}
```

**Explicación de las líneas 190–198:**

`fetchUsuarios`: consulta la lista paginada/filtrada de usuarios admin. Construye
query string con `URLSearchParams` solo para los filtros presentes (`busqueda`,
`mac`, `plan`, `limite`). GET a `/admin/usuarios`; la respuesta tipada contiene el
total y el array de `UsuarioAdmin`. Los nombres de filtro coinciden con los
parámetros esperados por el backend.

- **Línea 190**: objeto de parámetros opcionales con valor por defecto `{}`.
- **Líneas 191-195**: agrega cada filtro solo si tiene valor (nunca envía claves
  vacías); `limite` se serializa a string.
- **Línea 196**: serializa la query (por ejemplo `?busqueda=ana&limite=50`).
- **Línea 197**: GET a `/admin/usuarios` con o sin query.

```ts
export interface PagoSimuladoTicket {
  ticket_number: number;
  date: string;
  time: string;
  plan_type: "monthly" | "annual";
  amount: number;
  contact_email: string;
}

export interface ResultadoPagoSimulado {
  success: boolean;
  ticket: PagoSimuladoTicket;
  usuario: {
    device_id: string;
    name: string;
    mac_address: string;
    subscription_status: string;
    plan_type: string;
    subscription_expires_at: string;
  };
}

export function simularPago(params: {
  mac_address?: string;
  device_id?: string;
  plan_type: "monthly" | "annual";
  dias?: number;
}): Promise<ResultadoPagoSimulado> {
  return request("/admin/pagos/simular", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
```

**Explicación de las líneas 200–232:**

Tipos y función para el pago simulado (pruebas). `PagoSimuladoTicket` modela el
comprobante que devuelve el backend (número correlativo, fecha/hora, plan mensual
o anual, monto y email de contacto). `ResultadoPagoSimulado` envuelve el ticket y
los datos de la suscripción del usuario actualizados. `simularPago` hace un POST
con cuerpo JSON a `/admin/pagos/simular`. [NOTA] Según el comentario de cabecera de
`PagoSimulado.tsx`, este flujo no contacta a Mercado Pago: es solo para pruebas de
activación de suscripción.

- **Líneas 200-207**: interfaz del ticket.
- **Líneas 209-220**: interfaz del resultado (éxito + ticket + usuario actualizado).
- **Líneas 222-232**: función que serializa parámetros opcionales (`mac_address`,
  `device_id`, `plan_type`, `dias`) y hace el POST.

```ts
export function fetchStats(): Promise<StatsAdmin> {
  return request("/admin/stats");
}

export function fetchEstado(): Promise<EstadoSistema> {
  return request("/estado");
}
```

**Explicación de las líneas 234–240:**

- **Líneas 234-236**: `fetchStats`: GET a `/admin/stats` → paquete estadístico del
  Dashboard.
- **Líneas 238-240**: `fetchEstado`: GET a `/estado` → salud del sistema para el
  Layout y la pantalla Admin.

```ts
export function fetchUbicacionesUsuario(usuarioId: string, limite = 100): Promise<UbicacionMapa[]> {
  return request(`/ubicaciones/usuario/${encodeURIComponent(usuarioId)}?limite=${limite}`);
}

export function fetchConsentimientos(usuarioId: string): Promise<Consentimiento[]> {
  return request(`/consentimientos/usuario/${encodeURIComponent(usuarioId)}`);
}

export function fetchAccesos(usuarioId: string, limite = 50): Promise<AccesoTecnico[]> {
  return request(`/accesos/usuario/${encodeURIComponent(usuarioId)}?limite=${limite}`);
}
```

**Explicación de las líneas 242–252:**

Tres consultas históricas por usuario, todas GET y con el id codificado con
`encodeURIComponent` (protege contra ids con caracteres especiales y evita
inyección en la ruta).

- **Líneas 242-244**: histórico de ubicaciones (límite por defecto 100).
- **Líneas 246-248**: consentimientos del usuario (sin límite).
- **Líneas 250-252**: accesos técnicos (límite por defecto 50).

```ts
export function purgarDatos(): Promise<{ success: boolean; eliminados: Record<string, number> }> {
  return request("/admin/purga", { method: "POST" });
}
```

**Explicación de las líneas 254–256:**

`purgarDatos`: dispara la purga de datos (retención) en el backend vía POST a
`/admin/purga`. Responde `{ success, eliminados }` con un mapa tabla → cantidad de
registros eliminados, mostrado en la pantalla Admin.

- **Línea 254**: tipo de retorno con `Record<string, number>` para los conteos por
  tabla.

## Fichas de funciones y métodos

### getAdminKey (líneas 121–123)

- Firma: `export function getAdminKey(): string`.
- Propósito técnico: leer la clave admin persistida. Propósito funcional: proveer la
  credencial para la cabecera de autenticación.
- Parámetros: ninguno. Retorno: `string` (cadena vacía si no hay clave).
- Excepciones: puede lanzar si `localStorage` no está disponible (modo privado
  restrictivo); improbable.
- Flujo: `localStorage.getItem(STORAGE_KEY) ?? ""`.
- Riesgos: [MEDIO] leer/almacenar la clave en `localStorage` la expone a cualquier
  XSS del panel (ver Sección Seguridad).

### setAdminKey (líneas 125–127)

- Firma: `export function setAdminKey(key: string): void`.
- Propósito: persistir la clave admin tras login exitoso.
- Retorno: `void`. Efectos secundarios: escritura en `localStorage`.
- Riesgos: [MEDIO] si la clave se guarda sin expiración, permanece hasta borrado
  manual o cierre de sesión.

### clearAdminKey (líneas 129–131)

- Firma: `export function clearAdminKey(): void`.
- Propósito: eliminar la clave persistida (cierre de sesión).
- Retorno: `void`. Efectos secundarios: `localStorage.removeItem`.

### getBaseUrl (líneas 133–139)

- Firma: `export function getBaseUrl(): string`.
- Propósito técnico: resolver la URL base de la API. Propósito funcional: permitir
  al operador apuntar a otro backend (p. ej. localhost en desarrollo) sin rebuild.
- Parámetros: ninguno. Retorno: `string` sin barras finales.
- Precedencia: `localStorage` (`STORAGE_URL_KEY`) → `import.meta.env.VITE_API_URL`
  → URL por defecto `[SECRETO OCULTO]`.
- Excepciones: si `localStorage` fallara, `getItem` lanzaría; no está envuelto en
  try/catch.
- Riesgos: [BAJO] el operador puede configurar una URL arbitraria (p. ej. un
  servidor malicioso) si su sesión es manipulada; mitigado porque la clave admin
  viajaría entonces a ese origen (el navegador la enviaría solo si el fetch lo
  permite; sin `credentials`, el destino recibe la clave en cabecera si el
  operador la escribió). Depende de la confianza en el operador y de no sufrir XSS.

### setBaseUrl (líneas 141–143)

- Firma: `export function setBaseUrl(url: string): void`.
- Propósito: persistir la URL configurada por el operador, normalizada sin `/`
  final.
- Retorno: `void`. Efectos secundarios: escritura en `localStorage`.

### ApiError (clase, líneas 145–151)

- Firma: `export class ApiError extends Error { status: number; constructor(status: number, message: string) }`.
- Propósito: excepción con código HTTP para manejo diferenciado en la UI.
- Campos: `status: number` (0 = sin conexión; 401, 429, otros HTTP).
- Uso: `try { ... } catch (e) { if (e instanceof ApiError && e.status === 401) ... }`.

### request (líneas 153–186)

- Firma: `async function request<T>(path: string, init: RequestInit = {}): Promise<T>`.
- Propósito técnico: núcleo del cliente HTTP (fetch) con autenticación y errores
  normalizados.
- Parámetros:

| Parámetro | Tipo | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| path | string | Sí | Ruta relativa tras `/api/v1` |
| init | RequestInit | No | Opciones fetch (método, cuerpo, cabeceras) |

- Retorno: `Promise<T>` con el JSON parseado. Excepciones: `ApiError(0)`,
  `ApiError(401)`, `ApiError(429)`, `ApiError(status, detail)`.
- Flujo: 1) compone URL; 2) arma cabeceras + `X-Admin-Key`; 3) `fetch`; 4) clasifica
  errores; 5) parsea JSON.
- Efectos secundarios: petición de red; mensajes de error con la URL base.
- Riesgos: ver Sección Seguridad.

### fetchUsuarios (líneas 190–198)

- Firma: `export function fetchUsuarios(params: { busqueda?: string; mac?: string; plan?: string; limite?: number } = {}): Promise<{ total: number; usuarios: UsuarioAdmin[] }>`.
- Endpoint: `GET /api/v1/admin/usuarios[?busqueda=&mac=&plan=&limite=]`.
- Propósito: listar/filtrar usuarios para las tablas del panel.
- Parámetros: objeto opcional con filtros (ver firma). Retorno: total + lista.
- Llamada desde: `Usuarios.tsx`, `PagoSimulado.tsx`, `UsuarioDetalle.tsx`.

### simularPago (líneas 222–232)

- Firma: `export function simularPago(params: { mac_address?: string; device_id?: string; plan_type: "monthly" | "annual"; dias?: number }): Promise<ResultadoPagoSimulado>`.
- Endpoint: `POST /api/v1/admin/pagos/simular`.
- Propósito: activar suscripción de un usuario mediante pago simulado (pruebas, sin
  cobro real).
- Parámetros: identificadores opcionales del usuario (al menos uno), plan y días.
- Llamada desde: `PagoSimulado.tsx`.

### fetchStats (líneas 234–236)

- Endpoint: `GET /api/v1/admin/stats`. Retorno: `StatsAdmin`.
- Llamada desde: `Dashboard.tsx`, `Login.tsx` (validación de clave), `Admin.tsx`.

### fetchEstado (líneas 238–240)

- Endpoint: `GET /api/v1/estado`. Retorno: `EstadoSistema`.
- Llamada desde: `Layout.tsx` (polling 60 s), `Admin.tsx`.

### fetchUbicacionesUsuario (líneas 242–244)

- Endpoint: `GET /api/v1/ubicaciones/usuario/{id}?limite=N` (default 100).
- Retorno: `UbicacionMapa[]`. Llamada desde: `UsuarioDetalle.tsx`.

### fetchConsentimientos (líneas 246–248)

- Endpoint: `GET /api/v1/consentimientos/usuario/{id}`.
- Retorno: `Consentimiento[]`. Llamada desde: `UsuarioDetalle.tsx`.

### fetchAccesos (líneas 250–252)

- Endpoint: `GET /api/v1/accesos/usuario/{id}?limite=N` (default 50).
- Retorno: `AccesoTecnico[]`. Llamada desde: `UsuarioDetalle.tsx`.

### purgarDatos (líneas 254–256)

- Firma: `export function purgarDatos(): Promise<{ success: boolean; eliminados: Record<string, number> }>`.
- Endpoint: `POST /api/v1/admin/purga`.
- Propósito: ejecutar la purga por retención de datos (accesos, ubicaciones,
  consentimientos, logs).
- Retorno: éxito + conteos por tabla. Llamada desde: `Admin.tsx`.
- Riesgo: [ALTO] operación destructiva de borrado masivo; la pantalla Admin exige
  confirmación (CSS `.confirmar-purga`) antes de invocarla.

## Clases / interfaces / tipos

### interface UsuarioAdmin (líneas 13–32)

Responsabilidad: proyección consolidada de un usuario para el panel.
Relaciones: es el agregador referenciado por `UbicacionMapa.usuario_id`,
`Consentimiento` y `AccesoTecnico` (no embebidos).

| Campo | Tipo | Descripción |
| --- | --- | --- |
| device_id | string | Identificador del dispositivo/usuario |
| name | string | Nombre del usuario |
| phone | string | Teléfono |
| mac_address | string (opcional) | Dirección MAC |
| device_unique_id | string (opcional) | UUID del dispositivo |
| registered_at | string | Fecha de registro (ISO) |
| subscription_status | string | Estado de suscripción |
| plan_type | string \| null | Plan (monthly/annual/null) |
| subscription_expires_at | string \| null | Vencimiento de suscripción |
| updated_at | string | Última actualización del registro |
| ultima_ubicacion_id | number \| null | Id de la última ubicación |
| ultima_latitud / ultima_longitud | number \| null | Coordenadas de la última ubicación |
| ultimo_origen | string \| null | Origen (GPS/NAVEGADOR/IP/MANUAL) |
| ultima_precision | number \| null | Precisión en metros |
| ultima_fecha_hora | string \| null | Timestamp de la última ubicación |
| ultima_direccion | string \| null | Dirección estimada |
| total_ubicaciones | number | Contador de ubicaciones |

### interface UbicacionMapa (líneas 34–49)

Responsabilidad: una ubicación registrada de un usuario. Relaciones: pertenece a un
`UsuarioAdmin.device_id`.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | number | Id de la ubicación |
| usuario_id | string | Usuario propietario |
| fecha_hora_servidor | string | Timestamp del servidor |
| latitud / longitud | number \| null | Coordenadas |
| precision_metros | number \| null | Precisión |
| origen | string | Origen de captura |
| permiso_ubicacion | string \| null | Estado del permiso |
| ip / pais_ip / ciudad_ip / proveedor | string \| null (opcional) | Metadatos de red |
| direccion_estimada / direccion_confirmada | string \| null (opcional) | Direcciones |

### interface Consentimiento (líneas 51–57)

Responsabilidad: registro de consentimiento de permiso.

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | number | Id |
| tipo_permiso | string | Permiso al que refiere |
| estado | string | OTORGADO/RECHAZADO/REVOCADO/... |
| version_politica | string \| null | Versión de la política aceptada |
| fecha_hora | string | Timestamp |

### interface AccesoTecnico (líneas 59–74)

Responsabilidad: auditoría de un acceso técnico a la API. Ciclo de vida: sujeto a
retención (`EstadoSistema.retencion.accesos_dias`).

| Campo | Tipo | Descripción |
| --- | --- | --- |
| id | number | Id |
| fecha_hora | string | Timestamp |
| ip | string \| null | IP origen |
| metodo_http | string \| null | Método |
| ruta_consultada | string \| null | Ruta solicitada |
| endpoint | string \| null | Endpoint |
| codigo_respuesta | number \| null | HTTP status |
| user_agent | string \| null | User-Agent |
| navegador_aproximado / sistema_operativo_aproximado / tipo_dispositivo | string \| null | Inferencias del user-agent |
| pais_ip / ciudad_ip / proveedor | string \| null | Geolocalización por IP |

### interface Kpis (líneas 76–85)

Responsabilidad: contadores agregados. Campos: `total_usuarios`,
`usuarios_activos_24h`, `usuarios_activos_7d`, `total_ubicaciones`,
`ubicaciones_24h`, `total_accesos`, `accesos_24h`, `total_consentimientos` (todos
`number`).

### interface StatsAdmin (líneas 87–97)

Responsabilidad: paquete de estadísticas del Dashboard. Contiene `kpis` y arrays
de pares `{clave; c}` para origen, día, dispositivo, estado de suscripción, estado
de consentimiento, permiso y plan, más `generado_en: string`.

### interface EstadoSistema (líneas 99–116)

Responsabilidad: estado de salud del backend para el shell y la pantalla Admin.
Campos: `status`, `timestamp`, `base_datos {conectada, ubicaciones, accesos,
consentimientos}`, `servidor {ip_publica, proveedor_geo}`, `retencion
{accesos_dias, ubicaciones_dias, consentimientos_dias, logs_dias}`,
`version_api`.

### interface PagoSimuladoTicket (líneas 200–207)

Responsabilidad: ticket de pago simulado. Campos: `ticket_number: number`,
`date`, `time`, `plan_type: "monthly" | "annual"`, `amount: number`,
`contact_email: string`.

### interface ResultadoPagoSimulado (líneas 209–220)

Responsabilidad: resultado del pago simulado con el usuario actualizado. Campos:
`success: boolean`, `ticket: PagoSimuladoTicket`, `usuario {device_id, name,
mac_address, subscription_status, plan_type, subscription_expires_at}`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La autenticación es por clave estática (`X-Admin-Key`)
  persistida en `localStorage` sin expiración local; no hay tokens JWT con
  renovación. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `getBaseUrl` puede devolver una URL configurada por el
  operador que prevalece sobre `VITE_API_URL`; en producción eso permite apuntar a
  un backend distinto sin rebuild. Es una funcionalidad intencional de la pantalla
  Admin/Login. [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] Mensajes de error en español rioplatense ("Esperá un minuto", "Sin
  conexión"); tono informal coherente en toda la UI.
- [NOTA] El manejo de `resp.json()` se invoca dos veces por respuesta (una para
  cuerpos de error, otra para el cuerpo OK); correcto, pues solo se ejecuta una
  rama por petición.
- [NOTA] No se usa axios: el cliente está implementado con `fetch` nativo.
- [NOTA] Los valores de retención y conteos expuestos por `/estado` indican
  integración con las políticas DAMA/DAMMA del backend (retención de datos).
  [NIVEL DE CERTEZA: Inferido]

## Seguridad

- [MEDIO] Clave de administrador en `localStorage`: cualquier XSS en el panel
  puede leer `safealert_admin_key` y exfiltrarla (o usarla). Mitigación
  recomendada: sesión con token de corta vida + cookie HttpOnly/Secure o al menos
  CSP estricta. No se observa cabecera CSP en `index.html`.
- [MEDIO] No hay expiración/rotación de la clave en el cliente; `clearAdminKey`
  solo borra el almacenamiento local sin revocar en el servidor (riesgo de clave
  filtrada aún válida).
- [BAJO] `setBaseUrl` permite persistir cualquier URL; combinado con la clave en
  `localStorage`, un atacante con XSS podría redirigir las peticiones (incluida la
  clave) a un servidor controlado (no hay lista blanca de orígenes en el cliente).
- [BAJO] `Content-Type: application/json` fijo y cabecera custom `X-Admin-Key`
  reducen el riesgo CSRF clásico (las peticiones cross-site no pueden fijar
  cabeceras custom sin CORS preflight, y no se envían cookies de sesión).
- [INFORMATIVO] `encodeURIComponent` en los ids de ruta evita inyección por
  caracteres especiales en la URL.
- [INFORMATIVO] Los mensajes de error no contienen secretos; el backend debe
  evitar devolver trazas en `body.error` (el cliente las muestra tal cual).
- [INFORMATIVO] Datos personales (IP, geolocalización, teléfono) transitan en
  respuestas; el transporte debe ser HTTPS (responsable de la infraestructura).
- [BAJO] `getBaseUrl` no está protegido con try/catch ante fallos de
  `localStorage`; en navegadores con almacenamiento bloqueado podría lanzar.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Migrar a autenticación por sesión/token de corta duración con
  cookie HttpOnly + Secure y renovación, o al menos añadir CSP y marcar la clave
  con expiración.
- [RECOMENDACIÓN] No mostrar la URL base en el mensaje de error de red si el
  entorno es de producción (fuga menor de configuración); mantenerla en desarrollo.
- [RECOMENDACIÓN] Considerar `AbortController` con timeout para que las peticiones
  no queden colgadas indefinidamente (el Layout podría quedarse "Verificando…").
- [RECOMENDACIÓN] Tipar los parámetros de filtro de `fetchUsuarios` con tipos
  literales compartidos y validar en backend (evita discrepancias de vocabulario).
- [RECOMENDACIÓN] Revisar que el backend valide autorización por endpoint
  (especialmente `/admin/purga`, destructivo) y aplique rate limit (el cliente ya
  gestiona el 429).
