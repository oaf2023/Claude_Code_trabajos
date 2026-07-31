/* ============================================================================
 * Archivo         : format.ts
 * Descripción     : Utilidades de formato (fechas, coordenadas, duraciones,
 *                   etiquetas de estado y origen) para el dashboard admin.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9
 * Uso             : Interno - consumido por componentes del dashboard
 * ========================================================================== */

export const ORIGEN_LABEL: Record<string, string> = {
  GPS: "GPS",
  NAVEGADOR: "Navegador",
  IP: "IP",
  MANUAL: "Manual",
};

export const ORIGEN_COLOR: Record<string, string> = {
  GPS: "#22c55e",
  NAVEGADOR: "#3b82f6",
  IP: "#f59e0b",
  MANUAL: "#a855f7",
};

export const ESTADO_SUSCRIPCION_LABEL: Record<string, string> = {
  active: "Activo",
  pending_verification: "Verificación pendiente",
  expired: "Expirado",
  not_registered: "Sin suscripción",
};

export const ESTADO_CONSENTIMIENTO_LABEL: Record<string, string> = {
  OTORGADO: "Otorgado",
  RECHAZADO: "Rechazado",
  REVOCADO: "Revocado",
  NO_SOLICITADO: "No solicitado",
};

export const PERMISO_LABEL: Record<string, string> = {
  GRANTED: "Concedido",
  DENIED: "Denegado",
  PROMPT: "Solicitado",
  NO_DISPONIBLE: "No disponible",
  NO_SOLICITADO: "No solicitado",
  ERROR: "Error",
};

/** Formatea una fecha ISO UTC (backend SQLite) a hora local. */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatearSoloFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}

/** Antigüedad legible: "hace 5 min", "hace 3 h", "hace 2 días". */
export function antiguedad(iso: string | null | undefined): string {
  if (!iso) return "sin datos";
  const fecha = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(fecha.getTime())) return "sin datos";
  const segundos = Math.max(0, (Date.now() - fecha.getTime()) / 1000);
  if (segundos < 60) return `hace ${Math.floor(segundos)} s`;
  if (segundos < 3600) return `hace ${Math.floor(segundos / 60)} min`;
  if (segundos < 86400) return `hace ${Math.floor(segundos / 3600)} h`;
  return `hace ${Math.floor(segundos / 86400)} días`;
}

export function formatearCoordenada(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toFixed(6);
}

/** 150 -> "150 m" ; 1250 -> "1,25 km" */
export function formatearDistancia(metros: number | null | undefined): string {
  if (metros === null || metros === undefined || Number.isNaN(metros)) return "—";
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(2)} km`;
}

export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
