# Archivo: admin/src/pages/Dashboard.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/pages/Dashboard.tsx | 219 | TypeScript 5.9 / TSX (React 19 / Recharts) | 9219 | Pantalla principal de KPIs y gráficos | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla de inicio del panel (ruta `/`, montada en `App.tsx` línea 34). Muestra la operación del
sistema SafeAlert en forma de KPIs y gráficos: tarjetas de métricas clave, gráfico de anillo (donut)
por origen de ubicación (GPS/NAVEGADOR/IP/MANUAL), línea de actividad diaria de ubicaciones de los
últimos 30 días, barras por tipo de dispositivo de acceso, barras por estado de suscripción, barras
por estado de consentimiento y barras por estado de permiso de ubicación. Todos los datos provienen
de una única llamada a `fetchStats()` (`GET /api/v1/admin/stats`), con auto-refresco cada 60
segundos.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Se renderiza al navegar a `/` con sesión válida y consume datos reales del
endpoint de estadísticas del backend. Se importa únicamente desde `App.tsx`.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `useCallback`, `useEffect`, `useState` de `react` | externa | Líneas 38-58: estado y ciclo de vida de carga/refresco | Sí |
| Recharts (`Bar`, `BarChart`, `CartesianGrid`, `Cell`, `Legend`, `Line`, `LineChart`, `Pie`, `PieChart`, `ResponsiveContainer`, `Tooltip`, `XAxis`, `YAxis`) | externa | Líneas 106-205: gráficos del dashboard | Sí |
| `fetchStats`, `ApiError`, `type StatsAdmin` de `../lib/api` | interna | Líneas 38-51 y tipos | Sí |
| `ESTADO_CONSENTIMIENTO_LABEL`, `ORIGEN_COLOR`, `ORIGEN_LABEL` de `../lib/format` | interna | Líneas 64-84: etiquetas y colores | Sí |
| `KpiCard` de `../components/KpiCard` | interna | Líneas 93-97: tarjetas KPI | Sí |
| `ErrorAlerta`, `Spinner` de `../components/Alerta` | interna | Líneas 60-61: estados de error/carga | Sí |

## Componentes que dependen de este archivo

| Componente/archivo | Relación |
| --- | --- |
| `admin/src/App.tsx` | Lo importa (línea 16) y lo monta en la ruta `/` (dentro de `RequiereAuth` y `Layout`) |

