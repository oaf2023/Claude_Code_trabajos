# Archivo: admin/src/lib/format.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/lib/format.ts | 102 | TypeScript 5.9 | 3481 | Utilidades de formato y presentación (helpers puros) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Agrupa utilidades puras de formato y traducción para el panel: diccionarios
constantes de etiquetas y colores por estado/origen (usados por `Badges.tsx` y el
Dashboard), y funciones de formateo de fechas (hora local), antigüedad legible,
coordenadas, distancias e iniciales de nombre. No tiene estado, no hace llamadas de
red ni importa nada: son funciones deterministas ideales para pruebas unitarias.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` (con elementos `APARENTEMENTE NO UTILIZADO`,
ver Observaciones). La mayoría de los exports se consumen en varias pantallas
(grep real). `PERMISO_LABEL` y `formatearSoloFecha` no tienen referencias fuera de
este archivo dentro de `admin/src`. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| (sin importaciones) | — | — | Solo APIs estándar de ECMAScript: `Date`, `Intl` (implícito en `toLocaleString`), `RegExp` | Sí |

## Componentes que dependen de este archivo

Consumidores reales hallados por grep en `admin/src`:

- `components/Badges.tsx` (líneas 12-17): `ESTADO_CONSENTIMIENTO_LABEL`,
  `ESTADO_SUSCRIPCION_LABEL`, `ORIGEN_COLOR`, `ORIGEN_LABEL`.
- `pages/Dashboard.tsx` (línea 31): `ESTADO_CONSENTIMIENTO_LABEL`, `ORIGEN_COLOR`,
  `ORIGEN_LABEL`.
- `pages/Usuarios.tsx` (línea 16): `antiguedad`, `formatearCoordenada`, `iniciales`.
- `pages/UsuarioDetalle.tsx` (línea 26): `antiguedad`, `formatearCoordenada`,
  `formatearDistancia`, `formatearFecha`, `iniciales`.
- `pages/PagoSimulado.tsx` (línea 23): `formatearFecha`, `iniciales`.
- Sin referencias halladas: `PERMISO_LABEL` y `formatearSoloFecha`
  [POTENCIALMENTE NO UTILIZADO].

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `ORIGEN_LABEL` | `{ GPS: "GPS", NAVEGADOR: "Navegador", IP: "IP", MANUAL: "Manual" }` | `Record<string, string>` | Etiqueta legible de origen de ubicación | Líneas 12-17; consumido por Badges y Dashboard |
| `ORIGEN_COLOR` | `{ GPS: "#22c55e", NAVEGADOR: "#3b82f6", IP: "#f59e0b", MANUAL: "#a855f7" }` | `Record<string, string>` | Color semántico por origen | Líneas 19-24 |
| `ESTADO_SUSCRIPCION_LABEL` | `{ active: "Activo", pending_verification: "Verificación pendiente", expired: "Expirado", not_registered: "Sin suscripción" }` | `Record<string, string>` | Etiqueta de estado de suscripción | Líneas 26-31 |
| `ESTADO_CONSENTIMIENTO_LABEL` | `{ OTORGADO: "Otorgado", RECHAZADO: "Rechazado", REVOCADO: "Revocado", NO_SOLICITADO: "No solicitado" }` | `Record<string, string>` | Etiqueta de consentimiento | Líneas 33-38 |
| `PERMISO_LABEL` | `{ GRANTED: "Concedido", DENIED: "Denegado", PROMPT: "Solicitado", NO_DISPONIBLE: "No disponible", NO_SOLICITADO: "No solicitado", ERROR: "Error" }` | `Record<string, string>` | Etiqueta de estado de permiso de ubicación | Líneas 40-47; [POTENCIALMENTE NO UTILIZADO] |
| Locale | `"es-AR"` | string | Localización de fechas (argentina) | Líneas 54 y 68 |

Colores: `#22c55e` verde, `#3b82f6` azul, `#f59e0b` ámbar, `#a855f7` violeta;
coinciden con las variables CSS `--verde`, `--acento`, `--ambar`, `--violeta` de
`index.css`. [NIVEL DE CERTEZA: Confirmado por código]

## Estructura (funciones / clases / tipos)

- Constantes exportadas: `ORIGEN_LABEL`, `ORIGEN_COLOR`,
  `ESTADO_SUSCRIPCION_LABEL`, `ESTADO_CONSENTIMIENTO_LABEL`, `PERMISO_LABEL`.
- Funciones exportadas: `formatearFecha`, `formatearSoloFecha`, `antiguedad`,
  `formatearCoordenada`, `formatearDistancia`, `iniciales`.

