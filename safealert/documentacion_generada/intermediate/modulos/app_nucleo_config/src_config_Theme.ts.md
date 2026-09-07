# Archivo: src/config/Theme.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/config/Theme.ts | 70 | TypeScript 5.9 | 2105 | Configuración / Design tokens (Material Design 3) | APARENTEMENTE NO UTILIZADO | Altamente probable |

## Objetivo

Define un objeto único de configuración visual, `MD3_THEME`, inspirado en Material
Design 3 (M3), con una paleta semántica de colores (primary/secondary/tertiary/error,
surface y outline), una tipografía reducida, escala de espaciado y radios de forma.
Según su cabecera, su propósito declarado es servir como "sistema de diseño" para que
los componentes importen `MD3_THEME`. No exporta tipos ni funciones: es únicamente un
objeto de constantes de estilo.

[OBSERVACIÓN TÉCNICA] Este archivo convive con un sistema de tokens más completo y
operativo en `src/theme/tokens.ts` (color, spacing, borderRadius, typography, shadow)
que es el que realmente consumen las pantallas y componentes. `Theme.ts` parece un
intento temprano (fecha 2026-03-21) de design system M3 que quedó desbancado por la
capa `src/theme/*` (fechada 2026-06-29).

## Clasificación y estado

Etiqueta: `APARENTEMENTE NO UTILIZADO` con marcador `[POTENCIALMENTE NO UTILIZADO]`.

Justificación: la búsqueda grep de `MD3_THEME` y `config/Theme` sobre `src/`, `app/`
e `iphone/` solo encuentra referencias dentro del propio archivo (cabecera y
declaración). Ningún componente, hook, store ni pantalla importa `MD3_THEME` ni la ruta
`src/config/Theme`. El design system en uso real es `src/theme/index.ts` +
`src/theme/tokens.ts`. No se recomienda eliminarlo sin una decisión explícita del
equipo, pero sí marcarlo como candidato a retirar o migrar.

[NIVEL DE CERTEZA: Altamente probable] — búsqueda exhaustiva de referencias en el
árbol fuente de la aplicación (src/, app/ e iphone/), incluyendo imports relativos y
por alias `@/`.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna (archivo sin imports) | — | — | — |

El archivo no importa nada: es puro TypeScript de constantes. No hay dependencias de
entrada ni de salida hacia otras librerías.

## Componentes que dependen de este archivo

Ninguno detectado. La búsqueda grep de `MD3_THEME` sobre `src/`, `app/` e `iphone/`
devuelve únicamente las líneas 8 y 11 de este mismo archivo. No existen importaciones
de `src/config/Theme` ni de `MD3_THEME` en ningún otro lugar del código fuente de la
app principal ni de la variante `iphone/`.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| MD3_THEME | Objeto anidado (ver filas siguientes) | `{ colors, typography, spacing, shape }` (const, sin `as const`) | Design tokens M3 | Ninguna fuera del archivo |

Subsecciones de `MD3_THEME`:

| Nombre | Valor | Tipo | Finalidad |
| --- | --- | --- | --- |
| colors.primary | '#DC2626' (Red 600) | string | Color principal de intención (seguridad/alerta) |
| colors.onPrimary | '#FFFFFF' | string | Contenido sobre primary |
| colors.primaryContainer | '#FEE2E2' | string | Contenedor primario |
| colors.onPrimaryContainer | '#450A0A' | string | Contenido sobre contenedor primario |
| colors.secondary | '#4B5563' (Gray 600) | string | Elementos de soporte |
| colors.onSecondary | '#FFFFFF' | string | Contenido sobre secondary |
| colors.secondaryContainer | '#F3F4F6' | string | Contenedor secundario |
| colors.onSecondaryContainer | '#111827' | string | Contenido sobre contenedor secundario |
| colors.tertiary | '#7C3AED' (Violet 600) | string | Acentos o estados especiales (IA/Análisis) |
| colors.onTertiary | '#FFFFFF' | string | Contenido sobre tertiary |
| colors.tertiaryContainer | '#EDE9FE' | string | Contenedor terciario |
| colors.onTertiaryContainer | '#2E1065' | string | Contenido sobre contenedor terciario |
| colors.error | '#B91C1C' | string | Estado crítico/error |
| colors.onError | '#FFFFFF' | string | Contenido sobre error |
| colors.errorContainer | '#FFF1F2' | string | Contenedor de error |
| colors.onErrorContainer | '#4C0505' | string | Contenido sobre contenedor de error |
| colors.background | '#F9FAFB' | string | Fondo general |
| colors.onBackground | '#111827' | string | Contenido sobre fondo |
| colors.surface | '#FFFFFF' | string | Superficie de tarjetas |
| colors.onSurface | '#111827' | string | Contenido sobre superficie |
| colors.surfaceVariant | '#F3F4F6' | string | Superficie variante |
| colors.onSurfaceVariant | '#4B5563' | string | Contenido sobre superficie variante |
| colors.outline | '#D1D5DB' | string | Bordes/outlines |
| typography.displayLarge | fontSize 57 / weight '400' / letterSpacing -0.25 | object | Texto display grande M3 |
| typography.headlineMedium | fontSize 28 / weight '400' | object | Titular medio M3 |
| typography.titleMedium | fontSize 16 / weight '500' / letterSpacing 0.15 | object | Título medio M3 |
| typography.bodyLarge | fontSize 16 / weight '400' / letterSpacing 0.5 | object | Cuerpo grande M3 |
| typography.labelMedium | fontSize 12 / weight '500' / letterSpacing 0.5 | object | Etiqueta media M3 |
| spacing.xs/sm/md/lg/xl | 4 / 8 / 16 / 24 / 32 | number | Escala de espaciado |
| shape.none | 0 | number | Sin radio |
| shape.extraSmall | 4 | number | Radio extra pequeño |
| shape.small | 8 | number | Radio pequeño |
| shape.medium | 12 | number | Radio medio |
| shape.large | 16 | number | Radio grande |
| shape.full | 9999 | number | Radio completo (píldora/círculo) |

