# Archivo: src/utils/MessageFormatter.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/utils/MessageFormatter.ts |
| Líneas totales | 46 |
| Lenguaje | TypeScript 5.9 |
| Tamaño (bytes) | 1762 |
| Categoría | Lógica de dominio (utilidad) para construcción de mensajes de alerta |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Centraliza la interpolación de la plantilla de mensaje de alerta: recibe el texto con
placeholders (`{name}`, `{location}`, `{time}`) y los datos de ubicación, y devuelve el
mensaje final listo para SMS. Añade una nota de caducidad de la ubicación cuando la
posición es antigua (`isStale`), formatea la hora local con la zona horaria argentina
(`es-AR`) y aplica un nombre de contacto por defecto si no se provee.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Se usa de forma real en `src/services/AlertService.ts`
(importación línea 22; llamada `MessageFormatter.format(...)` en línea 215). Además el
archivo está incluido en la recolección de cobertura de Jest (`jest.config.js`, línea 32)
y tiene su suite de tests en `src/utils/__tests__/MessageFormatter.test.ts` (9 casos).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna importación | — | — | — |

El archivo no importa librerías; usa `Date`, `String.prototype.replace`,
`toLocaleTimeString` y plantillas de texto del estándar de JavaScript/TypeScript.

## Componentes que dependen de este archivo

Referencias reales encontradas con búsqueda sobre el código fuente:

- `src/services/AlertService.ts` (línea 22): `import { MessageFormatter } from '../utils/MessageFormatter'`; llamada en línea 215 para componer `messageText` a partir de `settings.messageTemplate` y los datos de ubicación.
- `src/utils/__tests__/MessageFormatter.test.ts` (línea 11): importa `MessageFormatter` para sus 9 tests.
- `jest.config.js` (línea 32): archivo bajo `collectCoverageFrom`.

## Variables globales y constantes

Ninguna: el objeto `MessageFormatter` es la única exportación y no mantiene estado global.

## Estructura (funciones / clases / tipos)

