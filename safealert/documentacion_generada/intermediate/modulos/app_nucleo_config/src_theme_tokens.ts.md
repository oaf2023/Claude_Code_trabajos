# Archivo: src/theme/tokens.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/theme/tokens.ts | 113 | TypeScript 5.9 | 3082 | Design system / Tokens (única fuente de verdad visual) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Define los design tokens de SafeAlert: colores semánticos y neutros, escala de
espaciado, radios de borde, tipografía y sombras. Se declara como la "única fuente de
verdad para la interfaz" (cabecera) y se rige por el principio que describe el propio
archivo: "neutro cuando protege, ámbar cuando está limitada, rojo solo durante una
emergencia real". Exporta además los tipos derivados `ColorKey`, `SpacingKey` y
`BorderRadiusKey` para tipar consumos de tokens.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — es el token central del design system,
consumido directa e indirectamente por config, componentes del theme, componentes de
UI y pantallas (ver dependientes).

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna (archivo sin imports) | — | — | — |

Archivo puramente declarativo de constantes; no importa nada.

## Componentes que dependen de este archivo

Consumidores directos (import de `../theme/tokens` o del índice que lo re-exporta):

| Archivo dependiente | Símbolos usados |
| --- | --- |
| src/config/constants.ts | color (para COLORS) |
| src/theme/Button.tsx | color, spacing, borderRadius, typography, shadow |
| src/theme/Card.tsx | color, spacing, borderRadius, shadow |
| src/theme/Icon.tsx | color |
| src/theme/index.ts | Re-export de todos los tokens y tipos |
| src/components/WebModeBanner.tsx | color, spacing, borderRadius, typography |
| src/components/M3Button.tsx | (vía theme/Button) |
| app/(tabs)/_layout.tsx | color (vía ../../src/theme) |
| app/(tabs)/settings.tsx | color, spacing, borderRadius, shadow (vía theme) |
| app/_layout.tsx | color (vía theme) |
| app/(tabs)/index.tsx | color, spacing, borderRadius, typography, shadow |
| app/(tabs)/history.tsx | color, spacing |
| app/(tabs)/contacts.tsx | color, spacing, borderRadius, shadow |
| app/como-funciona.tsx, bienvenida.tsx, permissions.tsx, test-alert.tsx, contacts/[id].tsx | color, spacing, borderRadius, shadow (vía theme) |
| src/components/PaymentModal.tsx, TrialExpiredModal.tsx, PaymentOverdueModal.tsx | color (vía ../theme) |

El índice `src/theme/index.ts` re-exporta `color, spacing, borderRadius, typography,
shadow` y los tipos `ColorKey`, `SpacingKey`, de modo que la mayoría de consumidores
de pantalla los obtienen desde el barril del theme.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| color | Objeto con 4 grupos (semánticos, neutros, fondo/superficie, texto, bordes) | const object | Paleta de colores | Amplia (ver dependientes) |
| spacing | Escala xs(4)..5xl(48) | const object | Espaciado | Componentes/pantallas |
| borderRadius | sm(6), md(10), lg(14), xl(18), full(9999) | const object | Radios de borde | Componentes/pantallas |
| typography | h1, h2, h3, body, bodySmall, caption, button, buttonSmall | const object | Estilos tipográficos | Pantallas |
| shadow | sm, md, lg (iOS shadow + elevation Android) | const object | Sombras | Card, pantallas |
| ColorKey | keyof typeof color | type | Tipo de claves de color | Consumidores tipados |
| SpacingKey | keyof typeof spacing | type | Tipo de claves de spacing | Consumidores tipados |
| BorderRadiusKey | keyof typeof borderRadius | type | Tipo de claves de radio | Consumidores tipados |

Valores relevantes de `color` (todos públicos, sin secretos):

