/* ============================================================================
 * Archivo         : Login.tsx
 * Descripción     : Pantalla de ingreso al panel admin. Solicita la clave
 *                   X-Admin-Key y la URL base de la API; valida contra
 *                   GET /api/v1/admin/stats antes de permitir el acceso.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Ruta /login
 * ========================================================================== */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBaseUrl, setAdminKey, setBaseUrl, fetchStats, ApiError } from "../lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [clave, setClave] = useState("");
  const [url, setUrl] = useState(getBaseUrl());
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const ingresar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!clave.trim()) {
      setError("Ingresá la clave de administrador.");
      return;
    }
    setCargando(true);
    try {
      setBaseUrl(url.trim() || "https://oaf.pythonanywhere.com");
      setAdminKey(clave.trim());
      await fetchStats();
      navigate("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Clave de administrador inválida.");
      } else {
        setError(err instanceof Error ? err.message : "No se pudo conectar con el backend.");
      }
      setAdminKey("");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={ingresar}>
        <div className="login-logo">
          <span className="sidebar-logo-mark">S</span>
          <h1>SafeAlert Admin</h1>
          <p>Panel de administración de posicionamientos</p>
        </div>
        <label className="campo">
          <span>URL del backend</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://oaf.pythonanywhere.com"
            autoComplete="url"
          />
        </label>
        <label className="campo">
          <span>Clave de administrador</span>
          <input
            type="password"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            placeholder="X-Admin-Key"
            autoComplete="current-password"
            autoFocus
          />
        </label>
        {error && (
          <div className="alerta-error" role="alert">
            {error}
          </div>
        )}
        <button className="btn btn-primary btn-block" type="submit" disabled={cargando}>
          {cargando ? "Verificando…" : "Ingresar"}
        </button>
        <p className="login-note">
          La clave se guarda solo en este navegador (localStorage) y se envía en el encabezado{" "}
          <code>X-Admin-Key</code>.
        </p>
      </form>
    </div>
  );
}
