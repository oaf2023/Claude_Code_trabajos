# Archivo: iphone/app/contacts/[id].tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/app/contacts/[id].tsx | 11 | TypeScript/TSX | 527 | Detalle de contacto (ruta dinámica, reexport) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Reexport de la pantalla de detalle/edición de contacto compartida
(`app/contacts/[id].tsx`, 383 líneas) para exponerla como ruta dinámica
`/contacts/[id]` en el árbol de `iphone/app/`. Se abre como modal desde la lista de
contactos (`router.push('/contacts/' + id)` en `app/(tabs)/contacts.tsx`) y permite
ver/editar los datos del contacto de confianza.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: reexport válido hacia la implementación compartida.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| ../../../app/contacts/[id] | interna (proyecto padre) | Implementación real de la pantalla | Sí |

## Componentes que dependen de este archivo

- Expo Router: ruta dinámica `/contacts/[id]` del árbol iphone (modal).
- Layout raíz compartido: `<Stack.Screen name="contacts/[id]">` con
  `presentation: 'modal'`.
- Pantalla compartida `app/(tabs)/contacts.tsx` (edición de contacto).
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

No aplica (solo reexport). Cabecera documental: oafon, 2026-04-21, v1.0.0.

## Estructura (funciones / clases / tipos)

- Exportación por defecto de la pantalla compartida.

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : [id].tsx
* Descripcion     : Reexport del detalle de contacto compartido para el cliente Apple.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Ruta dinamica de contacto en safealert/iphone.
* ============================================================================ */

export { default } from '../../../app/contacts/[id]';
```

**Explicación de las líneas 1-11:**

- **Líneas 1-9**: cabecera documental estándar.
- **Línea 11**: reexporta la implementación real de la ruta dinámica.
- [NOTA] La sintaxis `[id]` en el nombre del archivo crea una ruta con parámetro en
  Expo Router; la pantalla compartida leerá el parámetro `id` para cargar el contacto.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] Reexport puro con paridad con la app
  principal.
- [NOTA] La ruta dinámica es idéntica en ambos árboles (`[id].tsx`), lo que garantiza
  que el modal de detalle funcione en la variante mientras exista la ruta.

## Seguridad

- [INFORMATIVO] Sin lógica propia; la pantalla compartida trata datos personales de
  contacto; validar que no se expongan números completos en logs ni analíticas.
  [NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] BAJO: si la pantalla compartida de detalle permite editar y guardar en
  Firestore, confirmar que las reglas de seguridad (`firestore.rules`) autoricen
  únicamente al propietario del documento.
- [RECOMENDACIÓN] Probar la ruta dinámica en iOS/Web (modal desde contactos).
