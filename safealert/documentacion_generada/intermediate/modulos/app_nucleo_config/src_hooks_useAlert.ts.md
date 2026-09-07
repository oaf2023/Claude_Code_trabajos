# Archivo: src/hooks/useAlert.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/hooks/useAlert.ts | 69 | TypeScript 5.9 | 2318 | Hook de React (fachada del flujo de alerta) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Hook de fachada que expone a las pantallas el estado y las acciones públicas del flujo
de alerta SOS. Suscribe componentes al estado canónico guardado en `useGuardStore`
(fase de alerta, cuenta regresiva, última alerta, palabra detectada y última
ubicación) y envuelve las acciones de disparo (`triggerManual`, `triggerTest`) del
`AlertService`, así como la cancelación de la cuenta regresiva (`cancelCountdown` vía
`WakeWordService`).

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — consumido por dos pantallas reales
(ver dependientes).

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `AlertService` de `../services/AlertService` | interna | triggerManual/triggerTest (líneas 35, 44) | Sí |
| `WakeWordService` de `../services/WakeWordService` | interna | cancelCountdown (línea 52) | Sí |
| `useGuardStore` de `../stores/useGuardStore` | interna | Selectores de estado (líneas 27-31) | Sí |

Nota de diseño: `cancelCountdown` delega en `WakeWordService.cancelAlert()` aunque la
acción es genérica de alerta (no específica de wake word); es el servicio el que
centraliza el ciclo de cancelación.

## Componentes que dependen de este archivo

| Archivo dependiente | Uso |
| --- | --- |
| app/(tabs)/index.tsx | `import { useAlert }` (línea 34) y desestructuración en línea 91 |
| app/test-alert.tsx | `import { useAlert }` (línea 11), usa triggerTest/alertPhase/lastAlert |

No se detectaron usos en `src/` ni en `iphone/`.

## Variables globales y constantes

No define variables globales ni constantes de configuración. Todo el estado reside en
`useGuardStore` (ver su análisis).

## Estructura (funciones / clases / tipos)

- `useAlert(): {...}` — hook exportado (líneas 26-68).
- Funciones internas del hook: `triggerManual` (33-40), `triggerTest` (42-49),
  `cancelCountdown` (51-53).
- Propiedad computada `isAlerting` (64-67).

## Análisis línea por línea

**Bloque líneas 1-31 (cabecera, imports y selectores):**

```ts
/* ============================================================================
* Archivo         : useAlert.ts
* Descripción     : Hook de fachada para consumir el flujo canónico de alerta.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : const alert = useAlert();
* ============================================================================ */

import { AlertService } from '../services/AlertService';
import { WakeWordService } from '../services/WakeWordService';
import { useGuardStore } from '../stores/useGuardStore';

/* ============================================================================
* Función         : useAlert
* Descripción     : Expone el estado y acciones públicas del flujo de alerta.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : useGuardStore, AlertService
* Ingesta         : Sin argumentos
* Devolución      : Objeto con estado y acciones de alerta
* Uso             : useAlert()
* ============================================================================ */
export function useAlert() {
  const alertPhase = useGuardStore((s) => s.alertPhase);
  const countdownSeconds = useGuardStore((s) => s.countdownSeconds);
  const lastAlert = useGuardStore((s) => s.lastAlert);
  const detectedKeyword = useGuardStore((s) => s.detectedKeyword);
  const lastLocation = useGuardStore((s) => s.lastLocation);
```

**Explicación de las líneas 1-31:**
- **Líneas 1-9**: cabecera del archivo (2026-03-19).
- **Líneas 11-13**: imports de `AlertService`, `WakeWordService` y `useGuardStore`.
- **Líneas 15-25**: docstring del hook (conexiones e ingesta).
- **Línea 26**: apertura del hook.
- **Líneas 27-31**: suscripciones selectivas a `useGuardStore`. Cada selector
  individual evita re-renderizados innecesarios (patrón recomendado de Zustand):
  fase de alerta, segundos restantes, última alerta completa, palabra clave detectada
  y última ubicación conocida.

**Bloque líneas 33-68 (acciones y retorno):**

```ts
  const triggerManual = async () => {
    try {
      await AlertService.send('manual');
    } catch (e) {
      console.error('[useAlert] Manual trigger failed:', e);
      throw e;
    }
  };

  const triggerTest = async () => {
    try {
      await AlertService.send('test', true);
    } catch (e) {
      console.error('[useAlert] Test trigger failed:', e);
      throw e;
    }
  };

  const cancelCountdown = () => {
    WakeWordService.cancelAlert();
  };

  return {
    alertPhase,
    countdownSeconds,
    lastAlert,
    lastLocation,
    detectedKeyword,
    triggerManual,
    triggerTest,
    cancelCountdown,
    isAlerting:
      alertPhase === 'countdown' ||
      alertPhase === 'capturing' ||
      alertPhase === 'sending',
  };
}
```

