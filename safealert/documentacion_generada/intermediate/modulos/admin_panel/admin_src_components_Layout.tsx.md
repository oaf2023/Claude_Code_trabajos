# Archivo: admin/src/components/Layout.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/components/Layout.tsx | 105 | TypeScript 5.9 / React 19 (TSX) | 3532 | Componente de layout (estructura + navegación + estado del backend) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Es el layout maestro que envuelve las rutas autenticadas de la aplicación React
Router. Compone una barra lateral (sidebar) con la navegación principal (Dashboard,
Usuarios, Pagos simulados, Administración), un encabezado superior (topbar) que
muestra el estado del backend consultado periódicamente, un botón de cierre de
sesión y un contenedor `<Outlet />` donde se renderiza la ruta hija activa.
Coordina autenticación local (borrado de la clave admin) y telemetría mínima del
estado del servidor.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Se importa únicamente en `App.tsx` (línea 14:
`import Layout from "./components/Layout";`) y actúa como envoltorio de las rutas
protegidas. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `NavLink`, `Outlet`, `useNavigate` de `react-router-dom` | externa (dependencia en package.json) | `NavLink` líneas 68-77; `Outlet` línea 100; `useNavigate` línea 25 y 53 | Sí |
| `useEffect`, `useState` de `react` | estándar (React) | Líneas 25-49 (estado `estado`, `online`; efecto de polling) | Sí |
| `clearAdminKey`, `fetchEstado`, `type EstadoSistema` de `../lib/api` | interna | `clearAdminKey` línea 52; `fetchEstado` línea 32; `EstadoSistema` líneas 26 y 91 | Sí |

## Componentes que dependen de este archivo