No hay secretos en este archivo: los valores son códigos de color y medidas
públicamente embebidas en el bundle.

## Estructura (funciones / clases / tipos)

No exporta funciones, clases, interfaces ni hooks. Única exportación: la constante
`MD3_THEME` (objeto literal anidado). No hay lógica ejecutable.

## Análisis línea por línea

**Bloque líneas 1-9 (cabecera de archivo):**

```ts
/* ============================================================================
* Archivo         : Theme.ts
* Descripción     : Sistema de diseño basado en Material Design 3 (M3) y colores dinámicos.
* Autor           : oafon
* Fecha           : 2026-03-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importar MD3_THEME para estilos de componentes.
* ============================================================================ */
```

**Explicación de las líneas 1-9:**
Comentario de cabecera estándar del proyecto. Aporta metadatos útiles: autor, fecha,
versión y uso declarado. Indica que el archivo está pensado para que los componentes
importen `MD3_THEME`, lo cual no ocurre en la práctica (ver sección Clasificación).

**Bloque líneas 11-47 (colors):**

```ts
export const MD3_THEME = {
  colors: {
    // Primary - Refleja la intención principal (Seguridad/Alerta)
    primary: '#DC2626', // Red 600
    onPrimary: '#FFFFFF',
    primaryContainer: '#FEE2E2',
    onPrimaryContainer: '#450A0A',

    // Secondary - Para elementos de soporte
    secondary: '#4B5563', // Gray 600
    onSecondary: '#FFFFFF',
    secondaryContainer: '#F3F4F6',
    onSecondaryContainer: '#111827',

    // Tertiary - Acentos o estados especiales (IA/Análisis)
    tertiary: '#7C3AED', // Violet 600
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#EDE9FE',
    onTertiaryContainer: '#2E1065',

    // Error - Crítico
    error: '#B91C1C',
    onError: '#FFFFFF',
    errorContainer: '#FFF1F2',
    onErrorContainer: '#4C0505',

    // Background & Surface
    background: '#F9FAFB',
    onBackground: '#111827',
    surface: '#FFFFFF',
    onSurface: '#111827',
    surfaceVariant: '#F3F4F6',
    onSurfaceVariant: '#4B5563',

    // Outline
    outline: '#D1D5DB',
  },
```

**Explicación de las líneas 11-47:**
- **Línea 11** (`export const MD3_THEME = {`): declara y exporta el objeto único del
  sistema de diseño.
- **Línea 12** (`colors: {`): abre la paleta semántica M3.
- **Líneas 13-17**: grupo Primary. La línea 13 es un comentario que explica la
  intención semántica (seguridad/alerta). La línea 14 define el rojo `#DC2626`
  (Red 600 de Tailwind) como color primario, coherente con una app de emergencias.
  Las líneas 15-17 definen los pares de contraste M3 (onPrimary y contenedores).
- **Líneas 19-23**: grupo Secondary (gris `#4B5563`) para elementos de soporte.
- **Líneas 25-29**: grupo Tertiary (violeta `#7C3AED`) comentado como reservado para
  IA/análisis.
- **Líneas 31-35**: grupo Error con rojo oscuro `#B91C1C` para estados críticos.
- **Líneas 37-43**: Background/Surface. Valores neutros claros (fondo `#F9FAFB`,
  superficie blanca). El texto sobre superficie usa gris casi negro `#111827`.
