# Archivo: src/theme/Button.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/theme/Button.tsx | 139 | TypeScript 5.9 | 4362 | Componente UI (design system) | FUNCIONALIDAD EXISTENTE (uso indirecto acotado) | Confirmado por código |

## Objetivo

Botón reutilizable del design system. Cubre los patrones más comunes de la app:
variantes `danger` (CTA de emergencia por defecto), `primary`, `secondary`,
`outline`, `ghost` y `chip`; tamaños `sm`/`md`/`lg`; soporte de icono a izquierda o
derecha (usando el componente `Icon` del mismo theme); estados `loading` (muestra
ActivityIndicator) y `disabled`; y accesibilidad (role, label, hint y estado).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` con matiz: el único consumidor detectado es
`src/components/M3Button.tsx` (componente envoltorio), y `M3Button` no tiene a su vez
consumidores visibles en `app/` ni `src/` (ver Observaciones). Es decir, `Button` está
funcional y es usado, pero su cadena de uso efectiva termina en un envoltorio sin
pantallas que lo importen.

[NIVEL DE CERTEZA: Confirmado por código] para el uso por M3Button; [NIVEL DE
CERTEZA: Altamente probable] para la ausencia de consumidores de M3Button (grep en
src/ y app/).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React` | externa | JSX | Sí |
| TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View de `react-native` | externa | Render y tipado | Sí |
| `color, spacing, borderRadius, typography, shadow` de `./tokens` | interna | Estilos de variantes/tamaños | color, spacing, borderRadius sí; typography y shadow importados pero sin uso visible en el cuerpo |
| `Icon, IconName` de `./Icon` | interna | Render de icono y tipo de prop `icon` | Sí |

[OBSERVACIÓN TÉCNICA] `typography` y `shadow` se importan en la línea 22 pero no se
referencian en el cuerpo del componente (los estilos usan literales de fontSize/
fontWeight y no aplican sombras). Importación parcialmente innecesaria.
[NIVEL DE CERTEZA: Confirmado por código]

## Componentes que dependen de este archivo

| Archivo dependiente | Uso |
| --- | --- |
| src/components/M3Button.tsx | `import { Button } from '../theme/Button';` (línea 14) — envoltorio que mapea variantes |
| src/theme/index.ts | Re-export del barril (expone Button a toda la app) |

No se detectaron usos de `Button` directamente desde `app/` (las pantallas importan
tokens del barril, no Button) ni desde `iphone/`.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| ButtonVariant | 'danger' \| 'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'chip' | union type | Variantes visuales del botón | Prop `variant` |
| variantStyles | Mapa variant -> { container: ViewStyle; text: TextStyle } | const object | Estilos por variante | Render |
| sizeStyles | Mapa 'sm'/'md'/'lg' -> { container, text, iconSize } | const object | Estilos y tamaño de icono por tamaño | Render |
| styles.base | { alignItems, justifyContent center } | StyleSheet | Base de centrado | Render |

Detalle de variantes (semántica):

| Variante | Contenedor | Texto | Uso previsto |
| --- | --- | --- | --- |
| danger | fondo color.danger (rojo) | textoInverse | CTA principal/emergencia (default) |
| primary | fondo color.safe (verde) | textoInverse | Acción primaria de confirmación |
| secondary | surface con borde | textPrimary | Acción secundaria |
| outline | transparente, borde 1.5 danger | danger | Acción destacada sin relleno |
| ghost | transparente | textSecondary | Acción de baja prominencia |
| chip | dangerLight, radio full | danger, 13px/500 | Píldora tipo etiqueta |

Detalle de tamaños:

| Tamaño | Padding | Radio | Texto | iconSize |
| --- | --- | --- | --- | --- |
| sm | xs x md | sm (6) | 13/600 | 16 |
| md | md x lg | md (10) | 15/700 | 20 |
| lg | lg x 2xl | lg (14) | 17/700 | 24 |

Sin secretos.

## Estructura (funciones / clases / tipos)

- Tipo `ButtonVariant` (línea 25) e interfaz `ButtonProps` (líneas 27-40).
- Constantes `variantStyles` (42-67) y `sizeStyles` (69-85).
- Componente funcional `Button` (87-132).
- `styles` (StyleSheet) (134-138).

## Análisis línea por línea

