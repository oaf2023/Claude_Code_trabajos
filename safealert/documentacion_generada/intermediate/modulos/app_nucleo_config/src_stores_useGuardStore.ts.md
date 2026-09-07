# Archivo: src/stores/useGuardStore.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/stores/useGuardStore.ts | 85 | TypeScript 5.9 | 3264 | Store de estado global (Zustand + persist) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Store global canónico del flujo de alerta SOS y del modo guardia. Mantiene:
- `isArmed`: si la guardia (modo vigilante activado por voz) está armada.
- `alertPhase`: máquina de estados de la alerta (idle -> countdown -> capturing ->
  sending -> sent / error).
- `countdownSeconds`: segundos restantes de la cuenta regresiva cancelable.
- Estado derivado de detección por voz: `detectedKeyword`, `guardStatusMessage`,
  `lastHeardTranscript`.
- `lastLocation`: última ubicación conocida (tipo `AlertLocation`).
- `lastAlert`: última alerta enviada (tipo `Alert`).
- `showOverdueAlert`: flag para avisar que la última alerta solo se envió al contacto
  principal por pago vencido.

Persiste únicamente `isArmed` en AsyncStorage (clave 'guard-storage') para restaurar
el estado de guardia tras reinicios, y ofrece acciones setter por campo más
`resetAlertState` para volver la alerta a estado inicial.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` — ampliamente consumido por servicios, hooks y
pantallas (ver dependientes).

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `create` de `zustand` | externa | Línea 48 | Sí |
| `persist`, `createJSONStorage` de `zustand/middleware` | externa | Líneas 48-84 | Sí |
| `AsyncStorage` de `@react-native-async-storage/async-storage` | externa | Línea 81 (storage de persist) | Sí |
| `ALERT_COUNTDOWN_SECONDS` de `../config/constants` | interna | Líneas 53, 73 | Sí |
| `Alert as AppAlert`, `AlertLocation` de `../types/Alert` | interna | Tipos del estado (línea 15) | Sí |

Nota: `Alert` se importa con alias `AppAlert` para evitar colisión con el componente
`Alert` de react-native usado en pantallas.

## Componentes que dependen de este archivo

| Archivo dependiente | Uso |
| --- | --- |
| src/hooks/useAlert.ts | Selectores de fase/countdown/última alerta/palabra/ubicación |
| src/services/AlertService.ts | setLastAlert, setAlertPhase, setShowOverdueAlert, resetAlertState |
| src/services/WakeWordService.ts | isArmed, resetAlertState, setArmed, setDetectedKeyword, setAlertPhase |
| src/services/LocationService.ts | setLastLocation (origen MANUAL/simulado/fallback) |
| app/_layout.tsx | Store de guardia (restauración en boot) |
| app/(tabs)/index.tsx | Estado de alerta/guardia de la pantalla principal |
| app/permissions.tsx | Store de guardia (línea 28) |
| src/services/__tests__/AlertService.test.ts | resetAlertState, setState |
| src/services/__tests__/LocationService.test.ts | resetAlertState, setState |

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| AlertPhase | 'idle' \| 'countdown' \| 'capturing' \| 'sending' \| 'sent' \| 'error' | union type exportada | Máquina de estados de alerta | Estado y acciones |
| GuardState | Interfaz del store | interface | Contrato del estado | Store |
| Clave de persistencia 'guard-storage' | 'guard-storage' | string | Clave AsyncStorage | persist (línea 80) |

Estado inicial relevante: `isArmed: false`, `alertPhase: 'idle'`,
`countdownSeconds: ALERT_COUNTDOWN_SECONDS` (3), resto null/false. La persistencia
guarda SOLO `isArmed` (`partialize`), evitando persistir ubicaciones/transcripciones
sensibles.

## Estructura (funciones / clases / tipos)

- Tipo exportado `AlertPhase` (líneas 17-23).
- Interfaz `GuardState` (líneas 25-46).
- Store `useGuardStore` con middleware `persist` (líneas 48-85).
  - Acciones: setArmed, setAlertPhase, setCountdownSeconds, setDetectedKeyword,
    setGuardStatusMessage, setLastHeardTranscript, setLastLocation, setLastAlert,
    setShowOverdueAlert, resetAlertState.

## Análisis línea por línea

**Bloque líneas 1-46 (cabecera, imports, tipo AlertPhase e interfaz):**

```ts
/* ============================================================================
* Archivo         : useGuardStore.ts
* Descripción     : Estado global canónico del flujo de alerta y modo guardia.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Consumir con useGuardStore(selector) desde hooks y pantallas.
* ============================================================================ */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ALERT_COUNTDOWN_SECONDS } from '../config/constants';
import { Alert as AppAlert, AlertLocation } from '../types/Alert';

