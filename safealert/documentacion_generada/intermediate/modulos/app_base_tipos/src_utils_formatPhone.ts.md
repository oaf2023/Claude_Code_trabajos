# Archivo: src/utils/formatPhone.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/utils/formatPhone.ts |
| Líneas totales | 39 |
| Lenguaje | TypeScript 5.9 |
| Tamaño (bytes) | 1135 |
| Categoría | Utilidades de normalización y validación de teléfonos (E.164) |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Provee el manejo de teléfonos del proyecto: `toE164` normaliza un número al formato
E.164 requerido por Twilio (proveedor de SMS), `isValidPhone` valida que el número
normalizado cumpla E.164 y `formatDisplayPhone` produce una representación legible para
Argentina (`+54 9 11 XXXX-XXXX`). Es la pieza que garantiza la invariante E.164 que
declaran los comentarios de `src/types/Contact.ts`.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Las tres funciones se usan de forma real en pantallas y
servicios:

- `toE164`: `app/bienvenida.tsx` (línea 32 y 150) y `src/services/ContactsService.ts` (líneas 13, 88, 148, 188).
- `isValidPhone`: `app/contacts/[id].tsx` (líneas 30 y 101) y `app/bienvenida.tsx` (líneas 32 y 86).
- `formatDisplayPhone`: `app/(tabs)/contacts.tsx` (líneas 26, 50, 63).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna | — | — | — |

El archivo usa solo expresiones regulares y operaciones de string del estándar.

## Componentes que dependen de este archivo

Referencias reales encontradas con búsqueda sobre el código fuente:

- `app/(tabs)/contacts.tsx` (línea 26): `import { formatDisplayPhone } ...` — formato de listado (líneas 50, 63).
- `app/contacts/[id].tsx` (línea 30): `import { isValidPhone } ...` — validación al guardar (línea 101).
- `app/bienvenida.tsx` (línea 32): `import { isValidPhone, toE164 } ...` — alta de teléfono (líneas 86, 150).
- `src/services/ContactsService.ts` (línea 13): `import { toE164 } ...` — normalización al crear/actualizar contactos (líneas 88, 148, 188).
- `docs/runbooks/README.md` (línea 29): referencia documental a `formatPhone` antes de enviar.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `defaultCountryCode` (parámetro) | `'+54'` | string | Prefijo de país por defecto (Argentina) en `toE164` | Línea 7 |
| Regex de limpieza | `/[^\d+]/g` | RegExp (literal en código) | Quita todo lo que no sea dígito o `+` | Línea 9 |
| Regex de E.164 | `/^\+\d{7,15}$/` | RegExp (literal en código) | Valida `+` seguido de 7 a 15 dígitos | Línea 25 |
| Prefijo argentino | `'+54'` | string | Comparación de `formatDisplayPhone` | Línea 31 |

## Estructura (funciones / clases / tipos)

- Funciones exportadas: `toE164`, `isValidPhone`, `formatDisplayPhone`.

## Análisis línea por línea

```ts
/**
 * Converts a phone number string to E.164 format required by Twilio.
 * Examples:
 *   "+54 9 11 1234-5678" → "+5491112345678"
 *   "011-1234-5678" → needs country code prefix
 */
export function toE164(phone: string, defaultCountryCode = '+54'): string {
  // Remove all non-digit characters except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // Already in E.164
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');

  return `${defaultCountryCode}${cleaned}`;
}
```

**Explicación de las líneas 1–20:**

- **Líneas 1–6**: docstring JSDoc que explica la conversión a E.164 (requerido por Twilio)
  con dos ejemplos: `"+54 9 11 1234-5678"` → `"+5491112345678"` y `"011-1234-5678"` →
  "necesita prefijo de país" (lo aporta `defaultCountryCode`).
- **Línea 7**: firma de `toE164(phone: string, defaultCountryCode = '+54'): string`;
  el segundo parámetro fija Argentina como país por defecto.
- **Línea 9** (`let cleaned = phone.replace(/[^\d+]/g, '');`): elimina todos los
  caracteres que no sean dígitos o el signo `+`.
- **Líneas 11–14**: si el resultado ya empieza por `+`, se considera E.164 completo y se
  devuelve tal cual.
- **Línea 17**: si no hay `+`, quita los ceros a la izquierda (`/^0+/`), habituales en
  números locales argentinos (p. ej. `011-...`).
- **Línea 19**: antepone el prefijo de país por defecto al número limpio.

```ts
export function isValidPhone(phone: string): boolean {
  const e164 = toE164(phone);
  // E.164: + followed by 7-15 digits
  return /^\+\d{7,15}$/.test(e164);
}
```

**Explicación de las líneas 22–26:**

- **Línea 22**: firma de `isValidPhone(phone: string): boolean`.
- **Línea 23**: normaliza el número con `toE164` (con el prefijo por defecto).
- **Línea 25** (`return /^\+\d{7,15}$/.test(e164);`): valida el estándar E.164: `+`
  seguido de entre 7 y 15 dígitos.
- **Línea 26**: cierre.

