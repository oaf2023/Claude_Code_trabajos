/* ============================================================================
 * Archivo         : App.tsx
 * Descripción     : Definición de rutas del panel admin de SafeAlert.
 *                   Protege las pantallas detrás de autenticación por
 *                   X-Admin-Key (Login como puerta de entrada).
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19 / React Router 7
 * Uso             : Entrada principal de la aplicación (ver main.tsx)
 * ========================================================================== */

import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import UsuarioDetalle from "./pages/UsuarioDetalle";
import Admin from "./pages/Admin";
import { getAdminKey } from "./lib/api";

function RequiereAuth() {
  return getAdminKey() ? <Outlet /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<RequiereAuth />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/usuarios/:usuarioId" element={<UsuarioDetalle />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
