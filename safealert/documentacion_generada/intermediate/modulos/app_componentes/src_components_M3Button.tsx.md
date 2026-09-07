# Archivo: src/components/M3Button.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/components/M3Button.tsx | 62 | TypeScript 5.9 / TSX (React Native) | 1748 | Componente UI reutilizable (wrapper) | APARENTEMENTE NO UTILIZADO | [NIVEL DE CERTEZA: Altamente probable] |

## Objetivo

Componente `M3Button`, un botón de interfaz reutilizable creado como *wrapper* de compatibilidad sobre el botón del design system interno `Button` (`src/theme/Button.tsx`). Según la cabecera del archivo (versión 2.0.0), en su versión anterior implementaba su propio botón y ahora únicamente **delega** en `Button` para no romper los imports existentes en pantallas heredadas. Su responsabilidad real es traducir la API de props histórica del componente (`variant` con valores `primary | secondary | error | outline`, `labelStyle`, etc.) a la API del `Button` del design system (variantes `danger | secondary | outline | primary`, `textStyle`, `size`), además de fijar un tamaño por defecto (`size="md"`).

## Clasificación y estado

- `FUNCIONALIDAD EXISTENTE` como definición de componente: exporta `M3Button` correctamente tipado y conectado al design system (`Button`), con mapeo de variantes funcional.
- `APARENTEMENTE NO UTILIZADO`: la búsqueda `grep` de la cadena `M3Button` sobre `src/`, `app/`, `admin/` e `iphone/` (archivos `.tsx` y `.ts`) no encontró **ningún** import ni uso fuera de este mismo archivo.
  - [NIVEL DE CERTEZA: Altamente probable] — la búsqueda cubrió los directorios de código fuente de la app principal, la variante `iphone/` y el panel `admin/`; no se analizó `node_modules`.
