# Archivo: tsconfig.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| tsconfig.json | 25 | JSON (TypeScript) | 410 | Configuración del compilador TypeScript | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Configuración de TypeScript para la app SafeAlert. Extiende la base oficial de Expo (`expo/tsconfig.base`), activa el modo estricto, define alias de módulos (`@/*` hacia `src/*` y un mapeo de tipos para `react-native-wakeword`) y delimita los archivos incluidos/excluidos del análisis del compilador. Lo consumen `tsc --noEmit` (script `typecheck`), `ts-jest` (vía `jest.config.js`) y el editor.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Es el tsconfig activo referenciado por `jest.config.js` (línea 22) y por el script `typecheck`. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `expo/tsconfig.base` (extends) | externa (paquete expo) | Base de opciones del compilador | Sí |

No importa módulos en runtime (configuración estática).

## Componentes que dependen de este archivo

- `jest.config.js` línea 22: `tsconfig: 'tsconfig.json'` en el transformador `ts-jest`.
- `package.json` línea 15: script `typecheck` = `tsc --noEmit`.
- Editor/IDE y `expo start` (typechecking interno de Expo en desarrollo).
- `metro.config.js` no lo referencia directamente (Metro no usa paths de TS; los alias los resuelve Babel/Metro por otros medios).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `compilerOptions.strict` | `true` | boolean | Modo estricto de TS | Línea 4 |
| `paths."react-native-wakeword"` | `["./src/types/react-native-wakeword"]` | array | Reescribe la resolución del módulo wakeword hacia su archivo de tipos | Líneas 6-8 |
| `paths."@/*"` | `["./src/*"]` | array | Alias global a `src/` | Líneas 9-11 |

## Estructura (funciones / clases / tipos)

No aplica. Estructura JSON: `extends`, `compilerOptions` (`strict`, `paths`), `include`, `exclude`.

## Análisis línea por línea

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "react-native-wakeword": [
        "./src/types/react-native-wakeword"
      ],
      "@/*": [
        "./src/*"
      ]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.d.ts"
  ],
  "exclude": [
    "node_modules",
    "functions",
    "admin",
    "temp_voice_resources"
  ]
}
```

**Explicación de las líneas 1–25:**

- **Línea 2**: hereda la configuración base oficial de Expo (targets, JSX, módulos compatibles con Metro).
- **Línea 4**: activa `strict: true`: todas las comprobaciones estrictas de TypeScript están habilitadas.
- **Líneas 5-12**: `paths` define alias de módulos SOLO para el compilador:
  - **Líneas 6-8**: `react-native-wakeword` se resuelve a `./src/types/react-native-wakeword` (el archivo de tipos `react-native-wakeword.d.ts` existe en `src/types/`). La librería nativa no trae tipos y este mapeo permite importarla tipada.
  - **Líneas 9-11**: `@/*` apunta a `./src/*` (importaciones tipo `@/services/...`).
- **Líneas 14-18**: `include`: compila todos los `.ts`/`.tsx` del árbol y los tipos generados por Expo en `.expo/types/**/*.d.ts` (rutas tipadas de expo-router).
- **Líneas 19-24**: `exclude`: excluye `node_modules`, y los subproyectos `functions` (Cloud Functions), `admin` (panel web Vite) y `temp_voice_resources` (recursos de prueba de wakeword), que tienen su propio contexto TypeScript.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `paths` solo afecta al compilador: en runtime, Metro/Babel resuelven `@/` por su cuenta (el alias lo soporta `babel-preset-expo`/Metro automáticamente; `jest.config.js` lo replica con `moduleNameMapper`). El mapeo de `react-native-wakeword` es necesario para que `tsc` no falle en los imports.
- [OBSERVACIÓN TÉCNICA] `include` cubre también `scripts/`, `backend/`, `cloud-run/` o cualquier `.ts` suelto en raíz si los hubiera (el propio `diag*.mjs` son JS, no TS). `backend/` y `cloud-run/` son Python/otros, por lo que no entran. [NIVEL DE CERTEZA: Inferido]
- [NOTA] `functions` y `admin` tienen tsconfig propios; excluirlos evita conflictos de opciones entre proyectos.

## Seguridad

- [INFORMATIVO] Sin hallazgos de seguridad: es configuración de compilación. El modo `strict` reduce riesgos de tipos inseguros en runtime (null/undefined).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Si se añaden subcarpetas TypeScript independientes (p. ej. `scripts/ts`), valorar excluirlas explícitamente para no mezclar contextos.
- [RECOMENDACIÓN] Mantener el alias `@/*` sincronizado entre `tsconfig.json`, `jest.config.js` y el soporte de Metro/Babel.