| Clave | Valor | Significado |
| --- | --- | --- |
| danger | '#DC2626' | Rojo de emergencia (CTA principal SOS) |
| dangerDark | '#991B1B' | Rojo oscuro (estados presionados) |
| dangerLight | '#FEE2E2' | Fondo rojo claro (contenedores de alerta) |
| safe | '#16A34A' | Verde "protege" (estado seguro/confirmación) |
| safeDark | '#15803D' | Verde oscuro |
| safeLight | '#DCFCE7' | Fondo verde claro |
| warning | '#D97706' | Ámbar "limitada" (avisos) |
| warningDark | '#B45309' | Ámbar oscuro |
| warningLight | '#FEF3C7' | Fondo ámbar claro |
| neutral50..neutral900 | '#F9FAFB' .. '#111827' | Escala de grises (9 pasos) |
| background | '#F9FAFB' | Fondo general |
| surface / surfaceElevated | '#FFFFFF' | Superficies |
| overlay | 'rgba(0,0,0,0.5)' | Fondo de overlays/modales |
| textPrimary | '#111827' | Texto principal |
| textSecondary | '#6B7280' | Texto secundario |
| textMuted | '#9CA3AF' | Texto tenue |
| textInverse | '#FFFFFF' | Texto sobre color de acción |
| textLink | '#2563EB' | Enlaces |
| border | '#E5E7EB' | Bordes por defecto |
| borderFocus | '#3B82F6' | Borde en foco |

## Estructura (funciones / clases / tipos)

- Constantes `color`, `spacing`, `borderRadius`, `typography`, `shadow` — todas con
  `as const` para tipado literal.
- Tipos derivados `ColorKey`, `SpacingKey`, `BorderRadiusKey` (líneas 111-113).
- Sin funciones ni clases.

## Análisis línea por línea

**Bloque líneas 1-54 (cabecera y color):**

```ts
/* ============================================================================
* Archivo         : tokens.ts
* Descripción     : Design system tokens — colores, tipografía, spacing,
*                   sombras y radios. Única fuente de verdad para la interfaz.
*                   Basado en el principio: neutro cuando protege, ámbar cuando
*                   está limitada, rojo solo durante una emergencia real.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { color, spacing, typography } from '../theme/tokens'
* ============================================================================ */

export const color = {
  // Semánticos principales
  danger: '#DC2626',
  dangerDark: '#991B1B',
  dangerLight: '#FEE2E2',
  safe: '#16A34A',
  safeDark: '#15803D',
  safeLight: '#DCFCE7',
  warning: '#D97706',
  warningDark: '#B45309',
  warningLight: '#FEF3C7',

  // Neutros (escala)
  neutral50: '#F9FAFB',
  neutral100: '#F3F4F6',
  neutral200: '#E5E7EB',
  neutral300: '#D1D5DB',
  neutral400: '#9CA3AF',
  neutral500: '#6B7280',
  neutral600: '#4B5563',
  neutral700: '#374151',
  neutral800: '#1F2937',
  neutral900: '#111827',

  // Fondo y superficie
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.5)',

  // Texto
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',
  textLink: '#2563EB',

  // Bordes
  border: '#E5E7EB',
  borderFocus: '#3B82F6',
} as const;
```

**Explicación de las líneas 1-54:**
- **Líneas 1-12**: cabecera; fija el principio de diseño (neutro/ámbar/rojo) y el uso.
- **Línea 14**: apertura de `color`.
- **Líneas 16-24**: semánticos principales con sus tres tonos (base/dark/light):
  danger (rojo emergencia), safe (verde), warning (ámbar).
- **Líneas 27-36**: escala neutra de 9 pasos (50 a 900), escala estándar tipo
  Tailwind/Gray.
- **Líneas 39-42**: fondo/superficie (blanco para surface y surfaceElevated) y
  `overlay` semitransparente para modales.
- **Líneas 45-49**: texto (principal, secundario, tenue, inverso y enlace azul).
- **Líneas 52-53**: bordes (default gris y foco azul).
- **Línea 54**: `as const` — congela el objeto y deriva literales exactos, permitiendo
  que `ColorKey` sea unión de claves literales.

**Bloque líneas 56-74 (spacing y borderRadius):**

```ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  full: 9999,
} as const;
```

**Explicación de las líneas 56-74:**
- **Líneas 56-66**: escala de espaciado de 4 a 48 puntos con pasos crecientes (4, 8,
  12, 16, 20, 24, 32, 40, 48). Las claves '2xl'-'5xl' requieren comillas (no son
  identificadores válidos). Es la escala operativa del proyecto (NÓTESE que difiere de
  la escala de `src/config/Theme.ts`: allí md=16, aquí md=12; el sistema operativo es
  este archivo).
