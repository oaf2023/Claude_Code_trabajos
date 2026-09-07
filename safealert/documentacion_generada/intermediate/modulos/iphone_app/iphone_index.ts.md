# Archivo: iphone/index.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| iphone/index.ts | 11 | TypeScript | 494 | Punto de entrada de aplicación | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Punto de entrada del cliente Apple de SafeAlert. Únicamente importa
`expo-router/entry`, que monta Expo Router tomando como raíz de rutas la carpeta
`app/` del proyecto activo (en este caso `iphone/app/`). Es el archivo referenciado
por `"main": "index.ts"` del `package.json` de iphone.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE: entrada canónica de expo-router.
[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| expo-router/entry | externa | Monta el router (efecto secundario al importar) | Sí |

Nota: a diferencia del `index.ts` raíz (37 líneas, con instrumentación de bootstrap,
`LogBox.ignoreLogs` y trazas de consola), este punto de entrada es minimalista y sin
instrumentación. [NIVEL DE CERTEZA: Confirmado por código]

## Componentes que dependen de este archivo

- `package.json` de iphone (`main`).
- Expo CLI al arrancar.
- Ningún archivo lo importa en código.
[NIVEL DE CERTEZA: Confirmado por código]

## Variables globales y constantes

Sin variables. Cabecera documental con Autor oafon, Fecha 2026-04-21, Versión 1.0.0.

## Estructura (funciones / clases / tipos)

Sin funciones propias; solo un import con efecto.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : index.ts
* Descripcion     : Punto de entrada del cliente Apple de SafeAlert.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Cargado por Expo para montar Expo Router en iPhone y Mac.
* ============================================================================ */

import 'expo-router/entry';
```

**Explicación de las líneas 1-11:**

- **Líneas 1-9**: cabecera documental.
- **Línea 11** (`import 'expo-router/entry'`): import con efecto que registra y monta
  el componente raíz de Expo Router. Con `iphone/app.json` presente, Expo resuelve el
  directorio de rutas en `iphone/app/` (donde viven los reexports a la app compartida).

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [NIVEL DE CERTEZA: Confirmado por código] Entrada limpia; el cliente raíz (Android)
  usa instrumentación de bootstrap (marcas `__SAFEALERT_BOOTSTRAP_MARK__` y logs), que
  esta variante no replica.
- [NOTA] El aviso de `LogBox` para deprecaciones (`expo-av`, etc.) que aparece en el
  index raíz no se aplica aquí; los avisos se filtrarán igualmente desde el layout
  compartido si se reexporta (el `app/_layout.tsx` compartido hace
  `LogBox.ignoreLogs` en `__DEV__`).

## Seguridad

Sin hallazgos: no hay logs de datos sensibles en este archivo.
[NIVEL DE CERTEZA: Confirmado por código]

## Riesgos y recomendaciones (sin modificar código)

- [INFORMATIVO] Al ser minimalista, cualquier necesidad de diagnóstico de arranque en
  iOS requerirá instrumentación propia o la del layout compartido.