- Contradicción detectada: la cabecera afirma que el wrapper se mantiene "para no romper imports existentes", pero no se hallaron imports existentes que lo consuman. [OBSERVACIÓN TÉCNICA]

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React` (de `'react'`) | Estándar (externo) | Tipo `React.FC`, retorno JSX | Sí |
| `ViewStyle`, `TextStyle` (de `'react-native'`) | Estándar (externo) | Tipado de props `style` y `labelStyle` | Sí (solo tipos) |
| `Button` (de `'../theme/Button'`) | Interna | Render principal del wrapper | Sí |

## Componentes que dependen de este archivo

- No se encontró ninguna referencia de importación/uso de `M3Button` en `src/`, `app/`, `admin/` ni `iphone/`.
- [POTENCIALMENTE NO UTILIZADO] — componente definido y exportado sin consumidores detectados en el código actual.
- [NIVEL DE CERTEZA: Altamente probable]

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `M3ButtonProps` | Interfaz (ver sección Clases) | Tipo | Contrato de props del wrapper | Líneas 16–26 |
| `mapVariant` | Función | Función | Traduce la variante legacy a la variante del design system | Líneas 28–35 |
| `M3Button` | Componente | `React.FC<M3ButtonProps>` | Export público del wrapper | Líneas 37–62 |

Valores mágicos: `'md'` (línea 55) fija el tamaño mediano del botón del design system; los literales de variante `'primary'`, `'secondary'`, `'error'`, `'outline'` y `'danger'` forman parte del contrato de la API legacy vs. la del design system.

## Estructura (funciones / clases / tipos)

- Interfaz `M3ButtonProps` (líneas 16–26).
- Función interna `mapVariant(v)` (líneas 28–35).
- Componente exportado `M3Button` (líneas 37–62).
- No hay hooks, clases, estados ni llamadas a servicios: es un componente puramente de presentación/delegación.

## Análisis línea por línea

**Bloque L1–L10 — Cabecera de archivo (comentario):**

```tsx
/* ============================================================================
* Archivo         : M3Button.tsx
* Descripción     : Botón accesible — ahora usa el design system Button internamente.
*                   Se mantiene como wrapper para no romper imports existentes.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <M3Button title="Activar" onPress={...} />
* ============================================================================ */
```

**Explicación de las líneas 1–10:**
Bloque de metadatos en comentario con la convención interna del proyecto. Aporta información técnica relevante para la auditoría: declara que el componente es un botón accesible, que desde la versión 2.0.0 delega en el design system `Button` y que su razón de ser es no romper imports previos. [OBSERVACIÓN TÉCNICA] El propósito declarado ("no romper imports existentes") no se corresponde con la ausencia total de consumidores detectados (ver sección Observaciones).

- **Línea 2**: identifica el archivo.
- **Línea 3**: describe la nueva implementación (delegación en el design system).
- **Línea 4**: justifica su existencia como wrapper de compatibilidad.
- **Líneas 7–9**: versión 2.0.0, lenguaje y ejemplo de uso.

**Bloque L12–L14 — Importaciones:**

```tsx
import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { Button } from '../theme/Button';
```

**Explicación de las líneas 12–14:**
- **Línea 12** (`import React from 'react'`): importa React para usar `React.FC` y el JSX.
- **Línea 13**: importa únicamente los tipos `ViewStyle` y `TextStyle` de React Native para tipar `style` y `labelStyle`. Se trata de imports *solo de tipos*.
- **Línea 14**: importa `Button`, el componente real del design system (`src/theme/Button.tsx`), sobre el que delega el render.

**Bloque L16–L26 — Interfaz de props:**

```tsx
interface M3ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'error' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}
```

**Explicación de las líneas 16–26:**
Define el contrato público del wrapper:
- **Línea 17** (`title`): texto visible del botón (obligatorio).
- **Línea 18** (`onPress`): callback de pulsación (obligatorio).
- **Línea 19** (`variant`): variante legacy; nótese que incluye `'error'`, que no existe en el design system y debe mapearse (ver `mapVariant`).
- **Líneas 20–21** (`loading`, `disabled`): estados de carga y deshabilitado, opcionales.
- **Líneas 22–23** (`style`, `labelStyle`): estilos externos para el contenedor y el texto.
- **Líneas 24–25** (`accessibilityLabel`, `accessibilityHint`): soporte de accesibilidad que se reenvía al `Button` interno.

**Bloque L28–L35 — Función de mapeo de variantes:**

```tsx
function mapVariant(v: M3ButtonProps['variant']): 'danger' | 'secondary' | 'outline' | 'primary' {
  switch (v) {
    case 'error': return 'danger';
    case 'secondary': return 'secondary';
    case 'outline': return 'outline';
    default: return 'primary';
  }
}
```

**Explicación de las líneas 28–35:**
- **Línea 28**: firma; recibe la variante legacy y devuelve una variante válida del design system `Button` (`danger | secondary | outline | primary`).
- **Línea 30** (`case 'error': return 'danger'`): traduce el concepto legacy de botón de error al `danger` del design system (fondo `color.danger`).
- **Líneas 31–32**: pasan directamente `secondary` y `outline`.
- **Línea 33** (`default: return 'primary'`): cualquier otro valor (incluido `undefined`) cae en `'primary'`.
- [NOTA] El mapeo `'primary'` del wrapper corresponde en el design system a `color.safe` (verde) según `src/theme/Button.tsx`, no al rojo corporativo; los posibles consumidores legacy de una variante `primary` verían un color distinto al original si lo usaban con otra intención semántica. Impacto nulo hoy por no haber consumidores.

**Bloque L37–L47 — Declaración del componente y desestructuración de props:**

```tsx
export const M3Button: React.FC<M3ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
```

**Explicación de las líneas 37–47:**
- **Línea 37**: exporta el componente como `React.FC<M3ButtonProps>` (estilo de componente funcional tipado).
- **Línea 40** (`variant = 'primary'`): valor por defecto `'primary'`, que tras el mapeo se traduce en la variante `primary` del design system.
- **Líneas 41–42**: `loading` y `disabled` por defecto `false`.
- **Líneas 43–46**: `style`, `labelStyle`, `accessibilityLabel` y `accessibilityHint` se reciben sin valor por defecto (opcionales).

**Bloque L48–L62 — Render de delegación:**

```tsx
  return (
    <Button
      title={title}
      onPress={onPress}
      variant={mapVariant(variant)}
      loading={loading}
      disabled={disabled}
      size="md"
      style={style}
      textStyle={labelStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    />
  );
};
```

**Explicación de las líneas 48–62:**
El render delega por completo en `Button` del design system:
- **Línea 50–51**: reenvía `title` y `onPress` tal cual.
- **Línea 52**: aplica el mapeo de variantes (`mapVariant(variant)`), punto único de adaptación de la API legacy.
- **Líneas 53–54**: reenvía `loading` y `disabled`; el `Button` interno los usa para deshabilitar la pulsación, bajar la opacidad a 0.5 y mostrar un `ActivityIndicator` cuando `loading` es verdadero (según `src/theme/Button.tsx`).
- **Línea 55** (`size="md"`): fija tamaño mediano; el wrapper no expone la prop `size` del design system, por lo que el consumidor no puede cambiar el tamaño.
- **Línea 56**: `style` se aplica al contenedor del `Button` interno.
- **Línea 57**: `labelStyle` se convierte en `textStyle` (nomenclatura del design system).
- **Líneas 58–59**: reenvía las props de accesibilidad; el `Button` interno las usa junto con `accessibilityRole="button"` y `accessibilityState`.
- **Línea 62**: cierra el componente.
- [OBSERVACIÓN TÉCNICA] La prop `icon`/`iconPosition` que sí soporta el design system `Button` no está expuesta en el wrapper, por lo que los botones creados con `M3Button` no pueden mostrar íconos.

## Fichas de funciones y métodos

### mapVariant (líneas 28–35)

- Firma: `function mapVariant(v: M3ButtonProps['variant']): 'danger' | 'secondary' | 'outline' | 'primary'`.
- Propósito técnico: función pura que normaliza la variante legacy del wrapper hacia el vocabulario de variantes del design system `Button`.
- Propósito funcional: garantizar que un botón `error` se vea como botón de peligro (rojo) y que los valores no reconocidos caigan en la variante por defecto.
- Parámetros:
  | Nombre | Tipo | Descripción |
  | --- | --- | --- |
  | `v` | `M3ButtonProps['variant']` | Variante legacy (`primary`, `secondary`, `error`, `outline` o `undefined`) |
- Retorno: `'danger' | 'secondary' | 'outline' | 'primary'`.
- Excepciones: ninguna (uso de `switch` con `default`).
- Dependencias: ninguna. Flujo: evalúa el literal y devuelve el equivalente.
- Funciones que llama: ninguna. Desde dónde se llama: `M3Button` (línea 52).
- Efectos secundarios: ninguno. Riesgos: el mapeo por defecto a `'primary'` podría enmascarar valores inválidos en silencio.

## Clases / interfaces / tipos

### M3ButtonProps (líneas 16–26)

Interfaz de props del componente. Responsabilidad: definir la API pública legacy que el wrapper traduce al `Button` del design system.

| Campo | Tipo | Requerido | Descripción |
| --- | --- | --- | --- |
| `title` | `string` | Sí | Texto del botón |
| `onPress` | `() => void` | Sí | Callback de pulsación |
| `variant` | `'primary' \| 'secondary' \| 'error' \| 'outline'` | No | Variante legacy; por defecto `'primary'` |
| `loading` | `boolean` | No | Muestra indicador de carga; por defecto `false` |
| `disabled` | `boolean` | No | Deshabilita el botón; por defecto `false` |
| `style` | `ViewStyle` | No | Estilo del contenedor |
| `labelStyle` | `TextStyle` | No | Estilo del texto (se pasa como `textStyle`) |
| `accessibilityLabel` | `string` | No | Etiqueta de accesibilidad |
| `accessibilityHint` | `string` | No | Pista de accesibilidad |

Ciclo de vida: sin estado; componente puramente funcional. Relaciones: depende de `Button` (`src/theme/Button.tsx`).

## Observaciones técnicas

- [POTENCIALMENTE NO UTILIZADO] `M3Button` no tiene consumidores detectados en `src/`, `app/`, `admin/` ni `iphone/`. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] La cabecera (líneas 3–4) declara que el wrapper existe "para no romper imports existentes", pero el grep no halla imports que lo usen; el componente parece haber quedado huérfano tras la migración al design system. Impacto potencial: código muerto que confunde a futuros mantenedores. Archivo: `src/components/M3Button.tsx`, líneas 1–10.
- [OBSERVACIÓN TÉCNICA] El wrapper no expone `size`, `icon` ni `iconPosition`, capacidades que el `Button` del design system sí ofrece; cualquier pantalla que necesite esas opciones debe migrar directamente a `Button`. Archivo: `src/components/M3Button.tsx`, líneas 37–62.
- [OBSERVACIÓN TÉCNICA] La variante `'primary'` del wrapper se resuelve al `'primary'` del design system, cuyo fondo es `color.safe` (verde), mientras que el rojo corporativo corresponde a `'danger'`; un botón legacy `primary` mostraría color verde. Impacto potencial: cambio visual si se reintrodujera el uso. Archivo: `src/theme/Button.tsx` vs. `src/components/M3Button.tsx`.
- [NOTA] El componente hereda automáticamente la accesibilidad del `Button` interno (`accessibilityRole="button"`, `accessibilityState`), por lo que cumple roles de accesibilidad básicos.

## Seguridad

- No se encontraron hallazgos de seguridad en este archivo: no maneja datos sensibles, no realiza llamadas de red, no recibe ni emite secretos, y no contiene logging.
- [INFORMATIVO] No hay validación de entrada propia; depende enteramente de las props del consumidor (sin impacto de seguridad conocido por ser un componente de presentación).
- [INFORMATIVO] La accesibilidad se delega al `Button` interno, lo que reduce el riesgo de omisión de roles de accesibilidad en consumidores que migren.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Mantener un wrapper sin consumidores agrega superficie de API duplicada (`M3ButtonProps` vs. `ButtonProps`) que puede divergir (ya diverge en `variant`, `size`, `icon`). Recomendación: verificar de forma concluyente la ausencia de usos (incluidos imports dinámicos o barrel `components/index`) y, si se confirma, retirar el componente o reemplazar sus consumidores por `Button` del design system.
- [RECOMENDACIÓN] Si se conserva como compatibilidad, alinear la firma con `ButtonProps` (exponer `size`, `icon`, `iconPosition`) y documentar la equivalencia de variantes, o simplemente re-exportar `Button` con alias.
- [RECOMENDACIÓN] Centralizar el mapeo `'error' -> 'danger'` en un único sitio si aparecen más wrappers similares.
