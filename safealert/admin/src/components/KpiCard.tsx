/* ============================================================================
 * Archivo         : KpiCard.tsx
 * Descripción     : Tarjeta de indicador clave (KPI) con título, valor,
 *                   detalle y color de acento.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Utilizado en la pantalla Dashboard
 * ========================================================================== */

interface KpiCardProps {
  titulo: string;
  valor: number | string;
  detalle?: string;
  color?: string;
}

export default function KpiCard({ titulo, valor, detalle, color = "#3b82f6" }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <span className="kpi-accent" style={{ backgroundColor: color }} />
      <div className="kpi-body">
        <span className="kpi-titulo">{titulo}</span>
        <span className="kpi-valor">{typeof valor === "number" ? valor.toLocaleString("es-AR") : valor}</span>
        {detalle && <span className="kpi-detalle">{detalle}</span>}
      </div>
    </div>
  );
}