export type AlertPhase =
  | 'idle'
  | 'countdown'
  | 'capturing'
  | 'sending'
  | 'sent'
  | 'error';

interface GuardState {
  isArmed: boolean;
  alertPhase: AlertPhase;
  countdownSeconds: number;
  detectedKeyword: string | null;
  guardStatusMessage: string | null;
  lastHeardTranscript: string | null;
  lastLocation: AlertLocation | null;
  lastAlert: AppAlert | null;
  // true cuando la última alerta se envió solo al contacto principal por pago vencido
  showOverdueAlert: boolean;
  setArmed: (value: boolean) => void;
  setAlertPhase: (phase: AlertPhase) => void;
  setCountdownSeconds: (seconds: number) => void;
  setDetectedKeyword: (keyword: string | null) => void;
  setGuardStatusMessage: (message: string | null) => void;
  setLastHeardTranscript: (transcript: string | null) => void;
  setLastLocation: (location: AlertLocation | null) => void;
  setLastAlert: (alert: AppAlert | null) => void;
  setShowOverdueAlert: (value: boolean) => void;
  resetAlertState: () => void;
}
```

**Explicación de las líneas 1-46:**
- **Líneas 1-9**: cabecera estándar (2026-03-19): describe el store como "estado
  global canónico del flujo de alerta y modo guardia".
- **Líneas 11-15**: imports de Zustand (create + persist + createJSONStorage),
  AsyncStorage y constantes/tipos del dominio.
- **Líneas 17-23**: unión `AlertPhase` que modela el ciclo de vida de una alerta:
  idle (reposo), countdown (cuenta regresiva cancelable), capturing (grabando audio),
  sending (enviando), sent (entregada) y error (fallo). Es la "máquina de estados"
  central que la UI usa para pintar cada pantalla de alerta.
- **Líneas 25-46**: interfaz `GuardState`: campos (con sus tipos: `AlertLocation` para
  ubicación, `AppAlert` para la última alerta), el flag `showOverdueAlert` comentado
  (alerta enviada solo al contacto principal por pago vencido) y las acciones setter
  de un solo campo más `resetAlertState`.

**Bloque líneas 48-85 (store con persistencia):**

```ts
export const useGuardStore = create<GuardState>()(
  persist(
    (set) => ({
      isArmed: false,
      alertPhase: 'idle',
      countdownSeconds: ALERT_COUNTDOWN_SECONDS,
      detectedKeyword: null,
      guardStatusMessage: null,
      lastHeardTranscript: null,
      lastLocation: null,
      lastAlert: null,
      showOverdueAlert: false,

      setArmed: (value) => set({ isArmed: value }),
      setAlertPhase: (phase) => set({ alertPhase: phase }),
      setCountdownSeconds: (seconds) => set({ countdownSeconds: seconds }),
      setDetectedKeyword: (keyword) => set({ detectedKeyword: keyword }),
      setGuardStatusMessage: (guardStatusMessage) => set({ guardStatusMessage }),
      setLastHeardTranscript: (lastHeardTranscript) => set({ lastHeardTranscript }),
      setLastLocation: (location) => set({ lastLocation: location }),
      setLastAlert: (alert) => set({ lastAlert: alert }),
      setShowOverdueAlert: (value) => set({ showOverdueAlert: value }),
      resetAlertState: () =>
        set({
          alertPhase: 'idle',
          countdownSeconds: ALERT_COUNTDOWN_SECONDS,
          detectedKeyword: null,
          guardStatusMessage: null,
          lastHeardTranscript: null,
        }),
    }),
    {
      name: 'guard-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ isArmed: state.isArmed }),
    }
  )
);
```

**Explicación de las líneas 48-85:**
- **Línea 48**: `create<GuardState>()` con doble invocación (patrón requerido para
  usar middleware tipado con TypeScript).
- **Líneas 49-50**: `persist(...)` envuelve el creador del estado.
- **Líneas 51-59**: estado inicial: guardia desarmada, fase idle, countdown según
  `ALERT_COUNTDOWN_SECONDS` (3), sin palabra detectada, sin mensajes/transcripciones,
  sin ubicación, sin última alerta y sin flag de pago vencido.
- **Líneas 61-69**: setters de campo único (patrón plano y predecible).
- **Líneas 70-77**: `resetAlertState` deja la alerta en reposo: fase idle, countdown
  reiniciado a 3, y limpia palabra/mensaje/transcripción. NO toca `lastAlert`,
  `lastLocation`, `isArmed` ni `showOverdueAlert` (intencionado: conserva la última
  alerta/ubicación para la UI posterior y no desarma la guardia).
- **Líneas 79-83**: configuración de persistencia:
  - `name: 'guard-storage'`: clave en AsyncStorage.
  - `createJSONStorage(() => AsyncStorage)`: adaptador JSON sobre AsyncStorage.
  - `partialize`: persiste EXCLUSIVAMENTE `isArmed`. [OBSERVACIÓN TÉCNICA] Los datos
    sensibles del estado (ubicación, transcripciones, última alerta) NO se persisten;
    buena decisión de privacidad. El resto de campos se rehidrata con sus valores
    iniciales al arrancar.
- **Líneas 84**: cierre del persist y del create.

## Fichas de funciones y métodos

### resetAlertState (líneas 70-77)

- Firma: `resetAlertState: () => void`
- Propósito: reiniciar el ciclo de alerta (idle + countdown completo) y limpiar los
  campos de la detección por voz.
- Parámetros: ninguno. Retorno: void.
- Dependencias: `ALERT_COUNTDOWN_SECONDS`. La invocan `AlertService`,
  `WakeWordService` y tests.
- Efectos secundarios: actualización atómica del store. Riesgos: bajo; no resetea
  `lastAlert` (se conserva para el historial/feedback), comportamiento que debe
  conocerse al consumirla.

### Setters individuales (líneas 61-69)

- Propósito: mutaciones atómicas por campo.
- Riesgos: al ser de campo único y sin validación, cualquier valor se acepta (p. ej.
  `setAlertPhase('cualquier-cosa')` fallaría solo en TypeScript, no en runtime si se
  usa un cast). El tipado es la única protección.

## Clases / interfaces / tipos

### AlertPhase (líneas 17-23)

- Responsabilidad: modelar las fases del flujo de alerta.
- Valores: idle, countdown, capturing, sending, sent, error.
- Relaciones: usado por `useAlert` (cálculo de `isAlerting`), `AlertService` y las
  pantallas.

### GuardState (líneas 25-46)

- Responsabilidad: contrato completo del estado de guardia/alerta.
- Campos descritos en la tabla de la sección Variables. Relaciones: `AppAlert` y
  `AlertLocation` de `src/types/Alert`; `ALERT_COUNTDOWN_SECONDS` de constants.
- Ciclo de vida: rehidratación de `isArmed` desde AsyncStorage al arrancar; el resto
  del estado comienza en valores iniciales en cada sesión.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` La persistencia se limita a `isArmed`: al reabrir la app, la
  fase de alerta y los datos de contexto se pierden (correcto para privacidad, pero
  la UI debe tratar con estado rehidratado parcial).