**Explicación de las líneas 33-68:**
- **Líneas 33-40**: `triggerManual` invoca `AlertService.send('manual')`. En caso de
  error registra con `console.error` (prefijo '[useAlert]') y RE-LANZA la excepción
  (`throw e`) para que la pantalla pueda mostrar feedback al usuario.
- **Líneas 42-49**: `triggerTest` invoca `AlertService.send('test', true)` (modo de
  prueba). Mismo patrón de log + re-lanzamiento.
- **Líneas 51-53**: `cancelCountdown` delega en `WakeWordService.cancelAlert()` para
  abortar una alerta en cuenta regresiva (no lanza: acción de cancelación).
- **Líneas 55-68**: retorno del hook. Incluye estado, acciones y el booleano
  computado `isAlerting`, que es true mientras la alerta está en countdown, captura
  de audio o envío (fases 'countdown', 'capturing', 'sending'). Este booleano suele
  usarse en la UI para bloquear acciones o mostrar pantalla de alerta en curso.
  Obsérvese que `cancelCountdown` se llama `cancelAlert` en el servicio: el nombre del
  hook sugiere cancelar la cuenta regresiva, que es exactamente el efecto que tiene.

## Fichas de funciones y métodos

### triggerManual (líneas 33-40)

- Firma: `const triggerManual = async () => {...}` (retorno Promise<void>).
- Propósito: disparar una alerta SOS manual.
- Parámetros: ninguno. Retorno: promesa que resuelve al terminar `AlertService.send`.
- Excepciones: re-lanza errores tras loguearlos (para que el llamador los maneje).
- Dependencias: `AlertService.send`. Flujo: send('manual') -> actualización de estado
  interno de AlertService (useGuardStore) -> fin.
- Efectos secundarios: envío real de la alerta (SMS/llamadas/registro). Riesgos:
  disparo accidental; la UI debe confirmar (cuenta regresiva).

### triggerTest (líneas 42-49)

- Firma: `const triggerTest = async () => {...}`
- Propósito: disparar una alerta de prueba (`send('test', true)`).
- Parámetros: ninguno. Retorno: Promise<void>. Excepciones: re-lanza.
- Dependencias: `AlertService.send`. Riesgos: generar tráfico de prueba hacia
  contactos/backend; normalmente limitado a entorno de pruebas.

### cancelCountdown (líneas 51-53)

- Firma: `const cancelCountdown = () => {...}` (síncrona, void).
- Propósito: cancelar la alerta durante la cuenta regresiva.
- Parámetros: ninguno. Retorno: void.
- Dependencias: `WakeWordService.cancelAlert`. Efectos: aborta el ciclo de alerta en
  curso (resetea estado de guardia según el servicio).
- Riesgo: si `cancelAlert` no está disponible en una plataforma (p. ej. web), podría
  no cancelar; depende de la implementación del servicio.

## Clases / interfaces / tipos

No define clases ni interfaces. El tipo del objeto retornado es inferido; no hay un
tipo `UseAlertReturn` explícito exportado.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` La cancelación se delega a `WakeWordService` pese a que el
  hook se usa también para alertas manuales/test: acoplamiento semántico indirecto
  entre "cancelar alerta" y el servicio de wake word.
- `[OBSERVACIÓN TÉCNICA]` El hook no usa `useCallback`/`useMemo` para sus funciones:
  cada render crea funciones nuevas; dado el pequeño tamaño del árbol consumidor es
  aceptable, pero en pantallas grandes convendría memorizar.
- `[INFORMATIVO]` `console.error` con prefijo '[useAlert]' no imprime secretos (solo
  el error técnico); revisar que el objeto de error no contenga payloads sensibles.

## Seguridad

- `[INFORMATIVO]` El hook no maneja secretos ni credenciales.
- `[BAJO]` Los errores se registran con `console.error`: el objeto `e` podría
  contener URL o datos de respuesta del envío; en el estado actual es bajo, pero
  conviene no loguear cuerpos de peticiones.
- `[INFORMATIVO]` Acción sensible: `triggerManual` inicia una alerta real (envío a
  contactos). El control de acceso a esta acción reside en la UI (botón SOS +
  cuenta regresiva), no en el hook.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Medio: disparo de alerta real si la UI no exige confirmación robusta
  (depende del botón y de la cuenta regresiva de 3 s definida en constants).
- `[RECOMENDACIÓN]` Memorizar las acciones del hook con `useCallback` para estabilidad
  de referencias (útil si se pasan a children memoizados).
- `[RECOMENDACIÓN]` Revisar el acoplamiento `cancelCountdown` -> `WakeWordService`;
  si `AlertService` expone una cancelación genérica, usarla para desacoplar el hook
  del wake word.
