# Archivo: src/theme/Card.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/theme/Card.tsx | 91 | TypeScript 5.9 | 2410 | Componente UI (design system) | APARENTEMENTE NO UTILIZADO | Altamente probable |

## Objetivo

Tarjeta reutilizable del design system con variantes (`default`, `elevated`,
`highlighted`, `warning`, `success`) y capacidad de ser pulsable (`onPress` opcional:
si se provee, renderiza un `TouchableOpacity` con accesibilidad; si no, un `View`
simple). Estilos basados en tokens (surface, radios, sombras, colores semánticos).

## Clasificación y estado

Etiqueta: `APARENTEMENTE NO UTILIZADO` con marcador `[POTENCIALMENTE NO UTILIZADO]`.

Justificación basada en búsqueda real: el grep de `theme/Card`, `\bCard\b` (JSX) e
imports del barril en `src/` y `app/` no halla ningún consumidor del componente `Card`
del theme. El archivo solo coincide consigo mismo (definición y cabecera). El barril
`src/theme/index.ts` lo re-exporta (línea 15), pero ningún archivo importa `Card` por
nombre desde el theme.

[NIVEL DE CERTEZA: Altamente probable] — búsqueda sobre src/ y app/ (incluye
componentes .tsx y pantallas); sin referencias por ruta relativa ni alias `@/`.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React`, `ReactNode` de `react` | externa | Props (children) y JSX | Sí |
| `View`, `TouchableOpacity`, `StyleSheet`, `ViewStyle` de `react-native` | externa | Render y tipado | Sí |
| `color, spacing, borderRadius, shadow` de `./tokens` | interna | Estilos de variantes | Sí |

## Componentes que dependen de este archivo

Ninguno detectado. El componente se exporta vía `src/theme/index.ts`, pero no hay
imports de `Card` desde el theme en `src/` ni en `app/`. Las pantallas construyen sus
tarjetas directamente con View/estilos propios o con componentes específicos no
identificados como consumidores de este.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| CardVariant | 'default' \| 'elevated' \| 'highlighted' \| 'warning' \| 'success' | union type | Variantes visuales de la tarjeta | Prop `variant` |
| variantCardStyles | Mapa variant -> ViewStyle | const object | Estilos por variante | Render |
| styles.base | { padding: spacing.lg, gap: spacing.sm } | StyleSheet | Estilo base | Render |

Detalle de variantes:

| Variante | Fondo | Radio | Extras | Semántica |
| --- | --- | --- | --- | --- |
| default | surface | md (10) | shadow.sm | Tarjeta estándar |
| elevated | surface | md (10) | shadow.md | Tarjeta con elevación media |
| highlighted | surface | md (10) | borde 1 danger + shadow.sm | Destacada (alerta) |
| warning | warningLight | md (10) | borde izquierdo 4 warning | Aviso/limitación |
| success | safeLight | md (10) | borde izquierdo 4 safe | Confirmación/estado seguro |

Sin secretos.

## Estructura (funciones / clases / tipos)

- Tipo `CardVariant` (línea 15) e interfaz `CardProps` (líneas 17-24).
- Constante `variantCardStyles` (26-56).
- Componente funcional `Card` (58-84).
- `styles` (StyleSheet) (86-90).

## Análisis línea por línea

**Bloque líneas 1-56 (cabecera, imports, props y estilos de variante):**

```ts
/* ============================================================================
* Archivo         : Card.tsx
* Descripción     : Tarjeta reutilizable del design system con variantes.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <Card><Text>contenido</Text></Card>
* ============================================================================ */

