# Archivo: functions/tsconfig.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| functions/tsconfig.json | 16 | JSON | 351 | Configuración del compilador TypeScript | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Configura la compilación de las Cloud Functions de Firebase escritas en
TypeScript. Establece el módulo CommonJS (necesario para firebase-functions y
el runtime Node 20), el modo estricto de tipos, la carpeta de salida `lib/`
(coincide con `"main": "lib/index.js"` de `package.json`), mapas de origen para
depuración y el conjunto de archivos compilados (`src/**`). Es el archivo que
`npm run build` (script `tsc`) procesa antes de cada despliegue.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE`.

La configuración es coherente con la estructura real del código: todo el fuente
vive en `functions/src/*.ts` y la salida compilada es consumida por
`package.json` (`main`) y por Firebase (`firebase.json` ejecuta el predeploy
`npm --prefix "$RESOURCE_DIR" run build`). No se detectan inconsistencias.

## Dependencias e importaciones

No aplica (archivo de configuración del compilador). Depende de la
devDependency `typescript` declarada en `functions/package.json`.

## Componentes que dependen de este archivo

| Componente | Relación |
| --- | --- |
| functions/package.json | Script `build: tsc` y `build:watch` consumen esta configuración; `main: lib/index.js` consume su salida |
| functions/src/*.ts | Archivos compilados según la regla `"include": ["src"]` |
| firebase.json | El predeploy de funciones ejecuta la compilación definida aquí |

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| compilerOptions.module | commonjs | string | Sistema de módulos de salida | runtime Node |
| compilerOptions.target | es2020 | string | Nivel ECMAScript de salida | compilador |
| compilerOptions.outDir | lib | string | Carpeta de salida del compilado | package.json main |
| compilerOptions.include | ["src"] | array | Archivos a compilar | compilador |
| compilerOptions.strict | true | boolean | Modo estricto de TypeScript | calidad de tipos |

## Estructura (funciones / clases / tipos)

Sin funciones, clases ni tipos (archivo declarativo).

## Análisis línea por línea

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "es2020",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

**Explicación de las líneas 1–16:**

- **Línea 3** (`"module": "commonjs"`): genera módulos CommonJS, el formato que
  Firebase Functions espera en runtime Node; coherente con el uso de
  `require()` dinámico en `sendAlertSMS.ts` y con `"main": "lib/index.js"`.
- **Línea 4** (`noImplicitReturns`): obliga a que todas las rutas de una función
  devuelvan valor cuando alguna lo hace; endurece el código.
- **Línea 5** (`noUnusedLocals`): error de compilación si hay variables locales
  sin usar; evita residuos.
- **Línea 6** (`outDir: "lib"`): destino del compilado; el runtime carga
  `lib/index.js`.
- **Línea 7** (`sourceMap`): genera `.js.map`; facilita depuración en la consola
  de Google Cloud.
- **Línea 8** (`strict`): activa todas las comprobaciones estrictas de tipos
  (null checks, etc.); buena práctica de seguridad de tipos.
- **Línea 9** (`target: "es2020"`): sintaxis ES2020 en la salida; soportada por
  Node 20.
- **Línea 10** (`esModuleInterop`): permite importar módulos CommonJS con
  sintaxis ES (`import * as admin`, `import { z }`), habitual en este código.
- **Línea 11** (`forceConsistentCasingInFileNames`): evita imports con
  mayúsculas/minúsculas inconsistentes entre plataformas.
- **Línea 12** (`skipLibCheck`): omite la comprobación de tipos de los archivos
  `.d.ts` de dependencias; acelera la compilación a costa de no validar
  completamente las librerías.
- **Línea 14** (`compileOnSave`): opción heredada de editores (VS Code); en la
  práctica es ignorada o redundante con el watch.
- **Línea 15** (`include: ["src"]`): compila todo `functions/src/**`.

## Fichas de funciones y métodos

Sin lógica relevante.

## Clases / interfaces / tipos

Ninguna.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `compileOnSave` está obsoleto como mecanismo fiable:
  hoy se prefiere el watch del propio `tsc` (`build:watch`). No causa daño,
  pero es configuración legada. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] No se define `"declaration": true` ni `"types"`: no se
  genera ningún `.d.ts`, algo correcto para un paquete de funciones que no se
  publica como librería.
- [OBSERVACIÓN TÉCNICA] `esModuleInterop` junto a `module: commonjs` es
  compatible con los imports de `firebase-functions/v2/*` y `mercadopago`
  (paquete con exports ESM y CJS). No se detectan problemas de compilación
  aparentes. [NIVEL DE CERTEZA: Confirmado por código]

## Seguridad

- [INFORMATIVO] `skipLibCheck: true` desactiva la validación de tipos de las
  dependencias; no supone un riesgo de seguridad directo pero puede ocultar
  incompatibilidades de tipos en librerías de terceros.
- Sin hallazgos de seguridad adicionales: archivo de configuración de
  compilación sin secretos ni lógica.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Considerar añadir `"noUncheckedIndexedAccess": true` y
  `"exactOptionalPropertyTypes"` para endurecer aún más el modo estricto en un
  dominio sensible como el envío de SMS y pagos.
- [RECOMENDACIÓN] Eliminar `compileOnSave` (línea 14) por redundante y usar
  únicamente `build:watch` para desarrollo local.
- [RECOMENDACIÓN] Verificar que `target: es2020` no limite el uso de APIs de
  Node 20 disponibles en runtime (p. ej. `fetch`, que es global desde Node 18
  y se usa en `users.ts` y `createPaymentOrder.ts` sin problemas de target).
