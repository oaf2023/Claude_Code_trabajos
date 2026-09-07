# Archivo: iphone/app/(tabs)/_layout.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/app/(tabs)/_layout.tsx | 11 | TypeScript/TSX | 515 | Layout de pestañas (reexport) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Reexport del layout de pestañas compartido (`app/(tabs)/_layout.tsx`, 100 líneas) para
el grupo `(tabs)` en el árbol de `iphone/app/`. El layout compartido define las tabs
Inicio (`index`), Historial (`history`), Contactos (`contacts`) y Configuración
(`settings`) con iconos del tema compartido (`src/theme/Icon`).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE como reexport, pero con una divergencia importante frente a la
app principal (ver Observaciones y Riesgos): la app principal tiene la tab `history`
(`app/(tabs)/history.tsx`, 233 líneas) mientras que en `iphone/app/(tabs)/` NO existe
el archivo `history.tsx`. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| ../../../app/(tabs)/_layout | interna (proyecto padre) | Implementación real del layout de tabs | Sí |

## Componentes que dependen de este archivo

- Expo Router: layout del grupo `(tabs)` de `iphone/app`.
- Las pantallas `(tabs)/index`, `(tabs)/contacts`, `(tabs)/settings` de iphone se
  renderizan dentro de este layout.
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

No aplica (solo reexport). Cabecera documental: oafon, 2026-04-21, v1.0.0.

## Estructura (funciones / clases / tipos)

- Exportación por defecto del layout de tabs compartido.

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : _layout.tsx
* Descripcion     : Reexport del layout de tabs compartido para el cliente Apple.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Layout de tabs en safealert/iphone.
* ============================================================================ */

export { default } from '../../../app/(tabs)/_layout';
```

**Explicación de las líneas 1-11:**

- **Líneas 1-9**: cabecera documental estándar.
- **Línea 11**: reexporta el layout de tabs compartido.
- [OBSERVACIÓN TÉCNICA] El layout compartido declara 4 pantallas en su `<Tabs>`
  (index, history, contacts, settings; `app/(tabs)/_layout.tsx` líneas 52-87). El
  árbol de iphone solo reexporta `index`, `contacts` y `settings`; falta `history`.
  Según el comportamiento de expo-router, declarar un `Tabs.Screen name="history"` sin
  archivo de ruta correspondiente puede provocar un error en desarrollo o una tab sin
  contenido.
  [NIVEL DE CERTEZA: Inferido]

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Divergencia real de rutas entre la app principal y la variante
  iphone: la app principal incluye la tab Historial (`history.tsx`, 233 líneas) y
  también `app/ubicacion/manual.tsx` y `app/+html.tsx` (PWA), que no tienen reexport en
  iphone. [NIVEL DE CERTEZA: Confirmado por código]
- [NOTA] La variante iphone por tanto expone menos funcionalidad de navegación que la
  app principal (sin historial visible).

## Seguridad

- [INFORMATIVO] Sin lógica propia; sin hallazgos de seguridad en el reexport.
  [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] ALTO: el layout compartido registra una tab `history` que no existe en el
  árbol `iphone/app/(tabs)`; esto puede romper el render del grupo de tabs o dejar una
  pestaña inaccesible/errónea en la variante Apple. [NIVEL DE CERTEZA: Inferido]
- [RECOMENDACIÓN] Crear el reexport `iphone/app/(tabs)/history.tsx` apuntando a
  `../../../app/(tabs)/history` para lograr paridad, o ajustar el layout compartido
  para que registre las tabs de forma condicional por plataforma/árbol.
