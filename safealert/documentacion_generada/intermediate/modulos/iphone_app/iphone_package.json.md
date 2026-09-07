# Archivo: iphone/package.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/package.json | 26 | JSON | 620 | Manifiesto npm de la variante Apple | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Manifiesto npm del cliente Apple de SafeAlert (`safealert-iphone`), una variante de
aplicación Expo Router alojada en `iphone/`. Declara el punto de entrada
(`main: index.ts`), los scripts de arranque para iOS y web/Mac, y un conjunto mínimo
de dependencias. Su papel no es declarar el stack completo de negocio, sino permitir
que Expo resuelva el arranque de un cliente iOS/Web que reutiliza las pantallas y la
lógica compartidas de las carpetas `../app` y `../src` del proyecto padre.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: manifiesto coherente y utilizable para arrancar la variante.
[NIVEL DE CERTEZA: Confirmado por código] La comparación con el `package.json` raíz
(84 líneas) muestra que este manifiesto contiene solo 12 dependencias frente a las 44
de la raíz: la variante Apple depende de forma implícita del `node_modules` del
proyecto padre (ver `metro.config.js` de iphone, que añade el `node_modules` raíz a
`resolver.nodeModulesPaths`, y el `README.md` que declara la reutilización de
`../app` y `../src`).

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| expo ~55.0.6 | externa | SDK principal (scripts start/ios/web) | Sí |
| expo-router ~55.0.7 | externa | Enrutado; consumido por `index.ts` vía `expo-router/entry` | Sí |
| firebase ^12.12.1 | externa | Capa modular Firebase compartida (`../src/config/firebase.ts`) | Sí, en iOS/Web |
| react 19.2.0 | externa | Runtime de UI | Sí |
| react-native 0.83.2 | externa | Runtime nativo | Sí |
| react-native-web ^0.21.0 | externa | Salida Web/PWA (script web) | Sí |
| @types/react ~19.2.2 | externa (dev) | Typecheck | Sí |
| babel-preset-expo ~55.0.8 | externa (dev) | Usado por `babel.config.js` | Sí |
| typescript ~5.9.2 | externa (dev) | Script typecheck | Sí |

Nota: el manifiesto NO declara librerías que el código compartido importa
(por ejemplo `zustand`, `expo-av`, `expo-notifications`, `react-native-reanimated`,
`react-native-wakeword`, `@react-native-async-storage/async-storage`,
`@react-native-firebase/*`, `@sentry/react-native`, `@expo/vector-icons`, etc.).
Se resuelven en tiempo de compilación/bundle desde el `node_modules` raíz del
monorepo. [OBSERVACIÓN TÉCNICA]

## Componentes que dependen de este archivo

