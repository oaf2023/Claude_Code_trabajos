# Archivo: iphone/app/como-funciona.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/app/como-funciona.tsx | 11 | TypeScript/TSX | 527 | Pantalla informativa (reexport) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Reexport de la pantalla informativa "Cómo Funciona SafeAlert" compartida
(`app/como-funciona.tsx`, 315 líneas) para exponerla como ruta en `iphone/app/`. La
pantalla compartida se abre como modal desde Ajustes (`router.push('/como-funciona')`
en `app/(tabs)/settings.tsx` línea 149) y explica el funcionamiento de la app.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: reexport válido hacia la implementación compartida.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| ../../app/como-funciona | interna (proyecto padre) | Implementación real de la pantalla | Sí |

## Componentes que dependen de este archivo

- Expo Router: ruta `/como-funciona` del árbol `iphone/app`.
- Layout raíz compartido: `<Stack.Screen name="como-funciona">` con
  `presentation: 'modal'`.
- Pantalla compartida `app/(tabs)/settings.tsx` (navega a `/como-funciona`).
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

No aplica (solo reexport). Cabecera documental: oafon, 2026-04-21, v1.0.0.

## Estructura (funciones / clases / tipos)

- Exportación por defecto de la pantalla compartida.

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : como-funciona.tsx
* Descripcion     : Reexport de la pantalla informativa compartida para el cliente Apple.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Ruta informativa en safealert/iphone.
* ============================================================================ */

export { default } from '../../app/como-funciona';
```

**Explicación de las líneas 1-11:**

- **Líneas 1-9**: cabecera documental estándar.
- **Línea 11**: reexporta la pantalla real compartida. El contenido informativo,
  navegación y estilos provienen del archivo padre.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] Reexport puro; la pantalla compartida
  existe y es accesible desde Ajustes en ambas variantes por igual.
- [NOTA] La navegación hacia esta pantalla desde `(tabs)/settings` funciona porque la
  ruta `/como-funciona` existe en ambos árboles (raíz e iphone).

## Seguridad

- [INFORMATIVO] Sin lógica propia; el contenido informativo pertenece a la pantalla
  compartida. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [INFORMATIVO] Ninguno adicional: pantalla estática informativa, riesgo bajo.
