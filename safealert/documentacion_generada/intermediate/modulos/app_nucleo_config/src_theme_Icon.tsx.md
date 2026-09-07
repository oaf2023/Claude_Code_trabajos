# Archivo: src/theme/Icon.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/theme/Icon.tsx | 35 | TypeScript 5.9 | 1146 | Componente UI (design system) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Componente de icono del design system basado en `MaterialIcons` de
`@expo/vector-icons`. Su cabecera indica que "reemplaza progresivamente el uso de
emojis como iconografía". Envuelve a `MaterialIcons` con valores por defecto
(`size = 24`, color = `color.textPrimary`), prop `name` tipada con la unión de nombres
del propio set (`IconName`) y soporte de estilo opcional.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — usado por `WebModeBanner` y por `Button` del
theme; re-exportado por el barril `src/theme/index.ts`.

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React` | externa | JSX del componente | Sí |
| `StyleProp`, `TextStyle` de `react-native` | externa | Tipo de `style` | Sí |
| `MaterialIcons` de `@expo/vector-icons/MaterialIcons` | externa | Render del glifo + tipo IconName | Sí |
| `color` de `./tokens` | interna | Color por defecto del icono | Sí |

## Componentes que dependen de este archivo

| Archivo dependiente | Uso |
| --- | --- |
| src/components/WebModeBanner.tsx | `import { Icon } from '../theme/Icon';` (línea 15) para los iconos de specs |
| src/theme/Button.tsx | `import { Icon, IconName } from './Icon';` (línea 23) — render de iconos junto al texto y tipo de prop |
| src/theme/index.ts | Re-export de `Icon` (barril) |

No se detectaron imports de `Icon` por el barril en las pantallas de `app/` (ver
análisis de index.ts): el consumo real es directo desde los dos archivos citados.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| IconName | `React.ComponentProps<typeof MaterialIcons>['name']` | type | Unión de nombres de iconos válidos de MaterialIcons | Prop `name`, Button |

No hay secretos ni constantes de configuración.

## Estructura (funciones / clases / tipos)

- Tipo exportado `IconName` (línea 17).
- Interfaz `IconProps` (líneas 19-24).
- Componente funcional `Icon` (líneas 26-34).

## Análisis línea por línea

**Bloque líneas 1-34 (cabecera, imports y componente):**

```ts
/* ============================================================================
* Archivo         : Icon.tsx
* Descripción     : Componente de icono basado en MaterialIcons de @expo/vector-icons.
*                   Reemplaza progresivamente el uso de emojis como iconografía.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <Icon name="shield-check" size={24} color={color.safe} />
* ============================================================================ */

import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { color } from './tokens';

export type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 24, color: iconColor = color.textPrimary, style }: IconProps) {
  return (
    <MaterialIcons
      name={name}
      size={size}
      color={iconColor}
      style={style}
    />
  );
}
```

**Explicación de las líneas 1-34:**
- **Líneas 1-10**: cabecera. El propósito declarado de sustituir emojis por
  iconografía tipada es relevante para la estrategia de UI.
- **Línea 12**: import de React (necesario para JSX en esta configuración).
- **Línea 13**: tipos de estilo de RN (el icono hereda estilo de texto porque
  MaterialIcons es un glifo de fuente).
- **Línea 14**: import del set de iconos MaterialIcons de Expo.
- **Línea 15**: import del token de color por defecto.
- **Línea 17**: `IconName` se deriva de las props del propio MaterialIcons: cualquier
  nombre no válido falla en compilación (autocompletado y seguridad de tipos).
- **Líneas 19-24**: props del componente: `name` (obligatorio), `size` (default 24),
  `color` (default `color.textPrimary`), `style`.
- **Línea 26**: desestructuración con aliasing `color: iconColor` (evita colisión con
  el import `color` de tokens) y valores por defecto en la firma.
- **Líneas 27-34**: render directo de `MaterialIcons` con las props normalizadas.

## Fichas de funciones y métodos

### Icon (líneas 26-34)

- Firma: `export function Icon({ name, size = 24, color: iconColor = color.textPrimary, style }: IconProps)`
- Propósito técnico: envoltorio tipado de MaterialIcons con defaults del design
  system. Funcional: iconografía consistente reemplazando emojis.
- Parámetros: ver `IconProps`. Retorno: JSX de MaterialIcons. Excepciones: ninguna.
- Dependencias: MaterialIcons, tokens. Riesgos: si el nombre del icono no existe en la
  versión instalada de @expo/vector-icons, MaterialIcons renderiza el glifo "unknown"
  sin error en runtime (el tipo puede aprobar nombres que el set empaquetado no
  tenga si las versiones divergen).

## Clases / interfaces / tipos

### IconName (línea 17)

- Responsabilidad: unión tipada de todos los nombres de MaterialIcons.
- Relaciones: alimenta la prop `name` y la prop `icon?: IconName` de `Button`.

### IconProps (líneas 19-24)

- Responsabilidad: contrato de props del icono.
- Campos: name (obligatorio), size/color/style (opcionales).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` `WebModeBanner` usa nombres de icono como 'developer-board',
  'memory', 'storage', 'public' (definidos como strings en `webBanner.ts`): son
  strings planos, no verificados contra `IconName` en ese punto; si un nombre no
  existe, el render cae en el glifo de respaldo sin error.
- `[INFORMATIVO]` El componente no implementa accesibilidad propia (accessibilityLabel
  no forma parte de `IconProps`); los iconos decorativos deberían marcarse
  `accessibilityElementsHidden`/`importantForAccessibility` en el contenedor, o bien
  dotar al icono de label cuando sea semántico. Queda a criterio del consumidor.

## Seguridad

- `[INFORMATIVO]` Sin hallazgos: componente de presentación sin secretos ni datos.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: glifos de respaldo si un nombre de icono no existe (sin error
  visible en desarrollo).
- `[RECOMENDACIÓN]` Verificar los nombres de icono usados en datos (p. ej.
  `webBanner.ts`) contra `IconName` (tipar esas listas con `IconName`).
- `[RECOMENDACIÓN]` Considerar añadir `accessibilityLabel` opcional a `IconProps`
  para iconos semánticos.
