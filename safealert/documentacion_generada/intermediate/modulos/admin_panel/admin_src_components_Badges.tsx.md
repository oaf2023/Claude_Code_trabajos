# Archivo: admin/src/components/Badges.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/components/Badges.tsx | 52 | TypeScript 5.9 / React 19 (TSX) | 2028 | Componentes UI de insignias de estado (presentacionales) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Proporciona insignias (badges) de estado con color semántico para tres dominios del
panel: estado de suscripción del usuario, estado de consentimiento de permisos y
origen de una ubicación. Mapea cada valor técnico del backend a una etiqueta legible
en español (mediante los diccionarios de `lib/format.ts`) y a una variante de color
definida en CSS. Es un componente puramente presentacional: sin estado, sin
efectos y sin llamadas de red.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Los tres componentes exportados son importados
por las pantallas Usuarios, UsuarioDetalle y PagoSimulado (búsqueda grep real).

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `ESTADO_CONSENTIMIENTO_LABEL` de `../lib/format` | interna | `BadgeConsentimiento` (línea 42) | Sí |
| `ESTADO_SUSCRIPCION_LABEL` de `../lib/format` | interna | `BadgeEstadoSuscripcion` (línea 34) | Sí |
| `ORIGEN_COLOR` de `../lib/format` | interna | `BadgeOrigen` (línea 48) | Sí |
| `ORIGEN_LABEL` de `../lib/format` | interna | `BadgeOrigen` (línea 49) | Sí |

## Componentes que dependen de este archivo

Referencias reales halladas con grep sobre `admin/src`:

- `pages/Usuarios.tsx` (línea 17): importa `BadgeEstadoSuscripcion, BadgeOrigen`;
  usos en líneas 111 y 124.
- `pages/UsuarioDetalle.tsx` (línea 27): importa `BadgeConsentimiento,
  BadgeEstadoSuscripcion, BadgeOrigen`; usos en líneas 98, 118, 155 y 190.
- `pages/PagoSimulado.tsx` (línea 24): importa `BadgeEstadoSuscripcion`; usos en
  líneas 174, 206 y 271.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `Variante` | `"ok" \| "warn" \| "err" \| "info" \| "muted"` | type alias (string union) | Enumera las variantes visuales posibles del badge | Línea 19 y todas las funciones |
| `VARIANTE_CLASS` | `{ ok: "badge badge-ok", warn: "badge badge-warn", err: "badge badge-err", info: "badge badge-info", muted: "badge badge-muted" }` | `Record<Variante, string>` | Mapea variante → clases CSS | Líneas 21-27 |
| `"#6b7280"` | Color gris (fallback) | string | Color de borde/texto por defecto en `BadgeOrigen` cuando el origen no está en `ORIGEN_COLOR` | Líneas 48 (×2) |

Valores mágicos: `"active"`, `"pending_verification"`, `"expired"` son los estados
de suscripción emitidos por el backend; `"OTORGADO"`, `"RECHAZADO"`, `"REVOCADO"`
son estados de consentimiento. Significado confirmado por el diccionario de
`lib/format.ts`.

## Estructura (funciones / clases / tipos)

- `type Variante` — unión de variantes de color.
- `const VARIANTE_CLASS` — mapa variante → clases CSS.
- `BadgeEstadoSuscripcion({ estado }: { estado: string })` — exportada.
- `BadgeConsentimiento({ estado }: { estado: string })` — exportada.
- `BadgeOrigen({ origen }: { origen: string \| null \| undefined })` — exportada.

## Análisis línea por línea

```tsx
/* ============================================================================
 * Archivo         : Badges.tsx
 * Descripción     : Componentes de insignia de estado (suscripción,
 *                   consentimiento, origen) con colores semánticos.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Utilizado en tablas de usuarios y detalle de usuario
 * ========================================================================== */
```

**Explicación de las líneas 1–10:**

Cabecera documental del proyecto; sin lógica.

- **Línea 6**: fecha 2026-07-31 (futura respecto del calendario estándar, ver
  Observaciones).

```tsx
import {
  ESTADO_CONSENTIMIENTO_LABEL,
  ESTADO_SUSCRIPCION_LABEL,
  ORIGEN_COLOR,
  ORIGEN_LABEL,
} from "../lib/format";
```

**Explicación de las líneas 12–17:**

Importa cuatro diccionarios constantes desde `lib/format.ts` (etiquetas y colores).
Todas se usan: verifica por grep que aparecen en las líneas 34, 42, 48 y 49.

```tsx
type Variante = "ok" | "warn" | "err" | "info" | "muted";

const VARIANTE_CLASS: Record<Variante, string> = {
  ok: "badge badge-ok",
  warn: "badge badge-warn",
  err: "badge badge-err",
  info: "badge badge-info",
  muted: "badge badge-muted",
};
```

