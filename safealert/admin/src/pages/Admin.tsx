/* ============================================================================
 * Archivo         : Admin.tsx
 * Descripción     : Pantalla de administración: estado del backend (health
 *                   check), política de retención, purga manual con
 *                   confirmación, y configuración de URL/key del API.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Ruta /admin
 * ========================================================================== */

import { useCallback, useEffect, useState } from "react";
import { fetchEstado, purgarDatos, setAdminKey, setBaseUrl, getAdminKey, getBaseUrl, type EstadoSistema } from "../lib/api";
import { ErrorAlerta, Spinner } from "../components/Alerta";

export default function Admin() {
  const [estado, setEstado] = useState<EstadoSistema | null>(null);
  const [error, setError] = useState("");
  const [confirmandoPurga, setConfirmandoPurga] = useState(false);
  const [purgando, setPurgando] = useState(false);
  const [resultadoPurga, setResultadoPurga] = useState("");
  const [url, setUrl] = useState(getBaseUrl());
  const [clave, setClave] = useState(getAdminKey());
  const [guardado, setGuardado] = useState("");

  const cargar = useCallback(() => {
    setError("");
    fetchEstado()
      .then(setEstado)
      .catch((err) => setError(err instanceof Error ? err.message : "Error al consultar el estado."));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const guardarConfig = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBaseUrl(url.trim() || "https://oaf.pythonanywhere.com");
      setAdminKey(clave.trim());
      setGuardado("Configuración guardada.");
      window.setTimeout(() => setGuardado(""), 3000);
    } catch {
      setError("No se pudo guardar la configuración.");
    }
  };

  const ejecutarPurga = async () => {
    setPurgando(true);
    setResultadoPurga("");
    try {
      const res = await purgarDatos();
      const elim = res.eliminados;
      setResultadoPurga(
        `Purga completada: ${elim.accesos ?? 0} accesos, ${elim.ubicaciones ?? 0} ubicaciones, ${elim.consentimientos ?? 0} consentimientos.`
      );
      cargar();
    } catch (err) {
      setResultadoPurga("");
      setError(err instanceof Error ? err.message : "Error al ejecutar la purga.");
    } finally {
      setPurgando(false);
      setConfirmandoPurga(false);
    }
  };

  return (
    <div className="stack">
      {error && <ErrorAlerta mensaje={error} />}

      <div className="panel">
        <h2 className="panel-title">Estado del backend</h2>
        {!estado ? (
          <Spinner texto="Consultando estado…" />
        ) : (
          <div className="grid-datos">
            <div>
              <span className="dato-titulo">Estado</span>
              <span>
                <span className={`badge ${estado.status === "ok" ? "badge-ok" : "badge-err"}`}>
                  {estado.status === "ok" ? "Operativo" : estado.status}
                </span>
              </span>
            </div>
            <div>
              <span className="dato-titulo">Base de datos</span>
              <span>{estado.base_datos.conectada ? "Conectada" : "Sin conexión"}</span>
            </div>
            <div>
              <span className="dato-titulo">Registros en BD</span>
              <span>
                {estado.base_datos.ubicaciones.toLocaleString("es-AR")} ubicaciones ·{" "}
                {estado.base_datos.accesos.toLocaleString("es-AR")} accesos ·{" "}
                {estado.base_datos.consentimientos.toLocaleString("es-AR")} consentimientos
              </span>
            </div>
            <div>
              <span className="dato-titulo">Servidor</span>
              <span>
                IP pública {estado.servidor.ip_publica || "—"} · Geo: {estado.servidor.proveedor_geo}
              </span>
            </div>
            <div>
              <span className="dato-titulo">Versión API</span>
              <span>{estado.version_api}</span>
            </div>
            <div>
              <span className="dato-titulo">Última consulta</span>
              <span>{new Date(estado.timestamp.endsWith("Z") ? estado.timestamp : `${estado.timestamp}Z`).toLocaleString("es-AR")}</span>
            </div>
          </div>
        )}
        <button className="btn btn-ghost" onClick={cargar} disabled={!estado}>
          Actualizar estado
        </button>
      </div>

      <div className="panel">
        <h2 className="panel-title">Política de retención</h2>
        {!estado ? (
          <Spinner texto="Consultando retención…" />
        ) : (
          <div className="grid-datos">
            <div>
              <span className="dato-titulo">Accesos técnicos</span>
              <span>{estado.retencion.accesos_dias} días</span>
            </div>
            <div>
              <span className="dato-titulo">Ubicaciones</span>
              <span>{estado.retencion.ubicaciones_dias} días</span>
            </div>
            <div>
              <span className="dato-titulo">Consentimientos</span>
              <span>{estado.retencion.consentimientos_dias} días</span>
            </div>
            <div>
              <span className="dato-titulo">Logs</span>
              <span>{estado.retencion.logs_dias} días</span>
            </div>
          </div>
        )}
        <div className="fila-accion">
          {!confirmandoPurga ? (
            <button className="btn btn-peligro" onClick={() => setConfirmandoPurga(true)}>
              Ejecutar purga de retención
            </button>
          ) : (
            <div className="confirmar-purga">
              <span>¿Eliminar registros anteriores a la retención? Esta acción no se puede deshacer.</span>
              <div>
                <button className="btn btn-peligro" onClick={ejecutarPurga} disabled={purgando}>
                  {purgando ? "Purgando…" : "Sí, purgar"}
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirmandoPurga(false)} disabled={purgando}>
                  Cancelar
                </button>
              </div>
            </div>
          )}
          {resultadoPurga && <p className="ok-msg">{resultadoPurga}</p>}
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Configuración de conexión</h2>
        <form className="form-config" onSubmit={guardarConfig}>
          <label className="campo">
            <span>URL del backend</span>
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://oaf.pythonanywhere.com" />
          </label>
          <label className="campo">
            <span>Clave de administrador</span>
            <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="X-Admin-Key" autoComplete="off" />
          </label>
          <button className="btn btn-primary" type="submit">
            Guardar
          </button>
          {guardado && <p className="ok-msg">{guardado}</p>}
        </form>
      </div>
    </div>
  );
}
