# Archivo: iphone/tsconfig.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/tsconfig.json | 28 | JSON | 515 | Configuración de TypeScript | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Configuración TypeScript del cliente Apple. Extiende el `tsconfig.json` raíz del
proyecto y redefine rutas de módulos para apuntar al código compartido del monorepo:
los alias `@/*` y `react-native-wakeword` se resuelven dentro de `../src/...`. Su
`include` abarca tanto los archivos propios de `iphone/` como los de `../app` y
`../src`, lo que permite el typecheck de toda la aplicación reutilizada desde esta
variante.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: configuración coherente que habilita el typecheck del código
compartido desde la variante. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| ../tsconfig.json | interna (extensión) | Base heredada (extends) | Sí |
| expo/tsconfig.base (indirecta) | externa | Via el tsconfig raíz | Sí |
| react-native-wakeword (path) | interna (tipos) | `../src/types/react-native-wakeword` (shim de tipos) | Sí, para el typecheck del código que importa wakeword |
| @/* (path) | interna | `../src/*` | Sí (aunque el código compartido no usa `@/` según grep) |
| .expo/types/**/*.d.ts | generada por Expo | Tipos de rutas expo-router | Sí |

## Componentes que dependen de este archivo

- El script `typecheck` de `iphone/package.json` (`tsc --noEmit -p tsconfig.json`).
- El editor/IDE al abrir la carpeta `iphone/`.
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| extends | ../tsconfig.json | string | Base compartida | Línea 2 |
| compilerOptions.baseUrl | . | string | Base de resolución relativa a iphone/ | Línea 4 |
| paths.react-native-wakeword | ../src/types/react-native-wakeword | array | Shim de tipos del SDK wakeword | Líneas 6-8 |
| paths.@/* | ../src/* | array | Alias hacia el código compartido | Líneas 9-11 |
| include | app, index.ts, ../app, ../src, .expo/types | array | Archivos a compilar | Líneas 14-23 |
| exclude | node_modules, ../node_modules | array | Exclusiones | Líneas 24-27 |

## Estructura (funciones / clases / tipos)

No aplica: configuración JSON.

## Análisis línea por línea

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "react-native-wakeword": [
        "../src/types/react-native-wakeword"
      ],
      "@/*": [
        "../src/*"
      ]
    }
  },
```

**Explicación de las líneas 1-13:**

- **Línea 2** (`extends: "../tsconfig.json"`): hereda del tsconfig raíz (que a su vez
  extiende `expo/tsconfig.base` y fija `strict: true`). Garantiza la misma disciplina
  de tipos que la app principal.
- **Línea 4**: `baseUrl: "."` relativo a `iphone/`.
- **Líneas 5-8**: el path `react-native-wakeword` apunta al shim local de tipos de la
  raíz (`../src/types/react-native-wakeword`), necesario porque la variante no declara
  el SDK como dependencia propia y no debe arrastrar las fuentes TS del paquete.
  [NIVEL DE CERTEZA: Confirmado por código; se verificó la existencia del `.d.ts`]
- **Líneas 9-11**: `@/*` resuelto contra `../src/*`, permitiendo que el typecheck
  siga imports `@/...` del código compartido si aparecieran.
  [NIVEL DE CERTEZA: Confirmado por código] Nota: un grep sobre `app/**/*.tsx` no
  encontró imports `from '@/...'`; el alias existe por precaución de paridad con el
  tsconfig raíz.

```json
  "include": [
    "app/**/*.ts",
    "app/**/*.tsx",
    "index.ts",
    "../app/**/*.ts",
    "../app/**/*.tsx",
    "../src/**/*.ts",
    "../src/**/*.tsx",
    ".expo/types/**/*.d.ts"
  ],
  "exclude": [
    "node_modules",
    "../node_modules"
  ]
}
```

**Explicación de las líneas 14-28:**

- **Líneas 14-16**: compila las rutas propias `app/**` e `index.ts`.
- **Líneas 17-20**: incluye las pantallas compartidas `../app/**/*.ts(x)`: clave para
  validar los reexports de iphone contra sus implementaciones reales.
- **Líneas 21-22**: incluye toda la lógica compartida `../src/**/*.ts(x)`.
- **Línea 23**: tipos generados por Expo Router (`.expo/types`), típicos de SDK 55.
- **Líneas 24-27**: excluye `node_modules` propio y el del padre.
- [OBSERVACIÓN TÉCNICA] Este `include` tan amplio (carpetas del padre) es un indicador
  arquitectónico de monorepo implícito: el typecheck de la variante depende del estado
  del código raíz.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] La variante comparte tipos y código con la
  raíz; `tsc` valida `../app` y `../src` completos, no solo `iphone/app`.
- [OBSERVACIÓN TÉCNICA] Si `../src` o `../app` acumulan errores, el script
  `npm run typecheck` de iphone fallará aunque el código propio de iphone esté bien;
  el acoplamiento es intencional pero frágil.
- [NOTA] El stub `react-native-wakeword.d.ts` (36 líneas) declara
  `KeyWordRNBridgeInstance`, `createKeyWordRNBridgeInstance` y un `useModel` por defecto
  sin tipos; es un shim de tipos, no la implementación.

## Seguridad

Sin hallazgos de seguridad: configuración de compilador sin secretos.
[NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] BAJO: typecheck acoplado al estado de las carpetas padre; recomendación de
  mantener el CI del monorepo ejecutando ambos typechecks (raíz y `iphone/`).
- [RECOMENDACIÓN] Documentar en el README que `npm run typecheck` en iphone valida el
  código compartido y no solo la variante.
