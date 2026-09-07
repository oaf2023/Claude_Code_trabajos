# Archivo: src/config/porcupine.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/config/porcupine.ts | 22 | TypeScript 5.9 | 870 | Configuración / Wake word (legado) | CÓDIGO LEGADO / APARENTEMENTE NO UTILIZADO | Altamente probable |

## Objetivo

Según su cabecera, "configuración declarativa del feature flag de wake word": debería
exponer constantes de disponibilidad de la activación por voz (clave de acceso,
sensibilidad, palabras clave y razón de indisponibilidad) para que el resto de la app
las consumiera. En la práctica sus valores se derivan de `features.ts` y una de sus
funciones (`getKeywordPaths`) está vacía.

## Clasificación y estado

Etiqueta: `CÓDIGO LEGADO` + marcador `[POTENCIALMENTE NO UTILIZADO]`.

Justificación basada en referencias reales:

- El proyecto migró del wake word Porcupine (Picovoice) a `react-native-wakeword`
  (motor local ONNX). Evidencia: `app/(tabs)/settings.tsx` e `app/(tabs)/index.tsx`
  usan `WakeWordService` (`src/services/WakeWordService.ts`) que a su vez importa
  flags de `../config/features` (línea 20 de ese servicio) — NO de `config/porcupine`.
- `iphone/tsconfig.json` (líneas 6-8) mapea el módulo `react-native-wakeword` hacia
  `src/types/react-native-wakeword`, confirmando que el motor actual es
  react-native-wakeword, no Porcupine.
- La búsqueda grep de `porcupine`/`PORCUPINE` en `src/`, `app/` e `iphone/` solo
  encuentra el propio archivo y la constante huérfana `PORCUPINE_SENSITIVITY` de
  `constants.ts`. No existe ningún `import` de `config/porcupine` ni uso de sus
  exportaciones.
- `PORCUPINE_ACCESS_KEY` está vacía (`''`): ni siquiera se configuró la clave de
  acceso de la API de Porcupine, lo que refuerza que el módulo nunca llegó a
  operar o quedó abandonado a mitad de migración.

[NIVEL DE CERTEZA: Altamente probable] — no se hallaron referencias en el árbol
fuente de la app (src/, app/, iphone/), incluyendo imports por alias `@/`.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `WAKE_WORD_DISABLED_REASON`, `WAKE_WORD_ENABLED` de `./features` | interna | Líneas 19-20 | Sí, pero solo dentro de este archivo (que no tiene consumidores) |

El archivo depende de `features.ts` para propagar el estado operativo del wake word,
pero al no ser importado por nadie, esa dependencia es inerte en la práctica.

## Componentes que dependen de este archivo

Ninguno detectado. Grep de `porcupine`/`PORCUPINE` y de `config/porcupine` sobre
`src/`, `app/` e `iphone/`: cero importaciones. La funcionalidad de wake word actual
lee sus flags de `src/config/features.ts` vía `WakeWordService`.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| PORCUPINE_ACCESS_KEY | '' (cadena vacía) | string | Clave de acceso a la API de Porcupine (Picovoice) | Ninguna |
| PORCUPINE_SENSITIVITY | 0.7 | number | Sensibilidad del detector | Ninguna (duplica constants.ts) |
| KEYWORD_LABELS | ['ayuda', 'socorro', 'auxilio'] | string[] | Palabras de activación en español | Ninguna |
| PORCUPINE_FEATURE_ENABLED | WAKE_WORD_ENABLED (boolean) | boolean | Flag de disponibilidad delegado a features | Ninguna |
| PORCUPINE_UNAVAILABLE_REASON | WAKE_WORD_DISABLED_REASON (string) | string | Motivo de indisponibilidad delegado a features | Ninguna |

[NOTA] `PORCUPINE_ACCESS_KEY` está vacía, por lo que no hay secreto real que ocultar;
de existir una clave operativa en el futuro, debería tratarse como [SECRETO OCULTO] y
nunca incrustarse en el cliente sin un backend proxy.

## Estructura (funciones / clases / tipos)

- `getKeywordPaths(): string[]` — exportada (línea 22). Devuelve siempre un array
  vacío.

## Análisis línea por línea

**Bloque líneas 1-22 (archivo completo):**

```ts
/* ============================================================================
* Archivo         : porcupine.ts
* Descripción     : Configuración declarativa del feature flag de wake word.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importar flags de disponibilidad de wake word.
* ============================================================================ */

import {
  WAKE_WORD_DISABLED_REASON,
  WAKE_WORD_ENABLED,
} from './features';

export const PORCUPINE_ACCESS_KEY = '';
export const PORCUPINE_SENSITIVITY = 0.7;
export const KEYWORD_LABELS = ['ayuda', 'socorro', 'auxilio'];
export const PORCUPINE_FEATURE_ENABLED = WAKE_WORD_ENABLED;
export const PORCUPINE_UNAVAILABLE_REASON = WAKE_WORD_DISABLED_REASON;

export const getKeywordPaths = (): string[] => [];
```

