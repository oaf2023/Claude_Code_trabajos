/* ============================================================================
 * Archivo         : Layout.tsx
 * Descripción     : Layout principal del dashboard con barra lateral de
 *                   navegación (Dashboard, Usuarios, Administración) y
 *                   encabezado con estado del backend.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Envuelve las rutas autenticadas de la aplicación
 * ========================================================================== */

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearAdminKey, fetchEstado, type EstadoSistema } from "../lib/api";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "◈" },
  { to: "/usuarios", label: "Usuarios", icon: "👥" },
  { to: "/admin", label: "Administración", icon: "⚙" },
];

export default function Layout() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<EstadoSistema | null>(null);
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    let activo = true;
    const cargar = () => {
      fetchEstado()
        .then((e) => {
          if (!activo) return;
          setEstado(e);
          setOnline(true);
        })
        .catch(() => {
          if (!activo) return;
          setOnline(false);
        });
    };
    cargar();
    const timer = window.setInterval(cargar, 60_000);
    return () => {
      activo = false;
      window.clearInterval(timer);
    };
  }, []);

  const cerrarSesion = () => {
    clearAdminKey();
    navigate("/login");
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="sidebar-logo-mark">S</span>
          <div>
            <strong>SafeAlert</strong>
            <small>Panel Admin</small>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `nav-item${isActive ? " nav-item-active" : ""}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className={`dot${online === false ? " dot-red" : online === true ? " dot-green" : " dot-gray"}`} />
          <span>{online === false ? "Backend sin conexión" : online === true ? "Backend conectado" : "Verificando…"}</span>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="topbar-title">Administración de Posicionamientos</h1>
            <p className="topbar-subtitle">
              {estado
                ? `API v${estado.version_api} · ${estado.base_datos.ubicaciones} ubicaciones · ${estado.base_datos.accesos} accesos`
                : "Cargando estado del backend…"}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={cerrarSesion}>
            Salir
          </button>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
