# Archivo: iphone/app/_layout.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/app/_layout.tsx | 11 | TypeScript/TSX | 512 | Layout raíz de Expo Router (reexport) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Reexport del layout raíz compartido de la app principal para el cliente Apple. Su
única responsabilidad es exponer la ruta raíz de Expo Router en el árbol de
`iphone/` apuntando a la implementación real de `app/_layout.tsx` (425 líneas), que
contiene autenticación controlada, hidratación, modales de pago/prueba, notificaciones
y restauración del modo guardia.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: reexport válido hacia una implementación que existe en la raíz.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| ../../app/_layout | interna (proyecto padre) | Implementación real del layout raíz | Sí |

## Componentes que dependen de este archivo

- Expo Router (resuelve esta ruta como `_layout` raíz del árbol `iphone/app`).
- Todas las rutas de `iphone/app/` se renderizan bajo este layout.
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

No aplica (solo reexport). Cabecera documental: Autor oafon, Fecha 2026-04-21,
Versión 1.0.0, Lenguaje TypeScript 5.9.

## Estructura (funciones / clases / tipos)

- Exportación por defecto anónima del componente compartido.

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : _layout.tsx
* Descripcion     : Reexport del layout raiz compartido para el cliente Apple.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Ruta raiz de Expo Router en safealert/iphone.
* ============================================================================ */

export { default } from '../../app/_layout';
```

**Explicación de las líneas 1-11:**

- **Líneas 1-9**: cabecera documental estándar del proyecto.
- **Línea 11** (`export { default } from '../../app/_layout'`): reexporta el default
  del layout raíz de la app principal. Expo Router tratará este archivo como el layout
  raíz del árbol `iphone/app`.
- [NOTA] El layout compartido (en `app/_layout.tsx`) registra en su `<Stack>` las
  pantallas `(tabs)`, `bienvenida`, `contacts/[id]`, `permissions`, `test-alert` y
  `como-funciona`; todas existen como reexports en `iphone/app/`.
- [OBSERVACIÓN TÉCNICA] El layout compartido importa servicios con dependencias
  nativas (NotificationService, WakeWordService, PaymentModal, TrialService,
  expo-splash-screen, Sentry). En la variante Apple, esas dependencias deben resolverse
  desde el `node_modules` raíz y deben estar soportadas en iOS/Web; si algún módulo
  nativo no está disponible en la plataforma destino, el arranque puede fallar
  (ver `iphone/app.json`: sin plugin de Sentry ni expo-secure-store).

## Fichas de funciones y métodos

No aplica (archivo de reexport sin lógica propia).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] Este archivo es un reexport: la lógica
  real está documentada en el módulo de la app principal (`app/_layout.tsx`).
- [POTENCIALMENTE NO UTILIZADO] No aplica a este archivo: es un punto de entrada de
  rutas, consumido por convención de Expo Router.

## Seguridad

- [INFORMATIVO] El reexport no añade superficie de seguridad por sí mismo; hereda toda
  la lógica de autenticación del layout compartido. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] MEDIO: dependencias del layout compartido no declaradas en
  `iphone/package.json` (Sentry, expo-secure-store vía código compartido, etc.) y
  resueltas desde el monorepo raíz; cualquier cambio de plataforma (iOS/Web) debe
  validarse en la variante.
- [RECOMENDACIÓN] Ejecutar la variante en iOS real y en Web para verificar el arranque
  completo del layout compartido antes de publicar.
