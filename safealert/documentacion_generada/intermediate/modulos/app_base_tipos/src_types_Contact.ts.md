# Archivo: src/types/Contact.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/types/Contact.ts |
| Líneas totales | 23 |
| Lenguaje | TypeScript 5.9 |
| Tamaño (bytes) | 763 |
| Categoría | Definición de tipos del dominio de contactos de confianza |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define el modelo de los contactos de confianza (destinatarios de las alertas SOS):
`Contact` para la entidad persistida (Firestore y persistencia local) y
`ContactFormData` para el formulario de alta/edición. Los comentarios documentan dos
reglas de dominio: el teléfono se guarda en formato E.164 (`+15551234567`) y la
`priority` 0 corresponde al contacto principal.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. `Contact` y `ContactFormData` se importan en 5 ubicaciones
reales del código fuente (pantallas, hook, stores y servicios).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna | — | — | — |

El archivo no importa nada; es autónomo.

## Componentes que dependen de este archivo

Referencias reales encontradas con búsqueda sobre el código fuente:

- `app/(tabs)/contacts.tsx` (línea 25): `import { Contact } from '../../src/types/Contact'` — lista de contactos.
- `src/hooks/useContacts.ts` (línea 6): `import { ContactFormData } from '../types/Contact'`.
- `src/stores/useContactsStore.ts` (línea 2): `import { Contact } from '../types/Contact'`.
- `src/services/AlertService.ts` (línea 14): `import { Contact } from '../types/Contact'` — para construir los contactos de la alerta.
- `src/services/ContactsService.ts` (línea 12): `import { Contact, ContactFormData } from '../types/Contact'` — CRUD de contactos.

## Variables globales y constantes

Ninguna: el archivo solo exporta tipos.

## Estructura (funciones / clases / tipos)

- Interfaces (`export interface`): `Contact`, `ContactFormData`.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : Contact.ts
* Descripción     : Tipos del dominio de contactos de confianza.
* Autor           : oafon
* Fecha           : 2026-03-26
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Uso             : Modelos usados por contactos, alertas y persistencia local.
* ============================================================================ */
```

**Explicación de las líneas 1–9:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto.
- **Líneas 2–8**: metadatos del archivo (autor `oafon`, fecha `2026-03-26`, versión
  `1.2.0`, TypeScript 5.9) y descripción de uso: "Modelos usados por contactos, alertas y
  persistencia local".
- **Línea 9**: cierre de la cabecera.

```ts
export interface Contact {
  id: string;
  name: string;
  phone: string; // E.164 format: +15551234567
  active: boolean;
  priority: number; // 0 = principal, números mayores = menor prioridad
  addedAt: number; // timestamp ms
}
```

**Explicación de las líneas 11–18:**

- **Línea 11**: apertura de `Contact`, contacto de confianza persistido.
- **Línea 12**: `id`, identificador único (id de documento Firestore o local).
- **Línea 13**: `name`, nombre visible del contacto.
- **Línea 14**: `phone`, teléfono en formato E.164; el comentario da el ejemplo
  `+15551234567`. La normalización a E.164 la aplica `src/utils/formatPhone.ts`
  (`toE164`), usada por `ContactsService.ts` antes de persistir.
- **Línea 15**: `active`, indica si el contacto está habilitado para recibir alertas.
- **Línea 16**: `priority`, orden de notificación; el comentario define `0` como principal
  y números mayores como menor prioridad.
- **Línea 17**: `addedAt`, timestamp en milisegundos de creación.
- **Línea 18**: cierre de la interfaz.

```ts
export interface ContactFormData {
  name: string;
  phone: string;
}
```

**Explicación de las líneas 20–23:**

- **Línea 20**: apertura de `ContactFormData`, datos mínimos del formulario de
  alta/edición de contactos.
- **Líneas 21–22**: `name` y `phone`, los únicos campos editables por el usuario.
- **Línea 23**: cierre de la interfaz.

## Fichas de funciones y métodos

El archivo no contiene funciones: es una declaración pura de tipos.

## Clases / interfaces / tipos

### Interfaz `Contact` (líneas 11–18)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| id | string | Sí | Identidad del contacto en listas (`contacts.tsx`) y stores |
| name | string | Sí | Mostrado en UI y usado como nombre en mensajes de alerta |
| phone | string | Sí | Normalizado a E.164 por `ContactsService.ts` con `toE164` (líneas 88, 148, 188) |
| active | boolean | Sí | Habilitación para envío de alertas |
| priority | number | Sí | Orden de notificación (0 = principal) |
| addedAt | number | Sí | Timestamp ms de creación |

- Responsabilidad: entidad de dominio de contacto de confianza, usada por pantallas,
  stores, servicios de contactos y servicios de alerta.
- Relaciones: `Contact` se convierte en `AlertContact` (de `src/types/Alert.ts`) al
  disparar una alerta (`AlertService.ts`).

### Interfaz `ContactFormData` (líneas 20–23)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| name | string | Sí | Entrada del formulario en `useContacts.ts` / `ContactsService.ts` |
| phone | string | Sí | Ídem; se valida con `isValidPhone` y se normaliza con `toE164` |

- Responsabilidad: contrato de los datos editables del formulario de contactos.
- Relaciones: se transforma en `Contact` (con `id`, `active`, `priority`, `addedAt`) en el
  alta y sirve de entrada al update.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: `ContactFormData` y `Contact` duplican `name`/`phone`, de modo
  que un cambio de formulario sin mapeo explícito podría persistir campos sin normalizar.
  Es un riesgo de diseño bajo, porque `ContactsService` sí aplica `toE164` en el alta.
- [NIVEL DE CERTEZA: Confirmado por código] respecto a las importaciones y la
  normalización E.164 verificada en `ContactsService.ts`.

## Seguridad

- INFORMATIVO: `phone` es dato personal (identificador de contacto); su persistencia en
  Firestore debe quedar protegida por reglas de seguridad por `userId`. No hay secretos ni
  valores sensibles en este archivo.
- No se detectan hallazgos CRÍTICOS, ALTOS ni MEDIOS en este archivo de tipos.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: mantener la invariante E.164 en el tipo (p. ej. con un tipo plantilla o
  validación centralizada en `ContactsService`) para que ningún flujo persista un teléfono
  sin normalizar.
- [RECOMENDACIÓN]: documentar el significado del orden de `priority` en un único lugar de
  referencia (comentario ya presente en línea 16) y verificar que el envío respeta ese
  orden.
