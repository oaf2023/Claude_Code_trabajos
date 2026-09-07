# Archivo: iphone/app/(tabs)/settings.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/app/(tabs)/settings.tsx | 11 | TypeScript/TSX | 536 | Pantalla de configuración (reexport) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Reexport de la pantalla de configuración compartida (`app/(tabs)/settings.tsx`,
532 líneas) para exponerla como tab `settings` en el árbol de `iphone/app/(tabs)`.
Permite gestionar ajustes de cuenta, recordatorios, permisos (navega a `/permissions`),
cómo funciona (navega a `/como-funciona`) y otros parámetros de la app.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: reexport válido hacia la implementación compartida.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| ../../../app/(tabs)/settings | interna (proyecto padre) | Implementación real de la pantalla | Sí |

## Componentes que dependen de este archivo

- Expo Router: tab `settings` del árbol iphone.
- Pantalla compartida `app/(tabs)/index.tsx` (navega a `/settings`, línea 365).
- Rutas a las que navega la pantalla compartida: `/como-funciona` y `/permissions`
  (ambas reexportadas en iphone).
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

No aplica (solo reexport). Cabecera documental: oafon, 2026-04-21, v1.0.0.

## Estructura (funciones / clases / tipos)

- Exportación por defecto de la pantalla compartida.

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : settings.tsx
* Descripcion     : Reexport de la pantalla de configuracion compartida para el cliente Apple.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Tab de configuracion en safealert/iphone.
* ============================================================================ */

export { default } from '../../../app/(tabs)/settings';
```

**Explicación de las líneas 1-11:**

- **Líneas 1-9**: cabecera documental estándar.
- **Línea 11**: reexporta la pantalla real de configuración.
- [NOTA] La pantalla compartida (532 líneas, la de mayor tamaño de la app principal)
  incluye ajustes de suscripción, recordatorios y cuenta, con lógica que puede requerir
  servicios de pago/cuenta (`src/services/`) disponibles también en la variante.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] Reexport puro: sin divergencia de código
  respecto a la app principal.
- [NOTA] Cualquier ajuste nuevo añadido a la pantalla compartida aparece
  automáticamente en ambas apps, lo que es la ventaja arquitectónica de los reexports.

## Seguridad

- [INFORMATIVO] Sin lógica propia. La pantalla compartida puede exponer datos de cuenta
  (teléfono, suscripción) y enlaces de pago; revisar que no se listen datos sensibles
  en logs. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] BAJO: si la pantalla compartida invoca flujos de pago (Mercado Pago) o
  ajustes de suscripción, validar su funcionamiento en iOS (StoreKit vs pasarela web)
  en la variante Apple.
- [RECOMENDACIÓN] Verificar el acceso a Configuración del sistema y los recordatorios
  locales en iOS.
