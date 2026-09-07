# Archivo: admin/src/components/Alerta.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| admin/src/components/Alerta.tsx | 27 | TypeScript 5.9 / React 19 (TSX) | 927 | Componente UI de feedback (presentacional) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define dos componentes de presentación reutilizables para el dashboard admin:
`ErrorAlerta`, que muestra un mensaje de error enmarcado con semántica accesible
(`role="alert"`), y `Spinner`, que muestra un indicador de carga animado junto a un
texto opcional. Su responsabilidad es exclusivamente visual: no contienen lógica de
negocio ni llamadas a servicios, y reciben todo su contenido por props.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`. Ambos componentes están exportados y son
importados por cinco pantallas del panel (Dashboard, Usuarios, UsuarioDetalle,
PagoSimulado y Admin), según búsqueda grep realizada sobre `admin/src`.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| (sin importaciones) | — | — | El archivo no importa nada: usa solo JSX y el transform automático de React (jsx: react-jsx) | Sí |

## Componentes que dependen de este archivo

Referencias reales halladas con grep sobre `admin/src`:

- `pages/Dashboard.tsx` (línea 33): importa `ErrorAlerta, Spinner`; usa `ErrorAlerta`
  y `Spinner` en líneas 60-61.
- `pages/Usuarios.tsx` (línea 18): importa `ErrorAlerta, Spinner`; usos en líneas 78-80.
- `pages/UsuarioDetalle.tsx` (línea 28): importa `ErrorAlerta, Spinner`; usos en
  líneas 68-70.
- `pages/PagoSimulado.tsx` (línea 25): importa `ErrorAlerta`; uso en línea 144.
- `pages/Admin.tsx` (línea 15): importa `ErrorAlerta, Spinner`; usos en líneas 71, 76 y 123.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| (sin variables globales) | — | — | Solo existen props y estado interno de cada componente | — |

## Estructura (funciones / clases / tipos)

- `ErrorAlerta({ mensaje }: { mensaje: string })` — componente funcional exportado.
- `Spinner({ texto = "Cargando…" }: { texto?: string })` — componente funcional exportado.
- No hay clases, interfaces ni hooks personalizados.

## Análisis línea por línea

```tsx
/* ============================================================================
 * Archivo         : Alerta.tsx
 * Descripción     : Componentes de feedback: alerta de error y spinner
 *                   de carga para las pantallas del dashboard.
 * Autor           : oafon / AI Assistant
 * Fecha           : 2026-07-31
 * Versión         : 1.0.0
 * Lenguaje        : TypeScript 5.9 / React 19
 * Uso             : Utilizado en todas las páginas del dashboard
 * ========================================================================== */
