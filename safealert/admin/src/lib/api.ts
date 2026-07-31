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
    "https://oaf.pythonanywhere.com"
  ).replace(/\/+$/, "");
}

export function setBaseUrl(url: string): void {
  localStorage.setItem(STORAGE_URL_KEY, url.replace(/\/+$/, ""));
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

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

/* --- Endpoints admin --- */

export function fetchUsuarios(params: { busqueda?: string; plan?: string; limite?: number } = {}): Promise<{ total: number; usuarios: UsuarioAdmin[] }> {
  const qs = new URLSearchParams();
  if (params.busqueda) qs.set("busqueda", params.busqueda);
  if (params.plan) qs.set("plan", params.plan);
  if (params.limite) qs.set("limite", String(params.limite));
  const q = qs.toString();
  return request(`/admin/usuarios${q ? `?${q}` : ""}`);
}

export function fetchStats(): Promise<StatsAdmin> {
  return request("/admin/stats");
}

export function fetchEstado(): Promise<EstadoSistema> {
  return request("/estado");
}

export function fetchUbicacionesUsuario(usuarioId: string, limite = 100): Promise<UbicacionMapa[]> {
  return request(`/ubicaciones/usuario/${encodeURIComponent(usuarioId)}?limite=${limite}`);
}

export function fetchConsentimientos(usuarioId: string): Promise<Consentimiento[]> {
  return request(`/consentimientos/usuario/${encodeURIComponent(usuarioId)}`);
}

export function fetchAccesos(usuarioId: string, limite = 50): Promise<AccesoTecnico[]> {
  return request(`/accesos/usuario/${encodeURIComponent(usuarioId)}?limite=${limite}`);
}

export function purgarDatos(): Promise<{ success: boolean; eliminados: Record<string, number> }> {
  return request("/admin/purga", { method: "POST" });
}
