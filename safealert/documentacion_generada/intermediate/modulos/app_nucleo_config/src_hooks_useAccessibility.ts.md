# Archivo: src/hooks/useAccessibility.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/hooks/useAccessibility.ts | 40 | TypeScript 5.9 | 1396 | Hook de React (accesibilidad WCAG 2.2 AA) | APARENTEMENTE NO UTILIZADO | Altamente probable |

## Objetivo

Provee utilidades de accesibilidad para la UI: un hook `useAccessibility` que expone
una comprobación de lector de pantalla activo y un objeto de estilo con diana táctil
mínima de 48x48 (WCAG 2.2 AA), y una función auxiliar `a11nProps` que genera las
propiedades de accesibilidad estándar (label, hint, role, accessible) para elementos
interactivos.

## Clasificación y estado

Etiqueta: `APARENTEMENTE NO UTILIZADO` con marcador `[POTENCIALMENTE NO UTILIZADO]`.

Justificación basada en búsqueda real: el grep de `useAccessibility`, `a11nProps` y
`MIN_TOUCH_SIZE` sobre `src/`, `app/` e `iphone/` solo devuelve coincidencias en este
mismo archivo (cabecera y definiciones). No hay ningún `import` de
`hooks/useAccessibility` ni invocación de `useAccessibility()` o `a11nProps()` en
pantallas ni componentes.

[NIVEL DE CERTEZA: Altamente probable] — la búsqueda cubre el árbol fuente completo de
la app (src/, app/) e iphone/; no se encontraron imports por ruta relativa ni por
alias `@/`.

Nota: los componentes del design system (`theme/Button`, `theme/Card`) implementan la
accesibilidad directamente con `accessibilityRole`/`accessibilityLabel`/`accessibilityHint`
inline, lo que pudo hacer innecesario este hook.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `useCallback` de `react` | externa | Línea 18 (memoriza isScreenReaderEnabled) | Sí |
| `AccessibilityInfo`, `Platform` de `react-native` | externa | Líneas 18-19 | Sí (`AccessibilityInfo`); `Platform` importado pero NO usado |

[OBSERVACIÓN TÉCNICA] `Platform` (línea 13) se importa pero no se utiliza en ningún
punto del archivo (no hay condicionales por SO). Import potencialmente innecesario.
[NIVEL DE CERTEZA: Confirmado por código]

## Componentes que dependen de este archivo

Ninguno detectado. Las búsquedas grep no hallan importadores en `src/`, `app/` ni
`iphone/`. El resto de la UI aplica accesibilidad de forma inline en los componentes
del theme y pantallas.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| MIN_TOUCH_SIZE | 48 | number | Tamaño mínimo de diana táctil en puntos (WCAG 2.2 AA) | Interno (touchTargetStyle) |

## Estructura (funciones / clases / tipos)

- `MIN_TOUCH_SIZE: number` — constante exportada (línea 15).
- `useAccessibility(): { isScreenReaderEnabled, touchTargetStyle }` — hook exportado
  (líneas 17-31).
- `a11nProps(label, hint?, role?)` — función auxiliar exportada (líneas 33-40).

## Análisis línea por línea

**Bloque líneas 1-19 (cabecera, imports y constante):**

```ts
/* ============================================================================
* Archivo         : useAccessibility.ts
* Descripción     : Hook de accesibilidad WCAG 2.2 AA. Garantiza dianas mínimas
*                   de 48x48, contraste suficiente y etiquetas semánticas.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { useAccessibility } from '../../src/hooks/useAccessibility';
* ============================================================================ */

import { useCallback } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export const MIN_TOUCH_SIZE = 48;
```

**Explicación de las líneas 1-19:**
- **Líneas 1-10**: cabecera estándar. Declara el objetivo WCAG 2.2 AA (dianas de
  48x48, contraste y etiquetas).
- **Línea 12**: import de `useCallback` de React.
- **Línea 13**: import de `AccessibilityInfo` y `Platform`. `Platform` no se usa
  después.
- **Línea 15**: constante de 48 puntos, valor de referencia de WCAG 2.2 para dianas
  táctiles.

**Bloque líneas 17-40 (hook y helper):**

```ts
export function useAccessibility() {
  const isScreenReaderEnabled = useCallback(async () => {
    return AccessibilityInfo.isScreenReaderEnabled();
  }, []);

  return {
    isScreenReaderEnabled,
    touchTargetStyle: {
      minWidth: MIN_TOUCH_SIZE,
      minHeight: MIN_TOUCH_SIZE,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  };
}

export function a11nProps(label: string, hint?: string, role?: string) {
  return {
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: (role || 'button') as 'button' | 'link' | 'header' | 'image' | 'text' | 'summary' | 'adjustable' | 'switch' | 'none',
    accessible: true,
  };
}
```

