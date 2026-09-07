# Archivo: iphone/app/permissions.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/app/permissions.tsx | 11 | TypeScript/TSX | 523 | Pantalla de permisos (reexport) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Reexport de la pantalla de permisos compartida (`app/permissions.tsx`, 296 líneas)
para exponerla como ruta en `iphone/app/`. En la pantalla compartida se solicitan los
permisos críticos (micrófono, ubicación, contactos, notificaciones) y, según el
código compartido, permite navegar a `/ubicacion/manual` (activación manual de
ubicación) y volver a `/permissions` desde Ajustes/Inicio.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: reexport válido hacia la implementación compartida.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| ../../app/permissions | interna (proyecto padre) | Implementación real de la pantalla | Sí |

## Componentes que dependen de este archivo

- Expo Router: ruta `/permissions` del árbol `iphone/app`.
- Layout raíz compartido: `<Stack.Screen name="permissions">` con `presentation: 'modal'`.
- Pantallas compartidas que navegan a `/permissions` (`(tabs)/index.tsx` línea 179,
  `(tabs)/settings.tsx` línea 160).
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

No aplica (solo reexport). Cabecera documental: oafon, 2026-04-21, v1.0.0.

## Estructura (funciones / clases / tipos)

- Exportación por defecto de la pantalla compartida.

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : permissions.tsx
* Descripcion     : Reexport de la pantalla de permisos compartida para el cliente Apple.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Ruta de permisos en safealert/iphone.
* ============================================================================ */

export { default } from '../../app/permissions';
```

**Explicación de las líneas 1-11:**

- **Líneas 1-9**: cabecera documental estándar.
- **Línea 11**: reexporta la pantalla compartida de permisos.
- [OBSERVACIÓN TÉCNICA] La pantalla compartida navega a `/ubicacion/manual`
  (`app/permissions.tsx` línea 223). En el árbol de la app principal esa ruta existe
  (`app/ubicacion/manual.tsx`, 208 líneas), pero en `iphone/app/` NO existe ningún
  reexport de `ubicacion/manual`; por tanto, en la variante Apple esa navegación podría
  apuntar a una ruta inexistente.
- [OBSERVACIÓN TÉCNICA] Los permisos solicitados en iOS dependen de las claves
  `infoPlist` y del plugin `react-native-permissions` definidos en
  `iphone/app.json`; la variante incluye además `Camera` (selfie de seguridad).

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] Reexport puro.
- [OBSERVACIÓN TÉCNICA] Posible ruta rota `/ubicacion/manual` en la variante Apple
  (ver sección Riesgos).

## Seguridad

- [INFORMATIVO] Pantalla crítica de privacidad: solicita micrófono, ubicación,
  contactos y notificaciones; la gestión real está en la pantalla compartida y en
  `src/services/PermissionsService.ts`. El reexport no añade lógica propia.
  [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] MEDIO: si el usuario elige activación manual de ubicación, la pantalla
  compartida navega a `/ubicacion/manual`, ruta no reexportada en `iphone/app/`; el
  comportamiento en la variante Apple sería error de ruta o pantalla inexistente.
  [NIVEL DE CERTEZA: Altamente probable]
- [RECOMENDACIÓN] Añadir el reexport de `ubicacion/manual` en el árbol de iphone o
  verificar que la pantalla compartida no lo invoque en iOS/Web.