**Explicación de las líneas 19–27:**

Define el tipo `Variante` (5 valores: verde/ámbar/rojo/azul/gris semánticos) y la
constante `VARIANTE_CLASS`, que asocia cada variante a dos clases CSS (`badge`
base + variante). El diseño usa CSS en lugar de inline styles, lo que permite que
los temas (claro/oscuro) puedan redefinir los colores.

- **Línea 19**: unión de tipos de las variantes visuales.
- **Línea 21**: declaración del mapa tipado `Record<Variante, string>`; fuerza a
  cubrir todas las variantes (el compilador avisaría si faltara una).
- **Líneas 22-26**: mapeo variante → clases.

```tsx
export function BadgeEstadoSuscripcion({ estado }: { estado: string }) {
  let variante: Variante = "muted";
  if (estado === "active") variante = "ok";
  if (estado === "pending_verification") variante = "warn";
  if (estado === "expired") variante = "err";
  return <span className={VARIANTE_CLASS[variante]}>{ESTADO_SUSCRIPCION_LABEL[estado] ?? estado}</span>;
}
```

**Explicación de las líneas 29–35:**

`BadgeEstadoSuscripcion`: recibe el estado de suscripción (string del backend) y
selecciona la variante por comparaciones `if` encadenadas (no switch). Si el estado
no coincide con ninguno conocido, queda `"muted"` (gris, neutro). La etiqueta se
resuelve con el diccionario `ESTADO_SUSCRIPCION_LABEL`, con *fallback* al valor
crudo (`?? estado`) por si el backend emite un estado nuevo no catalogado. Uso de
`??` correcto: muestra el estado crudo en lugar de romper.

- **Línea 30**: inicializa `variante` en `"muted"` (estado desconocido → neutro).
- **Línea 31**: `"active"` → verde.
- **Línea 32**: `"pending_verification"` → ámbar (pendiente de verificación).
- **Línea 33**: `"expired"` → rojo.
- **Línea 34**: renderiza `span` con las clases elegidas y la etiqueta traducida o
  el valor original.

```tsx
export function BadgeConsentimiento({ estado }: { estado: string }) {
  let variante: Variante = "muted";
  if (estado === "OTORGADO") variante = "ok";
  if (estado === "RECHAZADO") variante = "err";
  if (estado === "REVOCADO") variante = "warn";
  return <span className={VARIANTE_CLASS[variante]}>{ESTADO_CONSENTIMIENTO_LABEL[estado] ?? estado}</span>;
}
```

**Explicación de las líneas 37–43:**

`BadgeConsentimiento`: análogo al anterior para estados de consentimiento de
permisos (valores en mayúsculas del backend). `OTORGADO` → verde, `RECHAZADO` →
rojo, `REVOCADO` → ámbar; cualquier otro → `muted`. [NOTA] semántica: un permiso
revocado (ámbar) se considera menos grave que rechazado (rojo); criterio de diseño
del panel.

- **Líneas 38-41**: mapeo de estados a variantes mediante `if`.
- **Línea 42**: renderiza etiqueta con diccionario `ESTADO_CONSENTIMIENTO_LABEL`.

```tsx
export function BadgeOrigen({ origen }: { origen: string | null | undefined }) {
  if (!origen) return <span className="badge badge-muted">sin datos</span>;
  return (
    <span className="badge badge-origen" style={{ borderColor: ORIGEN_COLOR[origen] ?? "#6b7280", color: ORIGEN_COLOR[origen] ?? "#6b7280" }}>
      {ORIGEN_LABEL[origen] ?? origen}
    </span>
  );
}
```

**Explicación de las líneas 45–51:**

`BadgeOrigen`: recibe el origen de la ubicación (`"GPS"`, `"NAVEGADOR"`, `"IP"`,
`"MANUAL"` o ausente). Si es `null`/`undefined`/cadena vacía renderiza un badge
`muted` con "sin datos". En caso contrario usa la clase `badge badge-origen` (que
en CSS tiene borde de 1px sin color fijo, línea 601-604 de `index.css`) y aplica
inline el color de borde y texto tomado de `ORIGEN_COLOR`, con `#6b7280` (gris)
como color de respaldo si el origen no está catalogado. La etiqueta proviene de
`ORIGEN_LABEL` con el mismo patrón de *fallback*.

- **Línea 45**: prop opcional amplia (`string | null | undefined`) porque el
  backend puede devolver `ultimo_origen` nulo.
- **Línea 46**: rama sin datos → badge gris "sin datos".
- **Línea 48**: estilo inline condicional; doble uso del `??` para borde y color
  con el mismo gris de respaldo.
- **Línea 49**: etiqueta legible o valor crudo.

## Fichas de funciones y métodos

### BadgeEstadoSuscripcion (líneas 29–35)

