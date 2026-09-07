# Archivo: src/types/react-native-wakeword.d.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/types/react-native-wakeword.d.ts |
| Líneas totales | 36 |
| Lenguaje | TypeScript 5.9 (archivo de declaración `.d.ts`) |
| Tamaño (bytes) | 1335 |
| Categoría | Declaración de tipos (shim) de un módulo nativo externo |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Es una **declaración de tipos de un módulo nativo externo**: `react-native-wakeword`
(Paquete DaVoice de detección de palabra de activación). El SDK no expone fuentes
TypeScript fiables, por lo que el proyecto declara localmente la forma del módulo
(`declare module 'react-native-wakeword'`) para poder consumirlo con tipos sin depender de
sus fuentes TS defectuosas (según el comentario de cabecera, línea 8). El mecanismo de
resolución es doble:

- `tsconfig.json` (líneas 5-8) mapea la ruta del paquete al archivo de declaración mediante
  `paths`: `"react-native-wakeword": ["./src/types/react-native-wakeword"]`.
- `iphone/tsconfig.json` (líneas 6-7) hace lo mismo para la variante iOS apuntando a
  `../src/types/react-native-wakeword`.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. El archivo alimenta la resolución de tipos de TypeScript y es la
base del consumo real del SDK en `src/services/WakeWordService.ts`, que define tipos
derivados mediante `typeof import('react-native-wakeword')` (líneas 28-31) y usa
`createKeyWordRNBridgeInstance` (línea 274). El paquete está instalado como dependencia
(`package.json` línea 59, `^1.1.82`).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react-native-wakeword` (declarado, no importado aquí) | externa (declaración de módulo) | `WakeWordService.ts` (import dinámico línea 52, tipos líneas 28-31) | Sí |

El archivo no importa nada: `declare module` describe un módulo externo. Las API
declaradas son:

- Clase `KeyWordRNBridgeInstance` (exportada).
- Función `createKeyWordRNBridgeInstance` (exportada).
- Export default `useModel` (valor `unknown`).

## Componentes que dependen de este archivo

Referencias reales encontradas con búsqueda sobre el código fuente:

- `tsconfig.json` (líneas 6-7) e `iphone/tsconfig.json` (líneas 6-7): mapeo `paths` del
  paquete al archivo.
- `src/services/WakeWordService.ts`: único consumidor de negocio:
  - Línea 28: `type WakeWordModule = typeof import('react-native-wakeword')`.
  - Líneas 29-31: `type KeyWordRNBridgeInstance = Awaited<ReturnType<...>>`.
  - Línea 52: `wakeWordModulePromise = import('react-native-wakeword')`.
  - Línea 107: campo `bridgeInstance: KeyWordRNBridgeInstance | null`.
  - Línea 274: `const instance = await wakeWordModule.createKeyWordRNBridgeInstance(...)`.
- `metro.config.js` (línea 41): el paquete figura en `NATIVE_WEB_EMPTY`, de modo que en
  web Metro lo redirige a `src/shims/web-empty.js` (este mapeo de tipos solo aplica a
  móvil).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `useModel` (export default declarado) | `unknown` | constant (valor desconocido) | Export default del SDK que el proyecto decide no tipar | Comentado en los ejemplos del SDK; no usado en código propio |

## Estructura (funciones / clases / tipos)

- `declare module 'react-native-wakeword'`: bloque que declara la forma del módulo.
  - Clase: `KeyWordRNBridgeInstance`.
  - Función: `createKeyWordRNBridgeInstance`.
  - Constante (export default): `useModel`.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : react-native-wakeword.d.ts
* Descripción     : Shim local de tipos para el SDK react-native-wakeword.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Resolver el consumo tipado del SDK sin depender de sus fuentes TS defectuosas.
* ============================================================================ */
```

**Explicación de las líneas 1–9:**

- **Línea 1**: apertura del comentario de cabecera estándar del proyecto.
- **Líneas 2–8**: metadatos (autor `oafon`, fecha `2026-03-19`, versión `1.0.0`) y
  propósito: resolver el consumo tipado del SDK "sin depender de sus fuentes TS
  defectuosas".
- **Línea 9**: cierre de la cabecera.

```ts
declare module 'react-native-wakeword' {
  export class KeyWordRNBridgeInstance {
    constructor(instanceId: string, isSticky: boolean);
    instanceId: string;
    createInstance(
      modelName: string,
      threshold: number,
      bufferCnt: number
    ): Promise<unknown>;
    setKeywordDetectionLicense(license: string): Promise<boolean>;
    startKeywordDetection(threshold: number): Promise<unknown>;
    stopKeywordDetection(): Promise<unknown>;
    destroyInstance(): Promise<unknown>;
    onKeywordDetectionEvent(
      callback: (phrase: string) => void
    ): { remove?: () => void };
  }
```

**Explicación de las líneas 11–27:**

- **Línea 11**: `declare module 'react-native-wakeword'`: declara el espacio de nombres del
  paquete para el compilador sin tocar el paquete real.
- **Línea 12**: apertura de la clase `KeyWordRNBridgeInstance` (instancia puente al motor
  nativo DaVoice).
- **Línea 13**: constructor con `instanceId: string` e `isSticky: boolean`.
- **Línea 14**: propiedad pública `instanceId: string`.
- **Líneas 15–19**: `createInstance(modelName, threshold, bufferCnt)`, crea la instancia de
  detección con el nombre del modelo, umbral y contador de buffers; devuelve
  `Promise<unknown>` (el SDK real devuelve la propia instancia o un objeto de estado; el
  shim no lo precisa).
- **Línea 20**: `setKeywordDetectionLicense(license)`, registra la licencia comercial del
  SDK; devuelve `Promise<boolean>`.
