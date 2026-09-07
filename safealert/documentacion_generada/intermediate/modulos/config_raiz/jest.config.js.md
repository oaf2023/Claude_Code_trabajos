# Archivo: jest.config.js

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| jest.config.js | 39 | JavaScript (CommonJS) | 1199 | Configuración de Jest (tests unitarios) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Configura Jest para los tests unitarios de SafeAlert. Usa el preset `ts-jest` (los tests se escriben en TypeScript), ejecuta en entorno `node`, restringe las pruebas al árbol `src/`, define el patrón de descubrimiento de tests, mapea el alias `@/` a `src/`, configura la recopilación de cobertura sobre servicios concretos de alertas/ubicación/pago y carga `jest.setup.js` como setup global. Lo usan los scripts `test`, `test:watch` y `test:coverage` de `package.json`.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Scripts `npm test` apuntan a `jest`; la configuración es coherente con los ficheros objetivo referenciados en `collectCoverageFrom`. [NIVEL DE CERTEZA: Confirmado por código] (el grado de uso real de cada ruta de cobertura no se verifica aquí).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `ts-jest` (preset) | externa | Línea 13 | Sí (devDependency instalada) |
| `tsconfig.json` | interna | Líneas 22 | Sí (opciones de transformación) |
| `jest.setup.js` | interna | Línea 35 (`setupFiles`) | Sí |

No ejecuta código en runtime; es declarativo.

## Componentes que dependen de este archivo

- `package.json`: scripts `test`, `test:watch`, `test:coverage` (líneas 16-18).
- Archivos de test en `src/**/__tests__/*.test.ts`.
- Archivos de cobertura declarados (servicios de `src/services/` y `src/utils/`).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `preset` | `'ts-jest'` | string | Transforma TS sin Babel | Línea 13 |
| `testEnvironment` | `'node'` | string | Entorno Node (sin DOM) | Línea 14 |
| `roots` | `['<rootDir>/src']` | array | Busca tests solo en `src/` | Línea 15 |
| `testMatch` | `['**/__tests__/**/*.test.ts']` | array | Solo `.test.ts` dentro de `__tests__` | Línea 16 |
| `moduleNameMapper` | `'^@/(.*)$' → '<rootDir>/src/$1'` | object | Resuelve el alias `@/` | Líneas 17-19 |
| `collectCoverageFrom` | 6 rutas de servicios | array | Archivos medidos en cobertura | Líneas 26-33 |
| `coverageDirectory` | `<rootDir>/coverage` | string | Salida de informes | Línea 34 |
| `setupFiles` | `['<rootDir>/jest.setup.js']` | array | Setup previo a cada test | Línea 35 |
| `verbose` | `true` | boolean | Salida detallada por test | Línea 36 |

## Estructura (funciones / clases / tipos)

No aplica. Objeto de configuración exportado.

## Análisis línea por línea

```js
/* ============================================================================
* Archivo         : jest.config.js
* Descripción     : Configuración de Jest para tests unitarios de SafeAlert.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : JavaScript
* Uso             : npx jest
* ============================================================================ */

/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'src/services/AlertStateMachine.ts',
    'src/services/AlertQueue.ts',
    'src/services/AlertService.ts',
    'src/services/LocationService.ts',
    'src/services/PaymentService.ts',
    'src/utils/MessageFormatter.ts',
  ],
  coverageDirectory: '<rootDir>/coverage',
  setupFiles: ['<rootDir>/jest.setup.js'],
  verbose: true,
};

module.exports = config;
```

**Explicación de las líneas 1–39:**

- **Líneas 1-9**: cabecera estándar del proyecto (v1.0.0).
- **Línea 12**: anotación JSDoc de tipos para el editor.
- **Línea 13**: `preset: 'ts-jest'` — usa el preset de ts-jest para transformar TypeScript.
- **Línea 14**: `testEnvironment: 'node'` — sin DOM ni jsdom; los servicios bajo test son lógica pura de Node.
- **Línea 15**: `roots` limita la búsqueda de tests a `src/`.
- **Línea 16**: `testMatch` solo descubre `**/__tests__/**/*.test.ts`.
- **Líneas 17-19**: `moduleNameMapper` traduce importaciones `@/...` a `<rootDir>/src/...`, replicando el alias de `tsconfig.json`.
- **Líneas 20-24**: `transform` aplica `ts-jest` a `.ts`/`.tsx`, indicándole el tsconfig raíz.
- **Línea 25**: extensiones de módulo reconocidas.
- **Líneas 26-33**: `collectCoverageFrom` acota la cobertura a seis ficheros clave: la máquina de estados de alerta, la cola de alertas, el servicio de alertas, el servicio de ubicación, el servicio de pago y el formateador de mensajes. [OBSERVACIÓN TÉCNICA] Si alguno de estos archivos no existiera o se renombrara, Jest podría emitir avisos de "no tests/coverage" sin romper la suite.
- **Línea 34**: carpeta de informes de cobertura.
- **Línea 35**: `setupFiles` carga `jest.setup.js` antes de cada archivo de test (mocks globales).
- **Línea 36**: `verbose: true` — detalle por test en consola.
- **Línea 39**: exporta la configuración.

## Fichas de funciones y métodos

No aplica (configuración declarativa).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `testMatch` solo cubre `*.test.ts` (no `.tsx`, `.spec.ts` ni tests en JS), lo que limita qué archivos se descubren como pruebas.
- [OBSERVACIÓN TÉCNICA] La cobertura se centra en servicios; los tests de componentes/UI (si existen) no están contemplados en esta config.
- [NOTA] El preset `ts-jest` es independiente de Babel: los tests no usan `babel.config.js`.

## Seguridad

- [INFORMATIVO] Sin hallazgos de seguridad en la configuración. El alcance a `src/` y el entorno `node` limitan el riesgo de ejecutar código no deseado en tests.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Verificar que los seis archivos de `collectCoverageFrom` existen actualmente en `src/services/` y `src/utils/` (renombrados o eliminados generarían ruido de cobertura).
- [RECOMENDACIÓN] Si se incorporan tests de componentes React, ampliar `testMatch`/`testEnvironment` (jsdom o react-test-renderer) en un proyecto Jest separado o con `projects`.
- [RECOMENDACIÓN] Ejecutar `npm run test:coverage` periódicamente para vigilar la cobertura real de la lógica de alertas (núcleo crítico de la app).