## Análisis línea por línea

```ts
/* ============================================================================
 * Archivo         : format.ts
 * Descripción     : Utilidades de formato (fechas, coordenadas, duraciones,
 *                   etiquetas de estado y origen) para el dashboard admin.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9
 * Uso             : Interno - consumido por componentes del dashboard
 * ========================================================================== */
```

**Explicación de las líneas 1–10:**

Cabecera documental del proyecto; sin lógica.

- **Línea 6**: fecha 2026-07-31 (futura; coherente con el repositorio).

```ts
export const ORIGEN_LABEL: Record<string, string> = {
  GPS: "GPS",
  NAVEGADOR: "Navegador",
  IP: "IP",
  MANUAL: "Manual",
};

export const ORIGEN_COLOR: Record<string, string> = {
  GPS: "#22c55e",
  NAVEGADOR: "#3b82f6",
  IP: "#f59e0b",
  MANUAL: "#a855f7",
};
```

**Explicación de las líneas 12–24:**

Diccionarios de origen de ubicación: `ORIGEN_LABEL` traduce códigos del backend a
etiquetas ("NAVEGADOR" → "Navegador"); `ORIGEN_COLOR` asigna el color semántico
(GPS verde, navegador azul, IP ámbar, manual violeta). `Record<string, string>`
permite acceso con cualquier clave y *fallback* `??` en el consumidor.

- **Línea 12**: export del mapa de etiquetas.
- **Línea 19**: export del mapa de colores.

```ts
export const ESTADO_SUSCRIPCION_LABEL: Record<string, string> = {
  active: "Activo",
  pending_verification: "Verificación pendiente",
  expired: "Expirado",
  not_registered: "Sin suscripción",
};

export const ESTADO_CONSENTIMIENTO_LABEL: Record<string, string> = {
  OTORGADO: "Otorgado",
  RECHAZADO: "Rechazado",
  REVOCADO: "Revocado",
  NO_SOLICITADO: "No solicitado",
};
```

**Explicación de las líneas 26–38:**

Etiquetas de estado: suscripción (claves en minúscula snake_case del backend:
`active`, `pending_verification`, `expired`, `not_registered`) y consentimiento
(claves en mayúsculas: `OTORGADO`, `RECHAZADO`, `REVOCADO`, `NO_SOLICITADO`).
[NOTA] `Badges.tsx` mapea colores solo para un subconjunto (p. ej. no maneja
`not_registered` ni `NO_SOLICITADO` con color propio; caen en `muted`).

```ts
export const PERMISO_LABEL: Record<string, string> = {
  GRANTED: "Concedido",
  DENIED: "Denegado",
  PROMPT: "Solicitado",
  NO_DISPONIBLE: "No disponible",
  NO_SOLICITADO: "No solicitado",
  ERROR: "Error",
};
```

**Explicación de las líneas 40–47:**

Diccionario de estados de permiso de ubicación (claves en inglés del backend de
Android: `GRANTED`, `DENIED`, `PROMPT`, `NO_DISPONIBLE`, `NO_SOLICITADO`, `ERROR`).
[POTENCIALMENTE NO UTILIZADO]: ninguna referencia fuera de este archivo dentro de
`admin/src` (grep real). Podría destinarse a usos futuros o haberse dejado de la
fase de desarrollo.

```ts
/** Formatea una fecha ISO UTC (backend SQLite) a hora local. */
export function formatearFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
```

**Explicación de las líneas 49–62:**

`formatearFecha`: convierte un timestamp ISO (que el backend SQLite emite sin `Z`,
tratado como UTC) a fecha/hora local. Lógica clave: si la cadena no termina en
`Z`, le agrega `Z` para que `Date` la interprete como UTC y no como hora local
(corrección de zona horaria). Valida con `Number.isNaN(fecha.getTime())` y, si es
inválida, devuelve la entrada original. Formato: `dd/mm/aa hh:mm:ss` con locale
`es-AR`.

- **Línea 51**: entrada vacía → em dash `"—"`.
- **Línea 52**: construye `Date` tratando el input como UTC (añade `Z` si falta).
- **Línea 53**: fecha inválida → devuelve la cadena cruda.
- **Líneas 54-61**: formatea día/mes/año/hora/minuto/segundo en local.

```ts
export function formatearSoloFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const fecha = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(fecha.getTime())) return iso;
  return fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
}
```

**Explicación de las líneas 64–69:**

`formatearSoloFecha`: variante sin hora: `dd mmm` (p. ej. "05 jul"), misma lógica
de normalización UTC. [POTENCIALMENTE NO UTILIZADO]: sin referencias externas en
`admin/src`.