**Bloque líneas 1-40 (cabecera, imports, tipo e interfaz):**

```ts
/* ============================================================================
* Archivo         : Button.tsx
* Descripción     : Botón reutilizable del design system. Cubre los patrones
*                   más comunes: danger (CTA), outline, ghost y small.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <Button title="Activar" onPress={...} variant="danger" />
* ============================================================================ */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { color, spacing, borderRadius, typography, shadow } from './tokens';
import { Icon, IconName } from './Icon';

type ButtonVariant = 'danger' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'chip';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
```

**Explicación de las líneas 1-40:**
- **Líneas 1-10**: cabecera del componente.
- **Líneas 12-21**: imports de React Native (TouchableOpacity como contenedor
  pulsable, Text, StyleSheet, tipos de estilo, ActivityIndicator para loading y View
  para el contenedor interno del contenido).
- **Línea 22**: import de tokens (typography y shadow sin uso posterior).
- **Línea 23**: import del Icon del theme y del tipo IconName.
- **Línea 25**: unión de variantes.
- **Líneas 27-40**: props del botón: `title` y `onPress` obligatorios; el resto
  opcionales (variant default 'danger', icono con posición, loading, disabled, size,
  estilos extra y props de accesibilidad).

**Bloque líneas 42-85 (mapas de variantes y tamaños):**

```ts
const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  danger: {
    container: { backgroundColor: color.danger },
    text: { color: color.textInverse },
  },
  primary: {
    container: { backgroundColor: color.safe },
    text: { color: color.textInverse },
  },
  secondary: {
    container: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
    text: { color: color.textPrimary },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color.danger },
    text: { color: color.danger },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: color.textSecondary },
  },
  chip: {
    container: { backgroundColor: color.dangerLight, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
    text: { color: color.danger, fontSize: 13, fontWeight: '500' },
  },
};

const sizeStyles: Record<string, { container: ViewStyle; text: TextStyle; iconSize: number }> = {
  sm: {
    container: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm },
    text: { fontSize: 13, fontWeight: '600' },
    iconSize: 16,
  },
  md: {
    container: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md },
    text: { fontSize: 15, fontWeight: '700' },
    iconSize: 20,
  },
  lg: {
    container: { paddingVertical: spacing.lg, paddingHorizontal: spacing['2xl'], borderRadius: borderRadius.lg },
    text: { fontSize: 17, fontWeight: '700' },
    iconSize: 24,
  },
};
```

**Explicación de las líneas 42-85:**
- **Líneas 42-67**: `variantStyles`, mapa tipado por `Record<ButtonVariant, ...>`:
  cada variante define estilo de contenedor y de texto con tokens. `danger` es rojo
  con texto inverso (semántica de emergencia). `chip` define inline radio full y
  paddings (usa borderRadius.full y spacing), texto pequeño rojo.
- **Líneas 69-85**: `sizeStyles` tipado como `Record<string, ...>` (claves sm/md/lg)
  con padding, radio, tipografía e `iconSize`. [OBSERVACIÓN TÉCNICA] El tipo
  `Record<string, ...>` no restringe las claves a sm/md/lg; la prop `size` sí está
  tipada como 'sm' | 'md' | 'lg', así que en la práctica es seguro (la laxitud es
  solo del tipo del mapa interno).

**Bloque líneas 87-132 (componente Button):**