- Interfaz local (no exportada): `MessageData`.
- Objeto exportado: `MessageFormatter` con el método `format(template, data): string`.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : MessageFormatter.ts
* Descripción     : Lógica de dominio para la construcción de mensajes de alerta.
* Autor           : oafon
* Fecha           : 2026-03-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : MessageFormatter.format(template, data)
* ============================================================================ */
```

**Explicación de las líneas 1–9:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto.
- **Líneas 2–8**: metadatos (autor `oafon`, fecha `2026-03-21`, versión `1.0.0`) y
  descripción: "Lógica de dominio para la construcción de mensajes de alerta".
- **Línea 9**: cierre de la cabecera.

```ts
interface MessageData {
  mapsLink: string;
  isStale: boolean;
  staleMinutes?: number;
  contactName?: string;
}
```

**Explicación de las líneas 11–16:**

- **Línea 11**: apertura de `MessageData`, contrato de entrada del formateador.
- **Línea 12**: `mapsLink`, enlace de mapas de la ubicación (string; puede ser vacío o el
  marcador `[Ubicación no disponible]` que arma el llamador).
- **Línea 13**: `isStale`, indica si la ubicación es antigua.
- **Línea 14**: `staleMinutes`, minutos de antigüedad (opcional).
- **Línea 15**: `contactName`, nombre del contacto (opcional).
- **Línea 16**: cierre de la interfaz.

```ts
/* ============================================================================
* Función         : format
* Descripción     : Reemplaza placeholders en el template por datos reales de ubicación y tiempo.
* Fecha            : 2026-03-21
* Versión          : 1.0.0
* Lenguaje         : TypeScript 5.9
* Conexiones      : AlertService.ts
* Ingesta          : template: string, data: MessageData
* Devolución      : string
* Uso             : MessageFormatter.format(template, { mapsLink, isStale, ... })
* ============================================================================ */
export const MessageFormatter = {
  format(template: string, data: MessageData): string {
    const time = new Date().toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    let locationText = data.mapsLink;
    if (data.isStale && data.staleMinutes) {
      locationText = `${data.mapsLink} (ubicación de hace ${data.staleMinutes} min)`;
    }

    return template
      .replace('{location}', locationText)
      .replace('{time}', time)
      .replace('{name}', data.contactName || 'Tu contacto');
  }
};
```

**Explicación de las líneas 18–46:**

- **Líneas 18–28**: cabecera de función estándar del proyecto para `format`
  (descripción, fecha, versión, conexiones con `AlertService.ts`, ingesta, devolución y
  uso).
- **Línea 29**: exporta el objeto `MessageFormatter` (export nombrado de una constante).
- **Línea 30**: firma del método `format(template: string, data: MessageData): string`.
- **Líneas 31–34**: `const time = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })`: genera la hora actual HH:mm con la locale argentina. [OBSERVACIÓN TÉCNICA]: usa la hora del dispositivo, no la del servidor; suficiente para un mensaje de emergencia.
- **Línea 36**: `let locationText = data.mapsLink`: valor base del placeholder `{location}`.
- **Líneas 37–39**: si `isStale` y `staleMinutes` son verdaderos, anexa el sufijo `(ubicación de hace N min)` al enlace. [NOTA]: con `isStale: true` pero `staleMinutes` ausente/0, no se anota nada (condición `&&`).
- **Líneas 41–44**: encadenamiento de `replace`: sustituye el primer `{location}`, el
  primer `{time}` y el primer `{name}`. [OBSERVACIÓN TÉCNICA]: `String.replace` con
  string reemplaza solo la PRIMERA ocurrencia de cada placeholder; si la plantilla
  repitiera `{name}` dos veces, la segunda quedaría sin sustituir.
- **Línea 44**: `data.contactName || 'Tu contacto'`: valor por defecto cuando no se
  provee nombre.
- **Línea 45**: cierre del método.
- **Línea 46**: cierre del objeto exportado.

## Fichas de funciones y métodos

### `MessageFormatter.format(template, data)` (líneas 30–45)

- Firma original: `format(template: string, data: MessageData): string`.
- Propósito técnico: sustituir los placeholders de la plantilla por los datos reales.
- Propósito funcional: componer el SMS de emergencia legible que recibirán los contactos.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| template | string | Plantilla con placeholders `{location}`, `{time}`, `{name}` |
| data.mapsLink | string | Enlace de mapas o marcador de ubicación no disponible |
| data.isStale | boolean | Indica ubicación antigua |
| data.staleMinutes | number (opcional) | Minutos de antigüedad |
| data.contactName | string (opcional) | Nombre del contacto destinatario |

- Retorno: string con los placeholders sustituidos (o sin cambios si no hay placeholders
  o el template es vacío).
- Excepciones: no lanza excepciones explícitas.
- Dependencias: ninguna externa; usa APIs estándar de fecha y string.
- Flujo interno paso a paso:
  1. Calcula la hora local actual con `toLocaleTimeString('es-AR')`.
  2. Decide el texto de ubicación (con o sin nota de caducidad).
  3. Reemplaza los placeholders en orden `{location}`, `{time}`, `{name}`.
- Desde dónde se llama: `AlertService.ts` (línea 215), con
  `mapsLink` (o `'[Ubicación no disponible]'`), `location?.isStale` y
  `location?.staleMinutes`.
- Efectos secundarios: ninguno (función pura respecto a su entrada, salvo la lectura del
  reloj del sistema en el momento de la llamada).
- Riesgos: hora local del dispositivo; sustitución de una sola ocurrencia por placeholder.

## Clases / interfaces / tipos

### Interfaz `MessageData` (líneas 11–16, no exportada)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| mapsLink | string | Sí | `AlertService.ts` línea 216 |
| isStale | boolean | Sí | `AlertService.ts` línea 217 |
| staleMinutes | number | No | `AlertService.ts` línea 218 |
| contactName | string | No | No usado por `AlertService` hoy (queda disponible) |

- Responsabilidad: tipar la entrada de `format`. Al no exportarse, los consumidores deben
  construir el objeto conforme a la forma estructural.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: `format` reemplaza solo la primera ocurrencia de cada placeholder
  (líneas 41-43). La plantilla por defecto de `Settings.ts` usa cada placeholder una sola
  vez, pero una plantilla personalizada con placeholders repetidos produciría mensajes
  incompletos. Impacto potencial: MEDIO en experiencia, bajo en seguridad.
- [OBSERVACIÓN TÉCNICA]: `isStale: true` sin `staleMinutes` no añade la nota de
  antigüedad (línea 37): comportamiento silencioso que depende del llamador.
- [OBSERVACIÓN TÉCNICA]: `toLocaleTimeString('es-AR', ...)` usa la zona horaria y locale
  del dispositivo; dos usuarios pueden recibir horas formateadas de forma distinta si sus
  dispositivos difieren. Es aceptable para el caso de uso, pero conviene tenerlo presente
  al auditar mensajes.
- [NIVEL DE CERTEZA: Confirmado por código] para el uso en `AlertService.ts`.

## Seguridad

- INFORMATIVO: los placeholders se sustituyen con `String.replace` (sin ejecución de
  código), por lo que no hay riesgo de inyección de plantillas a partir de `messageTemplate`
  o `mapsLink`.
- BAJO: el contenido de `mapsLink` puede ser un enlace arbitrario si alguna vez se
  construye con entrada de usuario sin validar; hoy lo genera `LocationService` a partir de
  números. Los destinatarios del SMS podrían recibir enlaces no controlados si cambiara la
  fuente.
- No se detectan hallazgos CRÍTICOS ni ALTOS.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: usar `replaceAll` o `split/join` si se quiere sustituir todas las
  ocurrencias de cada placeholder, o documentar la restricción de una sola ocurrencia.
- [RECOMENDACIÓN]: considerar `Intl.DateTimeFormat` cacheado para consistencia y
  rendimiento si `format` se llamara en bucles.
- [RECOMENDACIÓN]: mantener la suite de tests (9 casos, ver
  `MessageFormatter.test.ts`) como red de seguridad al tocar esta lógica.
