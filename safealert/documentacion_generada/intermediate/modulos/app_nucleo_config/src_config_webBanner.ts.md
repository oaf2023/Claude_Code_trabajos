# Archivo: src/config/webBanner.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/config/webBanner.ts | 37 | TypeScript 5.9 | 1485 | Configuración / Datos de UI para el modo web | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Centraliza los datos que alimentan el banner informativo del modo web (PWA) de
SafeAlert: por un lado las especificaciones del servidor que ejecuta la web
(`SERVER_SPECS`: CPU, RAM, almacenamiento, transferencia) y por otro la lista de
funcionalidades no disponibles cuando la app corre en el navegador (`WEB_LIMITATIONS`,
p. ej. wake word, grabación de audio, ubicación en segundo plano).

Proporciona dos interfaces TypeScript (`ServerSpec`, `WebLimitation`) que tipan las
estructuras de datos y dos constantes exportadas consumidas por el componente
`WebModeBanner.tsx`.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — importado por `src/components/WebModeBanner.tsx`
(línea 17: `import { SERVER_SPECS, WEB_LIMITATIONS } from '../config/webBanner';`), y
dicho componente se renderiza en `app/(tabs)/index.tsx` (líneas 46 y 229) solo cuando
`Platform.OS === 'web'`.

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna (archivo sin imports) | — | — | — |

Archivo puramente declarativo de datos; sin dependencias externas ni internas.

## Componentes que dependen de este archivo

| Archivo dependiente | Forma de uso |
| --- | --- |
| src/components/WebModeBanner.tsx | Importa `SERVER_SPECS` y `WEB_LIMITATIONS` y los mapea a filas del panel |
| app/(tabs)/index.tsx | Renderiza `<WebModeBanner />` en web (dependencia indirecta) |

La búsqueda en `app/` e `iphone/` no muestra otros consumidores; la variante iphone no
usa este módulo.

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| SERVER_SPECS | Array de 4 objetos ServerSpec | ServerSpec[] | Especificaciones del servidor mostradas en el banner | WebModeBanner.tsx |
| WEB_LIMITATIONS | Array de 5 objetos WebLimitation | WebLimitation[] | Lista de funciones no disponibles en web | WebModeBanner.tsx |

Detalle de `SERVER_SPECS` (icon, label, value):

| icon (MaterialIcons) | label | value |
| --- | --- | --- |
| developer-board | CPU | 1 vCPU |
| memory | RAM | 2 GB RAM |
| storage | Almacenamiento | 40 GB NVMe |
| public | Transferencia | 2 TB |

Detalle de `WEB_LIMITATIONS` (feature, note):

| feature | note |
| --- | --- |
| Wake Word / Guardia por voz | Solo Android |
| Grabación de audio | Solo Android |
| Notificaciones programadas | No soportado en web |
| Ubicación en segundo plano | No soportado en web |
| Identificación de dispositivo nativa | No soportado en web |

[NOTA] Los valores de `SERVER_SPECS` describen la capacidad del despliegue web del
proyecto (por contexto del proyecto: Cloud Run/backend Flask) y son informativos,
no secretos.

## Estructura (funciones / clases / tipos)

- Interfaz `ServerSpec` (líneas 13-17): `{ icon: string; label: string; value: string }`.
- Interfaz `WebLimitation` (líneas 19-22): `{ feature: string; note: string }`.
- Constantes `SERVER_SPECS` (líneas 24-29) y `WEB_LIMITATIONS` (líneas 31-36).
- Sin funciones ni lógica.

## Análisis línea por línea

**Bloque líneas 1-29 (cabecera, interfaces y SERVER_SPECS):**

```ts
/* ============================================================================
* Archivo         : webBanner.ts
* Descripción     : Datos centralizados para el banner informativo del modo web.
*                   Specs del servidor y lista de funcionalidades no disponibles
*                   cuando SafeAlert se ejecuta en el navegador.
* Autor           : oafon
* Fecha           : 2026-08-26
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importado por WebModeBanner.tsx para renderizar el panel.
* ============================================================================ */

export interface ServerSpec {
  icon: string;
  label: string;
  value: string;
}

export interface WebLimitation {
  feature: string;
  note: string;
}

export const SERVER_SPECS: ServerSpec[] = [
  { icon: 'developer-board', label: 'CPU', value: '1 vCPU' },
  { icon: 'memory', label: 'RAM', value: '2 GB RAM' },
  { icon: 'storage', label: 'Almacenamiento', value: '40 GB NVMe' },
  { icon: 'public', label: 'Transferencia', value: '2 TB' },
];
```