Ningún archivo de código lo importa. Es leído por Expo CLI / npm al ejecutar los
scripts de la carpeta `iphone/`. [NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| name | safealert-iphone | string | Identidad del paquete | Línea 2 |
| version | 1.0.0 | string | Versión del cliente Apple | Línea 3 |
| main | index.ts | string | Punto de entrada de Expo | Línea 5 |
| scripts.start | expo start | string | Arranque dev (iOS/Web) | Línea 7 |
| scripts.ios | expo run:ios | string | Compilar y ejecutar en iOS | Línea 8 |
| scripts.mac | expo start --web | string | Arranque Web/PWA para Mac | Línea 9 |
| scripts.web | expo start --web | string | Arranque Web | Línea 10 |
| scripts.typecheck | tsc --noEmit -p tsconfig.json | string | Validación de tipos | Línea 11 |
| dependencies | expo, expo-router, firebase, react, react-native, react-native-web | object | Dependencias de runtime | Líneas 13-20 |
| devDependencies | @types/react, babel-preset-expo, typescript | object | Dependencias de desarrollo | Líneas 21-25 |

## Estructura (funciones / clases / tipos)

No define funciones, clases ni tipos. Es un objeto JSON de configuración npm.

## Análisis línea por línea

```json
{
  "name": "safealert-iphone",
  "version": "1.0.0",
  "private": true,
  "main": "index.ts",
  "scripts": {
    "start": "expo start",
    "ios": "expo run:ios",
    "mac": "expo start --web",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit -p tsconfig.json"
  }
}
```

**Explicación de las líneas 1-12:**

- **Línea 2** (`"name": "safealert-iphone"`): identidad del paquete, distinta del
  `safealert` raíz; confirma que es una variante separada del cliente Android/raíz.
- **Línea 3**: versión 1.0.0 del cliente Apple (la app principal va por 1.0.0 en su
  `package.json` raíz pero 1.2.0 en su `app.json`; aquí no hay desfase).
- **Línea 4** (`"private": true`): impide publicación accidental a npm.
- **Línea 5** (`"main": "index.ts"`): Expo arranca desde `iphone/index.ts`.
- **Línea 7**: `expo start` levanta Metro con la configuración de `iphone/`.
- **Línea 8**: `expo run:ios` compila el binario nativo iOS del cliente Apple.
- **Líneas 9-10**: `mac` y `web` son equivalentes (`expo start --web`): objetivo
  Mac mediante Expo Web/PWA según el README.
- **Línea 11**: typecheck con el `tsconfig.json` de iphone (que extiende el raíz e
  incluye `../app` y `../src`).

```json
  "dependencies": {
    "expo": "~55.0.6",
    "expo-router": "~55.0.7",
    "firebase": "^12.12.1",
    "react": "19.2.0",
    "react-native": "0.83.2",
    "react-native-web": "^0.21.0"
  },
  "devDependencies": {
    "@types/react": "~19.2.2",
    "babel-preset-expo": "~55.0.8",
    "typescript": "~5.9.2"
  }
}
```

**Explicación de las líneas 13-25:**

- **Líneas 14-15**: versión de Expo SDK 55 y expo-router alineadas con la raíz
  (`~55.0.6` y `~55.0.7` idénticas). [NIVEL DE CERTEZA: Confirmado por código]
- **Línea 16** (`firebase`): la variante Apple usa el SDK JS modular de Firebase,
  mientras Android usa React Native Firebase nativo (declarado solo en la raíz). Lo
  confirma el `README.md` (línea 20) y la capa híbrida `../src/config/firebase.ts`.
- **Líneas 17-18**: React 19.2.0 y React Native 0.83.2, mismas versiones que la raíz.
- **Línea 19**: react-native-web para el destino Web (script `mac`/`web`).
- **Líneas 21-25**: herramientas dev mínimas; no incluye `jest` (la raíz sí), por lo
  que los tests de `../src/services/__tests__` no se ejecutan desde iphone.
- [OBSERVACIÓN TÉCNICA] Ausencia de dependencias del código compartido: instalar de
  forma aislada `npm install` en `iphone/` dejaría sin resolver imports reales del
  negocio (estado, audio, notificaciones, wakeword, etc.). La variante solo funciona
  porque Metro resuelve contra el `node_modules` raíz (ver `iphone/metro.config.js`).

## Fichas de funciones y métodos

No aplica (archivo de configuración sin lógica).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Manifiesto mínimo que no refleja el grafo real de
  dependencias del código compartido; la viabilidad depende del monorepo implícito
  con la raíz. Archivo: iphone/package.json, líneas 13-25. Impacto potencial:
  instalación aislada o CI en `iphone/` fallaría; también `expo doctor` puede avisar
  de dependencias no declaradas.
- [NIVEL DE CERTEZA: Confirmado por código] La variante iphone NO es una app
  independiente: reutiliza pantallas (`../app`) y lógica (`../src`) y depende del
  `node_modules` raíz.
- [NIVEL DE CERTEZA: Confirmado por código] iphone no es el origen de la app
  principal: sus propios archivos (fecha 2026-04-21 en cabeceras) son reexports
  posteriores que apuntan a las pantallas compartidas de `app/`, mientras que la app
  raíz contiene el código de negocio completo y de mayor tamaño (p. ej.
  `app/(tabs)/settings.tsx` con 532 líneas vs el reexport de 11 líneas de iphone).

## Seguridad

Sin hallazgos de seguridad en este archivo: no contiene credenciales, tokens, URLs de
servicios ni datos sensibles. `private: true` evita publicación accidental.
[NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] MEDIO: dependencias implícitas del monorepo raíz; recomendación: documentar
  que la variante requiere el `node_modules` raíz o declarar las dependencias
  compartidas que realmente importa el código reutilizado.
- [RECOMENDACIÓN] Alinear la semántica de versionado con la app principal si ambas se
  publican en tiendas con el mismo backend.
- [INFORMATIVO] No existe script de tests; si se requiere cobertura de la lógica
  compartida desde esta variante, conviene un script `test` reutilizando jest de la raíz.