```

**Explicación de las líneas 1–10:**

Cabecera documental obligatoria del proyecto (según convención interna de scripts):
indica archivo, descripción, autor, fecha, versión, lenguaje y uso. No aporta
lógica; solo documentación.

- **Línea 5**: autor "oafon / AI Assistant"; indica que el archivo fue generado con
  asistencia de IA.
- **Línea 6**: fecha 2026-07-31; [NOTA] es una fecha futura respecto del calendario
  estándar, coherente con el resto del repositorio.

```tsx
export function ErrorAlerta({ mensaje }: { mensaje: string }) {
  return (
    <div className="alerta-error" role="alert">
      <strong>Error:</strong> {mensaje}
    </div>
  );
}
```

**Explicación de las líneas 12–18:**

Define el componente `ErrorAlerta`. Renderiza un `div` con la clase CSS
`alerta-error` (estilos definidos en `src/index.css`, fondo/borde rojizos) y con
`role="alert"`, lo que hace que los lectores de pantalla anuncien el contenido de
forma inmediata. Muestra el literal "Error:" en negrita seguido del mensaje
recibido por prop. El texto se renderiza como hijo de React, por lo que React
escapa el contenido por defecto y no es vulnerable a inyección XSS por este canal.

- **Línea 12**: firma del componente; tipa la prop `mensaje` como `string`
  obligatoria.
- **Línea 14**: `div` contenedor con clase `alerta-error` y `role="alert"`
  (accesibilidad).
- **Línea 15**: `strong` con "Error:" más el valor interpolado de `mensaje`.

```tsx
export function Spinner({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div className="spinner-box">
      <span className="spinner" />
      <span>{texto}</span>
    </div>
  );
}
```

**Explicación de las líneas 20–26:**

Define el componente `Spinner`. La prop `texto` es opcional con valor por defecto
"Cargando…" (valor mágico con significado literal). Renderiza un contenedor
`spinner-box` con un `span` vacío de clase `spinner` (animado por CSS con la
keyframe `girar` en `index.css`) y un `span` con el texto. No recibe control de
estado: la visibilidad la decide el padre condicionalmente.

- **Línea 20**: firma con parámetro desestructurado y valor por defecto `"Cargando…"`.
- **Línea 22**: contenedor flex centrado.
- **Línea 23**: `span` vacío autocerrado que dibuja el aro giratorio vía CSS.
- **Línea 24**: `span` con el texto opcional.

## Fichas de funciones y métodos

### ErrorAlerta (líneas 12–18)

- Firma: `export function ErrorAlerta({ mensaje }: { mensaje: string })`.
- Propósito técnico: componente presentacional que encapsula el patrón visual de
  error del dashboard.
- Propósito funcional: informar al operador del panel de un fallo (red, API,
  validación) de forma consistente y accesible.
- Parámetros:

| Parámetro | Tipo | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| mensaje | string | Sí | Texto del error a mostrar tras el literal "Error:" |

- Retorno: JSX (`div` con `role="alert"`). No lanza excepciones.
- Dependencias: ninguna externa; estilos de `index.css` (`.alerta-error`).
- Flujo interno: recibe prop → renderiza contenedor con texto.
- Funciones que llama: ninguna. Desde dónde se llama: pantallas Dashboard, Usuarios,
  UsuarioDetalle, PagoSimulado y Admin.
- Efectos secundarios: ninguno (componente puro).
- Riesgos: [INFORMATIVO] si `mensaje` contuviera HTML, React lo escapa al
  renderizarlo como texto; no hay riesgo XSS por esta vía.

### Spinner (líneas 20–26)

- Firma: `export function Spinner({ texto = "Cargando…" }: { texto?: string })`.
- Propósito técnico: indicador de carga reutilizable.
- Propósito funcional: comunicar estados de espera mientras se resuelven llamadas
  asíncronas del panel.
- Parámetros:

| Parámetro | Tipo | Obligatorio | Finalidad |
| --- | --- | --- | --- |
| texto | string | No (default `"Cargando…"`) | Etiqueta junto al spinner |

- Retorno: JSX (`div.spinner-box` con dos `span`). No lanza excepciones.
- Dependencias: estilos `.spinner-box`, `.spinner` y keyframes `girar` de `index.css`.
- Flujo interno: renderiza contenedor, aro animado y texto.
- Efectos secundarios: ninguno.
- Riesgos: ninguno relevante.

## Clases / interfaces / tipos

No declara clases, interfaces ni tipos exportables. Los tipos de props se definen
inline en las firmas.

## Observaciones técnicas

- [NOTA] La fecha de cabecera (2026-07-31) es futura; indicio de que el repositorio
  usa un calendario de proyecto propio o reloj de desarrollo adelantado.
  [NIVEL DE CERTEZA: Inferido]
- [INFORMATIVO] El componente `Spinner` declara clase `spinner` sobre un `span`
  vacío; el giro depende 100 % de CSS (`@keyframes girar`), por lo que sin
  `index.css` cargado no hay animación.

## Seguridad

- [INFORMATIVO] `role="alert"` mejora accesibilidad y aviso a tecnologías de
  asistencia; sin hallazgos de seguridad relevantes en este archivo (no maneja
  datos sensibles ni entradas de usuario).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Mantener un único componente de error evita divergencia visual
  entre pantallas; si en el futuro se añade logging de errores, centralizarlo aquí
  con cuidado de no volcar datos personales ni claves a consola.
- [RECOMENDACIÓN] Los mensajes de error mostrados (`mensaje`) provienen de
  excepciones de red/API; conviene que el backend no incluya trazas internas en
  `body.error` que pudieran filtrarse a la UI (ver análisis de `api.ts`).
