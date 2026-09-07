# Archivo: iphone/app/(tabs)/index.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/app/(tabs)/index.tsx | 11 | TypeScript/TSX | 516 | Pantalla principal / Inicio (reexport) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Reexport de la pantalla principal compartida (Inicio) de la app
(`app/(tabs)/index.tsx`, 456 líneas) para exponerla como tab `index` en el árbol de
`iphone/app/(tabs)`. Es la pantalla central de control de la alerta SOS (armado de
guardia, activación por voz, envío de alerta, atajos a Contactos, Permisos, Probar
Alerta y Ajustes).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: reexport válido hacia la implementación compartida.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| ../../../app/(tabs)/index | interna (proyecto padre) | Implementación real de la pantalla Inicio | Sí |

## Componentes que dependen de este archivo

- Expo Router: ruta `/(tabs)/` (index) del árbol iphone; es la ruta inicial del grupo
  de tabs (`initialRouteName="(tabs)"` en el layout raíz compartido cuando el usuario
  está onboarded).
- Navegaciones internas compartidas: `router.push('/contacts')`,
  `router.push('/permissions')`, `router.push('/test-alert')`,
  `router.push('/settings')` (presentes en la pantalla compartida).
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

No aplica (solo reexport). Cabecera documental: oafon, 2026-04-21, v1.0.0.

## Estructura (funciones / clases / tipos)

- Exportación por defecto de la pantalla compartida.

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : index.tsx
* Descripcion     : Reexport de la pantalla principal compartida para el cliente Apple.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Tab principal en safealert/iphone.
* ============================================================================ */

export { default } from '../../../app/(tabs)/index';
```

**Explicación de las líneas 1-11:**

- **Líneas 1-9**: cabecera documental estándar del proyecto.
- **Línea 11**: reexporta la implementación real de la pantalla Inicio desde el árbol
  de la app principal. Expo Router registra este archivo como la ruta `/(tabs)` inicial
  de la variante.
- [NOTA] La pantalla compartida (456 líneas) incluye la lógica crítica del botón SOS,
  estados de guardia (`useGuardStore`), permisos y servicios de alerta
  (`src/services/AlertService.ts`, `WakeWordService`, `LocationService`); toda esa
  lógica se hereda sin duplicación en la variante Apple.

## Fichas de funciones y métodos

No aplica (archivo de reexport).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] Reexport puro; la pantalla equivalente de
  la app principal y la de iphone son el MISMO archivo (paridad total por diseño).
- [OBSERVACIÓN TÉCNICA] La pantalla compartida navega a `/test-alert`, `/permissions`,
  `/contacts` y `/settings`; todas esas rutas existen en el árbol iphone salvo las
  divergencias ya documentadas en `iphone/app/permissions.tsx` (ruta `/ubicacion/manual`)
  y en el layout de tabs (ruta `history`).

## Seguridad

- [INFORMATIVO] Sin lógica propia en el reexport; la seguridad (permisos, ubicación,
  activación por voz, envío de alertas) depende de la pantalla y servicios compartidos.
  [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] BAJO: por ser la pantalla inicial tras el onboarding, cualquier fallo de
  arranque del layout compartido afecta a la experiencia principal de la variante;
  validar el flujo SOS completo en iOS/Web reales.
- [RECOMENDACIÓN] Ejecutar pruebas E2E del flujo de alerta en la variante antes de
  publicar, dado que la pantalla es compartida pero las plataformas difieren
  (permisos, wakeword, notificaciones).
