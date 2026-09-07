# Archivo: admin/src/pages/Usuarios.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/pages/Usuarios.tsx | 137 | TypeScript 5.9 / TSX (React 19) | 5357 | Pantalla de listado de usuarios | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla de listado de usuarios registrados (ruta `/usuarios`, montada en `App.tsx` línea 35).
Ofrece búsqueda libre (por nombre, dispositivo, teléfono o MAC, según el SQL del backend), filtro
por tipo de plan (mensual/anual/todos) y una tabla con: nombre y `device_id`, teléfono, estado de
suscripción con etiqueta de plan, últimas coordenadas, origen de la última ubicación, antigüedad de
esa ubicación y total de ubicaciones. Al hacer clic en una fila navega al detalle del usuario
(`/usuarios/:usuarioId`). Es la puerta de entrada a la funcionalidad de "Usuarios" del panel y la
base para la búsqueda por MAC usada en `PagoSimulado` (mismo endpoint `fetchUsuarios`).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Importado únicamente desde `App.tsx`. Los datos provienen de
`fetchUsuarios()` → `GET /api/v1/admin/usuarios` (endpoint real verificado en `flask_app.py`
líneas 1261-1314).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `useCallback`, `useEffect`, `useState` de `react` | externa | Líneas 24-55: estado y recarga reactiva | Sí |
| `useNavigate` de `react-router-dom` | externa | Líneas 23, 99: navegación al detalle | Sí |
| `fetchUsuarios`, `ApiError`, `type UsuarioAdmin` de `../lib/api` | interna | Líneas 26-51 y 98: descarga y tipado | Sí |
| `antiguedad`, `formatearCoordenada`, `iniciales` de `../lib/format` | interna | Líneas 102, 117, 126: formato | Sí |
| `BadgeEstadoSuscripcion`, `BadgeOrigen` de `../components/Badges` | interna | Líneas 111, 124: insignias de estado | Sí |
| `ErrorAlerta`, `Spinner` de `../components/Alerta` | interna | Líneas 78-80: estados | Sí |

## Componentes que dependen de este archivo

| Componente/archivo | Relación |
| --- | --- |
| `admin/src/App.tsx` | Lo importa (línea 17) y lo monta en la ruta `/usuarios` |
| `admin/src/pages/PagoSimulado.tsx` | Usa la misma función `fetchUsuarios` de la capa API (no importa este componente) |

