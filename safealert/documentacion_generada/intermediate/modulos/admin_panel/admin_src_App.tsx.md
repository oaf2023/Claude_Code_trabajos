# Archivo: admin/src/App.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/App.tsx | 45 | TypeScript 5.9 / TSX (React 19) | 1846 | Componente raíz y definición de rutas (React Router 7) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Componente raíz de la aplicación web del panel de administración SafeAlert. Define el enrutador
`BrowserRouter` con todas las rutas de la aplicación y aplica un guardián de autenticación
(`RequiereAuth`) que impide renderizar las pantallas del panel cuando no existe una clave de
administrador almacenada localmente. Actúa como "puerta de entrada": si no hay clave, cualquier
ruta protegida redirige a `/login`.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Es el punto de montaje importado desde `main.tsx` (línea 15) y por tanto
se ejecuta siempre. No se detectaron referencias cruzadas adicionales porque es el nodo raíz de la
UI.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react-router-dom` (`BrowserRouter`, `Navigate`, `Outlet`, `Route`, `Routes`) | externa (React Router 7) | Líneas 28-43: enrutado y redirecciones | Sí |
| `./components/Layout` | interna | Línea 33: envuelve las rutas autenticadas con navegación lateral | Sí |
| `./pages/Login` | interna | Línea 31: ruta pública `/login` | Sí |
| `./pages/Dashboard` | interna | Línea 34: ruta `/` | Sí |
| `./pages/Usuarios` | interna | Línea 35: ruta `/usuarios` | Sí |
| `./pages/UsuarioDetalle` | interna | Línea 36: ruta `/usuarios/:usuarioId` | Sí |
| `./pages/PagoSimulado` | interna | Línea 37: ruta `/pagos-simulados` | Sí |
| `./pages/Admin` | interna | Línea 38: ruta `/admin` | Sí |
| `getAdminKey` de `../lib/api` | interna | Línea 24: comprueba existencia de la clave en `localStorage` | Sí |

## Componentes que dependen de este archivo

| Componente/archivo | Relación |
| --- | --- |
| `admin/src/main.tsx` | Lo importa (línea 15) y lo monta con `createRoot` |
| `admin/index.html` | Punto de entrada `type="module"` de `/src/main.tsx`, que a su vez monta `App` |

[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| (sin variables globales) | — | — | No hay constantes ni estado global en este archivo | — |

Toda la información de autenticación proviene de `getAdminKey()` (`admin/src/lib/api.ts`), que lee
la clave de `localStorage` bajo la clave `safealert_admin_key` (valor `[SECRETO OCULTO]`).

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| `RequiereAuth` | Función componente (guard) | 23-25 |
| `App` (exportada por defecto) | Función componente raíz | 27-45 |

No hay clases, interfaces ni hooks propios.

## Análisis línea por línea

Bloque 1 (líneas 1-11) — Cabecera documental del script:

```tsx
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
```

**Explicación de las líneas 1-11:**

Cabecera estándar del proyecto (comentario de bloque). Aporta información técnica relevante: la
autenticación del panel se basa en el encabezado HTTP `X-Admin-Key` y el login es la puerta de
entrada. Declara versión 1.0.0, autor y fecha, sin valor funcional.

Bloque 2 (líneas 13-21) — Importaciones:

```tsx
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import UsuarioDetalle from "./pages/UsuarioDetalle";
import PagoSimulado from "./pages/PagoSimulado";
import Admin from "./pages/Admin";
import { getAdminKey } from "./lib/api";
```

**Explicación de las líneas 13-21:**

- **Línea 13**: importa las piezas de React Router necesarias: `BrowserRouter` (historial HTML5),
  `Navigate` (redirección declarativa), `Outlet` (contenedor de rutas anidadas), `Route` y `Routes`.
- **Líneas 14-20**: importa el `Layout` compartido (barra lateral + encabezado) y las siete páginas
  del panel (Login, Dashboard, Usuarios, UsuarioDetalle, PagoSimulado, Admin). Todas son rutas
  relativas internas de la aplicación.
- **Línea 21**: importa el único acceso a la clave de administrador desde la capa de API.

Bloque 3 (líneas 23-45) — Guardián de autenticación y tabla de rutas:

```tsx
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
            <Route path="/pagos-simulados" element={<PagoSimulado />} />
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

**Explicación de las líneas 23-45:**

- **Línea 23-25** (`RequiereAuth`): si `getAdminKey()` devuelve un valor no vacío (existe clave en
  `localStorage`), renderiza el `Outlet` con las rutas hijas; si no, redirige con `Navigate` a
  `/login` con `replace` (no se acumula historial de la ruta denegada). La comprobación es solo de
  presencia local: no valida la clave contra el backend en este punto.