- **Líneas 65-67**: mismas guardas que `formatearFecha`.
- **Línea 68**: formato solo día y mes abreviado.

```ts
/** Antigüedad legible: "hace 5 min", "hace 3 h", "hace 2 días". */
export function antiguedad(iso: string | null | undefined): string {
  if (!iso) return "sin datos";
  const fecha = new Date(iso.endsWith("Z") ? iso : `${iso}Z`);
  if (Number.isNaN(fecha.getTime())) return "sin datos";
  const segundos = Math.max(0, (Date.now() - fecha.getTime()) / 1000);
  if (segundos < 60) return `hace ${Math.floor(segundos)} s`;
  if (segundos < 3600) return `hace ${Math.floor(segundos / 60)} min`;
  if (segundos < 86400) return `hace ${Math.floor(segundos / 3600)} h`;
  return `hace ${Math.floor(segundos / 86400)} días`;
}
```

**Explicación de las líneas 71–81:**

`antiguedad`: calcula el tiempo transcurrido desde un timestamp y lo expresa en
unidades legibles ("hace X s/min/h/días"). Clamp con `Math.max(0, ...)` evita
negativos si el reloj local está adelantado respecto del servidor (fechas futuras
pequeñas). Las fechas futuras grandes se muestran como "hace 0 s" por el clamp
(limitación: no diferencia "en el futuro").

- **Línea 73**: sin dato → "sin datos".
- **Línea 76**: segundos transcurridos, nunca negativos.
- **Líneas 77-80**: escalas: <60 s, <1 h, <24 h, resto en días. [NOTA] "días"
  siempre en plural, incluso para 1 día.

```ts
export function formatearCoordenada(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || Number.isNaN(valor)) return "—";
  return valor.toFixed(6);
}
```

**Explicación de las líneas 83–86:**

`formatearCoordenada`: muestra una coordenada con 6 decimales (`toFixed(6)`,
~0,11 m de resolución, típico para GPS). Guarda contra `null`, `undefined` y `NaN`
→ em dash.

