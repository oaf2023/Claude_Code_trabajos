# Archivo: iphone/app/bienvenida.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/app/bienvenida.tsx | 11 | TypeScript/TSX | 511 | Pantalla de onboarding (reexport) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Reexport de la pantalla de bienvenida/onboarding compartida (`app/bienvenida.tsx`,
432 líneas) para que exista como ruta en el árbol de `iphone/app/`. Esta pantalla se
muestra al usuario no onboarded (el layout raíz usa `initialRouteName` =
`bienvenida` cuando `isOnboarded` es falso) y en ella el usuario decide comenzar,
redirigiendo a `/(tabs)` (ver `router.replace('/(tabs)')` en la pantalla compartida).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: reexport válido hacia la implementación compartida.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| ../../app/bienvenida | interna (proyecto padre) | Implementación real de la pantalla | Sí |

## Componentes que dependen de este archivo

- Expo Router: ruta `/bienvenida` del árbol `iphone/app`.
- Layout raíz compartido (`app/_layout.tsx`): `<Stack.Screen name="bienvenida">`.
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

No aplica (solo reexport). Cabecera documental: oafon, 2026-04-21, v1.0.0.

## Estructura (funciones / clases / tipos)

- Exportación por defecto de la pantalla compartida.

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : bienvenida.tsx
* Descripcion     : Reexport del onboarding compartido para el cliente Apple.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Ruta de onboarding en safealert/iphone.
* ============================================================================ */

export { default } from '../../app/bienvenida';
```

**Explicación de las líneas 1-11:**

- **Líneas 1-9**: cabecera documental estándar.
- **Línea 11**: reexporta la implementación real (`app/bienvenida.tsx`). La lógica de
  la pantalla (estado de onboarding, navegación a `/(tabs)`, estilos) vive en el
  archivo compartido.
- [OBSERVACIÓN TÉCNICA] La pantalla compartida puede incluir llamadas a servicios de
  la raíz (`src/`) y textos de registro/privacy; cualquier dependencia debe estar
  disponible en la variante Apple.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] Archivo de reexport; sin lógica propia.
- [NOTA] La comparación con la pantalla equivalente de la app principal muestra que NO
  hay duplicación: iphone apunta a la misma implementación, garantizando paridad
  visual/funcional por construcción.

## Seguridad

- [INFORMATIVO] Sin lógica propia; los aspectos de seguridad/privacidad pertenecen a la
  pantalla compartida (onboarding con políticas de privacidad). [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [INFORMATIVO] Ninguno adicional al de los reexports: validar el flujo de onboarding
  completo en iOS/Web (incluidos enlaces de políticas de privacidad si existieran).