import React, { ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { color, spacing, borderRadius, shadow } from './tokens';

type CardVariant = 'default' | 'elevated' | 'highlighted' | 'warning' | 'success';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const variantCardStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    ...shadow.sm,
  },
  elevated: {
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    ...shadow.md,
  },
  highlighted: {
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.danger,
    ...shadow.sm,
  },
  warning: {
    backgroundColor: color.warningLight,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: color.warning,
  },
  success: {
    backgroundColor: color.safeLight,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: color.safe,
  },
};
```

**Explicación de las líneas 1-56:**
- **Líneas 1-9**: cabecera del componente.
- **Líneas 11-13**: imports de React y RN, y tokens.
- **Línea 15**: unión de variantes.
- **Líneas 17-24**: props: `children` obligatorio, `variant`, `onPress` (opcional:
  hace la tarjeta pulsable), `style` y props de accesibilidad.
- **Líneas 26-56**: `variantCardStyles`, mapa tipado `Record<CardVariant,
  ViewStyle>`. default/elevated diferencian por sombra (sm/md); `highlighted` añade
  borde rojo (semántica de alerta); `warning` y `success` usan fondo claro y una
  franja lateral izquierda de 4 pt (warning ámbar / success verde), sin sombra.

**Bloque líneas 58-91 (componente Card y estilos base):**

```ts
export function Card({
  children,
  variant = 'default',
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const cardStyle = [styles.base, variantCardStyles[variant]].concat(style ? (Array.isArray(style) ? style.filter(Boolean) : [style]) : []);

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={cardStyle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
```

**Explicación de las líneas 58-91:**
- **Líneas 58-65**: desestructuración con variant default y accesibilidad opcional.
- **Línea 66**: composición del estilo: base + variante + estilos extra del llamador
  (normaliza array con `filter(Boolean)` para descartar valores falsy, o single style,
  o ninguno).
- **Líneas 68-81**: si `onPress` está definido, renderiza `TouchableOpacity` con
  `activeOpacity={0.7}` y accesibilidad de botón (role 'button', label y hint). Sin
  `accessibilityState` explícito (la tarjeta pulsable no informa disabled/busy).
- **Línea 83**: sin onPress renderiza un `View` simple (no interactivo, sin
  accesibilidad de botón).
- **Líneas 86-90**: `styles.base`: padding `spacing.lg` (16) y `gap: spacing.sm` (8)
  para separar hijos verticalmente.

## Fichas de funciones y métodos

### Card (líneas 58-84)

- Firma: `export function Card(props: CardProps): JSX`
- Propósito técnico: contenedor con variantes visuales y modo pulsable opcional.
- Parámetros: ver CardProps. Retorno: TouchableOpacity (si onPress) o View.
- Dependencias: tokens y componentes RN. Excepciones: ninguna directa.
- Efectos secundarios: ninguno. Riesgos: al ser pulsable, la tarjeta completa actúa
  como botón: cuidado con gestos hijos conflictivos y con la jerarquía de
  accesibilidad.

## Clases / interfaces / tipos

### CardProps (líneas 17-24)

- Responsabilidad: contrato de props de la tarjeta.
- Campos: children (ReactNode), variant, onPress, style (ViewStyle | ViewStyle[]),
  accessibilityLabel/accessibilityHint.
- Relaciones: `ReactNode`, `ViewStyle`, tokens.

## Observaciones técnicas

- `[POTENCIALMENTE NO UTILIZADO]` Componente sin consumidores detectados en src/ y
  app/. [NIVEL DE CERTEZA: Altamente probable]
- `[OBSERVACIÓN TÉCNICA]` Exportado por el barril `src/theme/index.ts` (línea 15),
  pero el barril no garantiza uso: es API disponible, no ejercitada.
- `[INFORMATIVO]` La tarjeta pulsable no expone `accessibilityState` ni feedback de
  foco; suficiente para uso básico, mejorable para lectores de pantalla.

## Seguridad

- `[INFORMATIVO]` Sin hallazgos: componente de presentación sin secretos ni datos.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: componente sin uso que suma superficie de API del design system;
  riesgo de que las pantallas construyan tarjetas ad-hoc e inconsistentes.
- `[RECOMENDACIÓN]` Adoptar `Card` en las pantallas que hoy construyen contenedores
  similares (historial, contactos, ajustes) o retirarlo si se decide no usarlo.
- `[RECOMENDACIÓN]` Si se adopta como tarjeta pulsable, añadir
  `accessibilityState={{ disabled: false }}`/feedback de foco y documentar el uso
  con onPress.
