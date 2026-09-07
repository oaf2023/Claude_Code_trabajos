# Archivo: iphone/app/(tabs)/contacts.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/app/(tabs)/contacts.tsx | 11 | TypeScript/TSX | 528 | Pantalla de contactos (reexport) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Reexport de la pantalla de contactos de confianza compartida
(`app/(tabs)/contacts.tsx`, 313 líneas) para exponerla como tab `contacts` en el árbol
de `iphone/app/(tabs)`. Permite listar, editar (navega a `/contacts/[id]`) y añadir
contactos (`router.push('/contacts/new')` en la pantalla compartida, línea 219).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: reexport válido hacia la implementación compartida.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| ../../../app/(tabs)/contacts | interna (proyecto padre) | Implementación real de la pantalla | Sí |

## Componentes que dependen de este archivo

- Expo Router: tab `contacts` del árbol iphone.
- Pantalla compartida `app/(tabs)/index.tsx` (navega a `/contacts`, línea 325).
- Rutas de detalle: `/contacts/[id]` (reexportada en iphone).
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

No aplica (solo reexport). Cabecera documental: oafon, 2026-04-21, v1.0.0.

## Estructura (funciones / clases / tipos)

- Exportación por defecto de la pantalla compartida.

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : contacts.tsx
* Descripcion     : Reexport de la pantalla de contactos compartida para el cliente Apple.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Tab de contactos en safealert/iphone.
* ============================================================================ */

export { default } from '../../../app/(tabs)/contacts';
```

**Explicación de las líneas 1-11:**

- **Líneas 1-9**: cabecera documental estándar.
- **Línea 11**: reexporta la pantalla real de contactos.
- [NOTA] La pantalla compartida usa `ContactsService` y `useContactsStore` de `src/`;
  en iOS la lectura de contactos requiere el permiso `NSContactsUsageDescription`
  declarado en `iphone/app.json`.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] Reexport puro: paridad con la pantalla de
  la app principal.
- [OBSERVACIÓN TÉCNICA] La pantalla compartida navega a `/contacts/new` (línea 219 de
  la implementación) para añadir contacto. No se encontró `app/contacts/new.tsx` en la
  app principal (solo `app/contacts/[id].tsx`), por lo que la creación de contactos
  podría ser un flujo PARCIALMENTE IMPLEMENTADO en ambas variantes. [NIVEL DE CERTEZA:
  Inferido]

## Seguridad

- [INFORMATIVO] Sin lógica propia. La pantalla compartida maneja datos personales de
  contactos (nombres, teléfonos) con permiso de acceso a contactos del sistema;
  aplicar Data Governance (DAMMA/DAMA-DMBOK) en el almacenamiento sincronizado con
  Firestore. [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] BAJO: dependencia del permiso de contactos iOS declarado en `app.json`
  (presente). Validar el flujo de selección desde la agenda en iOS.
- [OBSERVACIÓN TÉCNICA] Verificar si la ruta `/contacts/new` debe existir en el árbol
  iphone (o en la raíz) para completar el alta de contactos.