**Explicación de las líneas 1-22:**
- **Líneas 1-9**: cabecera de archivo (2026-03-19, v1.0.0). Declara el propósito de
  exponer flags de wake word. La fecha (marzo 2026) es anterior a la migración a
  react-native-wakeword.
- **Líneas 11-14**: import de `WAKE_WORD_ENABLED` y `WAKE_WORD_DISABLED_REASON` desde
  `./features` (el archivo de flags actual).
- **Línea 16**: `PORCUPINE_ACCESS_KEY = ''`. Una clave vacía significa que el servicio
  de Porcupine nunca pudo autenticarse; si algún consumidor la usara, la activación
  fallaría. Refuerza el carácter de código no operativo.
- **Línea 17**: sensibilidad 0.7, duplicada con `constants.ts` (línea 28). Valores
  duplicados en dos archivos con el mismo nombre: riesgo de divergencia.
- **Línea 18**: palabras clave en español ('ayuda', 'socorro', 'auxilio'). En la
  implementación actual (react-native-wakeword), las palabras configurables se leen de
  `useSettingsStore.getState().triggerWords` (ver WakeWordService), no de esta lista.
- **Líneas 19-20**: re-exportan el estado del wake word desde `features.ts` con
  nombres "Porcupine". Si el proyecto siguiera usando Porcupine, estos serían los
  flags de disponibilidad.
- **Línea 22**: `getKeywordPaths` devuelve siempre `[]`. En Porcupine, las palabras
  clave se referenciaban por rutas de archivos de modelo (`.ppn`); esta función quedó
  como stub sin implementación (no lanza ni devuelve rutas reales), lo que refuerza
  el estado de código abandonado a mitad de integración.

## Fichas de funciones y métodos

### getKeywordPaths (línea 22)

- Firma: `export const getKeywordPaths = (): string[] => [];`
- Propósito técnico (inferido): devolver las rutas de los modelos de palabra clave de
  Porcupine. Propósito funcional: sin uso, ya que el motor actual es
  react-native-wakeword.
- Parámetros: ninguno. Retorno: `string[]` siempre vacío. Excepciones: ninguna.
- Dependencias: ninguna. Riesgos: si algún consumidor futuro la usara asumiendo
  rutas válidas, la detección fallaría silenciosamente.

## Clases / interfaces / tipos

No define clases, interfaces ni tipos.

## Observaciones técnicas

- `[POTENCIALMENTE NO UTILIZADO]` Archivo sin consumidores: cero imports en src/, app/
  e iphone/. [NIVEL DE CERTEZA: Altamente probable]
- `[OBSERVACIÓN TÉCNICA]` Evidencia de migración: el wake word operativo vive en
  `src/services/WakeWordService.ts` + `src/config/features.ts` con el motor
  `react-native-wakeword` (modelo `wakeword_es.onnx`), mientras que este archivo es
  vestigio de la etapa Porcupine (Picovoice) de marzo 2026.
- `[OBSERVACIÓN TÉCNICA]` `PORCUPINE_SENSITIVITY` duplicada en `constants.ts` y en
  este archivo: posible divergencia si se ajustara solo una.
- `[OBSERVACIÓN TÉCNICA]` `KEYWORD_LABELS` no coincide con la fuente operativa de
  palabras (triggerWords del store), por lo que su información está obsoleta.

## Seguridad

- `[INFORMATIVO]` `PORCUPINE_ACCESS_KEY` está vacía: sin secreto expuesto hoy.
- `[MEDIO]` Riesgo futuro: si alguien reintroduce Porcupine rellenando esta clave en
  el cliente, quedaría incrustada en el APK. La política del proyecto (cabecera de
  `features.ts`) exige backend proxy para claves sensibles.
- No hay logging de secretos ni paths sensibles en este archivo.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: código muerto que confunde sobre el estado real del wake word
  (un lector podría pensar que Porcupine sigue activo).
- `[RECOMENDACIÓN]` Eliminar el archivo en una limpieza planificada, o al menos
  marcarlo en el README del módulo como legado de la etapa Porcupine. Antes de
  eliminarlo, re-verificar ausencia de referencias tras futuros cambios.
- `[RECOMENDACIÓN]` Eliminar también `PORCUPINE_SENSITIVITY` de `constants.ts` en la
  misma limpieza, salvo que la sensibilidad operativa se unifique leyendo
  `useSettingsStore.wakeWordSensitivity`.
