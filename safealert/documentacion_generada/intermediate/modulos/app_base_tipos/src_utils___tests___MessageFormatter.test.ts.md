# Archivo: src/utils/__tests__/MessageFormatter.test.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/utils/__tests__/MessageFormatter.test.ts |
| Líneas totales | 106 |
| Lenguaje | TypeScript 5.9 (suite de tests con Jest + ts-jest) |
| Tamaño (bytes) | 3340 |
| Categoría | Tests unitarios del formateador de mensajes de alerta |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Verifica el comportamiento de `MessageFormatter.format` con 9 casos: sustitución de los
placeholders `{location}`, `{time}` y `{name}`, anotación de ubicación antigua
(`isStale`/`staleMinutes`), nombre por defecto `'Tu contacto'`, sustitución simultánea de
los tres placeholders y manejo de plantillas vacías o sin placeholders. Sirve como red de
seguridad de la lógica que compone el SMS de emergencia.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. El archivo cumple la máscara de descubrimiento de Jest
(`testMatch: ['**/__tests__/**/*.test.ts']`, ver `jest.config.js` líneas 16-17) y su
ejecución documentada en la cabecera es `npx jest src/utils/__tests__/MessageFormatter.test.ts`.
El informe técnico del proyecto reporta 9 tests con cobertura 100% de statements y branch
para este archivo (evidencia externa de ejecución).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `MessageFormatter` desde `../MessageFormatter` | interna | En todos los `it(...)` del bloque `format` | Sí |
| `describe`, `it`, `expect` (globales de Jest) | estándar de test (globales) | Estructura de la suite | Sí |

## Componentes que dependen de este archivo

El archivo es un test y no es importado por código de producción. Referencias reales
encontradas:

- `jest.config.js` (línea 32): `src/utils/MessageFormatter.ts` figura en `collectCoverageFrom`, por lo que este test contribuye a la cobertura de dicho archivo.
- La suite se descubre por `testMatch` de `jest.config.js` (líneas 16-17).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| URL de ejemplo | `'https://maps.example.com/0,0'` | string (literal en tests) | Enlace falso determinista para verificar la sustitución de `{location}` | Líneas 17, 27, 37, 47, 57, 66, 78, 99 |
| Nombre por defecto esperado | `'Tu contacto'` | string | Verifica el fallback de `{name}` sin `contactName` | Línea 70 |

## Estructura (funciones / clases / tipos)

- Bloque `describe('MessageFormatter')` con sub-bloque `describe('format')` y 9 casos
  `it(...)` anónimos.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : MessageFormatter.test.ts
* Descripción     : Tests unitarios del formateador de mensajes de alerta.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : npx jest src/utils/__tests__/MessageFormatter.test.ts
* ============================================================================ */
```

**Explicación de las líneas 1–9:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto.
- **Líneas 2–8**: metadatos (autor `oafon`, fecha `2026-06-29`, versión `1.0.0`) y comando
  de ejecución sugerido.
- **Línea 9**: cierre de la cabecera.

```ts
import { MessageFormatter } from '../MessageFormatter';

