# Archivo: src/utils/googleMapsLink.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/utils/googleMapsLink.ts |
| Líneas totales | 8 |
| Lenguaje | TypeScript 5.9 |
| Tamaño (bytes) | 330 |
| Categoría | Utilidad de generación de enlaces de mapas |
| Estado detectado | FUNCIONALIDAD EXISTENTE (parcial: una de las dos funciones) |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Genera enlaces de Google Maps a partir de coordenadas. Expone dos variantes:
`buildMapsLink` (formato corto `https://maps.google.com/?q=lat,lon`) y
`buildMapsLinkFromCoords` (formato oficial de la API de Google con universal link, que
también abre en Apple Maps en iOS).

## Clasificación y estado

- `buildMapsLink`: FUNCIONALIDAD EXISTENTE. Se usa en `LocationService.buildMapsLink`
  (líneas 17, 255-257 de `src/services/LocationService.ts`), que a su vez llama
  `AlertService` (línea 211).
- `buildMapsLinkFromCoords`: APARENTEMENTE NO UTILIZADO. No se hallaron importaciones de
  esta función fuera de su propia definición. [POTENCIALMENTE NO UTILIZADO].

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna | — | — | — |

Usa solo interpolación de plantillas de string.

## Componentes que dependen de este archivo

Referencias reales encontradas con búsqueda sobre el código fuente:

- `src/services/LocationService.ts` (línea 17): `import { buildMapsLink } from '../utils/googleMapsLink'` — se reexpone como método estático del servicio (líneas 255-257).
- `src/services/AlertService.ts` (línea 211): invoca `LocationService.buildMapsLink(location)` para el `mapsLink` de la alerta (uso indirecto de la utilidad).
- Tests que ejercitan la cadena: `src/services/__tests__/LocationService.test.ts` (línea 246: `describe('buildMapsLink')`) y `src/services/__tests__/AlertService.test.ts` (línea 27: mock de `buildMapsLink`).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| Prefijo URL 1 | `'https://maps.google.com/?q='` | string (en template) | Base del enlace corto | Línea 2 |
| Prefijo URL 2 | `'https://www.google.com/maps/search/?api=1&query='` | string (en template) | Base del enlace oficial con universal link | Línea 7 |

## Estructura (funciones / clases / tipos)

- Funciones exportadas: `buildMapsLink`, `buildMapsLinkFromCoords`.

## Análisis línea por línea

```ts
export function buildMapsLink(lat: number, lon: number): string {
  return `https://maps.google.com/?q=${lat},${lon}`;
}
```

**Explicación de las líneas 1–3:**

- **Línea 1**: firma de `buildMapsLink(lat: number, lon: number): string`.
- **Línea 2**: devuelve el enlace `https://maps.google.com/?q=lat,lon` interpolando ambos
  números. No se aplica URL-encoding explícito, pero los números no requieren escape.
- **Línea 3**: cierre.

```ts
export function buildMapsLinkFromCoords(lat: number, lon: number): string {
  // Also works in Apple Maps on iOS via universal link
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
}
```

**Explicación de las líneas 5–8:**

- **Línea 5**: firma de `buildMapsLinkFromCoords(lat: number, lon: number): string`.
- **Línea 6**: comentario: el formato también funciona en Apple Maps en iOS mediante
  universal link.
- **Línea 7**: devuelve el enlace del formato oficial de la API de Google Maps
  (`/maps/search/?api=1&query=...`).
- **Línea 8**: cierre.

## Fichas de funciones y métodos

### `buildMapsLink(lat, lon)` (líneas 1–3)

- Firma original: `export function buildMapsLink(lat: number, lon: number): string`.
- Propósito técnico: construir un enlace corto de Google Maps.
- Parámetros: `lat: number`, `lon: number`.
- Retorno: string URL.
- Excepciones: ninguna.
- Desde dónde se llama: `LocationService.buildMapsLink` (línea 256), que a su vez llama
  `AlertService` (línea 211).
- Efectos secundarios: ninguno.

### `buildMapsLinkFromCoords(lat, lon)` (líneas 5–8)

- Firma original: `export function buildMapsLinkFromCoords(lat: number, lon: number): string`.
- Propósito técnico: enlace oficial de Google (universal link compatible con Apple Maps).
- Parámetros: `lat: number`, `lon: number`.
- Retorno: string URL.
- Excepciones: ninguna.
- Desde dónde se llama: no se encontraron llamadas en el código fuente.
- Efectos secundarios: ninguno.

## Clases / interfaces / tipos

Ninguna: el archivo exporta solo funciones.

## Observaciones técnicas

- [POTENCIALMENTE NO UTILIZADO]: `buildMapsLinkFromCoords` (líneas 5-8) no tiene
  referencias fuera de su definición tras la búsqueda en el código fuente. No se afirma
  que pueda eliminarse sin confirmar la ausencia de usos dinámicos o en archivos fuera del
  alcance de la búsqueda.
- [NOTA]: `buildMapsLink` produce `https://maps.google.com/?q=lat,lon`, que es el formato
  que esperan los tests de mocks (p. ej. `'https://maps.google.com/?q=-34.6,-58.38'` en
  `AlertService.test.ts`, línea 27).
- [NIVEL DE CERTEZA: Confirmado por código] para el uso de `buildMapsLink`; [NIVEL DE
  CERTEZA: Altamente probable] para la falta de uso de `buildMapsLinkFromCoords` (búsqueda
  amplia sobre el proyecto).

## Seguridad

- INFORMATIVO: los enlaces exponen coordenadas exactas del usuario si se comparten fuera
  del flujo de alerta; es inherente a la funcionalidad SOS. No hay secretos en este
  archivo.
- No se detectan hallazgos de seguridad relevantes.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: confirmar si `buildMapsLinkFromCoords` debe eliminarse o usarse (p. ej.
  en plataforma iOS), evitando código muerto aparente.
- [RECOMENDACIÓN]: si el enlace se inserta en SMS, considerar añadir el parámetro de
  resultados sin `&output=embed` para que abra la app de mapas en lugar de una vista
  embebida, según el comportamiento deseado.
