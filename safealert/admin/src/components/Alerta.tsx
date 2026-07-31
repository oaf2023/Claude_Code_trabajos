/* ============================================================================
 * Archivo         : Alerta.tsx
 * Descripción     : Componentes de feedback: alerta de error y spinner
 *                   de carga para las pantallas del dashboard.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Utilizado en todas las páginas del dashboard
 * ========================================================================== */

export function ErrorAlerta({ mensaje }: { mensaje: string }) {
  return (
    <div className="alerta-error" role="alert">
      <strong>Error:</strong> {mensaje}
    </div>
  );
}

export function Spinner({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="spinner-box">
      <span className="spinner" />
      <span>{texto}</span>
    </div>
  );
}
