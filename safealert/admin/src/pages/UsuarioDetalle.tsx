/* ============================================================================
 * Archivo         : UsuarioDetalle.tsx
 * Descripción     : Detalle de un usuario: datos de registro y suscripción,
 *                   última ubicación, historial de ubicaciones (tabla),
 *                   consentimientos y accesos técnicos.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Ruta /usuarios/:usuarioId
 * ========================================================================== */

import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  fetchAccesos,
  fetchConsentimientos,
  fetchUbicacionesUsuario,
  fetchUsuarios,
  ApiError,
  type AccesoTecnico,
  type Consentimiento,
  type UbicacionMapa,
  type UsuarioAdmin,
} from "../lib/api";
import { antiguedad, formatearCoordenada, formatearDistancia, formatearFecha, iniciales } from "../lib/format";
import { BadgeConsentimiento, BadgeEstadoSuscripcion, BadgeOrigen } from "../components/Badges";
import { ErrorAlerta, Spinner } from "../components/Alerta";

export default function UsuarioDetalle() {
  const { usuarioId = "" } = useParams();
  const [usuario, setUsuario] = useState<UsuarioAdmin | null>(null);
  const [ubicaciones, setUbicaciones] = useState<UbicacionMapa[]>([]);
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>([]);
  const [accesos, setAccesos] = useState<AccesoTecnico[]>([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const [lista, ubics, consents, acc] = await Promise.all([
        fetchUsuarios({ busqueda: usuarioId, limite: 1 }),
        fetchUbicacionesUsuario(usuarioId, 100),
        fetchConsentimientos(usuarioId),
        fetchAccesos(usuarioId, 50),
      ]);
      setUsuario(lista.usuarios.find((u) => u.device_id === usuarioId) ?? null);
      setUbicaciones(ubics);
      setConsentimientos(consents);
      setAccesos(acc);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Sesión expirada. Volvé a ingresar.");
      } else {
        setError(err instanceof Error ? err.message : "Error al cargar el detalle del usuario.");
      }
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  if (cargando) return <Spinner texto="Cargando detalle…" />;
  if (error) return <ErrorAlerta mensaje={error} />;
  if (!usuario) return <ErrorAlerta mensaje="Usuario no encontrado." />;

  return (
    <div className="stack">
      <Link to="/usuarios" className="volver">
        ← Volver a usuarios
      </Link>

      <div className="panel panel-usuario">
        <div className="celda-usuario grande">
          <span className="avatar avatar-grande">{iniciales(usuario.name)}</span>
          <div>
            <h2>{usuario.name}</h2>
            <p className="mono">{usuario.device_id}</p>
          </div>
        </div>
        <div className="grid-datos">
          <div>
            <span className="dato-titulo">Teléfono</span>
            <span>{usuario.phone || "—"}</span>
          </div>
          <div>
            <span className="dato-titulo">Registrado</span>
            <span>{formatearFecha(usuario.registered_at)}</span>
          </div>
          <div>
            <span className="dato-titulo">Suscripción</span>
            <span>
              <BadgeEstadoSuscripcion estado={usuario.subscription_status} />
              {usuario.plan_type && <small className="plan-tag">{usuario.plan_type}</small>}
            </span>
          </div>
          <div>
            <span className="dato-titulo">Vence</span>
            <span>{formatearFecha(usuario.subscription_expires_at)}</span>
          </div>
          <div>
            <span className="dato-titulo">Ubicaciones totales</span>
            <span>{usuario.total_ubicaciones.toLocaleString("es-AR")}</span>
          </div>
          <div>
            <span className="dato-titulo">Última ubicación</span>
            <span>
              {usuario.ultima_latitud != null ? (
                <>
                  <span className="mono">
                    {formatearCoordenada(usuario.ultima_latitud)}, {formatearCoordenada(usuario.ultima_longitud)}
                  </span>
                  <BadgeOrigen origen={usuario.ultimo_origen} />
                  <small>{antiguedad(usuario.ultima_fecha_hora)}</small>
                </>
              ) : (
                "sin datos"
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title">Historial de ubicaciones ({ubicaciones.length})</h2>
        {ubicaciones.length === 0 ? (
          <p className="sin-datos">Sin ubicaciones registradas.</p>
        ) : (
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha (servidor)</th>
                  <th>Coordenadas</th>
                  <th>Origen</th>
                  <th>Precisión</th>
                  <th>Permiso</th>
                  <th>Dirección</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {ubicaciones.map((u) => (
                  <tr key={u.id}>
                    <td>{formatearFecha(u.fecha_hora_servidor)}</td>
                    <td className="mono">
                      {u.latitud != null ? `${formatearCoordenada(u.latitud)}, ${formatearCoordenada(u.longitud)}` : "—"}
                    </td>
                    <td>
                      <BadgeOrigen origen={u.origen} />
                    </td>
                    <td>{formatearDistancia(u.precision_metros)}</td>
                    <td>{u.permiso_ubicacion ?? "—"}</td>
                    <td>{u.direccion_confirmada || u.direccion_estimada || "—"}</td>
                    <td className="mono">{u.ip ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid-2">
        <div className="panel">
          <h2 className="panel-title">Consentimientos ({consentimientos.length})</h2>
          {consentimientos.length === 0 ? (
            <p className="sin-datos">Sin consentimientos registrados.</p>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Permiso</th>
                    <th>Estado</th>
                    <th>Versión política</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {consentimientos.map((c) => (
                    <tr key={c.id}>
                      <td>{c.tipo_permiso}</td>
                      <td>
                        <BadgeConsentimiento estado={c.estado} />
                      </td>
                      <td>{c.version_politica ?? "—"}</td>
                      <td>{formatearFecha(c.fecha_hora)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <h2 className="panel-title">Accesos técnicos ({accesos.length})</h2>
          {accesos.length === 0 ? (
            <p className="sin-datos">Sin accesos registrados.</p>
          ) : (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>IP</th>
                    <th>Ruta</th>
                    <th>Dispositivo</th>
                    <th>SO</th>
                    <th>Ubicación IP</th>
                  </tr>
                </thead>
                <tbody>
                  {accesos.map((a) => (
                    <tr key={a.id}>
                      <td>{formatearFecha(a.fecha_hora)}</td>
                      <td className="mono">{a.ip ?? "—"}</td>
                      <td className="mono">{a.ruta_consultada ?? "—"}</td>
                      <td>{a.tipo_dispositivo ?? a.navegador_aproximado ?? "—"}</td>
                      <td>{a.sistema_operativo_aproximado ?? "—"}</td>
                      <td>
                        {[a.pais_ip, a.ciudad_ip].filter(Boolean).join(", ") || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