describe('MessageFormatter', () => {
  describe('format', () => {
```

**Explicación de las líneas 11–14:**

- **Línea 11**: importa el objeto bajo prueba.
- **Línea 13**: `describe('MessageFormatter')` agrupa la suite.
- **Línea 14**: `describe('format')` agrupa los casos del método.

```ts
    it('should replace {location} placeholder with maps link', () => {
      const result = MessageFormatter.format('Ubicación: {location}', {
        mapsLink: 'https://maps.example.com/0,0',
        isStale: false,
      });

      expect(result).toContain('https://maps.example.com/0,0');
      expect(result).not.toContain('{location}');
    });
```

**Explicación de las líneas 15–23:**

- **Línea 15**: caso 1: reemplaza `{location}` por el enlace de mapas.
- **Líneas 16–19**: llama a `format` con la plantilla `'Ubicación: {location}'` y datos
  con enlace y `isStale: false`.
- **Líneas 21–22**: aserciones: el resultado contiene la URL y ya no contiene el
  placeholder `{location}`.

```ts
    it('should append stale info when location is stale', () => {
      const result = MessageFormatter.format('{location}', {
        mapsLink: 'https://maps.example.com/0,0',
        isStale: true,
        staleMinutes: 5,
      });

      expect(result).toContain('(ubicación de hace 5 min)');
    });
```

**Explicación de las líneas 25–33:**

- **Línea 25**: caso 2: con `isStale: true` y `staleMinutes: 5` el enlace debe anotarse.
- **Líneas 26–30**: llamada con los datos de caducidad.
- **Línea 32**: aserción de que el sufijo `(ubicación de hace 5 min)` está presente.

```ts
    it('should not append stale info when isStale is false', () => {
      const result = MessageFormatter.format('{location}', {
        mapsLink: 'https://maps.example.com/0,0',
        isStale: false,
      });

      expect(result).not.toContain('ubicación de hace');
    });
```

**Explicación de las líneas 35–42:**

- **Línea 35**: caso 3: sin caducidad no debe anotarse nada.
- **Líneas 36–39**: llamada con `isStale: false`.
- **Líneas 41**: aserción negativa sobre el texto de antigüedad.

```ts
    it('should replace {time} placeholder with current time', () => {
      const result = MessageFormatter.format('Enviado a las {time}', {
        mapsLink: '',
        isStale: false,
      });

      expect(result).toMatch(/Enviado a las \d{2}:\d{2}/);
      expect(result).not.toContain('{time}');
    });
```

**Explicación de las líneas 44–52:**

- **Línea 44**: caso 4: sustitución de `{time}` por la hora actual.
- **Líneas 45–48**: llamada con `mapsLink` vacío.
- **Líneas 50–51**: aserciones con expresión regular `\d{2}:\d{2}` (formato HH:mm) y
  ausencia del placeholder.

```ts
    it('should replace {name} placeholder with contact name', () => {
      const result = MessageFormatter.format('Alerta para {name}', {
        mapsLink: '',
        isStale: false,
        contactName: 'María',
      });

      expect(result).toBe('Alerta para María');
    });
```

**Explicación de las líneas 54–62:**

- **Línea 54**: caso 5: sustitución de `{name}` cuando se pasa `contactName`.
- **Líneas 55–59**: llamada con `contactName: 'María'`.
- **Línea 61**: aserción de igualdad exacta con el nombre interpolado.

```ts
    it('should use default text when {name} not provided', () => {
      const result = MessageFormatter.format('Alerta para {name}', {
        mapsLink: '',
        isStale: false,
      });

      expect(result).toBe('Alerta para Tu contacto');
    });
```

**Explicación de las líneas 64–71:**

- **Línea 64**: caso 6: sin `contactName` se aplica el valor por defecto.
- **Líneas 65–68**: llamada sin el campo.
- **Línea 70**: aserción de que el resultado usa `'Tu contacto'`.

```ts
    it('should replace all placeholders simultaneously', () => {
      const result = MessageFormatter.format(
        '{name} - {location} - {time}',
        {
          mapsLink: 'https://maps.example.com',
          isStale: false,
          contactName: 'Juan',
        }
      );

      expect(result).toContain('Juan');
      expect(result).toContain('https://maps.example.com');
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
```

**Explicación de las líneas 73–86:**

- **Línea 73**: caso 7: sustitución simultánea de los tres placeholders en una plantilla
  combinada.
- **Líneas 74–81**: llamada con los tres datos.
- **Líneas 83–85**: aserciones parciales de nombre, enlace y hora.

```ts
    it('should handle empty template gracefully', () => {
      const result = MessageFormatter.format('', {
        mapsLink: '',
        isStale: false,
      });

      expect(result).toBe('');
    });
```

**Explicación de las líneas 88–95:**

- **Línea 88**: caso 8: plantilla vacía no debe romper.
- **Líneas 89–92**: llamada con template `''`.
- **Línea 94**: aserción de resultado vacío.

```ts
    it('should handle template with no placeholders', () => {
      const result = MessageFormatter.format('Mensaje fijo sin placeholders', {
        mapsLink: 'https://maps.example.com',
        isStale: true,
      });

      expect(result).toBe('Mensaje fijo sin placeholders');
    });
  });
});
```

**Explicación de las líneas 97–106:**

- **Línea 97**: caso 9: plantilla sin placeholders se devuelve intacta aunque `isStale`
  sea true y exista `mapsLink` (el llamador no interpola si no hay placeholder).
- **Líneas 98–102**: llamada con texto fijo.
- **Línea 104**: aserción de igualdad exacta.
- **Líneas 105–106**: cierre de los bloques `describe('format')` y `describe('MessageFormatter')`.

## Fichas de funciones y métodos

El archivo define 9 casos de test anónimos (`it(...)`), no funciones reutilizables. No
hay lógica de producción.

## Clases / interfaces / tipos

Ninguna. Los objetos de datos de los tests se ajustan estructuralmente a `MessageData`
(interfaz no exportada de `MessageFormatter.ts`).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: el caso de `{time}` (líneas 44-52) valida solo el formato
  `\d{2}:\d{2}`; si `toLocaleTimeString('es-AR')` devolviera `'24:05'` u otro formato con
  variantes de locale, el test podría fallar de forma intermitente según la implementación
  del runtime de Jest (Node). [NIVEL DE CERTEZA: Inferido].
- [OBSERVACIÓN TÉCNICA]: no hay test que cubra el caso límite `isStale: true` con
  `staleMinutes` ausente (el comportamiento actual no anota el mensaje), ni plantillas con
  placeholders repetidos (donde solo se sustituye la primera ocurrencia).
- [NOTA]: los tests dependen de la hora real del sistema en el momento de ejecución, pero
  solo comprueban el formato, no el valor exacto, por lo que son deterministas en la práctica.
- [NIVEL DE CERTEZA: Confirmado por código] para la estructura y aserciones.

## Seguridad

- INFORMATIVO: el archivo usa URLs de ejemplo falsas (`https://maps.example.com/...`), sin
  datos reales ni secretos. No hay hallazgos de seguridad.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: añadir casos para `isStale: true` sin `staleMinutes` y para
  placeholders repetidos, alineando los tests con los límites observados en
  `MessageFormatter.ts`.
- [RECOMENDACIÓN]: mantener el patrón de `describe`/`it` y los literales de ejemplo, que
  permiten ejecutar la suite en Node sin dependencias nativas.