- **Líneas 68-74**: radios de borde (6, 10, 14, 18 y full=9999 para formas de
  píldora). También difieren de `Theme.ts` (shape: 8/12/16) — tokens es la fuente
  real.

**Bloque líneas 76-109 (typography y shadow):**

```ts
export const typography = {
  h1: { fontSize: 26, fontWeight: '800' as const, lineHeight: 34, letterSpacing: -0.02 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  button: { fontSize: 17, fontWeight: '700' as const, letterSpacing: 0.3 },
  buttonSmall: { fontSize: 14, fontWeight: '600' as const, letterSpacing: 0.2 },
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
} as const;
```

**Explicación de las líneas 76-109:**
- **Líneas 76-85**: escala tipográfica por roles (h1-h3, body, bodySmall, caption,
  button, buttonSmall). Los `fontWeight` se fijan con `as const` para tiparlos como
  literales válidos de RN (`'800'`, `'700'`, ...). h1 usa letterSpacing negativo
  (-0.02) propio de titulares grandes.
- **Líneas 87-109**: sombras en dos planos: propiedades iOS (`shadowColor`,
  `shadowOffset`, `shadowOpacity`, `shadowRadius`) y `elevation` para Android.
  Escalones sm/md/lg de intensidad creciente (opacidad 0.08/0.12/0.15).

**Bloque líneas 111-113 (tipos derivados):**

```ts
export type ColorKey = keyof typeof color;
export type SpacingKey = keyof typeof spacing;
export type BorderRadiusKey = keyof typeof borderRadius;
```

**Explicación de las líneas 111-113:**
- Derivación automática de uniones de claves literales a partir de los objetos `as
  const`. Esto permite tipar props de componentes (p. ej. aceptar solo nombres de
  color válidos) y garantiza que al añadir un token, el tipo se actualice solo.

## Fichas de funciones y métodos

No aplica: archivo declarativo sin funciones.

## Clases / interfaces / tipos

### ColorKey / SpacingKey / BorderRadiusKey (líneas 111-113)

- Responsabilidad: tipos de las claves de cada token para consumo tipado.
- Relaciones: derivados de los objetos `as const`. No exporta un `TypographyKey`
  (potencial mejora: tipar también claves de tipografía y sombras si se necesitan).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` Duplicidad histórica con `src/config/Theme.ts` (MD3_THEME):
  valores de spacing/radios/tipografía NO coinciden entre ambos (p. ej. spacing.md 12
  aquí vs 16 allí; borderRadius.md 10 vs shape.medium 12). tokens.ts es el sistema en
  uso; Theme.ts está sin consumidores (ver su análisis).
- `[OBSERVACIÓN TÉCNICA]` `surface` y `surfaceElevated` tienen el mismo valor
  ('#FFFFFF'): no hay diferenciación visual de elevación por color (se compensa con
  sombras). Si en el futuro se quiere jerarquía por color, habrá que distinguirlos.
- `[INFORMATIVO]` `typography` no define una clave para pantallas grandes ni estados
  de enlace/error: los consumidores combinan tokens con estilos ad-hoc cuando lo
  necesitan.
- `[INFORMATIVO]` La cabecera menciona "colores dinámicos" implícitamente no: el
  archivo es una paleta fija clara (no soporta modo oscuro dinámico). Verificar si el
  requisito de dark mode existe (no implementado aquí).

## Seguridad

- `[INFORMATIVO]` Sin hallazgos: tokens de presentación públicos, sin secretos,
  permisos, logging ni datos.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo-medio: coexistencia de dos fuentes de tokens (Theme.ts vs tokens.ts)
  puede inducir inconsistencias si alguien importa la equivocada. [RECOMENDACIÓN]
  Eliminar o re-exportar Theme.ts desde tokens para dejar una única fuente.
- `[RIESGO]` Bajo: sin modo oscuro definido en tokens; si SafeAlert planea soportar
  tema oscuro, la paleta fija clara obligará a refactorizar hacia tokens por modo.
- `[RECOMENDACIÓN]` Añadir tipos derivados para `typography` y `shadow` si se quiere
  tipar esos consumos igual que color/spacing.