```ts
export function Button({
  title,
  onPress,
  variant = 'danger',
  icon: iconName,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  size = 'md',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const opacity = disabled || loading ? 0.5 : 1;

  const content = loading ? (
    <ActivityIndicator size="small" color={v.text.color} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      {iconName && iconPosition === 'left' && (
        <Icon name={iconName} size={s.iconSize} color={v.text.color as string} />
      )}
      <Text style={[s.text, v.text, textStyle]}>{title}</Text>
      {iconName && iconPosition === 'right' && (
        <Icon name={iconName} size={s.iconSize} color={v.text.color as string} />
      )}
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, s.container, v.container, { opacity }, ...(Array.isArray(style) ? style : style ? [style] : [])]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

**Explicación de las líneas 87-132:**
- **Líneas 87-100**: desestructuración con defaults (variant danger, icono a la
  izquierda, loading/disabled false, size md).
- **Líneas 101-102**: resolución de estilos por variante y tamaño.
- **Línea 103**: opacidad 0.5 si está deshabilitado o cargando (feedback visual sin
  cambiar colores).
- **Líneas 105-117**: contenido condicional: si `loading`, un `ActivityIndicator` con
  el color del texto de la variante; en caso contrario, un `View` horizontal con el
  icono (según posición) y el texto. Uso de `gap: spacing.sm` para separación.
- **Líneas 119-130**: `TouchableOpacity`:
  - `disabled`: desactiva el toque si loading o disabled.
  - estilo combinado: base + tamaño + variante + opacidad + estilo(s) extra del
    llamador (soporta array o single).
  - accesibilidad: role 'button', label por defecto = title, hint opcional y
    `accessibilityState` con disabled/busy (anuncia a lectores de pantalla el estado
    de carga).
- **Líneas 134-138**: `styles.base` centra el contenido (el centrado horizontal del
  TouchableOpacity no está garantizado por defecto).

## Fichas de funciones y métodos

### Button (líneas 87-132)

- Firma: `export function Button(props: ButtonProps): JSX`
- Propósito técnico: botón del design system con variantes/tamaños/estados.
  Funcional: CTA de emergencia (danger), acciones de confirmación (primary) y
  acciones secundarias (outline/ghost/chip), con feedback de carga.
- Parámetros: ver ButtonProps (title y onPress obligatorios).
- Retorno: TouchableOpacity. Excepciones: ninguna directa (delega onPress).
- Dependencias: tokens, Icon, ActivityIndicator. La invoca M3Button.
- Efectos secundarios: ninguno directo; el onPress es responsabilidad del llamador.
- Riesgos: al ser contenedor genérico sin minHeight propio, no garantiza la diana
  táctil mínima de 48 pt por sí solo (los paddings de md/lg lo aproximan; en sm la
  altura total depende del contenido y podría quedar por debajo de 48 pt, cuestión de
  accesibilidad WCAG 2.2).

## Clases / interfaces / tipos

### ButtonProps (líneas 27-40)

- Responsabilidad: contrato de props del botón.
- Campos: title, onPress, variant, icon (IconName), iconPosition, loading, disabled,
  size, style (ViewStyle | ViewStyle[]), textStyle, accessibilityLabel, accessibilityHint.
- Relaciones: `IconName` de ./Icon; tokens de ./tokens.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` Cadena de uso: Button -> M3Button (src/components), y
  M3Button no tiene importadores detectados en src/ ni app/. Por tanto, el patrón de
  botón "canónico" no se usa hoy directamente en pantallas (estas construyen botones
  con TouchableOpacity propios o con M3Button si reaparece). El componente sigue
  exportado en el barril.
- `[OBSERVACIÓN TÉCNICA]` Import sin uso: `typography` y `shadow` de tokens (línea
  22). [NIVEL DE CERTEZA: Confirmado por código]
- `[OBSERVACIÓN TÉCNICA]` `Record<string, ...>` en `sizeStyles` debilita el tipado
  interno (la API pública está tipada correctamente).
- `[INFORMATIVO]` Accesibilidad: se declaran role/label/hint/state; no se fija un
  minHeight mínimo de 48, por lo que la diana en tamaño sm puede ser menor a la
  recomendación WCAG 2.2 (consultar `useAccessibility.ts`, MIN_TOUCH_SIZE=48, sin
  uso).

## Seguridad

- `[INFORMATIVO]` Sin hallazgos: componente de presentación, sin secretos ni datos.
- `[INFORMATIVO]` El texto del botón se usa como accessibilityLabel por defecto: si el
  título contuviera datos dinámicos del usuario, se leerían en voz alta (uso normal
  de la función).

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: posible diana táctil < 48 pt en tamaño sm (accesibilidad).
  [RECOMENDACIÓN] Fijar `minHeight: MIN_TOUCH_SIZE` (o el valor equivalente) en la
  base del botón o al menos en tamaños sm/md.
- `[RIESGO]` Bajo: duplicidad de implementaciones de botón (theme/Button + M3Button +
  botones ad-hoc en pantallas) fragmenta la UI. [RECOMENDACIÓN] Decidir un único
  componente canónico y migrar las pantallas.
- `[RECOMENDACIÓN]` Limpiar el import de `typography`/`shadow` si se confirma su no
  uso tras la migración.
