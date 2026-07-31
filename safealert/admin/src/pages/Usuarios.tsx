/* ============================================================================
 * Archivo         : Usuarios.tsx
 * Descripción     : Listado de usuarios con búsqueda por nombre/device/tel,
 *                   filtro por plan y tabla con última ubicación, origen,
 *                   antigüedad y estado de suscripción. Navega al detalle.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Ruta /usuarios
 * ========================================================================== */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUsuarios, ApiError, type UsuarioAdmin } from "../lib/api";
import { antiguedad, formatearCoordenada, iniciales } from "../lib/format";
import { BadgeEstadoSuscripcion, BadgeOrigen } from "../components/Badges";
import { ErrorAlerta, Spinner } from "../components/Alerta";

const PLANES = ["", "monthly", "annual"];

export default function Usuarios() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [plan, setPlan] = useState("");
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async (busquedaActual: string, planActual: string) => {
    setCargando(true);
    setError("");
    try {
      const data = await fetchUsuarios({
        busqueda: busquedaActual || undefined,
        plan: planActual || undefined,
        limite: 300,
      });
      setUsuarios(data.usuarios);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Sesión expirada. Volvé a ingresar.");
      } else {
        setError(err instanceof Error ? err.message : "Error al cargar usuarios.");
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar(busqueda, plan);
  }, [cargar, busqueda, plan]);

  return (
    <div className="stack">
      <div className="panel">
        <div className="filtros">
          <input
            className="input"
            type="search"
            placeholder="Buscar por nombre, dispositivo o teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select className="input input-select" value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Filtrar por plan">
            {PLANES.map((p) => (
              <option key={p} value={p}>
                {p === "" ? "Todos los planes" : p === "monthly" ? "Plan mensual" : "Plan anual"}
              </option>
            ))}
          </select>
          <span className="contador">{total.toLocaleString("es-AR")} resultado{total === 1 ? "" : "s"}</span>
        </div>
        {error ? (
          <ErrorAlerta mensaje={error} />
        ) : cargando ? (
          <Spinner texto="Cargando usuarios…" />
        ) : usuarios.length === 0 ? (
          <p className="sin-datos">No se encontraron usuarios.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Teléfono</th>
                  <th>Suscripción</th>
                  <th>Última ubicación</th>
                  <th>Origen</th>
                  <th>Antigüedad</th>
                  <th>Total ubic.</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.device_id} className="fila-click" onClick={() => navigate(`/usuarios/${encodeURIComponent(u.device_id)}`)}>
                    <td>
                      <div className="celda-usuario">
                        <span className="avatar">{iniciales(u.name)}</span>
                        <div>
                          <strong>{u.name}</strong>
                          <small className="mono">{u.device_id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{u.phone || "—"}</td>
                    <td>
                      <BadgeEstadoSuscripcion estado={u.subscription_status} />
                      {u.plan_type && <small className="plan-tag">{u.plan_type}</small>}
                    </td>
                    <td>
                      {u.ultima_latitud != null ? (
                        <span className="mono">
                          {formatearCoordenada(u.ultima_latitud)}, {formatearCoordenada(u.ultima_longitud)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <BadgeOrigen origen={u.ultimo_origen} />
                    </td>
                    <td>{u.ultima_fecha_hora ? antiguedad(u.ultima_fecha_hora) : "sin datos"}</td>
                    <td>{u.total_ubicaciones.toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