```ts
/** 150 -> "150 m" ; 1250 -> "1,25 km" */
export function formatearDistancia(metros: number | null | undefined): string {
  if (metros === null || metros === undefined || Number.isNaN(metros)) return "—";
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(2)} km`;
}
```

**Explicación de las líneas 88–93:**

`formatearDistancia`: convierte precisión en metros a texto: menor a 1000 m →
metros enteros redondeados ("150 m"); mayor o igual → kilómetros con 2 decimales
("1,25 km"). El separador decimal depende del locale del navegador
(`toFixed` usa punto; el consumidor no aplica locale posterior).

- **Línea 91**: rama metros.
- **Línea 92**: rama kilómetros.

```ts
export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}
```

**Explicación de las líneas 95–101:**

`iniciales`: extrae las iniciales de un nombre para el avatar. Divide por espacios,
descarta vacíos, toma como máximo 2 palabras, toma la primera letra de cada una en
mayúscula y las une sin separador. El `!` (non-null assertion) es seguro porque
`filter(Boolean)` garantiza que cada elemento `p` tiene al menos un carácter
(aunque una palabra de solo espacios ya fue filtrada).

- **Línea 97**: separa en palabras por cualquier cantidad de espacios/tabs.
- **Línea 98**: elimina elementos vacíos.
- **Línea 99**: limita a dos palabras (máx. 2 iniciales).
- **Línea 100**: primera letra en mayúscula.
- **Línea 101**: concatena, p. ej. "Juan Pérez" → "JP".

## Fichas de funciones y métodos

### formatearFecha (líneas 50–62)

- Firma: `export function formatearFecha(iso: string | null | undefined): string`.
- Propósito técnico: normalizar un timestamp ISO UTC (posiblemente sin `Z`) y
  formatearlo a local `es-AR`.
- Propósito funcional: mostrar fechas legibles en tablas y detalle de usuario.
- Parámetros:

| Parámetro | Tipo | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| iso | string \| null \| undefined | Sí (tolera ausencia) | Timestamp ISO del backend |

- Retorno: `string` formateada, `"—"` si vacío, o la entrada cruda si es inválida.
- Excepciones: ninguna (usa guardas antes de formatear).
- Llamada desde: `UsuarioDetalle.tsx` (líneas 93, 104, 150, 193, 222) y
  `PagoSimulado.tsx` (líneas 211, 276).
- Riesgos: [INFORMATIVO] si el navegador no soportara el locale, degrada al
  locale por defecto.

### formatearSoloFecha (líneas 64–69)

- Firma: `export function formatearSoloFecha(iso: string | null | undefined): string`.
- Propósito: formato corto `dd mmm` en local.
- Retorno: `string` o `"—"`/entrada cruda según guardas.
- [POTENCIALMENTE NO UTILIZADO] sin llamadas externas en `admin/src`.

### antiguedad (líneas 72–81)

- Firma: `export function antiguedad(iso: string | null | undefined): string`.
- Propósito: antigüedad legible ("hace 5 min").
- Retorno: `string`; "sin datos" si ausente/inválida; clamp a 0 s para fechas
  futuras.
- Llamada desde: `Usuarios.tsx` (línea 126), `UsuarioDetalle.tsx` (línea 119).
- Riesgos: [BAJO] "1 días" en singular (pluralización no gestionada); fechas
  futuras por desfase de reloj se muestran como "hace 0 s".

### formatearCoordenada (líneas 83–86)

- Firma: `export function formatearCoordenada(valor: number | null | undefined): string`.
- Propósito: coordenada con 6 decimales o em dash.
- Llamada desde: `Usuarios.tsx` (línea 117), `UsuarioDetalle.tsx` (líneas 116, 152).

### formatearDistancia (líneas 89–93)

- Firma: `export function formatearDistancia(metros: number | null | undefined): string`.
- Propósito: precisión en metros como "150 m" o "1,25 km".
- Llamada desde: `UsuarioDetalle.tsx` (línea 157).

### iniciales (líneas 95–101)

- Firma: `export function iniciales(nombre: string): string`.
- Propósito: iniciales (máx. 2) para avatares.
- Llamada desde: `Usuarios.tsx` (línea 102), `UsuarioDetalle.tsx` (línea 80),
  `PagoSimulado.tsx` (línea 167).
- Riesgo: [INFORMATIVO] si `nombre` fuera `undefined` en tiempo de ejecución
  (contrato de tipos lo impide), lanzaría al llamar `.split`; el backend debe
  garantizar nombre no nulo.

## Clases / interfaces / tipos

No declara clases ni interfaces: usa `Record<string, string>` para los
diccionarios. Los tipos de entrada/salida de las funciones son inline.

## Observaciones técnicas

- [POTENCIALMENTE NO UTILIZADO] `PERMISO_LABEL` (líneas 40-47): sin referencias
  externas en `admin/src` (grep real). No se afirma que pueda eliminarse: el
  backend puede devolver esos estados y el módulo podría usarlo en un futuro
  cercano.
- [POTENCIALMENTE NO UTILIZADO] `formatearSoloFecha` (líneas 64-69): sin
  referencias externas en `admin/src`.
- [OBSERVACIÓN TÉCNICA] La normalización `iso.endsWith("Z") ? iso : iso + "Z"`
  asume que las fechas sin `Z` son UTC (backend SQLite). Si el backend emitiera
  alguna vez hora local sin marcador, se desplazaría incorrectamente.
  [NIVEL DE CERTEZA: Inferido]
- [NOTA] `ORIGEN_COLOR`, `ESTADO_*_LABEL` etc. duplican en JS los colores
  definidos en CSS (`--verde`, `--acento`, ...); riesgo de divergencia al
  re-tematizar.
- [NOTA] Fecha de cabecera 2026-07-31 (futura), coherente con el módulo.

## Seguridad

- [INFORMATIVO] Funciones puras sin acceso a red, almacenamiento ni secretos; sin
  hallazgos de seguridad.
- [INFORMATIVO] Los textos devueltos se insertan en JSX como hijos de React
  (escapados), sin riesgo XSS.
- [INFORMATIVO] Gobernanza de datos: `formatearCoordenada`/`formatearDistancia`
  exponen geolocalización con 6 decimales en la UI; es información sensible que el
  panel muestra por diseño a operadores autorizados (acceso restringido por la
  clave admin del backend).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Eliminar o documentar `PERMISO_LABEL` y `formatearSoloFecha` si
  se confirma que no se usarán, o conectarlos donde el estado de permiso se
  muestre (usar `PERMISO_LABEL` en las tablas de ubicaciones por permiso).
- [RECOMENDACIÓN] Centralizar colores y locales en constantes/temas compartidos
  para evitar duplicación JS/CSS.
- [RECOMENDACIÓN] Añadir tests unitarios: funciones puras e ideales para ello
  (casos: UTC sin `Z`, fechas inválidas, distancias límite 1000 m).
- [RECOMENDACIÓN] Manejar pluralización de "días" y decidir el comportamiento con
  fechas futuras en `antiguedad`.