[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `PLANES` | `["", "monthly", "annual"]` | `string[]` | Opciones del selector de plan (vacío = todos) | Línea 20, usada en 69-73 |
| `LIMITE_TABLA` (literal embebido) | `300` | number | Límite de usuarios solicitado al backend | Línea 38 |
| Estado local | — | — | `busqueda`, `plan`, `usuarios`, `total`, `error`, `cargando` | Líneas 24-29 |

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| `Usuarios` (exportada por defecto) | Componente de página | 22-137 |
| `cargar` | Callback de descarga (`useCallback`, async) | 31-51 |

No hay clases ni interfaces propias; se consume `UsuarioAdmin` de `lib/api.ts`.

## Análisis línea por línea

Bloque 1 (líneas 1-11) — Cabecera documental:

```tsx
/* ============================================================================
 * Archivo         : Usuarios.tsx
 * Descripción     : Listado de usuarios con búsqueda por nombre/device/tel,
 *                   filtro por plan y tabla con última ubicación, origen,
 *                   antigüedad y estado de suscripción. Navega al detalle.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Ruta /usuarios
 * ========================================================================== */
```

**Explicación de las líneas 1-11:**

Cabecera del proyecto; resume el propósito: listado con búsqueda (nombre/device/tel; el SQL del
backend incluye también `mac_address`) y filtro por plan.

Bloque 2 (líneas 13-20) — Importaciones y constante de planes:

```tsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUsuarios, ApiError, type UsuarioAdmin } from "../lib/api";
import { antiguedad, formatearCoordenada, iniciales } from "../lib/format";
import { BadgeEstadoSuscripcion, BadgeOrigen } from "../components/Badges";
import { ErrorAlerta, Spinner } from "../components/Alerta";

const PLANES = ["", "monthly", "annual"];
```

**Explicación de las líneas 13-20:**

- **Líneas 13-18**: imports de hooks, navegación, capa API (con el tipo `UsuarioAdmin`), utilidades
  de formato y componentes de presentación (insignias y alertas).
- **Línea 20**: opciones del filtro de plan: `""` (todos), `monthly`, `annual`.

Bloque 3 (líneas 22-55) — Estado, carga y disparo reactivo:

```tsx
export default function Usuarios() {
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [plan, setPlan] = useState("");
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const cargar = useCallback(async (busquedaActual: string, planActual: string) => {
    setCargando(true);
    setError("");
    try {
      const data = await fetchUsuarios({
        busqueda: busquedaActual || undefined,
        plan: planActual || undefined,
        limite: 300,
      });
      setUsuarios(data.usuarios);
      setTotal(data.total);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Sesión expirada. Volvé a ingresar.");
      } else {
        setError(err instanceof Error ? err.message : "Error al cargar usuarios.");
      }
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar(busqueda, plan);
  }, [cargar, busqueda, plan]);
```

**Explicación de las líneas 22-55:**

- **Línea 22**: define el componente.
- **Línea 23**: hook de navegación para ir al detalle al pulsar una fila.
- **Líneas 24-29**: estado local: texto de búsqueda, plan seleccionado, lista de usuarios, total
  devuelto, error y bandera de carga.
- **Líneas 31-51**: `cargar` (memoizado; recibe los filtros como parámetros para no depender del
  estado): activa la carga, limpia el error y llama a `fetchUsuarios` con:
  - `busqueda`: texto (o `undefined` si vacío) → parámetro `busqueda` del backend (búsqueda
    `LIKE` sobre `device_id`, `name`, `phone` y `mac_address`).
  - `plan`: valor del selector (o `undefined` si "todos") → filtro exacto `u.plan_type = ?`.
  - `limite: 300`: tope de filas (el backend lo acota a máx. 500).
  Almacena la lista y el total devueltos. En fallo distingue 401 ("Sesión expirada. Volvé a
  ingresar.") del resto.
- **Líneas 53-55**: efecto que dispara `cargar` cada vez que cambian los filtros (`busqueda` o
  `plan`). [OBSERVACIÓN TÉCNICA] No hay *debounce*: cada pulsación de tecla lanza una petición al
  backend; con sesiones de escritura rápidas se producen ráfagas de peticiones (ver Riesgos).

Bloque 4 (líneas 57-81) — Barra de filtros y estados de pantalla:

```tsx
  return (
    <div className="stack">
      <div className="panel">
        <div className="filtros">
          <input
            className="input"
            type="search"
            placeholder="Buscar por nombre, dispositivo o teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select className="input input-select" value={plan} onChange={(e) => setPlan(e.target.value)} aria-label="Filtrar por plan">
            {PLANES.map((p) => (
              <option key={p} value={p}>
                {p === "" ? "Todos los planes" : p === "monthly" ? "Plan mensual" : "Plan anual"}
              </option>
            ))}
          </select>
          <span className="contador">{total.toLocaleString("es-AR")} resultado{total === 1 ? "" : "s"}</span>
        </div>
        {error ? (
          <ErrorAlerta mensaje={error} />
        ) : cargando ? (
          <Spinner texto="Cargando usuarios…" />
        ) : usuarios.length === 0 ? (
          <p className="sin-datos">No se encontraron usuarios.</p>
        ) : (
```

**Explicación de las líneas 57-81:**

- **Líneas 58-59**: contenedor y panel de la pantalla.
- **Líneas 60-76**: barra de filtros:
  - **Líneas 61-67**: campo de búsqueda `type="search"` con placeholder "Buscar por nombre,
    dispositivo o teléfono…"; cada cambio actualiza `busqueda` (y dispara la recarga).
  - **Líneas 68-74**: selector de plan (accesible con `aria-label="Filtrar por plan"`) con las
    opciones "Todos los planes", "Plan mensual" y "Plan anual".
  - **Línea 75**: contador de resultados con pluralización correcta ("1 resultado"/"N resultados").
- **Líneas 77-81**: renderizado condicional: alerta de error, spinner de carga, aviso "No se
  encontraron usuarios." o la tabla (siguiente bloque).

Bloque 5 (líneas 84-133) — Tabla de usuarios:

```tsx
          <div className="tabla-scroll">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Teléfono</th>
                  <th>Suscripción</th>
                  <th>Última ubicación</th>
                  <th>Origen</th>
                  <th>Antigüedad</th>
                  <th>Total ubic.</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.device_id} className="fila-click" onClick={() => navigate(`/usuarios/${encodeURIComponent(u.device_id)}`)}>
                    <td>
                      <div className="celda-usuario">
                        <span className="avatar">{iniciales(u.name)}</span>
                        <div>
                          <strong>{u.name}</strong>
                          <small className="mono">{u.device_id}</small>
                        </div>
                      </div>
                    </td>
                    <td>{u.phone || "—"}</td>
                    <td>
                      <BadgeEstadoSuscripcion estado={u.subscription_status} />
                      {u.plan_type && <small className="plan-tag">{u.plan_type}</small>}
                    </td>
                    <td>
                      {u.ultima_latitud != null ? (
                        <span className="mono">
                          {formatearCoordenada(u.ultima_latitud)}, {formatearCoordenada(u.ultima_longitud)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <BadgeOrigen origen={u.ultimo_origen} />
                    </td>
                    <td>{u.ultima_fecha_hora ? antiguedad(u.ultima_fecha_hora) : "sin datos"}</td>
                    <td>{u.total_ubicaciones.toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Explicación de las líneas 84-133:**

- **Líneas 84-131**: tabla con scroll horizontal para pantallas angostas (`tabla-scroll`/`tabla`).
  Cabecera (líneas 87-95) con siete columnas: Usuario, Teléfono, Suscripción, Última ubicación,
  Origen, Antigüedad, Total ubic.
- **Líneas 98-129**: cuerpo generado con `usuarios.map`:
  - **Línea 99**: cada fila usa `device_id` como clave y la clase `fila-click`; al hacer clic
    navega a `/usuarios/{device_id}` con `encodeURIComponent` (el `device_id` puede contener
    caracteres que requieren codificación). [NOTA] La fila es clicable pero no es un enlace
    nativo (`<tr onClick>`): no hay accesibilidad por teclado ni apertura en pestaña nueva.
  - **Líneas 100-108**: celda "Usuario": avatar con iniciales, nombre en negrita y `device_id` en
    fuente mono.
  - **Línea 109**: teléfono o "—".
  - **Líneas 110-113**: celda "Suscripción": insignia de estado (activo/verificación pendiente/
    expirado/sin suscripción) y etiqueta pequeña del tipo de plan si existe.
  - **Líneas 114-122**: últimas coordenadas formateadas a 6 decimales (o "—") si existe
    `ultima_latitud`.
  - **Líneas 123-125**: insignia del origen de la última ubicación (GPS, Navegador, IP, Manual).
  - **Línea 126**: antigüedad legible ("hace 5 min", "hace 3 h", "hace 2 días") o "sin datos".
  - **Línea 127**: total de ubicaciones con formato es-AR.
- **Líneas 132-137**: cierres condicionales y del componente.

## Fichas de funciones y métodos

### Usuarios (líneas 22-137)

- Firma (código original): `export default function Usuarios() { ... }`
- Propósito técnico y funcional: listado con búsqueda y filtro; punto de acceso al detalle.
- Parámetros: ninguno. Retorno: JSX. Excepciones: no lanza.
- Dependencias: `fetchUsuarios`, `useNavigate`, utilidades de formato y componentes de insignia.
- Desde dónde se llama: `App.tsx`, ruta `/usuarios`.
- Efectos secundarios: peticiones al backend en cada cambio de filtro.
- Riesgos: ráfagas de peticiones sin debounce; datos personales visibles (ver Seguridad).

### cargar (líneas 31-51)

- Firma (código original): `const cargar = useCallback(async (busquedaActual: string, planActual: string) => { ... }, []);`
- Propósito: descargar la lista de usuarios con los filtros vigentes.
- Parámetros: `busquedaActual` (texto de búsqueda), `planActual` (plan o vacío).
- Retorno: `Promise<void>` (los datos se guardan en estado). Excepciones: capturadas.
- Dependencias: `fetchUsuarios`, `ApiError`. Invocado desde el efecto (líneas 53-55).
- Efectos secundarios: actualización de `usuarios`, `total`, `error`, `cargando`.

## Clases / interfaces / tipos

| Tipo | Responsabilidad | Campos principales |
| --- | --- | --- |
| `UsuarioAdmin` (definida en `lib/api.ts` líneas 13-32, consumida aquí) | Tipa un usuario del listado admin | `device_id`, `name`, `phone`, `mac_address?`, `device_unique_id?`, `registered_at`, `subscription_status`, `plan_type`, `subscription_expires_at`, `updated_at`, `ultima_ubicacion_id`, `ultima_latitud`, `ultima_longitud`, `ultimo_origen`, `ultima_precision`, `ultima_fecha_hora`, `ultima_direccion`, `total_ubicaciones` |

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Búsqueda sin debounce (el efecto dispara `fetchUsuarios` en cada
  pulsación). Impacto: ráfagas de peticiones SQL sobre la tabla `users` con tres `LIKE %…%`
  (sin índice utilizable) + subconsulta de última ubicación por fila; posible lentitud y consumo de
  rate limit.
- [OBSERVACIÓN TÉCNICA] El listado no pagina: solicita 300 filas y muestra el "total" de esa
  ventana (el backend devuelve `total: len(resultado)`, es decir, el total de la página, no el
  total absoluto de usuarios). Impacto: el contador de resultados y la exhaustividad del listado
  son parciales con más de 300 usuarios.
- [OBSERVACIÓN TÉCNICA] La fila usa `onClick` sobre `<tr>` (no `<Link>`): sin accesibilidad de
  teclado, sin cursor/estado por defecto (salvo CSS `fila-click`) y sin prefetch de React Router.
- [OBSERVACIÓN TÉCNICA] `fetchUsuarios` devuelve campos no mostrados en la tabla (p. ej.
  `mac_address`, `device_unique_id`, `ultima_direccion`, `ultima_precision`, `registered_at`,
  `subscription_expires_at`); se aprovechan en `UsuarioDetalle` y `PagoSimulado`.
- [NIVEL DE CERTEZA: Confirmado por código] El placeholder y la cabecera no mencionan MAC, pero el
  backend sí busca por `mac_address` (línea 1295 de `flask_app.py`): la búsqueda por MAC funciona
  aunque la UI no la anuncie.

## Seguridad

- [MEDIO] La pantalla expone datos personales de usuarios (nombre, teléfono, `device_id`, MAC
  implícitamente buscable, coordenadas GPS precisas a 6 decimales). La única barrera es la clave
  compartida `X-Admin-Key` enviada por encabezado. No hay autorización por rol ni registro de
  auditoría de consultas del administrador.
- [INFORMATIVO] El `device_id` viaja codificado con `encodeURIComponent` en la URL al navegar al
  detalle, evitando rupturas por caracteres especiales; no se filtran datos en la URL (solo el
  identificador).
- [BAJO] Al no haber debounce, la consulta repetida amplifica la exposición del endpoint ante un
  operador con la clave comprometida (más tráfico consultable), sin impacto adicional de
  seguridad per se.
- [INFORMATIVO] No se observan secretos ni credenciales en este archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Rendimiento del listado con `LIKE` no indexado y sin paginación: recomendación de
  debounce (300-400 ms) y paginación real en backend (OFFSET/LIMIT con total absoluto).
- [RECOMENDACIÓN] Convertir las filas en enlaces accesibles (`Link`/`useNavigate` con `role` y
  foco) para teclado y lectores de pantalla.
- [RECOMENDACIÓN] Considerar un registro de auditoría de acceso del panel (quién consulta datos de
  qué usuario y cuándo), coherente con el carácter sensible de las coordenadas y datos de contacto.
- [INFORMATIVO] Completar la búsqueda en la UI mencionando la MAC (ya soportada por el backend) si
  se desea guiar al operador de pagos simulados.