**Explicación de las líneas 1-29:**
- **Líneas 1-11**: cabecera estándar (2026-08-26, v1.0.0). Declara el uso: consumido
  por `WebModeBanner.tsx`.
- **Líneas 13-17**: interfaz `ServerSpec` con el nombre del icono de MaterialIcons,
  etiqueta y valor textual.
- **Líneas 19-22**: interfaz `WebLimitation` con la función limitada y una nota sobre
  la restricción.
- **Líneas 24-29**: `SERVER_SPECS` tipado como `ServerSpec[]`. Los cuatro elementos
  declaran los recursos del servidor web. Los nombres de icono son compatibles con
  MaterialIcons (los resuelve `WebModeBanner` a través de `<Icon>`).
  Significado de valores: despliegue ligero (1 vCPU, 2 GB RAM, 40 GB NVMe, 2 TB de
  transferencia), coherente con un plan de hosting económico para la PWA.

**Bloque líneas 31-36 (WEB_LIMITATIONS):**

```ts
export const WEB_LIMITATIONS: WebLimitation[] = [
  { feature: 'Wake Word / Guardia por voz', note: 'Solo Android' },
  { feature: 'Grabación de audio', note: 'Solo Android' },
  { feature: 'Notificaciones programadas', note: 'No soportado en web' },
  { feature: 'Ubicación en segundo plano', note: 'No soportado en web' },
  { feature: 'Identificación de dispositivo nativa', note: 'No soportado en web' },
];
```

**Explicación de las líneas 31-36:**
- **Línea 31**: declara la lista tipada de limitaciones de la web.
- **Líneas 32-33**: wake word/guardia por voz y grabación de audio solo disponibles en
  Android (coherente con `features.ts`, donde el wake word y la guardia de audio
  quedan restringidos por plataforma).
- **Línea 34**: notificaciones programadas no soportadas en web (limitación real del
  modelo de notificaciones del navegador en segundo plano).
- **Línea 35**: ubicación en segundo plano no soportada en web (las APIs de geolocalización
  web solo funcionan en primer plano con permiso explícito).
- **Línea 36**: identificación de dispositivo nativa no disponible en navegador
  (depende de APIs nativas).

La lista es coherente con el resto de flags de plataforma del proyecto. Al ser texto
de UI, cualquier cambio de soporte (p. ej. habilitar audio en iOS) exige actualizar
esta lista y el flag correspondiente de `features.ts` a la vez.

## Fichas de funciones y métodos

No aplica: no hay funciones ni lógica ejecutable.

## Clases / interfaces / tipos

### ServerSpec (líneas 13-17)

- Responsabilidad: tipar cada fila de especificación del servidor (icono + etiqueta +
  valor).
- Campos: `icon: string` (nombre de icono MaterialIcons), `label: string`,
  `value: string`. Relaciones: se usa como tipo del array `SERVER_SPECS`.

### WebLimitation (líneas 19-22)

- Responsabilidad: tipar cada limitación mostrada en el banner web.
- Campos: `feature: string`, `note: string`. Relaciones: tipo del array
  `WEB_LIMITATIONS`.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` Los nombres de icono son cadenas planas; si el nombre de un
  icono no existe en MaterialIcons, el componente renderiza un glifo de respaldo sin
  error. La verificación se hace en `WebModeBanner`/`Icon`.
- `[OBSERVACIÓN TÉCNICA]` La información de specs del servidor está hardcodeada en el
  bundle de la app web: si el plan del servidor cambia, hay que publicar una nueva
  versión. Es aceptable para datos estáticos de UI, pero debe mantenerse
  sincronizada con el despliegue real (Cloud Run).
- `[INFORMATIVO]` No se detectaron referencias en `iphone/`; el banner es exclusivo
  del modo web de la app principal.

## Seguridad

- `[INFORMATIVO]` No hay secretos, credenciales, paths internos ni logging.
- `[INFORMATIVO]` Las specs de servidor son datos públicos de presentación; no
  revelan configuración interna real del despliegue (p. ej. IPs, claves).

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Bajo: desincronización entre el texto del banner y las capacidades reales
  de la web (p. ej. si se habilita audio en iOS/web y la lista sigue diciendo "Solo
  Android").
- `[RECOMENDACIÓN]` Derivar las limitaciones de los flags de `features.ts`
  (WAKE_WORD_ENABLED, AUDIO_GUARD_ENABLED, etc.) en lugar de duplicar la lógica en
  texto, para que el banner refleje automáticamente la configuración real.
- `[RECOMENDACIÓN]` Revisar periódicamente que `SERVER_SPECS` coincida con el plan del
  hosting web.