- **Línea 21**: `startKeywordDetection(threshold)`, inicia la detección con el umbral
  dado.
- **Línea 22**: `stopKeywordDetection()`, detiene la detección.
- **Línea 23**: `destroyInstance()`, destruye la instancia nativa.
- **Líneas 24–26**: `onKeywordDetectionEvent(callback)`, registra el callback que recibe la
  frase detectada (`phrase: string`) y devuelve `{ remove?: () => void }` para
  desuscribirse.
- **Línea 27**: cierre de la clase.

```ts
  export function createKeyWordRNBridgeInstance(
    instanceId: string,
    isSticky: boolean
  ): Promise<KeyWordRNBridgeInstance>;

  const useModel: unknown;
  export default useModel;
}
```

**Explicación de las líneas 29–36:**

- **Líneas 29–32**: declara la función factoría `createKeyWordRNBridgeInstance(instanceId,
  isSticky)` que devuelve `Promise<KeyWordRNBridgeInstance>`; es la llamada real que hace
  `WakeWordService.ts` (línea 274).
- **Líneas 34–35**: declara `const useModel: unknown` como export default (hook de React
  del SDK) sin tiparlo; `unknown` obliga a un cast explícito si se usara.
- **Línea 36**: cierre del `declare module`.

## Fichas de funciones y métodos

### Clase declarada `KeyWordRNBridgeInstance` (líneas 12–27)

- Firmas principales: constructor `(instanceId: string, isSticky: boolean)`;
  `createInstance(modelName: string, threshold: number, bufferCnt: number):
  Promise<unknown>`; `setKeywordDetectionLicense(license: string): Promise<boolean>`;
  `startKeywordDetection(threshold: number): Promise<unknown>`;
  `stopKeywordDetection(): Promise<unknown>`; `destroyInstance(): Promise<unknown>`;
  `onKeywordDetectionEvent(callback: (phrase: string) => void): { remove?: () => void }`.
- Propósito técnico: contrato tipado de la API puente nativa del SDK de wake word.
- Parámetros: los descritos en cada firma (id de instancia, sticky, modelo, umbral, buffer,
  licencia, callback de frase).
- Retornos: promesas con resultado `unknown` o `boolean`; el callback devuelve un
  descriptor de suscripción con `remove` opcional.
- Dependencias: es solo declaración; el comportamiento real vive en el módulo nativo
  (Android).
- Flujo de llamada real: `WakeWordService` la crea con
  `createKeyWordRNBridgeInstance(...)` (línea 274) y la guarda en `bridgeInstance`
  (línea 107).

### Función declarada `createKeyWordRNBridgeInstance` (líneas 29–32)

- Firma: `(instanceId: string, isSticky: boolean) => Promise<KeyWordRNBridgeInstance>`.
- Propósito: factoría que devuelve la instancia puente; llamada real en
  `WakeWordService.ts` (línea 274).
- [NIVEL DE CERTEZA: Confirmado por código] para el uso en `WakeWordService`.

## Clases / interfaces / tipos

### Clase `KeyWordRNBridgeInstance` (declarada)

- Responsabilidad: representar la instancia del motor DaVoice (puente nativo).
- Campos: `instanceId: string` (público).
- Métodos: `createInstance`, `setKeywordDetectionLicense`, `startKeywordDetection`,
  `stopKeywordDetection`, `destroyInstance`, `onKeywordDetectionEvent` (descritos arriba).
- Relaciones: producida por `createKeyWordRNBridgeInstance`; consumida por
  `WakeWordService`.
- Ciclo de vida (según la API): crear con `createInstance`, iniciar con
  `startKeywordDetection`, detener con `stopKeywordDetection` y liberar con
  `destroyInstance`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: los retornos `Promise<unknown>` (líneas 19, 21-23) son poco
  informativos; el SDK real puede devolver estados o códigos de error que hoy quedan sin
  tipar. Si `WakeWordService` necesita inspeccionar esos valores, conviene refinar la
  declaración.
- [OBSERVACIÓN TÉCNICA]: la cabecera habla de "fuentes TS defectuosas" del SDK
  (línea 8): [NIVEL DE CERTEZA: Inferido] de que el paquete distribuido incluye tipos
  incompatibles o ausentes, lo que motivó este shim local.
- [OBSERVACIÓN TÉCNICA]: este shim de tipos solo aplica en compilación móvil; en web el
  paquete se redirige en tiempo de build a `src/shims/web-empty.js` (ver
  `metro.config.js`, línea 41 y 83-85), por lo que la declaración nunca se ejercita en web.
- [POTENCIALMENTE NO UTILIZADO]: el export default `useModel` (líneas 34-35) no tiene uso
  confirmado en el código del proyecto (el código propio usa la API imperativa de la
  clase); se mantiene para cubrir la superficie del SDK por si se usa el hook.

## Seguridad

- INFORMATIVO: `setKeywordDetectionLicense` recibe una licencia comercial. [SECRETO
  OCULTO]: la licencia real no debe estar en el código ni en logs; debe inyectarse de forma
  segura. La declaración de tipos no contiene el valor.
- INFORMATIVO: `onKeywordDetectionEvent` entrega frases de voz del entorno; el manejo de
  esa señal debe minimizar el almacenamiento.
- No se detectan hallazgos CRÍTICOS, ALTOS ni MEDIOS en este archivo de declaración.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: refinar los retornos `unknown` cuando se conozca el contrato real del
  SDK (versión `1.1.82` instalada) para detectar errores en compilación.
- [RECOMENDACIÓN]: mantener este shim sincronizado con la versión del paquete al
  actualizar `react-native-wakeword`, ya que la API nativa puede cambiar entre versiones
  (la cadena de versión está en `package.json`).