```ts
export function formatDisplayPhone(phone: string): string {
  // Return a human-readable version for display
  const e164 = toE164(phone);
  if (e164.startsWith('+54')) {
    // Argentine format: +54 9 11 XXXX-XXXX
    const digits = e164.slice(3);
    if (digits.length === 11) {
      return `+54 ${digits.slice(0, 1)} ${digits.slice(1, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
  }
  return e164;
}
```

**Explicación de las líneas 28–39:**

- **Línea 28**: firma de `formatDisplayPhone(phone: string): string`.
- **Línea 30**: normaliza a E.164 como base.
- **Líneas 31–37**: solo formatea si el prefijo es argentino `+54`.
  - Línea 33: descarta el prefijo `+54` (quedan los dígitos del número).
  - Línea 34: solo si quedan exactamente 11 dígitos (formato móvil argentino con `9`).
  - Línea 35: compone `+54 9 11 XXXX-XXXX` partiendo el string en grupos (1, 2, 4 y resto).
- **Línea 38**: para números no argentinos o con otra longitud devuelve el E.164 plano.

## Fichas de funciones y métodos

### `toE164(phone, defaultCountryCode)` (líneas 7–20)

- Firma original: `export function toE164(phone: string, defaultCountryCode = '+54'): string`.
- Propósito técnico: normalizar cualquier escritura de teléfono a E.164.
- Propósito funcional: entregar a Twilio/backends un número internacional estándar.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| phone | string | Teléfono en formato libre |
| defaultCountryCode | string (opcional) | Prefijo por defecto; `'+54'` |

- Retorno: string E.164 (con `+`).
- Excepciones: ninguna explícita; un string sin dígitos devuelve el prefijo de país solo.
- Dependencias: ninguna.
- Flujo interno: limpiar caracteres no deseados → si ya tiene `+`, devolver → quitar ceros
  iniciales → anteponer prefijo.
- Desde dónde se llama: `ContactsService.ts` (88, 148, 188) y `app/bienvenida.tsx` (150).
- Efectos secundarios: ninguno.
- Riesgos: números locales sin prefijo se interpretan siempre como argentinos; un usuario
  internacional sin `+` recibiría el prefijo argentino por defecto.

### `isValidPhone(phone)` (líneas 22–26)

- Firma original: `export function isValidPhone(phone: string): boolean`.
- Propósito técnico: validar E.164 tras la normalización.
- Parámetros: `phone: string`.
- Retorno: `boolean`.
- Excepciones: ninguna.
- Flujo: normaliza con `toE164` y prueba la regex `/^\+\d{7,15}$/`.
- Desde dónde se llama: `app/contacts/[id].tsx` (línea 101) y `app/bienvenida.tsx` (línea 86).
- Riesgos: un número con más de 15 o menos de 7 dígitos tras el `+` se rechaza, correcto
  según el estándar.

### `formatDisplayPhone(phone)` (líneas 28–39)

- Firma original: `export function formatDisplayPhone(phone: string): string`.
- Propósito técnico: formatear para presentación en UI.
- Parámetros: `phone: string`.
- Retorno: string legible (`+54 9 11 XXXX-XXXX`) o E.164 sin formato.
- Flujo: normaliza, y si es `+54` con 11 dígitos lo agrupa; en otro caso lo devuelve tal cual.
- Desde dónde se llama: `app/(tabs)/contacts.tsx` (líneas 50, 63) para listas y
  accesibilidad.
- Riesgos: números fijos argentinos (sin `9`, 10 dígitos) no se formatean; visualmente
  quedarían como E.164 plano.

## Clases / interfaces / tipos

Ninguna: el archivo exporta solo funciones.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: el tratamiento de Argentina es específico (`+54`, quitar ceros
  iniciales). Si la app se internacionaliza, el país por defecto y el formateo deberán
  parametrizarse.
- [OBSERVACIÓN TÉCNICA]: `formatDisplayPhone` solo aplica el formato bonito a móviles
  argentinos de 11 dígitos; cualquier otro número (fijos, internacionales) se muestra como
  E.164 plano. Impacto potencial: BAJO (cosmético).
- [OBSERVACIÓN TÉCNICA]: `toE164` con un string vacío devuelve `'+54'`, que pasaría la
  regex de 7-15 dígitos? No: `'+54'` tiene 2 dígitos, así que `isValidPhone('')` es false.
  [NIVEL DE CERTEZA: Confirmado por código].
- [NIVEL DE CERTEZA: Confirmado por código] para los usos citados en pantallas y servicios.

## Seguridad

- BAJO: la normalización no valida que el número pertenezca realmente al usuario que lo
  registra; un atacante podría registrar el teléfono de un tercero como contacto de
  confianza y hacer que la app envíe SMS de emergencia a ese número. La mitigación
  (verificación por OTP) no se observa en este módulo.
- INFORMATIVO: `phone` es dato personal (PII); debe persistirse cifrado en tránsito y
  protegido por reglas de Firestore.
- No se detectan hallazgos CRÍTICOS ni ALTOS en este archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: parametrizar el país por defecto (config o geolocalización) si se
  admite registro internacional.
- [RECOMENDACIÓN]: ampliar `formatDisplayPhone` para cubrir fijos argentinos y números
  internacionales comunes, o limitar su uso a móviles argentinos.
- [RECOMENDACIÓN]: evaluar verificación del número (p. ej. SMS de confirmación) en el alta
  de contacto, dado el impacto de enviar alertas a números de terceros.
