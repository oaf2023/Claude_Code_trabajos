/* ============================================================================
 * Archivo         : Dashboard.tsx
 * Descripción     : Pantalla principal con KPIs y gráficos: tarjetas de
 *                   métricas, donut por origen, línea de actividad diaria
 *                   (30 días), barras por dispositivo y estado de
 *                   suscripciones / consentimientos.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19 / Recharts
 * Uso             : Ruta /
 * ========================================================================== */

import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchStats, ApiError, type StatsAdmin } from "../lib/api";
import { ESTADO_CONSENTIMIENTO_LABEL, ORIGEN_COLOR, ORIGEN_LABEL } from "../lib/format";
import KpiCard from "../components/KpiCard";
import { ErrorAlerta, Spinner } from "../components/Alerta";

const ORIGENES = ["GPS", "NAVEGADOR", "IP", "MANUAL"];

export default function Dashboard() {
  const [stats, setStats] = useState<StatsAdmin | null>(null);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    setError("");
    fetchStats()
      .then(setStats)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError("Sesión expirada. Volvé a ingresar.");
        } else {
          setError(err instanceof Error ? err.message : "Error al cargar estadísticas.");
        }
      });
  }, []);

  useEffect(() => {
    cargar();
    const timer = window.setInterval(cargar, 60_000);
    return () => window.clearInterval(timer);
  }, [cargar]);

  if (error && !stats) return <ErrorAlerta mensaje={error} />;
  if (!stats) return <Spinner texto="Cargando estadísticas…" />;

  const k = stats.kpis;
  const origenData = ORIGENES.map((origen) => ({
    name: ORIGEN_LABEL[origen],
    value: stats.ubicaciones_por_origen.find((o) => o.origen === origen)?.c ?? 0,
  })).filter((o) => o.value > 0);
  const origenTotal = origenData.reduce((acc, o) => acc + o.value, 0);
  const diaData = stats.ubicaciones_por_dia.map((d) => ({
    dia: d.dia.slice(8, 10) + "/" + d.dia.slice(5, 7),
    ubicaciones: d.c,
  }));
  const dispositivoData = stats.accesos_por_dispositivo.map((d) => ({
    name: d.tipo_dispositivo || "desconocido",
    accesos: d.c,
  }));
  const suscripcionData = stats.usuarios_por_estado_suscripcion.map((s) => ({
    name: s.subscription_status,
    usuarios: s.c,
  }));
  const consentimientoData = stats.consentimientos_por_estado.map((c) => ({
    name: ESTADO_CONSENTIMIENTO_LABEL[c.estado] ?? c.estado,
    valor: c.c,
  }));
  const permisoData = stats.ubicaciones_por_permiso.map((p) => ({
    name: p.permiso_ubicacion,
    valor: p.c,
  }));

  return (
    <div className="stack">
      <section className="grid-kpis">
        <KpiCard titulo="Usuarios registrados" valor={k.total_usuarios} detalle={`${k.usuarios_activos_7d} activos (7 días)`} color="#3b82f6" />
        <KpiCard titulo="Usuarios activos 24 h" valor={k.usuarios_activos_24h} detalle="con ubicación en el último día" color="#22c55e" />
        <KpiCard titulo="Ubicaciones registradas" valor={k.total_ubicaciones} detalle={`${k.ubicaciones_24h} en las últimas 24 h`} color="#f59e0b" />
        <KpiCard titulo="Accesos técnicos" valor={k.total_accesos} detalle={`${k.accesos_24h} en las últimas 24 h`} color="#8b5cf6" />
        <KpiCard titulo="Consentimientos" valor={k.total_consentimientos} detalle="otorgados / revocados" color="#ec4899" />
      </section>

      <section className="grid-2">
        <div className="panel">
          <h2 className="panel-title">Ubicaciones por origen</h2>
          {origenTotal === 0 ? (
            <p className="sin-datos">Sin ubicaciones registradas.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={origenData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {origenData.map((o) => (
                    <Cell key={o.name} fill={ORIGEN_COLOR[o.name.toUpperCase()] ?? "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [Number(v).toLocaleString("es-AR"), "ubicaciones"]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel">
          <h2 className="panel-title">Actividad diaria de ubicaciones (30 días)</h2>
          {diaData.length === 0 ? (
            <p className="sin-datos">Sin actividad en los últimos 30 días.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={diaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b3445" />
                <XAxis dataKey="dia" tick={{ fill: "#8ea0b8", fontSize: 11 }} tickMargin={6} minTickGap={24} />
                <YAxis tick={{ fill: "#8ea0b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="ubicaciones" stroke="#3b82f6" strokeWidth={2} dot={false} name="Ubicaciones" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid-2">
        <div className="panel">
          <h2 className="panel-title">Accesos por tipo de dispositivo</h2>
          {dispositivoData.length === 0 ? (
            <p className="sin-datos">Sin accesos registrados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dispositivoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b3445" />
                <XAxis dataKey="name" tick={{ fill: "#8ea0b8", fontSize: 11 }} tickMargin={6} />
                <YAxis tick={{ fill: "#8ea0b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="accesos" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Accesos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel">
          <h2 className="panel-title">Usuarios por estado de suscripción</h2>
          {suscripcionData.length === 0 ? (
            <p className="sin-datos">Sin usuarios registrados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={suscripcionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b3445" />
                <XAxis dataKey="name" tick={{ fill: "#8ea0b8", fontSize: 11 }} tickMargin={6} />
                <YAxis tick={{ fill: "#8ea0b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="usuarios" fill="#22c55e" radius={[4, 4, 0, 0]} name="Usuarios" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      <section className="grid-2">
        <div className="panel">
          <h2 className="panel-title">Consentimientos por estado</h2>
          {consentimientoData.length === 0 ? (
            <p className="sin-datos">Sin consentimientos registrados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={consentimientoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b3445" />
                <XAxis dataKey="name" tick={{ fill: "#8ea0b8", fontSize: 11 }} tickMargin={6} />
                <YAxis tick={{ fill: "#8ea0b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="valor" fill="#ec4899" radius={[4, 4, 0, 0]} name="Registros" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="panel">
          <h2 className="panel-title">Estado del permiso de ubicación</h2>
          {permisoData.length === 0 ? (
            <p className="sin-datos">Sin ubicaciones registradas.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={permisoData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2b3445" />
                <XAxis dataKey="name" tick={{ fill: "#8ea0b8", fontSize: 11 }} tickMargin={6} />
                <YAxis tick={{ fill: "#8ea0b8", fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="valor" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Registros" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}

const tooltipStyle = {
  backgroundColor: "#111827",
  border: "1px solid #2b3445",
  borderRadius: 8,
  color: "#e5e7eb",
  fontSize: 12,
};
