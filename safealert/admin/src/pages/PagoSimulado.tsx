/* ============================================================================
 * Archivo         : PagoSimulado.tsx
 * Descripción     : Generación de pagos simulados (pruebas) desde el panel
 *                   admin. Permite buscar usuarios por dirección MAC,
 *                   seleccionar uno y activar su suscripción con un pago
 *                   simulado: genera ticket correlativo y registra el evento
 *                   sin cobro real (no toca MercadoPago).
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-08-01
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Ruta /pagos-simulados
 * ========================================================================== */

import { useCallback, useEffect, useState } from "react";
import {
  fetchUsuarios,
  simularPago,
  ApiError,
  type ResultadoPagoSimulado,
  type UsuarioAdmin,
} from "../lib/api";
import { formatearFecha, iniciales } from "../lib/format";
import { BadgeEstadoSuscripcion } from "../components/Badges";
import { ErrorAlerta } from "../components/Alerta";

type PlanType = "monthly" | "annual";

export default function PagoSimulado() {
  const [mac, setMac] = useState("");
  const [plan, setPlan] = useState<PlanType>("monthly");
  const [dias, setDias] = useState<number>(0);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [buscando, setBuscando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState("");
  const [seleccionado, setSeleccionado] = useState<UsuarioAdmin | null>(null);
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoPagoSimulado | null>(null);

  const buscar = useCallback(async (macActual: string) => {
    setError("");
    setResultado(null);
    setSeleccionado(null);
    if (!macActual.trim()) {
      setUsuarios([]);
      setBuscado(false);
      return;
    }
    setBuscando(true);
    try {
      const data = await fetchUsuarios({ mac: macActual.trim(), limite: 100 });
      setUsuarios(data.usuarios);
      setTotal(data.total);
      setBuscado(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Sesión expirada. Volvé a ingresar.");
      } else {
        setError(err instanceof Error ? err.message : "Error al buscar por MAC.");
      }
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    if (buscado && !seleccionado && usuarios.length > 0) {
      setSeleccionado(usuarios[0]);
    }
  }, [buscado, seleccionado, usuarios]);

  const generar = async () => {
    if (!seleccionado) return;
    setGenerando(true);
    setError("");
    setResultado(null);
    try {
      const res = await simularPago({
        device_id: seleccionado.device_id,
        plan_type: plan,
        dias: dias || undefined,
      });
      setResultado(res);
      setSeleccionado((prev) =>
        prev
          ? {
              ...prev,
              subscription_status: res.usuario.subscription_status,
              plan_type: res.usuario.plan_type,
              subscription_expires_at: res.usuario.subscription_expires_at,
            }
          : prev
      );
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Sesión expirada. Volvé a ingresar.");
      } else {
        setError(err instanceof Error ? err.message : "Error al generar el pago simulado.");
      }
    } finally {
      setGenerando(false);
    }
  };

  const MAC_LABEL: Record<PlanType, string> = {
    monthly: "Plan mensual — $7.500 ARS",
    annual: "Plan anual — $75.000 ARS",
  };

  return (
    <div className="stack">
      <div className="panel">
        <h2 className="panel-title">Pago simulado por MAC</h2>
        <p className="panel-sub">
          Buscá un usuario por dirección MAC, seleccionalo y generá un pago simulado
          para activar su suscripción sin cobro real (herramienta de pruebas).
        </p>

        <form
          className="form-config"
          onSubmit={(e) => {
            e.preventDefault();
            void buscar(mac);
          }}
        >
          <label className="campo">
            <span>Dirección MAC</span>
            <input
              type="text"
              value={mac}
              onChange={(e) => setMac(e.target.value)}
              placeholder="AA:BB:CC:DD:EE:FF"
              className="mono"
              autoComplete="off"
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={buscando || !mac.trim()}>
            {buscando ? "Buscando…" : "Buscar por MAC"}
          </button>
        </form>

        {error && <ErrorAlerta mensaje={error} />}

        {buscado && !buscando && (
          <p className="contador">
            {total.toLocaleString("es-AR")} usuario{total === 1 ? "" : "s"} con esa MAC
          </p>
        )}
      </div>

      {buscado && !buscando && usuarios.length > 0 && (
        <div className="panel">
          <h2 className="panel-title">Seleccionar usuario</h2>
          <div className="lista-seleccion">
            {usuarios.map((u) => (
              <button
                key={u.device_id}
                type="button"
                className={`item-seleccion${seleccionado?.device_id === u.device_id ? " item-seleccion-active" : ""}`}
                onClick={() => {
                  setSeleccionado(u);
                  setResultado(null);
                }}
              >
                <span className="avatar">{iniciales(u.name)}</span>
                <span className="item-seleccion-body">
                  <strong>{u.name}</strong>
                  <small className="mono">{u.device_id}</small>
                  <small className="mono">{u.mac_address || "sin MAC"}</small>
                </span>
                <span>
                  <BadgeEstadoSuscripcion estado={u.subscription_status} />
                  {u.plan_type && <small className="plan-tag">{u.plan_type}</small>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {buscado && !buscando && usuarios.length === 0 && (
        <div className="panel">
          <p className="sin-datos">No se encontraron usuarios con esa MAC.</p>
        </div>
      )}

      {seleccionado && (
        <div className="panel">
          <h2 className="panel-title">
            Generar pago simulado para {seleccionado.name}
          </h2>
          <div className="grid-datos">
            <div>
              <span className="dato-titulo">Dispositivo</span>
              <span className="mono">{seleccionado.device_id}</span>
            </div>
            <div>
              <span className="dato-titulo">MAC</span>
              <span className="mono">{seleccionado.mac_address || "—"}</span>
            </div>
            <div>
              <span className="dato-titulo">Suscripción</span>
              <span>
                <BadgeEstadoSuscripcion estado={seleccionado.subscription_status} />
              </span>
            </div>
            <div>
              <span className="dato-titulo">Vence</span>
              <span>{formatearFecha(seleccionado.subscription_expires_at)}</span>
            </div>
          </div>

          <div className="form-config">
            <label className="campo">
              <span>Plan</span>
              <select
                className="input input-select"
                value={plan}
                onChange={(e) => setPlan(e.target.value as PlanType)}
                aria-label="Plan de pago simulado"
              >
                <option value="monthly">Mensual — $7.500 ARS</option>
                <option value="annual">Anual — $75.000 ARS</option>
              </select>
            </label>
            <label className="campo">
              <span>Duración (días) — vacío = 32 mensual / 380 anual</span>
              <input
                type="number"
                min={1}
                max={3650}
                value={dias || ""}
                onChange={(e) => setDias(e.target.value === "" ? 0 : Number(e.target.value))}
                placeholder="Automático"
              />
            </label>
            <button className="btn btn-peligro" type="button" onClick={generar} disabled={generando}>
              {generando ? "Generando…" : `✅ Generar pago simulado (${MAC_LABEL[plan]})`}
            </button>
          </div>
        </div>
      )}

      {resultado && (
        <div className="panel">
          <h2 className="panel-title">Pago simulado generado</h2>
          <div className="grid-datos">
            <div>
              <span className="dato-titulo">N° de ticket</span>
              <span className="mono">#{String(resultado.ticket.ticket_number).padStart(6, "0")}</span>
            </div>
            <div>
              <span className="dato-titulo">Fecha</span>
              <span>
                {resultado.ticket.date} {resultado.ticket.time} UTC
              </span>
            </div>
            <div>
              <span className="dato-titulo">Plan</span>
              <span>{resultado.ticket.plan_type === "annual" ? "Anual" : "Mensual"}</span>
            </div>
            <div>
              <span className="dato-titulo">Monto</span>
              <span>${resultado.ticket.amount.toLocaleString("es-AR")} ARS</span>
            </div>
            <div>
              <span className="dato-titulo">Estado suscripción</span>
              <span>
                <BadgeEstadoSuscripcion estado={resultado.usuario.subscription_status} />
              </span>
            </div>
            <div>
              <span className="dato-titulo">Vence</span>
              <span>{formatearFecha(resultado.usuario.subscription_expires_at)}</span>
            </div>
          </div>
          <p className="ok-msg">La app de ese dispositivo reflejará la suscripción activa al consultar su estado.</p>
        </div>
      )}
    </div>
  );
}