- **Líneas 45-46**: Outline `#D1D5DB` para bordes.

Los valores de color coinciden con los tokens semánticos operativos de
`src/theme/tokens.ts` (danger = '#DC2626', background = '#F9FAFB', etc.), lo que
refuerza la hipótesis de que `Theme.ts` fue la semilla de la que derivaron los tokens.

**Bloque líneas 48-54 (typography):**

```ts
  typography: {
    displayLarge: { fontSize: 57, fontWeight: '400', letterSpacing: -0.25 },
    headlineMedium: { fontSize: 28, fontWeight: '400' },
    titleMedium: { fontSize: 16, fontWeight: '500', letterSpacing: 0.15 },
    bodyLarge: { fontSize: 16, fontWeight: '400', letterSpacing: 0.5 },
    labelMedium: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  },
```

**Explicación de las líneas 48-54:**
- **Línea 48** (`typography: {`): abre el subobjeto tipográfico con nombres de roles M3.
- **Línea 49**: `displayLarge` (57 px, peso 400) — gran titular; el letterSpacing
  negativo -0.25 es típico de tamaños grandes M3.
- **Línea 50**: `headlineMedium` (28 px).
- **Línea 51**: `titleMedium` (16 px, peso 500, tracking 0.15).
- **Línea 52**: `bodyLarge` (16 px, peso 400).
- **Línea 53**: `labelMedium` (12 px, peso 500).

Esta escala M3 no se corresponde 1:1 con la tipografía de `tokens.ts` (h1-h3, body,
caption, button), que es la realmente usada. Es otra señal de duplicidad entre ambos
sistemas.

**Bloque líneas 55-61 (spacing):**

```ts
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
```

**Explicación de las líneas 55-61:**
Escala de espaciado en puntos: 4-8-16-24-32. [OBSERVACIÓN TÉCNICA] Los valores
difieren de `tokens.ts` (sm: 8, md: 12, lg: 16, xl: 20, 2xl: 24, ...), por lo que si
un componente mezclara ambos sistemas obtendría espaciados inconsistentes. Hoy no hay
mezcla porque `MD3_THEME` no se consume.

**Bloque líneas 62-69 (shape):**

```ts
  shape: {
    none: 0,
    extraSmall: 4,
    small: 8,
    medium: 12,
    large: 16,
    full: 9999,
  }
};
```

**Explicación de las líneas 62-69:**
- **Líneas 63-68**: radios de forma (0, 4, 8, 12, 16, 9999). `full: 9999` produce
  formas de píldora/círculo. Los valores también difieren ligeramente de
  `borderRadius` de `tokens.ts` (sm: 6, md: 10, lg: 14, xl: 18, full: 9999).
- **Línea 69** (`};`): cierra el objeto `MD3_THEME`. Nótese que el objeto NO usa
  `as const`, por lo que las cadenas de color se infieren como `string` y no hay
  tipado literal estricto.

## Fichas de funciones y métodos

No aplica: el archivo no contiene lógica ejecutable ni funciones.

## Clases / interfaces / tipos

No define clases, interfaces ni tipos exportados. El tipo de `MD3_THEME` es inferido
por TypeScript a partir del literal.

## Observaciones técnicas

- `[POTENCIALMENTE NO UTILIZADO]` `MD3_THEME` no tiene ningún consumidor en
  `src/`, `app/` ni `iphone/`. [NIVEL DE CERTEZA: Altamente probable]
- `[OBSERVACIÓN TÉCNICA]` Existe duplicidad de design tokens entre este archivo y
  `src/theme/tokens.ts`, con valores de spacing/radios/tipografía que NO coinciden
  entre sí. Mantener dos fuentes de verdad visuales es un riesgo de deriva de UI.
- `[OBSERVACIÓN TÉCNICA]` Fechas dispares: `Theme.ts` es de 2026-03-21 (v1.0.0) y el
  sistema `src/theme/` es de 2026-06-29, lo que sugiere reemplazo no completado (el
  archivo viejo no fue eliminado).

## Seguridad

No se detectan hallazgos de seguridad: el archivo contiene exclusivamente valores de
presentación (colores, medidas) que son públicos por diseño al estar embebidos en el
bundle. No hay credenciales, tokens, paths ni logging.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: código muerto que añade ruido y ambigüedad sobre cuál es la fuente
  de verdad visual del proyecto.
- `[RECOMENDACIÓN]` Decidir entre migrar/eliminar `MD3_THEME` o bien documentar su
  retiro explícito; consolidar toda la UI sobre `src/theme/tokens.ts`.
- `[RECOMENDACIÓN]` Si se conserva a corto plazo, eliminar la duplicidad de valores
  re-exportando desde `tokens.ts` en lugar de definirlos de nuevo.
