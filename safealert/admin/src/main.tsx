/* ============================================================================
 * Archivo         : main.tsx
 * Descripción     : Punto de entrada de la aplicación admin de SafeAlert.
 *                   Monta la raíz de React con estrict mode.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : npm run dev / npm run build (ver index.html)
 * ========================================================================== */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
