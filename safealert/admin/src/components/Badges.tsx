/* ============================================================================
 * Archivo         : Badges.tsx
 * Descripción     : Componentes de insignia de estado (suscripción,
 *                   consentimiento, origen) con colores semánticos.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Utilizado en tablas de usuarios y detalle de usuario
 * ========================================================================== */

import {
  ESTADO_CONSENTIMIENTO_LABEL,
  ESTADO_SUSCRIPCION_LABEL,
  ORIGEN_COLOR,
  ORIGEN_LABEL,
} from "../lib/format";

type Variante = "ok" | "warn" | "err" | "info" | "muted";

const VARIANTE_CLASS: Record<Variante, string> = {
  ok: "badge badge-ok",
  warn: "badge badge-warn",
  err: "badge badge-err",
  info: "badge badge-info",
  muted: "badge badge-muted",
};

export function BadgeEstadoSuscripcion({ estado }: { estado: string }) {
  let variante: Variante = "muted";
  if (estado === "active") variante = "ok";
  if (estado === "pending_verification") variante = "warn";
  if (estado === "expired") variante = "err";
  return <span className={VARIANTE_CLASS[variante]}>{ESTADO_SUSCRIPCION_LABEL[estado] ?? estado}</span>;
}

export function BadgeConsentimiento({ estado }: { estado: string }) {
  let variante: Variante = "muted";
  if (estado === "OTORGADO") variante = "ok";
  if (estado === "RECHAZADO") variante = "err";
  if (estado === "REVOCADO") variante = "warn";
  return <span className={VARIANTE_CLASS[variante]}>{ESTADO_CONSENTIMIENTO_LABEL[estado] ?? estado}</span>;
}

export function BadgeOrigen({ origen }: { origen: string | null | undefined }) {
  if (!origen) return <span className="badge badge-muted">sin datos</span>;
  return (
    <span className="badge badge-origen" style={{ borderColor: ORIGEN_COLOR[origen] ?? "#6b7280", color: ORIGEN_COLOR[origen] ?? "#6b7280" }}>
      {ORIGEN_LABEL[origen] ?? origen}
    </span>
  );
}