[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `ORIGENES` | `["GPS", "NAVEGADOR", "IP", "MANUAL"]` | `string[]` | Orígenes de ubicación conocidos para fijar el orden/label del donut | Línea 35, usada en 64 |
| `tooltipStyle` | objeto CSS (`backgroundColor "#111827"`, borde, radio, color, fontSize 12) | objeto | Estilo oscuro común de los tooltips de Recharts | Líneas 213-218, usada en 130, 149, 166, 185, 202 |
| (Estado local) | — | — | `stats`, `error` (líneas 38-39) | — |

## Estructura (funciones / clases / tipos)

| Nombre | Tipo | Líneas |
| --- | --- | --- |
| `Dashboard` (exportada por defecto) | Componente de página | 37-211 |
| `cargar` | Callback de carga (`useCallback`) | 41-52 |
| (hook) `useEffect` de auto-refresco | Efecto con `setInterval` de 60 s | 54-58 |
| `tooltipStyle` | Constante de estilo (fuera del componente) | 213-218 |

No hay clases ni interfaces propias; se consumen los tipos `StatsAdmin`, `Kpis` de `lib/api.ts`.

## Análisis línea por línea

Bloque 1 (líneas 1-12) — Cabecera documental:

```tsx
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
```

**Explicación de las líneas 1-12:**

Cabecera del proyecto. Resume el contenido visual de la pantalla y la pila tecnológica (React 19 +
Recharts).

Bloque 2 (líneas 14-35) — Importaciones y constante de orígenes:

```tsx
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
```

**Explicación de las líneas 14-35:**

- **Líneas 14**: hooks de React para estado/efectos.
- **Líneas 15-29**: componentes de Recharts importados para los cinco gráficos de la pantalla
  (PieChart, LineChart y tres BarChart).
- **Línea 30**: cliente de estadísticas del panel y sus tipos (`StatsAdmin` describe la respuesta
  completa de `/admin/stats`).
- **Línea 31**: utilidades de formato/etiquetas y paleta de colores por origen de ubicación.
- **Líneas 32-33**: componentes de presentación reutilizables (tarjeta KPI, alerta de error y
  spinner).
- **Línea 35**: constante que fija los cuatro orígenes de ubicación posibles; se usa para recorrer
  el array de estadísticas y construir la serie del donut con orden estable y etiqueta localizada.

Bloque 3 (líneas 37-61) — Estado, carga y ciclo de vida:

```tsx
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
```

**Explicación de las líneas 37-61:**

- **Línea 37**: define el componente de página.
- **Línea 38**: estado `stats` con la respuesta tipada de `/admin/stats`; `null` indica carga.
- **Línea 39**: estado de error (texto).
- **Líneas 41-52**: `cargar` (memoizado con `useCallback`, dependencias vacías): limpia el error,
  llama a `fetchStats()`, guarda el resultado en `setStats`; en fallo, distingue `ApiError` con
  `status 401` (mensaje "Sesión expirada. Volvé a ingresar.") de cualquier otro error (mensaje de la
  excepción o genérico). No redirige a `/login` ni limpia la clave (ver Seguridad).
- **Líneas 54-58**: efecto de montaje: ejecuta `cargar()` y programa un auto-refresco con
  `window.setInterval` de 60 000 ms (60 s); limpia el temporizador al desmontar devolviendo la
  función de cancelación. La dependencia `[cargar]` es estable (useCallback con `[]`).
- **Línea 60**: si hay error y todavía no hay datos, muestra la alerta de error (pantalla de fallo
  inicial).
- **Línea 61**: si no hay datos (ni error), muestra el spinner "Cargando estadísticas…".
- [NOTA] Si el refresco posterior falla con datos ya cargados, `stats` sigue existiendo y la
  pantalla conserva los datos anteriores (la condición `error && !stats` evita el reemplazo de la
  vista por el error).

Bloque 4 (líneas 63-88) — Derivación de series para los gráficos:

```tsx
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
```

**Explicación de las líneas 63-88:**

- **Línea 63**: acceso directo a `stats.kpis` (objeto de métricas).
- **Líneas 64-67**: serie del donut por origen: recorre `ORIGENES`, toma el contador `c` de
  `stats.ubicaciones_por_origen` para cada origen (o 0 si no viene), aplica la etiqueta
  localizada y descarta orígenes sin datos (`.filter(value > 0)`).
- **Línea 68**: suma total de ubicaciones por origen; se usa para decidir si mostrar "Sin
  ubicaciones registradas." o el gráfico (línea 103).
- **Líneas 69-72**: serie de actividad diaria: recorta la fecha ISO `YYYY-MM-DD` con `slice` para
  formatearla como `DD/MM` (caracteres 8-10 = día, 5-7 = mes). Nota: no usa `new Date`, opera sobre
  la cadena devuelta por el backend (que agrupa por `substr(fecha_hora_servidor,1,10)`).
- **Líneas 73-76**: serie de accesos por dispositivo: etiqueta el tipo (o "desconocido" si es
  vacío/null).
- **Líneas 77-80**: serie de usuarios por estado de suscripción: usa el valor crudo
  `subscription_status` (active, expired, etc.) como nombre del eje.
- **Líneas 81-84**: serie de consentimientos por estado: traduce el código (OTORGADO, RECHAZADO,
  REVOCADO, NO_SOLICITADO) con `ESTADO_CONSENTIMIENTO_LABEL` y conserva el código si no hay
  etiqueta.
- **Líneas 85-88**: serie por estado de permiso de ubicación: usa el valor crudo
  `permiso_ubicacion` (GRANTED, DENIED, etc.).
- [OBSERVACIÓN TÉCNICA] Los ejes de barras muestran códigos en inglés sin traducir en
  "Usuarios por estado de suscripción" (línea 78) y en "Estado del permiso de ubicación"
  (línea 86), mientras `lib/format.ts` define `ESTADO_SUSCRIPCION_LABEL` y `PERMISO_LABEL` que no
  se aplican aquí. Impacto: cosmético/informativo (el usuario ve "active"/"GRANTED").

Bloque 5 (líneas 90-135) — KPIs y primeros dos gráficos (donut por origen y línea 30 días):

```tsx
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
```

**Explicación de las líneas 90-135:**

- **Línea 91**: contenedor vertical de la página (`stack`).
- **Líneas 92-98**: fila de cinco tarjetas KPI con los valores de `stats.kpis`: usuarios
  registrados (con activos en 7 días), usuarios activos en 24 h, ubicaciones registradas (con las
  de 24 h), accesos técnicos (con los de 24 h) y total de consentimientos. Cada tarjeta lleva un
  color de acento distinto.
- **Líneas 100-136**: primera fila de dos paneles (`grid-2`):
  - **Líneas 101-118**: panel "Ubicaciones por origen": si no hay ubicaciones muestra el aviso
    "Sin ubicaciones registradas."; si no, donut con `Pie` (anillo: `innerRadius` 55, `outerRadius`
    90), una `Cell` coloreada por origen según `ORIGEN_COLOR` (con gris `#6b7280` como respaldo),
    tooltip con formato numérico es-AR y leyenda. Se aplica `o.name.toUpperCase()` porque la
    etiqueta es la palabra localizada ("GPS", "Navegador", etc.).
  - **Líneas 120-135**: panel "Actividad diaria de ubicaciones (30 días)": si no hay datos, aviso
    "Sin actividad en los últimos 30 días."; si no, `LineChart` con rejilla punteada oscura, eje X
    de fechas `DD/MM` con `minTickGap` para no saturar etiquetas, eje Y sin decimales, tooltip con
    estilo oscuro y línea monotone de ubicaciones.

Bloque 6 (líneas 138-171) — Barras por dispositivo y por suscripción:

```tsx
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
```

**Explicación de las líneas 138-171:**

- **Líneas 138-154**: panel "Accesos por tipo de dispositivo" (Android, iOS, etc. según lo
  registrado en `accesos_tecnicos`): aviso si no hay accesos; si no, `BarChart` con barras
  violetas `#8b5cf6`, esquinas superiores redondeadas, tooltip oscuro y ejes con texto pequeño.
- **Líneas 156-170**: panel "Usuarios por estado de suscripción": aviso si no hay usuarios; si no,
  `BarChart` con barras verdes `#22c55e`. En el eje X se muestran los códigos crudos
  (p. ej. `active`, `expired`), sin traducción (ver Observaciones).
- Ambos paneles reutilizan el mismo patrón de estilos de ejes y tooltip.

Bloque 7 (líneas 174-208) — Barras por consentimiento y por permiso de ubicación:

```tsx
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
```

**Explicación de las líneas 174-219:**

- **Líneas 174-190**: panel "Consentimientos por estado" (OTORGADO/RECHAZADO/REVOCADO/NO_SOLICITADO
  traducidos con `ESTADO_CONSENTIMIENTO_LABEL`): barras rosas `#ec4899`.
- **Líneas 192-207**: panel "Estado del permiso de ubicación": barras ámbar `#f59e0b` con los
  códigos crudos de permiso.
- **Líneas 208-210**: cierre de la última sección, del contenedor y del componente.
- **Líneas 213-218**: constante `tooltipStyle` (estilo oscuro de tooltip): fondo `#111827`, borde
  `#2b3445`, radio 8, texto `#e5e7eb`, tamaño 12. Se aplica a todos los tooltips excepto al del
  donut (que usa `formatter`).
- [NOTA] La pantalla no muestra los campos `usuarios_por_plan` ni `generado_en` que sí devuelve
  `StatsAdmin` (ver Observaciones).

## Fichas de funciones y métodos

### Dashboard (líneas 37-211)

- Firma (código original): `export default function Dashboard() { ... }`
- Propósito técnico y funcional: renderiza KPIs y gráficos de la operación SafeAlert a partir de la
  respuesta de `/admin/stats`.
- Parámetros: ninguno. Retorno: JSX (pantalla). Excepciones: no lanza.
- Dependencias: `fetchStats` y tipos de `lib/api.ts`; utilidades de `lib/format.ts`; componentes
  `KpiCard`, `ErrorAlerta`, `Spinner`; librería Recharts.
- Desde dónde se llama: `App.tsx`, ruta `/`.
- Efectos secundarios: peticiones periódicas cada 60 s mientras el componente está montado.
- Riesgos: si la clave caduca, muestra error persistente sin redirigir a login (ver Seguridad).

### cargar (líneas 41-52) — callback interno de Dashboard

- Firma (código original): `const cargar = useCallback(() => { ... }, []);`
- Propósito técnico: encapsula la descarga de estadísticas con manejo de errores diferenciado.
- Parámetros: ninguno. Retorno: `void` (asíncrono mediante promesas). Excepciones: no relanza;
  captura y almacena el mensaje en estado `error`.
- Dependencias: `fetchStats`, `ApiError`. Se invoca desde el `useEffect` de montaje y desde el
  `setInterval` (líneas 54-57).
- Efectos secundarios: actualización de estado (`stats`, `error`).

## Clases / interfaces / tipos

| Tipo | Responsabilidad | Campos principales |
| --- | --- | --- |
| `StatsAdmin` (definida en `lib/api.ts` líneas 87-97, consumida aquí) | Tipa la respuesta completa de `GET /api/v1/admin/stats` | `kpis`, `ubicaciones_por_origen`, `ubicaciones_por_dia`, `accesos_por_dispositivo`, `usuarios_por_estado_suscripcion`, `consentimientos_por_estado`, `ubicaciones_por_permiso`, `usuarios_por_plan`, `generado_en` |
| `Kpis` (definida en `lib/api.ts` líneas 76-85) | Tipa el bloque de métricas | `total_usuarios`, `usuarios_activos_24h`, `usuarios_activos_7d`, `total_ubicaciones`, `ubicaciones_24h`, `total_accesos`, `accesos_24h`, `total_consentimientos` |

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El tipo `StatsAdmin` incluye `usuarios_por_plan` y `generado_en` que esta
  pantalla no utiliza. Impacto: bajo (datos descargados sin mostrar); útil si se planean más
  gráficos.
- [OBSERVACIÓN TÉCNICA] `lib/format.ts` define `ESTADO_SUSCRIPCION_LABEL` y `PERMISO_LABEL` que
  Dashboard no aplica a sus ejes de barras (líneas 78 y 86 usan códigos crudos en inglés).
  Impacto: presentación inconsistente con el resto del panel (que sí traduce mediante `Badges`).
- [OBSERVACIÓN TÉCNICA] Auto-refresco cada 60 s sin pausa por pestaña en segundo plano (no se usa
  `document.hidden` ni `visibilitychange`). Impacto: consumo de red continuo incluso con la
  pestaña oculta.
- [OBSERVACIÓN TÉCNICA] En el donut (línea 110) se indexa `ORIGEN_COLOR` con `o.name.toUpperCase()`
  (la etiqueta localizada); dado que `ORIGEN_LABEL` ya es la fuente de `name`, la lógica es
  correcta solo porque los nombres traducidos de GPS/NAVEGADOR/IP/MANUAL no se alteran al pasar a
  mayúsculas.
- [NIVEL DE CERTEZA: Confirmado por código] Toda la carga de datos proviene de un único endpoint
  (`/admin/stats`), a diferencia del resto de pantallas que combinan varios.

## Seguridad

- [BAJO] Ante `401` (clave inválida o revocada en backend) la pantalla solo muestra "Sesión
  expirada. Volvé a ingresar." sin cerrar sesión ni redirigir: el temporizador de 60 s seguirá
  reintentando con la clave caducada. No hay exfiltración, pero la sesión queda "zombie".
- [INFORMATIVO] La pantalla muestra métricas agregadas (sin datos personales de usuarios
  concretos). La protección de acceso depende íntegramente de `X-Admin-Key` en el backend.
- [INFORMATIVO] No se observan secretos ni datos personales en el código ni en textos de esta
  pantalla.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Consumo de red permanente por polling de 60 s incluso con pestaña en segundo plano:
  recomendación de pausar el intervalo con la API de visibilidad de página.
- [RECOMENDACIÓN] Centralizar el manejo de sesión expirada (redirigir a `/login` y limpiar la
  clave) ante 401, en lugar de mostrarlo por pantalla.
- [RECOMENDACIÓN] Aplicar `ESTADO_SUSCRIPCION_LABEL` y `PERMISO_LABEL` en los ejes para mantener
  la interfaz completamente en español.
- [INFORMATIVO] Aprovechar `usuarios_por_plan` ya disponible si se desea un gráfico de distribución
  de planes.