**Explicación de las líneas 17-40:**
- **Línea 17**: declara el hook sin parámetros.
- **Líneas 18-20**: `isScreenReaderEnabled`, función memorizada con `useCallback` (sin
  dependencias) que consulta `AccessibilityInfo.isScreenReaderEnabled()` de forma
  asíncrona (devuelve Promise<boolean>).
- **Líneas 22-30**: el hook retorna la función y `touchTargetStyle`, un objeto de
  estilo con ancho/alto mínimos de 48 y centrado de contenido (justifyContent y
  alignItems centrados). Los `as const` fijan los literales para compatibilidad con
  estilos tipados de React Native.
- **Líneas 33-40**: `a11nProps` genera props estándar: `accessibilityLabel`
  (obligatorio), `accessibilityHint` (opcional), `accessibilityRole` (por defecto
  'button' pero tipado con unión de roles válidos de RN) y `accessible: true`.

[OBSERVACIÓN TÉCNICA] `isScreenReaderEnabled` es un snapshot: si el usuario activa o
desactiva el lector de pantalla mientras la app está abierta, el hook no se entera (no
usa el evento `AccessibilityInfo.addEventListener('screenReaderChanged', ...)`). Para
UI reactiva a cambios de lector de pantalla habría que suscribirse y refrescar estado.

## Fichas de funciones y métodos

### useAccessibility (líneas 17-31)

- Firma: `export function useAccessibility(): { isScreenReaderEnabled: () => Promise<boolean>; touchTargetStyle: {...} }`
- Propósito técnico: exponer utilidades de accesibilidad vía hook. Funcional:
  comprobar lector de pantalla y aplicar diana táctil mínima.
- Parámetros: ninguno. Retorno: objeto con `isScreenReaderEnabled` y
  `touchTargetStyle`.
- Dependencias: `useCallback`, `AccessibilityInfo`, `MIN_TOUCH_SIZE`. Excepciones:
  las del API de RN (promesa).
- Efectos secundarios: ninguno. Riesgos: snapshot sin suscripción a cambios.

### a11nProps (líneas 33-40)

- Firma: `export function a11nProps(label: string, hint?: string, role?: string): {...}`
- Propósito: generar props de accesibilidad listas para spread en un componente.
- Parámetros: `label` (obligatorio), `hint` y `role` (opcionales, role default
  'button').
- Retorno: objeto con accessibilityLabel/Hint/Role/accessible.
- Dependencias: ninguna. Excepciones: ninguna.
- Efectos secundarios: ninguno. Riesgo: bajo; el tipo de `role` es una unión fija de
  RN; un rol inválido se rechazaría en compilación (al pasar por el cast) pero no en
  runtime si llegara como string externo.

## Clases / interfaces / tipos

No define clases ni interfaces (el tipo de retorno es inferido).

## Observaciones técnicas

- `[POTENCIALMENTE NO UTILIZADO]` Hook y helper sin consumidores en src/, app/ e
  iphone/. [NIVEL DE CERTEZA: Altamente probable]
- `[OBSERVACIÓN TÉCNICA]` La accesibilidad efectiva de la app está implementada de
  forma inline en `theme/Button.tsx` y `theme/Card.tsx` (accessibilityRole, label,
  hint, accessibilityState) y en las pantallas; este módulo quedaría como biblioteca
  auxiliar para un futuro uso sistemático.
- `[OBSERVACIÓN TÉCNICA]` `Platform` importado y no usado (línea 13).
- `[OBSERVACIÓN TÉCNICA]` `isScreenReaderEnabled` no reacciona a cambios en vivo del
  lector de pantalla (sin addEventListener).

## Seguridad

- `[INFORMATIVO]` Sin hallazgos: no hay secretos, permisos solicitados, logging ni
  datos sensibles. La consulta a `AccessibilityInfo` no requiere permisos especiales.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: código sin uso que da falsa sensación de cobertura de
  accesibilidad.
- `[RECOMENDACIÓN]` Si se decide adoptarlo: integrarlo en el design system
  (`theme/Button`, `theme/Card`) para unificar las props de accesibilidad, y
  suscribirse al evento `screenReaderChanged` para reaccionar a cambios en vivo.
- `[RECOMENDACIÓN]` En una limpieza, retirar `Platform` del import y eliminar o
  integrar el módulo según la decisión de diseño.
