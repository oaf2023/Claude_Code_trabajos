# Archivo: admin/src/components/KpiCard.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/components/KpiCard.tsx | 30 | TypeScript 5.9 / React 19 (TSX) | 1139 | Componente UI de tarjeta KPI (presentacional) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define la tarjeta reutilizable de indicador clave de rendimiento (KPI) de la
pantalla Dashboard. Muestra un título, un valor (numérico o texto) y un detalle
opcional, con una barra de acento de color configurable a la izquierda. El formato
numérico aplica localización argentina (`es-AR`) para miles. Responsabilidad
exclusivamente visual, sin lógica de negocio.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Es el componente de exportación por defecto y
se consume únicamente en `pages/Dashboard.tsx` (grep real): importado en línea 32,
instanciado en líneas 93-97 con cinco KPIs distintos.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| (sin importaciones) | — | — | Solo JSX; transform automático `jsx: react-jsx` | Sí |

## Componentes que dependen de este archivo

Referencia real hallada con grep sobre `admin/src`:

- `pages/Dashboard.tsx` (línea 32): `import KpiCard from "../components/KpiCard";`
  Usos en líneas 93-97 (Usuarios registrados, Usuarios activos 24 h, Ubicaciones
  registradas, Accesos técnicos, Consentimientos).

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `color` (prop con default) | `"#3b82f6"` (azul) | string | Color de la barra de acento cuando no se provee | Línea 19 |
| `"es-AR"` | locale argentino | string | Formato de número con separador de miles | Línea 25 |

Valor mágico `#3b82f6`: azul primario idéntico a la variable CSS `--acento`
(`index.css` línea 20). [NIVEL DE CERTEZA: Confirmado por código]

## Estructura (funciones / clases / tipos)

- `interface KpiCardProps` — props del componente.
- `KpiCard({ titulo, valor, detalle, color = "#3b82f6" }: KpiCardProps)` — componente
  funcional exportado por defecto.

## Análisis línea por línea

```tsx
/* ============================================================================
 * Archivo         : KpiCard.tsx
 * Descripción     : Tarjeta de indicador clave (KPI) con título, valor,
 *                   detalle y color de acento.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Utilizado en la pantalla Dashboard
 * ========================================================================== */
```

**Explicación de las líneas 1–10:**

Cabecera documental del proyecto; sin lógica.

- **Línea 6**: fecha 2026-07-31 (futura, coherente con el repositorio).

```tsx
interface KpiCardProps {
  titulo: string;
  valor: number | string;
  detalle?: string;
  color?: string;
}
```

**Explicación de las líneas 12–17:**

Declara la interfaz de props: `titulo` obligatorio, `valor` numérico o de texto
(para KPIs no numéricos), `detalle` y `color` opcionales. Permite al Dashboard
personalizar acento y descripción por KPI.

- **Línea 13**: título mostrado.
- **Línea 14**: `valor` acepta `number | string` (flexibilidad para métricas
  textuales).
- **Línea 15**: `detalle` opcional (subtexto).
- **Línea 16**: `color` opcional (acento de la barra).

```tsx
export default function KpiCard({ titulo, valor, detalle, color = "#3b82f6" }: KpiCardProps) {
  return (
    <div className="kpi-card">
      <span className="kpi-accent" style={{ backgroundColor: color }} />
      <div className="kpi-body">
        <span className="kpi-titulo">{titulo}</span>
        <span className="kpi-valor">{typeof valor === "number" ? valor.toLocaleString("es-AR") : valor}</span>
        {detalle && <span className="kpi-detalle">{detalle}</span>}
      </div>
    </div>
  );
}
```

**Explicación de las líneas 19–29:**

Componente `KpiCard`. Renderiza un `div.kpi-card` (tarjeta con borde/fondo en CSS)
que contiene: (1) `span.kpi-accent`, una barra vertical de 5px cuyo color se aplica
inline desde la prop `color` (default azul); (2) `div.kpi-body` con `span.kpi-titulo`
(etiqueta), `span.kpi-valor` (valor formateado) y, condicionalmente, `span.kpi-detalle`.

- **Línea 19**: firma con desestructuración y default de `color`.
- **Línea 21**: contenedor de la tarjeta (CSS `.kpi-card`, `index.css` 362-368).
- **Línea 22**: barra de acento con `backgroundColor` inline.
- **Línea 24**: título (clase `.kpi-titulo`, texto suave pequeño).
- **Línea 25**: si `valor` es número, `toLocaleString("es-AR")` inserta separador de
  miles con formato argentino (p. ej. `1.234.567`); si es cadena, se muestra tal
  cual.
- **Línea 26**: render condicional del detalle solo si existe (`{detalle && ...}`).
- **Líneas 27-28**: cierre de estructura JSX.

## Fichas de funciones y métodos

### KpiCard (líneas 19–29)

- Firma: `export default function KpiCard({ titulo, valor, detalle, color = "#3b82f6" }: KpiCardProps)`.
- Propósito técnico: componente presentacional de tarjeta KPI con acento de color
  configurable.
- Propósito funcional: resumir métricas clave del panel (usuarios, ubicaciones,
  accesos, consentimientos) de forma visualmente homogénea.
- Parámetros:

| Parámetro | Tipo | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| titulo | string | Sí | Etiqueta de la métrica |
| valor | number \| string | Sí | Valor a mostrar (se formatea con `es-AR` si es numérico) |
| detalle | string | No | Subtexto aclaratorio |
| color | string | No (default `"#3b82f6"`) | Color de la barra de acento |

- Retorno: JSX `div.kpi-card`. No lanza excepciones.
- Dependencias: clases CSS `.kpi-card`, `.kpi-accent`, `.kpi-body`, `.kpi-titulo`,
  `.kpi-valor`, `.kpi-detalle` de `index.css`.
- Flujo interno: desestructura props → construye JSX condicional → retorna.
- Efectos secundarios: ninguno.
- Riesgos: [INFORMATIVO] si `valor` fuera `NaN` o `Infinity` de tipo number,
  `toLocaleString` los mostraría como "NaN"/"Infinity"; los consumidores calculan
  los KPIs desde el backend (`StatsAdmin`), por lo que depende de la calidad de los
  datos. Sin impacto relevante.

## Clases / interfaces / tipos

- `interface KpiCardProps` (líneas 12-17): describe el contrato de props. Campos
  detallados arriba. No tiene métodos ni ciclo de vida (interfaz de tipo, solo
  compilación).

## Observaciones técnicas

- [NOTA] La fecha de cabecera (2026-07-31) es futura; coherente con el resto del
  módulo.
- [INFORMATIVO] El color por defecto `#3b82f6` duplica la variable CSS `--acento`;
  si se re-tematizara el dashboard, las tarjetas sin `color` explícito conservarían
  el azul fijo. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [INFORMATIVO] Sin hallazgos de seguridad: componente sin entradas peligrosas,
  datos que renderiza provienen del backend y React escapa el contenido textual.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Usar la variable CSS `--acento` vía clase (`.kpi-accent` con
  `background: var(--acento)`) como valor por defecto, reservando la prop `color`
  solo para excepciones.
- [RECOMENDACIÓN] Definir `KpiCardProps` como `export interface` si otros módulos
  necesitaran tipar la tarjeta.