- **Línea 27**: declara el componente raíz `App` exportado por defecto.
- **Línea 29**: instancia `BrowserRouter`, que sincroniza la UI con la URL (historial HTML5).
- **Líneas 30-41**: árbol de rutas:
  - **Línea 31**: `/login` es la única ruta fuera del guardián (pública). El componente Login no se
    renderiza dentro del Layout.
  - **Líneas 32-40**: grupo protegido. `RequiereAuth` es una ruta "layout" sin `path` (línea 32)
    que envuelve a `Layout` (línea 33). Dentro del Layout se definen: `/` → Dashboard (línea 34),
    `/usuarios` → listado (línea 35), `/usuarios/:usuarioId` → detalle con parámetro dinámico
    (línea 36), `/pagos-simulados` → simulación de pagos (línea 37) y `/admin` → administración
    (línea 38). Las páginas se renderizan mediante `Outlet` dentro de `Layout`.
  - **Línea 41**: ruta comodín `*`: cualquier URL desconocida redirige a `/`.
- **Líneas 42-43**: cierre de `Routes` y `BrowserRouter`.

## Fichas de funciones y métodos

### RequiereAuth (líneas 23-25)

- Firma (código original): `function RequiereAuth() { return getAdminKey() ? <Outlet /> : <Navigate to="/login" replace />; }`
- Propósito técnico: componente guardián de React Router que condiciona el renderizado de las
  rutas hijas a la existencia de una clave de administrador en `localStorage`.
- Propósito funcional: impedir el acceso a las pantallas del panel sin haber iniciado sesión.
- Parámetros: ninguno. Retorno: JSX (`Outlet` o `Navigate`). Excepciones: no lanza.
- Dependencias: `getAdminKey()` (`lib/api.ts`). Flujo: se evalúa en cada navegación; si hay clave
  renderiza el contenido anidado, si no redirige a `/login`.
- Desde dónde se llama: declarativamente como ruta layout en `App` (línea 32).
- Efectos secundarios: ninguno directo. Riesgos: no distingue clave vacía de clave vencida; si la
  clave existe pero el backend la rechaza (401), el guardián no redirige a `/login` (las páginas
  muestran "Sesión expirada", ver páginas respectivas).

### App (líneas 27-45)

- Firma (código original): `export default function App() { ... }`
- Propósito técnico: raíz de la aplicación que instala `BrowserRouter` y define la tabla de rutas.
- Propósito funcional: orquestar la navegación pública/protegida del panel.
- Parámetros: ninguno. Retorno: JSX con el árbol de rutas. Excepciones: no lanza.
- Dependencias: React Router 7 y todos los componentes de páginas y `Layout`.
- Desde dónde se llama: `main.tsx` (línea 15-20), montada con `createRoot` y `StrictMode`.
- Efectos secundarios: ninguno. Riesgos: ninguno adicional a los del guardián.

## Clases / interfaces / tipos

No hay clases, interfaces ni tipos declarados en este archivo.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El guardián `RequiereAuth` solo verifica la existencia local de la clave
  (línea 24). No hay mecanismo central de expiración de sesión: cuando el backend devuelve 401 la
  UI no redirige automáticamente a `/login`; cada página debe gestionar el error por su cuenta.
  Impacto: UX inconsistente y potencial permanencia en pantallas con error de sesión.
- [OBSERVACIÓN TÉCNICA] No existe ruta específica de "no autorizado" ni manejo de la clave
  removida en tiempo real: si otro proceso borra `localStorage`, el guardián reaccionará en la
  siguiente navegación, no de forma inmediata.
- [NIVEL DE CERTEZA: Confirmado por código] Todas las rutas declaradas coinciden con componentes
  que efectivamente existen en `admin/src/pages/`.

## Seguridad

- [INFORMATIVO] La comprobación de autenticación ocurre solo en cliente y depende de la presencia
  de la clave en `localStorage`. La seguridad real la aporta el backend al exigir el encabezado
  `X-Admin-Key` en cada endpoint (ver `backend/flask_app.py`, decorador `require_admin_key`,
  líneas 576-585). Si la clave se almacena en `localStorage`, un XSS en cualquier página del panel
  podría extraerla.
- [MEDIO] Rutas protegidas por guardián de presencia, no de validez: un valor residual o corrupto
  en `localStorage` deja pasar al panel; las llamadas fallarán luego con 401 sin redirección
  automática a `/login`.
- [INFORMATIVO] No se observan secretos, tokens ni credenciales en este archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Sesión "caducada" sin cierre automático: recomendación de redirigir a `/login` y limpiar
  la clave ante un 401 centralizado (p. ej. en la capa `request` de `lib/api.ts`).
- [RECOMENDACIÓN] Considerar un contexto/sesión (p. ej. un `AuthProvider`) en lugar de consultar
  `localStorage` en cada render del guardián, para centralizar el estado de autenticación.
- [RECOMENDACIÓN] Proteger el almacenamiento de la clave (p. ej. HttpOnly + sesión de servidor) si
  el modelo de amenazas exige mitigar el robo por XSS; hoy la clave vive en `localStorage`.