- `[OBSERVACIÓN TÉCNICA]` `resetAlertState` no limpia `lastAlert` ni `showOverdueAlert`
  ni `lastLocation`: los consumidores (p. ej. pantalla de resultado de alerta) deben
  limpiarlos explícitamente si lo necesitan; no hay una acción de "limpiar todo".
- `[INFORMATIVO]` `countdownSeconds` almacena el valor vigente de la cuenta regresiva;
  lo decrementa el flujo de alerta (AlertService/WakeWordService), no el store.
- `[INFORMATIVO]` Estado de privacidad: `lastHeardTranscript` (transcripción de audio
  escuchada por el wake word) solo vive en memoria; no se persiste. Correcto según
  DAMA/DAMMA.

## Seguridad

- `[INFORMATIVO]` Datos personales (transcripciones de voz, ubicación, alertas) se
  mantienen solo en memoria del store y no se persisten ni loguean en este archivo.
- `[INFORMATIVO]` `isArmed` persistido en AsyncStorage en claro (no cifrado): es un
  booleano no sensible; aceptable. Si en el futuro se persisten más campos (p. ej.
  ubicación), deberá cifrarse o evitarse.
- `[BAJO]` Al rehidratar `isArmed = true` tras reinicio, la guardia podría quedar
  armada sin que el usuario lo recuerde (el manejo de reactivación lo hace
  WakeWordService en boot; revisar su lógica de restauración).

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Medio: si se añadieran campos sensibles al `partialize` sin cifrado,
  quedarían en AsyncStorage en claro. [RECOMENDACIÓN] Mantener la política actual
  (solo isArmed) o usar almacenamiento seguro (expo-secure-store) para campos
  sensibles.
- `[RECOMENDACIÓN]` Documentar el contrato de `resetAlertState` (qué limpia y qué
  conserva) para evitar sorpresas en futuras pantallas.
- `[RECOMENDACIÓN]` Considerar una acción `clearLastAlert` si la UI necesita borrar el
  estado de la última alerta tras mostrarla.