- Firma: `export function BadgeEstadoSuscripcion({ estado }: { estado: string })`.
- Propósito técnico: traducir el estado de suscripción del backend a un badge
  coloreado.
- Propósito funcional: el operador identifica de un vistazo si la suscripción está
  activa, pendiente, expirada o desconocida.
- Parámetros:

| Parámetro | Tipo | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| estado | string | Sí | Estado de suscripción del usuario (`active`, `pending_verification`, `expired`, u otros) |

- Retorno: JSX `span`. No lanza excepciones.
- Dependencias: `VARIANTE_CLASS`, `ESTADO_SUSCRIPCION_LABEL`, clases CSS de badges.
- Flujo interno: 1) inicializa variante a `muted`; 2) ajusta por `if`; 3) renderiza.
- Efectos secundarios: ninguno.
- Riesgos: [BAJO] si el backend añadiera estados nuevos, caen en `muted` mostrando
  la etiqueta cruda; comportamiento seguro aunque menos informativo.

### BadgeConsentimiento (líneas 37–43)

- Firma: `export function BadgeConsentimiento({ estado }: { estado: string })`.
- Propósito técnico: traducir el estado de consentimiento a badge coloreado.
- Propósito funcional: cumplimiento: mostrar si el consentimiento de permisos del
  usuario está otorgado, rechazado, revocado o no catalogado.
- Parámetros:

| Parámetro | Tipo | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| estado | string | Sí | `OTORGADO`, `RECHAZADO`, `REVOCADO` u otros |

- Retorno: JSX `span`. No lanza excepciones.
- Flujo interno: mapeo por `if` (38-41) → render (42).
- Efectos secundarios: ninguno.
- Riesgos: ninguno relevante.

### BadgeOrigen (líneas 45–51)

- Firma: `export function BadgeOrigen({ origen }: { origen: string | null | undefined })`.
- Propósito técnico: mostrar el origen de una ubicación con su color semántico.
- Propósito funcional: distinguir visualmente si la ubicación procede de GPS
  (verde), navegador (azul), IP (ámbar) o captura manual (violeta), o no existe.
- Parámetros:

| Parámetro | Tipo | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| origen | string \| null \| undefined | Sí (puede venir nulo) | Código de origen de la ubicación |

- Retorno: JSX `span` (badge `muted` si no hay origen). No lanza excepciones.
- Dependencias: `ORIGEN_COLOR`, `ORIGEN_LABEL`, clase `badge-origen`.
- Efectos secundarios: ninguno.
- Riesgos: [INFORMATIVO] el estilo inline depende de que `index.css` defina
  `badge-origen` con `border: 1px solid`; si se elimina esa regla, `borderColor`
  inline no tendría efecto visual sin `border-style`.

## Clases / interfaces / tipos

- `type Variante` (línea 19): unión `"ok" | "warn" | "err" | "info" | "muted"`.
  Responsabilidad: restringir los valores permitidos de variante visual. Usada en
  `VARIANTE_CLASS` y como tipo de las variables locales `variante`.
- No hay interfaces ni clases con estado; los componentes son funciones puras.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `VARIANTE_CLASS` define la variante `info` (línea 24) pero
  ningún componente la asigna (ningún `if` produce `"info"`). Es código muerto
  parcial pero inofensivo; `info` podría usarse en el futuro.
  [NIVEL DE CERTEZA: Confirmado por código] (dentro de `admin/src`)
- [NOTA] Fecha de cabecera 2026-07-31, futura; coherente con el resto del módulo.
- [INFORMATIVO] Uso consistente de `??` con *fallback* al valor crudo: ante estados
  nuevos del backend la UI degrada con elegancia (muestra el código original).

## Seguridad

- [INFORMATIVO] No se procesan ni muestran secretos; solo etiquetas de estado. El
  contenido interpolado (etiqueta o estado) se renderiza como texto escapado por
  React, sin riesgo XSS en este componente.
- [BAJO] Si el backend permitiera que `estado`/`origen` contengan cadenas
  controladas por el usuario final (p. ej. datos no validados), se mostrarían tal
  cual; impacto bajo porque React escapa el texto, pero conviene validación en el
  backend por higiene de datos (DAMA-DMBOK).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Sustituir las cadenas de comparación repetidas (`"active"`,
  `"OTORGADO"`, etc.) por constantes tipadas compartidas entre frontend y backend
  para evitar desincronización de vocabulario.
- [RECOMENDACIÓN] Eliminar o documentar el uso de la variante `info` para mantener
  el mapa `VARIANTE_CLASS` coherente con el código real.
- [RECOMENDACIÓN] Evaluar migrar `BadgeOrigen` a estilos por clase (como el resto
  de badges) en vez de colores inline, para facilitar temas y mantener
  consistencia.