- `App.tsx` (línea 14): único consumidor real hallado por grep en `admin/src`.
  [NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `NAV_ITEMS` | `[{ to: "/", label: "Dashboard", icon: "◈" }, { to: "/usuarios", ... }, { to: "/pagos-simulados", ... }, { to: "/admin", ... }]` | `Array<{ to: string; label: string; icon: string }>` | Define las entradas del menú lateral con su ruta, etiqueta e icono | Líneas 17-22 |
| `60_000` | 60000 ms = 1 min | number | Intervalo de refresco del estado del backend | Línea 44 |
| `"S"` | letra logo | string | Marca visual del logo de la sidebar | Línea 60 |

Significado de iconos (valores mágicos Unicode/emoji): `"◈"` (Dashboard), `"👥"`
(Usuarios), `"💳"` (Pagos simulados), `"⚙"` (Administración). [NIVEL DE CERTEZA:
Confirmado por código]

## Estructura (funciones / clases / tipos)

- `const NAV_ITEMS` — datos de navegación (no exportado, módulo interno).
- `Layout()` — componente funcional exportado por defecto.
- Estados internos: `estado` (`EstadoSistema | null`), `online` (`boolean | null`).
- Funciones internas: `cargar` (callback de consulta, definido dentro del efecto),
  `cerrarSesion`.
- Hooks usados: `useNavigate`, `useState`, `useEffect`, y los hooks de React Router
  `NavLink`/`Outlet` como componentes.

## Análisis línea por línea

```tsx
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
```

**Explicación de las líneas 1–10:**

Cabecera documental del proyecto; sin lógica.

- **Línea 6**: fecha 2026-07-31 (futura; coherente con el repositorio).

```tsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { clearAdminKey, fetchEstado, type EstadoSistema } from "../lib/api";
```

**Explicación de las líneas 13–15:**

Importaciones: `NavLink` (enlaces con estado activo), `Outlet` (renders de la ruta
anidada), `useNavigate` (navegación programática) de react-router-dom v7; `useEffect`
y `useState` de React; y del cliente API interno `clearAdminKey`, `fetchEstado` y el
tipo `EstadoSistema`.

- **Línea 13**: importa tres símbolos de react-router-dom.
- **Línea 14**: hooks de estado/efectos de React.
- **Línea 15**: funciones de sesión y consulta de estado del backend.

```tsx
const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "◈" },
  { to: "/usuarios", label: "Usuarios", icon: "👥" },
  { to: "/pagos-simulados", label: "Pagos simulados", icon: "💳" },
  { to: "/admin", label: "Administración", icon: "⚙" },
];
```

**Explicación de las líneas 17–22:**

Define la lista de enlaces del menú. Cada item declara la ruta, la etiqueta visible
y un icono (Unicode/emoji). Se itera en el JSX (línea 67) para no repetir markup.

- **Línea 18**: ruta raíz `/` (Dashboard); requiere `end` en el `NavLink` para no
  marcar activa todas las rutas (ver línea 71).
- **Línea 20**: `/pagos-simulados` no aparece en el comentario de cabecera del
  archivo (que menciona solo tres secciones), pero sí está en el menú; el
  comentario de cabecera está desactualizado. [NOTA]

```tsx
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
```

**Explicación de las líneas 24–49:**

Lógica de estado y ciclo de vida. `navigate` permite redirigir al login al cerrar
sesión. `estado` guarda la última respuesta de `/estado` del backend y `online` es
una bandera de tres estados: `null` (verificando), `true` (conectado), `false`
(sin conexión).

El `useEffect` (dependencias vacías, se ejecuta una vez al montar) define la bandera
`activo` para evitar actualizar estado de un componente desmontado, crea `cargar`
que invoca `fetchEstado()` y actualiza los estados según éxito o fallo, lo ejecuta
inmediatamente (`cargar()`) y programa un `setInterval` de 60 000 ms (1 minuto)
para reconsultar. La función de limpieza del efecto marca `activo = false` y
cancela el temporizador, evitando fugas de memoria y llamadas tras el desmontaje.

- **Línea 25**: obtiene la función de navegación de react-router.
- **Línea 26**: estado con la información del backend (o `null` mientras carga).
- **Línea 27**: bandera de conectividad de tres valores.
- **Línea 29**: efecto que corre una sola vez al montar (array vacío).
- **Línea 30**: guarda de desmontaje.
- **Línea 31**: define `cargar` (consulta el estado del sistema).
- **Líneas 32-37**: éxito: si el componente sigue montado, guarda la respuesta y
  marca online `true`.
- **Líneas 38-41**: fallo (red o HTTP no contemplado en promesa resuelta): marca
  online `false`. [NOTA] `fetchEstado` solo resuelve si la respuesta es ok
  (véase `request` en `api.ts`); los errores HTTP llegan por `.catch()`.
- **Línea 43**: primera consulta inmediata.
- **Línea 44**: temporizador de refresco cada 60 s.
- **Líneas 45-48**: limpieza al desmontar: inutiliza `activo` y limpia el intervalo.
- **Línea 49**: cierre del efecto con dependencias vacías.

```tsx
  const cerrarSesion = () => {
    clearAdminKey();
    navigate("/login");
  };
```

**Explicación de las líneas 51–54:**

`cerrarSesion` borra la clave de administrador del almacenamiento local
(`clearAdminKey()` de `lib/api.ts`, que elimina `localStorage.safealert_admin_key`)
y navega a `/login`. No hace llamada de invalidación al backend (la clave se
considera estática hasta que expire o se rote en el servidor).

- **Línea 52**: elimina la clave persistida del cliente.
- **Línea 53**: redirige al login.

```tsx
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
```

**Explicación de las líneas 56–83:**

Markup del sidebar. Contenedor `.layout` en flex; `.sidebar` fija de 230px (CSS).
Logo con la letra "S" sobre gradiente y texto "SafeAlert / Panel Admin". La
navegación itera `NAV_ITEMS` generando un `NavLink` por item: la prop `end` solo se
activa para la ruta raíz (evita que `/` quede activo en todas las rutas); la clase
se calcula con el callback `isActive` de React Router (activa añade
`nav-item-active`). El pie del sidebar muestra el indicador de conectividad:
`online === false` → punto rojo "Backend sin conexión"; `online === true` → punto
verde "Backend conectado"; `null` → punto gris "Verificando…". Los tres estados se
resuelven con ternarios anidados.

- **Línea 60**: letra del logo.
- **Líneas 61-64**: nombre del producto y subtítulo "Panel Admin".
- **Línea 67**: iteración sobre `NAV_ITEMS` para generar los enlaces.
- **Línea 70**: ruta destino del enlace.
- **Línea 71**: `end` solo en la raíz.
- **Línea 72**: clase condicional por estado activo.
- **Línea 74**: icono del item.
- **Línea 80**: clase del punto de estado según `online`.
- **Línea 81**: texto de estado del backend según `online`.

```tsx
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
```

**Explicación de las líneas 85–104:**

Columna principal `.main`: encabezado `.topbar` con el título "Administración de
Posicionamientos" y un subtítulo que, si hay estado cargado, muestra la versión de
la API (`estado.version_api`), el conteo de ubicaciones y accesos en base de datos;
si no hay estado aún, muestra "Cargando estado del backend…". A la derecha, botón
ghost "Salir" que dispara `cerrarSesion`. El contenido de la ruta activa se
renderiza en `<main className="content">` mediante `<Outlet />` de React Router
(los elementos anidados de la ruta protegida).

- **Línea 88**: título fijo del panel.
- **Líneas 90-92**: subtítulo dinámico con datos de `EstadoSistema` (template
  literal) o texto de carga.
- **Línea 95**: botón de salida con handler `cerrarSesion`.
- **Línea 100**: `Outlet` renderiza la ruta hija (pantalla activa).
- **Líneas 101-103**: cierre de estructura.

## Fichas de funciones y métodos

### Layout (líneas 24–104)

- Firma: `export default function Layout()` (sin props).
- Propósito técnico: componente contenedor que define el shell visual del panel y
  gestiona el estado global de conectividad y sesión en el lado del cliente.
- Propósito funcional: navegación entre secciones, indicador de salud del backend y
  cierre de sesión.
- Parámetros: ninguno.
- Retorno: JSX con estructura layout + `Outlet`. No lanza excepciones controladas.
- Dependencias: react-router-dom (NavLink/Outlet/useNavigate), React hooks,
  `lib/api.ts` (`fetchEstado`, `clearAdminKey`, tipo `EstadoSistema`), CSS de
  `index.css` (layout/sidebar/topbar/btn/dot).
- Flujo interno paso a paso:
  1. Obtiene `navigate`; inicializa `estado = null` y `online = null`.
  2. Al montar: consulta `fetchEstado`, agenda refresco cada 60 s, limpia al
     desmontar.
  3. `cerrarSesion` borra la clave y navega a `/login`.
  4. Renderiza sidebar + topbar + `Outlet`.
- Funciones que llama: `fetchEstado`, `clearAdminKey`, `navigate`. Desde dónde se
  llama: `App.tsx` como envoltorio de rutas.
- Efectos secundarios: escribe en `localStorage` (borrado de clave) al cerrar
  sesión; polling periódico al backend mientras esté montado.
- Riesgos: [BAJO] el polling no se pausa si la pestaña está en segundo plano (60 s
  constante). [INFORMATIVO] si `estado` quedara obsoleto entre peticiones fallidas,
  el subtítulo conserva la última respuesta aunque el punto muestre "sin conexión".

### cargar (líneas 31–42, función interna del efecto)

- Firma: `const cargar = () => { fetchEstado().then(...).catch(...) }`.
- Propósito técnico: envoltorio de consulta asíncrona del estado del backend.
- Propósito funcional: actualizar `estado` y `online`.
- Parámetros: ninguno. Retorno: `void` (promesa gestionada con `.then/.catch`).
- Excepciones: ninguna no controlada (fallos capturados por `.catch`).
- Dependencias: `fetchEstado`, `activo`, `setEstado`, `setOnline`.
- Efectos secundarios: actualización de estado de React.
- Riesgos: si `fetchEstado` nunca resolviera, `online` permanecería en `null`
  ("Verificando…") indefinidamente; comportamiento improbable por el manejo de
  errores de `request` en `api.ts`.

### cerrarSesion (líneas 51–54)

- Firma: `const cerrarSesion = () => { clearAdminKey(); navigate("/login"); }`.
- Propósito técnico: limpiar credencial local y redirigir.
- Propósito funcional: cerrar la sesión del operador.
- Parámetros: ninguno. Retorno: `void`.
- Efectos secundarios: elimina `localStorage.safealert_admin_key`; navegación.
- Riesgos: [BAJO] la clave puede seguir siendo válida en el servidor; sin
  revocación remota, si el navegador mantiene caché el acceso directo a una URL
  protegida dependerá de la protección por ruta de `App.tsx` (no analizado en este
  archivo).

## Clases / interfaces / tipos

- `EstadoSistema` (importada de `../lib/api`, no definida aquí): usada para tipar el
  estado del backend; sus campos son `status`, `timestamp`, `base_datos`
  (`conectada`, `ubicaciones`, `accesos`, `consentimientos`), `servidor`, `retencion`
  y `version_api` (definida en `api.ts` líneas 99-116).
- No se declaran clases, interfaces ni tipos propios en este archivo.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El comentario de cabecera (líneas 3-4) menciona solo
  "Dashboard, Usuarios, Administración" pero el menú incluye también
  "Pagos simulados" (`/pagos-simulados`); la cabecera está desactualizada respecto
  del código real. [NIVEL DE CERTEZA: Confirmado por código]
- [INFORMATIVO] Uso correcto del patrón `activo` (bandera de montaje) para evitar
  `setState` sobre componente desmontado y limpieza de intervalo: buena práctica.
- [INFORMATIVO] El indicador de conectividad mide solo el endpoint `/estado`; el
  resto de la API podría estar degradado sin que el punto cambie.

## Seguridad

- [BAJO] `clearAdminKey` elimina la clave del `localStorage` pero no revoca la
  clave en el servidor; si la clave se filtrara, seguiría siendo válida. La
  revocación es responsabilidad del backend (fuera del alcance de este archivo).
- [INFORMATIVO] El subtítulo expone datos operativos (versión de API, conteos) a
  cualquier operador autenticado; información no sensible.
- [INFORMATIVO] No se registran secretos en logs ni consola en este componente.
- [INFORMATIVO] El acceso a las rutas envueltas por `Layout` está presumiblemente
  protegido en `App.tsx`; la verificación de esa protección queda fuera de este
  archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Usar `visibilitychange` o backoff para pausar/ajustar el polling
  cuando la pestaña no esté visible y evitar tráfico innecesario.
- [RECOMENDACIÓN] Actualizar la cabecera del archivo para reflejar la sección
  "Pagos simulados".
- [RECOMENDACIÓN] Considerar revocación de la clave admin en el backend al cerrar
  sesión (endpoint de logout) para acortar la ventana de validez de claves
  filtradas.
- [RECOMENDACIÓN] Separar el indicador de conectividad a un hook propio
  (`useEstadoBackend`) para facilitar pruebas unitarias del polling.
