# Archivo: admin/src/index.css

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/index.css | 774 | CSS3 | 13195 | Hoja de estilos global del panel (tema oscuro, layout, componentes) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Hoja de estilos global única del dashboard admin (importada desde `main.tsx` según
la cabecera). Define un tema oscuro mediante variables CSS en `:root`, el layout
con sidebar/topbar/contenido, y estilos para botones, formularios, login, tarjetas
KPI, paneles, tablas, badges, filtros, alertas/spinners, detalle de usuario,
sección admin y media queries responsive. Todos los nombres de clase consumidos por
los componentes (`Layout.tsx`, `Alerta.tsx`, `Badges.tsx`, `KpiCard.tsx` y las
pantallas) están definidos aquí.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Se importa desde `src/main.tsx`
(`import "./index.css"`, típico de Vite); los estilos se aplican en toda la app.
Se verificó por grep que las clases usadas por los componentes analizados
(`alerta-error`, `spinner`, `badge*`, `kpi-*`, `layout`, `sidebar*`, `topbar`,
`nav-item*`, `dot*`, `btn*`) existen en este archivo. [NIVEL DE CERTEZA:
Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| (sin importaciones CSS) | — | — | CSS plano sin preprocesador; fuente del sistema (system-ui) sin `@import` externo | Sí |

## Componentes que dependen de este archivo

Prácticamente todos los archivos del panel referencian sus clases:

- `components/Layout.tsx`: `layout`, `sidebar`, `sidebar-logo(-mark)`,
  `sidebar-nav`, `nav-item(-active)`, `nav-icon`, `sidebar-footer`, `dot(-green/
  red/gray)`, `main`, `topbar(-title/-subtitle)`, `content`, `btn btn-ghost`.
- `components/Alerta.tsx`: `alerta-error`, `spinner-box`, `spinner`.
- `components/Badges.tsx`: `badge`, `badge-ok/warn/err/info/muted`, `badge-origen`.
- `components/KpiCard.tsx`: `kpi-card`, `kpi-accent`, `kpi-body`, `kpi-titulo`,
  `kpi-valor`, `kpi-detalle`.
- Pantallas (Login, Dashboard, Usuarios, UsuarioDetalle, PagoSimulado, Admin):
  `login-*`, `campo`, `input*`, `btn-*`, `grid-kpis`, `panel*`, `tabla*`,
  `fila-click`, `avatar*`, `celda-usuario`, `plan-tag`, `filtros`, `contador`,
  `volver`, `grid-datos`, `confirmar-purga`, `ok-msg`, `lista-seleccion`,
  `item-seleccion*`, `grid-2`, `sin-datos`, `form-config`, `mono`, `stack`,
  `fila-accion`. [NIVEL DE CERTEZA: Confirmado por código parcial — verificado con
  grep sobre componentes analizados]

## Variables globales y constantes

Variables CSS definidas en `:root` (líneas 13-26):

| Nombre | Valor | Tipo | Finalidad | Referencias de uso (líneas) |
| --- | --- | --- | --- | --- |
| `--bg` | `#0b1120` | color | Fondo general (azul muy oscuro) | 41, 268 |
| `--bg-panel` | `#111a2e` | color | Fondo de paneles/sidebar/topbar | 64, 182, 275, 363, 402 |
| `--bg-panel-2` | `#16213a` | color | Fondo elevado (hover, inputs, tablas) | 124, 245, 325, 433, 512, 554 |
| `--border` | `#243149` | color | Bordes | 65, 78, 120, 181, 241, 276, 326, 364, 405, 435, 492, 498, 555, 651 |
| `--texto` | `#e5e7eb` | color | Texto principal | 42, 125, 130, 244, 327, 437 |
| `--texto-suave` | `#8ea0b8` | color | Texto secundario | 51, 100, 118, 146, 194, 239, 296, 302, 318, 383, 395, 412, 467, 488, 558, 596, 622, 642, 665, 691, 698 |
| `--acento` | `#3b82f6` | color | Azul de acento/acciones | 85, 131, 229, 339, 445, 529, 592, 652 |
| `--verde` | `#22c55e` | color | Éxito/conectado | 157, 449, 572, 573, 728 |
| `--ambar` | `#f59e0b` | color | Advertencia | 578, 579 |
| `--rojo` | `#ef4444` | color | Error/peligro | 161, 249, 585, 586 |
| `--violeta` | `#8b5cf6` | color | Acento secundario/gradientes | 85, 529 |
| `--rosa` | `#ec4899` | color | KPI de consentimientos (uso en pantallas) | — (definida, consumida vía inline en Dashboard) |

Valores mágicos relevantes: `999px` (borde redondeado "píldora" de badges),
`860px` (breakpoint responsive), `60px`/`230px` (dimensiones de sidebar en modo
compacto/escritorio), `34px`/`48px` (avatares), `38px` (marca del logo),
`28px` (valor KPI), `5px` (barra de acento KPI).

## Estructura

Sin funciones/clases; organizada por secciones comentadas:
`:root` (variables), reset/base, `.mono`, Layout, Botones, Login, Formularios,
KPIs, Paneles, Selección de usuario, Tablas, Badges, Filtros, Alertas/spinners,
Detalle, Admin, y un `@media (max-width: 860px)` final.

## Análisis línea por línea

```css
/* ============================================================================
 * Archivo         : index.css
 * Descripción     : Hoja de estilos del dashboard admin de SafeAlert.
 *                   Tema oscuro, layout con sidebar, paneles, tablas,
 *                   gráficos, badges y formularios.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : CSS3
 * Uso             : Importado desde main.tsx
 * ========================================================================== */

:root {
  --bg: #0b1120;
  --bg-panel: #111a2e;
  --bg-panel-2: #16213a;
  --border: #243149;
  --texto: #e5e7eb;
  --texto-suave: #8ea0b8;
  --acento: #3b82f6;
  --verde: #22c55e;
  --ambar: #f59e0b;
  --rojo: #ef4444;
  --violeta: #8b5cf6;
  --rosa: #ec4899;
}
```

**Explicación de las líneas 1–26:**

Cabecera documental (1-11) y bloque `:root` (13-26) con 12 variables CSS del tema
oscuro: tres niveles de fondo, borde, dos tonos de texto, y la paleta semántica
(azul acento, verde, ámbar, rojo, violeta, rosa). Toda la hoja referencia estas
variables; re-tematizar implica cambiar solo este bloque. [NOTA] `--rosa` se usa
para el KPI "Consentimientos" vía prop `color` del Dashboard (inline) y no aparece
como `var(--rosa)` en la hoja; se definió para ser consumida en JSX.

- **Línea 13**: selector `:root` (equivalente a `html`), ámbito global.
- **Líneas 14-25**: definición de variables del tema.

```css
* {
  box-sizing: border-box;
}

html,
body,
#root {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

body {
  background: var(--bg);
  color: var(--texto);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.mono {
  font-family: "Cascadia Code", Consolas, "Courier New", monospace;
  font-size: 12px;
  color: var(--texto-suave);
}
```

**Explicación de las líneas 28–52:**

Base/reset. `box-sizing: border-box` universal evita que paddings desborden
layouts. Reset de márgenes en `html/body/#root` con altura mínima de viewport.
`body` fija fondo, texto, familia tipográfica del sistema y tamaño base 14px con
interlineado 1.5. `.mono` es la utilidad de texto monospace (direcciones MAC,
códigos) en 12px.

- **Líneas 28-30**: modelo de caja global.
- **Líneas 32-38**: reset de márgenes y altura mínima para anclar la app.
- **Líneas 40-46**: estilos base del cuerpo.
- **Líneas 48-52**: clase utilitaria `.mono`.

```css
/* ------------------------------ Layout ------------------------------ */

.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 230px;
  flex-shrink: 0;
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  border-bottom: 1px solid var(--border);
}

.sidebar-logo-mark {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--acento), var(--violeta));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 18px;
  color: #fff;
}

.sidebar-logo strong {
  display: block;
  font-size: 15px;
}

.sidebar-logo small {
  color: var(--texto-suave);
  font-size: 12px;
}

.sidebar-nav {
  flex: 1;
  padding: 14px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
```

**Explicación de las líneas 54–110:**

Estructura del layout (usa la clase `.layout` del `div` raíz de `Layout.tsx`).
`.layout` es flex en fila con altura mínima de viewport. `.sidebar` fija 230px,
pegajosa (sticky top 0) con altura completa, fondo panel y borde derecho.
`.sidebar-logo` es la franja superior del logo con separador; `.sidebar-logo-mark`
pinta el cuadro "S" con gradiente azul→violeta y texto blanco en negrita;
`.sidebar-logo strong/small` tipografían nombre y subtítulo. `.sidebar-nav`
contiene la navegación y ocupa el espacio sobrante con flex: 1.

- **Línea 57**: contenedor raíz flex.
- **Líneas 61-71**: sidebar fija y pegajosa (230px × 100vh).
- **Líneas 73-79**: fila del logo.
- **Líneas 81-92**: cuadro de la marca con gradiente de acento a violeta.
- **Líneas 94-102**: nombre del producto y subtítulo.
- **Líneas 104-110**: zona de navegación expansible.

```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--texto-suave);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--bg-panel-2);
  color: var(--texto);
}

.nav-item-active {
  background: var(--bg-panel-2);
  color: var(--texto);
  box-shadow: inset 3px 0 0 var(--acento);
}

.nav-icon {
  width: 20px;
  text-align: center;
  font-size: 15px;
}

.sidebar-footer {
  padding: 14px 16px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--texto-suave);
  font-size: 12px;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
}

.dot-green {
  background: var(--verde);
}

.dot-red {
  background: var(--rojo);
}

.dot-gray {
  background: #4b5563;
}
```

**Explicación de las líneas 112–167:**

Enlaces de navegación y pie del sidebar. `.nav-item` es un enlace flex con radio 8
y transición suave; hover eleva el fondo; `.nav-item-active` añade el indicador
lateral de 3px (box-shadow inset) en color acento — marca visual de la ruta
activa (asignada por `NavLink` de React Router). `.nav-icon` reserva 20px para el
icono. `.sidebar-footer` (franja inferior) y los puntos de estado `.dot`:
`.dot-green` (conectado), `.dot-red` (sin conexión), `.dot-gray` (verificando).
El gris `#4b5563` es un valor literal fuera de la paleta de variables.

- **Líneas 112-121**: enlace base de navegación.
- **Líneas 123-126**: hover.
- **Líneas 128-132**: estado activo con indicador inset.
- **Líneas 134-138**: columna del icono.
- **Líneas 140-148**: pie del sidebar.
- **Líneas 150-167**: indicador de estado (punto) y sus tres variantes de color.

```css
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 28px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
  position: sticky;
  top: 0;
  z-index: 10;
}

.topbar-title {
  margin: 0;
  font-size: 18px;
}

.topbar-subtitle {
  margin: 2px 0 0;
  color: var(--texto-suave);
  font-size: 12px;
}

.content {
  padding: 24px 28px;
  flex: 1;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
```

**Explicación de las líneas 169–208:**

Columna principal y encabezado. `.main` ocupa el resto del ancho en columna
(`min-width: 0` permite encoger contenido con tablas anchas). `.topbar` es el
encabezado pegajoso (sticky, z-index 10) que separa título a la izquierda y acción
a la derecha con `space-between`. `.content` es la zona de scroll con padding
generoso (24/28px). `.stack` es la utilidad de apilado vertical con separación de
18px.

- **Líneas 169-174**: columna principal.
- **Líneas 176-186**: barra superior pegajosa.
- **Líneas 188-197**: título y subtítulo del topbar.
- **Líneas 199-202**: zona de contenido.
- **Líneas 204-208**: contenedor de apilado.

```css
/* ------------------------------ Botones ------------------------------ */

.btn {
  border: none;
  border-radius: 8px;
  padding: 9px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s, background 0.15s;
  font-family: inherit;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--acento);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-ghost {
  background: transparent;
  color: var(--texto-suave);
  border: 1px solid var(--border);
}

.btn-ghost:hover:not(:disabled) {
  color: var(--texto);
  background: var(--bg-panel-2);
}

.btn-peligro {
  background: var(--rojo);
  color: #fff;
}

.btn-peligro:hover:not(:disabled) {
  filter: brightness(1.1);
}

.btn-block {
  width: 100%;
}
```

**Explicación de las líneas 210–259:**

Sistema de botones. `.btn` define la base (borde redondeado, tipografía heredada,
peso 600, cursor pointer) y el estado `:disabled` (opacidad 0.55 + cursor
`not-allowed`). Tres variantes: `.btn-primary` (fondo acento), `.btn-ghost`
(transparente con borde, usado en "Salir" del topbar y acciones secundarias) y
`.btn-peligro` (rojo, acciones destructivas como la purga). Hover con
`:not(:disabled)` (brillo 1.1 en rellenos, cambio de fondo en ghost). `.btn-block`
ocupa el 100 % del ancho (usado en el login). No hay estilos de foco visibles
(`:focus-visible`), detalle de accesibilidad.

- **Líneas 212-221**: base del botón.
- **Líneas 223-226**: estado deshabilitado.
- **Líneas 228-246**: primario y fantasma con hover.
- **Líneas 248-255**: botón de peligro.
- **Líneas 257-259**: botón de ancho completo.

```css
/* ------------------------------ Login ------------------------------ */

.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(1200px 600px at 50% -10%, #16213a 0%, var(--bg) 60%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.login-logo {
  text-align: center;
  margin-bottom: 6px;
}

.login-logo h1 {
  margin: 12px 0 4px;
  font-size: 20px;
}

.login-logo p {
  margin: 0;
  color: var(--texto-suave);
  font-size: 13px;
}

.login-note {
  margin: 0;
  color: var(--texto-suave);
  font-size: 11px;
  text-align: center;
}
```

**Explicación de las líneas 261–306:**

Pantalla de login. `.login-page` centra el contenido en la viewport con un fondo de
gradiente radial que ilumina la parte superior (usa el color `#16213a` — el mismo
valor que `--bg-panel-2` — literal). `.login-card` es la tarjeta centrada de hasta
400px con sombra profunda. `.login-logo` centra marca/título/descripción y
`.login-note` es la nota legal/menor al pie (letra 11px).

- **Líneas 263-270**: página centrada con gradiente radial decorativo.
- **Líneas 272-283**: tarjeta del formulario (máx. 400px, sombra).
- **Líneas 285-299**: bloque del logo.
- **Líneas 301-306**: nota menor.

```css
/* ------------------------------ Formularios ------------------------------ */

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.campo span {
  font-size: 12px;
  color: var(--texto-suave);
  font-weight: 600;
}

.input,
.campo input,
.campo select {
  background: var(--bg-panel-2);
  border: 1px solid var(--border);
  color: var(--texto);
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.input:focus,
.campo input:focus,
.campo select:focus {
  border-color: var(--acento);
}

.input-select {
  width: 190px;
}

.form-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 420px;
  align-items: flex-start;
}
```

**Explicación de las líneas 308–352:**

Formularios. `.campo` apila etiqueta (span) y control. Los selectores agrupados
`.input`, `.campo input`, `.campo select` comparten estilo de campo oscuro
(fondo `--bg-panel-2`, borde, radio 8, sin outline por defecto) y al recibir foco
cambian solo el color del borde al acento (`:focus`). `.input-select` fija ancho
190px para selects de filtro. `.form-config` es la columna del formulario de
configuración admin (máx. 420px).

- **Líneas 310-320**: agrupación campo + etiqueta.
- **Líneas 322-340**: estilos de entrada y foco.
- **Líneas 342-344**: select de ancho fijo.
- **Líneas 346-352**: formulario de configuración.

```css
/* ------------------------------ KPIs ------------------------------ */

.grid-kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.kpi-card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  display: flex;
  overflow: hidden;
}

.kpi-accent {
  width: 5px;
  flex-shrink: 0;
}

.kpi-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-titulo {
  color: var(--texto-suave);
  font-size: 12px;
  font-weight: 600;
}

.kpi-valor {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.kpi-detalle {
  color: var(--texto-suave);
  font-size: 12px;
}
```

**Explicación de las líneas 354–397:**

Tarjetas KPI del Dashboard. `.grid-kpis` coloca las tarjetas con `auto-fit` y
mínimo 200px (responsive sin media queries). `.kpi-card` es flex en fila con la
barra `.kpi-accent` (5px, color inline del componente) a la izquierda y
`.kpi-body` con el contenido. El `overflow: hidden` recorta el radio de la barra
de acento en las esquinas. Tipografías: `.kpi-titulo` pequeño suave, `.kpi-valor`
de 28px en peso 800 con letter-spacing negativo (impacto visual), `.kpi-detalle`
pequeño.

- **Líneas 356-360**: rejilla adaptativa de KPIs.
- **Líneas 362-368**: tarjeta.
- **Líneas 370-373**: barra de acento (5px).
- **Líneas 375-397**: cuerpo, título, valor y detalle.

```css
/* ------------------------------ Paneles ------------------------------ */

.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px;
}

.panel-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 700;
}

.panel-sub {
  margin: 0 0 14px;
  color: var(--texto-suave);
  font-size: 13px;
}
```

**Explicación de las líneas 399–418:**

Contenedores `.panel` (secciones del Dashboard/detalle) con `.panel-title` y
`.panel-sub` (subtítulo aclaratorio).

- **Líneas 401-406**: tarjeta contenedora.
- **Líneas 408-418**: título y subtítulo del panel.

```css
/* ------------------- Selección de usuario (pago simulado) ------------------- */

.lista-seleccion {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-seleccion {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  background: var(--bg-panel-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  color: var(--texto);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.item-seleccion:hover {
  border-color: var(--acento);
}

.item-seleccion-active {
  border-color: var(--verde);
  background: rgba(34, 197, 94, 0.08);
}

.item-seleccion-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 18px;
}

.sin-datos {
  color: var(--texto-suave);
  padding: 20px 0;
  text-align: center;
  margin: 0;
}
```

**Explicación de las líneas 420–471:**

Selector de usuario del flujo de pago simulado. `.lista-seleccion` apila los
candidatos; `.item-seleccion` es un botón de lista (ancho total, fondo elevado,
texto alineado a la izquierda, cursor pointer) con hover de borde acento y estado
`.item-seleccion-active` (borde verde + tinte verde translúcido) para el usuario
seleccionado. `.item-seleccion-body` distribuye el contenido. `.grid-2` es la
rejilla de dos columnas adaptativa (mínimo 420px por columna) para paneles
laterales; `.sin-datos` es el mensaje centrado cuando no hay resultados.

- **Líneas 422-426**: lista vertical.
- **Líneas 428-442**: ítem tipo botón.
- **Líneas 444-446**: hover.
- **Líneas 448-451**: ítem seleccionado.
- **Líneas 453-458**: cuerpo del ítem.
- **Líneas 460-464**: rejilla de dos columnas.
- **Líneas 466-471**: mensaje sin datos.

```css
/* ------------------------------ Tablas ------------------------------ */

.tabla-scroll {
  overflow-x: auto;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.tabla th {
  text-align: left;
  padding: 10px 12px;
  color: var(--texto-suave);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.tabla td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.tabla tbody tr:last-child td {
  border-bottom: none;
}

.fila-click {
  cursor: pointer;
  transition: background 0.12s;
}

.fila-click:hover {
  background: var(--bg-panel-2);
}

.celda-usuario {
  display: flex;
  align-items: center;
  gap: 10px;
}

.celda-usuario.grande {
  margin-bottom: 14px;
}
```

**Explicación de las líneas 473–523:**

Tablas de datos. `.tabla-scroll` habilita scroll horizontal para tablas anchas.
`.tabla` ocupa el 100 % con `border-collapse`. Cabeceras `.tabla th` en mayúsculas
de 11px, espaciado de letras y `white-space: nowrap` (evita saltos); celdas `.td`
con separadores inferiores, salvo la última fila. `.fila-click` convierte filas en
clicable (cursor pointer + hover) para navegar al detalle del usuario. `.celda-usuario`
compone avatar + datos en fila, con la variante `.grande` (margen inferior para el
encabezado del detalle).

- **Líneas 475-477**: contenedor con scroll horizontal.
- **Líneas 479-483**: tabla base.
- **Líneas 485-494**: cabecera.
- **Líneas 496-504**: celdas y último borde eliminado.
- **Líneas 506-513**: filas clicables.
- **Líneas 515-523**: celda compuesta de usuario.

```css
.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--acento), var(--violeta));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  color: #fff;
  flex-shrink: 0;
}

.avatar-grande {
  width: 48px;
  height: 48px;
  font-size: 17px;
}

.celda-usuario small {
  display: block;
}

.plan-tag {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 7px;
  border-radius: 6px;
  background: var(--bg-panel-2);
  border: 1px solid var(--border);
  font-size: 10px;
  color: var(--texto-suave);
}
```

**Explicación de las líneas 525–558:**

Avatares y etiqueta de plan. `.avatar` es el círculo con iniciales (gradiente
acento→violeta, texto blanco en negrita) de 34px; `.avatar-grande` lo agranda a
48px para el detalle. `.celda-usuario small` fuerza bloque para el subtítulo del
usuario. `.plan-tag` es la etiqueta pequeña del tipo de plan junto al estado.

- **Líneas 525-537**: avatar circular.
- **Líneas 539-543**: avatar grande.
- **Líneas 545-547**: subtexto de celda.
- **Líneas 549-558**: etiqueta de plan.

```css
/* ------------------------------ Badges ------------------------------ */

.badge {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
}

.badge-ok {
  background: rgba(34, 197, 94, 0.14);
  color: var(--verde);
  border: 1px solid rgba(34, 197, 94, 0.35);
}

.badge-warn {
  background: rgba(245, 158, 11, 0.14);
  color: var(--ambar);
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.badge-err {
  background: rgba(239, 68, 68, 0.14);
  color: var(--rojo);
  border: 1px solid rgba(239, 68, 68, 0.35);
}

.badge-info {
  background: rgba(59, 130, 246, 0.14);
  color: var(--acento);
  border: 1px solid rgba(59, 130, 246, 0.35);
}

.badge-muted {
  background: rgba(107, 114, 128, 0.12);
  color: var(--texto-suave);
  border: 1px solid rgba(107, 114, 128, 0.3);
}

.badge-origen {
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid;
}
```

**Explicación de las líneas 560–604:**

Insignias. `.badge` base: "píldora" (border-radius 999px), 11px, peso 700, sin
saltos de línea. Las variantes usan el patrón *tinte de fondo con transparencia +
texto en color pleno + borde al 35 %*: `.badge-ok` (verde, `rgba(34,197,94,...)`),
`.badge-warn` (ámbar), `.badge-err` (rojo), `.badge-info` (azul), `.badge-muted`
(gris). `.badge-origen` no define color propio: el borde y el color se inyectan
inline desde `BadgeOrigen` (componente) usando `ORIGEN_COLOR`; por eso declara
`border: 1px solid` (estilo/ancho) sin color.

- **Líneas 562-569**: clase base.
- **Líneas 571-599**: variantes de color semántico (tinte + borde translúcido).
- **Líneas 601-604**: badge de origen con borde sin color (se pinta inline).

```css
/* ------------------------------ Filtros ------------------------------ */

.filtros {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filtros .input[type="search"] {
  flex: 1;
  min-width: 220px;
}

.contador {
  color: var(--texto-suave);
  font-size: 12px;
  margin-left: auto;
}
```

**Explicación de las líneas 606–625:**

Barra de filtros de las listas. `.filtros` es flex con wrap; el campo de búsqueda
`.filtros .input[type="search"]` crece (flex: 1) con mínimo 220px; `.contador`
muestra el total y se empuja a la derecha con `margin-left: auto`.

- **Líneas 608-614**: contenedor de filtros.
- **Líneas 616-619**: campo de búsqueda expansible.
- **Líneas 621-625**: contador alineado a la derecha.

```css
/* ------------------------------ Alertas / spinners ------------------------------ */

.alerta-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
}

.spinner-box {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--texto-suave);
  padding: 24px 0;
  justify-content: center;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--border);
  border-top-color: var(--acento);
  border-radius: 50%;
  animation: girar 0.8s linear infinite;
}

@keyframes girar {
  to {
    transform: rotate(360deg);
  }
}
```

**Explicación de las líneas 627–660:**

Feedback visual (consumido por `ErrorAlerta` y `Spinner` de `Alerta.tsx`).
`.alerta-error` es la caja de error con tinte rojo, texto `#fca5a5` (rojo claro)
y radio 10. `.spinner-box` centra el aro y el texto con padding vertical.
`.spinner` dibuja el aro de carga: 18px, borde de 2px en color borde con la parte
superior en acento (efecto "reloj"), radio 50 % y animación `girar` de 0.8 s
lineal infinita. La keyframe `girar` rota de 0 a 360 grados.

- **Líneas 629-636**: caja de error.
- **Líneas 638-645**: contenedor del spinner.
- **Líneas 647-654**: aro animado.
- **Líneas 656-660**: keyframes de rotación.

```css
/* ------------------------------ Detalle ------------------------------ */

.volver {
  color: var(--texto-suave);
  text-decoration: none;
  font-size: 13px;
}

.volver:hover {
  color: var(--texto);
}

.panel-usuario {
  padding: 22px;
}

.grid-datos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px 22px;
}

.grid-datos > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dato-titulo {
  color: var(--texto-suave);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.grid-datos small {
  color: var(--texto-suave);
}
```

**Explicación de las líneas 662–700:**

Pantalla de detalle de usuario. `.volver` es el enlace "← Volver" (texto suave,
sin subrayado). `.panel-usuario` da más aire al panel del detalle. `.grid-datos`
rejilla adaptativa de pares etiqueta/valor (mínimo 220px); cada hijo `div` apila
etiqueta y valor; `.dato-titulo` es la etiqueta en mayúsculas pequeñas; los
`small` del grid (valores secundarios) en texto suave.

- **Líneas 664-672**: enlace volver.
- **Líneas 674-676**: panel del usuario.
- **Líneas 678-700**: rejilla de datos con títulos y subvalores.

```css
/* ------------------------------ Admin ------------------------------ */

.fila-accion {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.confirmar-purga {
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 10px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 560px;
}

.confirmar-purga > div {
  display: flex;
  gap: 10px;
}

.ok-msg {
  color: var(--verde);
  font-size: 13px;
  margin: 0;
}
```

**Explicación de las líneas 702–732:**

Sección administrativa (pantalla Admin). `.fila-accion` alinea verticalmente
acciones. `.confirmar-purga` es el bloque de confirmación de la purga de datos
(tinte rojo, máx. 560px) que exige un paso extra antes de la operación
destructiva; sus hijos botones se disponen en fila. `.ok-msg` es el mensaje de
éxito en verde.

- **Líneas 704-710**: contenedor de acciones.
- **Líneas 712-721**: panel de confirmación de purga.
- **Líneas 723-726**: fila de botones del panel.
- **Líneas 728-732**: mensaje de éxito.

```css
/* ------------------------------ Responsive ------------------------------ */

@media (max-width: 860px) {
  .sidebar {
    width: 64px;
  }

  .sidebar-logo div,
  .sidebar-footer span:last-child,
  .nav-item span:last-child {
    display: none;
  }

  .sidebar-logo {
    justify-content: center;
    padding: 14px 8px;
  }

  .sidebar-nav {
    padding: 10px 6px;
  }

  .nav-item {
    justify-content: center;
    padding: 12px;
  }

  .nav-icon {
    width: auto;
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .content,
  .topbar {
    padding-left: 16px;
    padding-right: 16px;
  }
}
```

**Explicación de las líneas 734–773:**

Media query responsive: por debajo de 860px la sidebar se colapsa a 64px (solo
iconos): se ocultan los textos del logo, el estado del pie y las etiquetas de
navegación (`display: none`), se centran logo e iconos y se reduce el padding. La
rejilla `.grid-2` pasa a una sola columna y el contenido/topbar reducen su padding
horizontal a 16px. Los iconos siguen visibles como navegación compacta.

- **Líneas 736-739**: sidebar compacta de 64px.
- **Líneas 741-745**: oculta textos del logo, estado y etiquetas.
- **Líneas 747-762**: centra logo, navegación e iconos.
- **Líneas 765-767**: rejilla a una columna.
- **Líneas 769-773**: paddings reducidos.

## Fichas de funciones y métodos

No aplica: CSS sin funciones. La única "lógica" es la keyframe `girar` (líneas
656-660) y la media query (736-773), explicadas en el análisis por bloques.

## Clases / interfaces / tipos

No aplica (CSS). Se listan los grupos de clases en la sección "Componentes que
dependen de este archivo".

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Los colores de los badges se expresan como `rgba` con
  literales numéricos repetidos (34,197,94 / 245,158,11 / ...) en lugar de
  derivarlos de las variables CSS; riesgo de divergencia si cambia la paleta.
  [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] `--rosa` está definido pero no se usa con `var(--rosa)`
  dentro de la hoja; el Dashboard la consume como color inline del KPI
  "Consentimientos" (`#ec4899` en JSX), duplicando el valor en dos lugares.
  [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] Los estilos de foco se limitan a `border-color` en inputs; los botones y
  enlaces no tienen `:focus-visible` propio (accesibilidad con teclado mejorable).
- [NOTA] Sin estilos para `prefers-color-scheme` ni modo claro: tema oscuro fijo.
- [NOTA] `#fca5a5` (texto de error), `#4b5563` (dot gray), `#fff` y los `rgba` son
  valores literales fuera de las variables del tema.

## Seguridad

- [INFORMATIVO] CSS sin riesgo de inyección conocido: no usa `url()` externa, ni
  `expression()`, ni `@import` remoto. Los colores inline de componentes vienen de
  constantes propias del frontend (no de entrada de usuario directa).
- [INFORMATIVO] Sin datos sensibles embebidos en la hoja de estilos.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Derivar los `rgba` de badges y alertas a partir de variables CSS
  con canal alpha (p. ej. `color-mix()` o variables `--verde-rgb`) para mantener la
  paleta consistente.
- [RECOMENDACIÓN] Añadir estilos `:focus-visible` a `.btn` y `.nav-item` para
  accesibilidad con teclado.
- [RECOMENDACIÓN] Considerar dividir el CSS en módulos (layout, componentes) si el
  archivo crece, manteniendo un único punto de importación.
- [RECOMENDACIÓN] Definir el valor del KPI "Consentimientos" como clase propia en
  CSS (con `var(--rosa)`) en lugar de color inline desde JSX.
