# Archivo: src/types/Settings.ts

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | src/types/Settings.ts |
| Líneas totales | 27 |
| Lenguaje | TypeScript 5.9 |
| Tamaño (bytes) | 870 |
| Categoría | Definición de tipos y valores por defecto de la configuración de la app |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Define el modelo de configuración persistente de la aplicación `AppSettings` (palabras de
activación, plantilla de mensaje, audio, suscripción, modo guardián, recordatorios,
sensibilidad del wake word y cuenta atrás de la alerta) junto con la constante
`DEFAULT_SETTINGS`, que fija los valores iniciales con que el store de ajustes
(`useSettingsStore`) hidrata su estado.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. `AppSettings` y `DEFAULT_SETTINGS` se importan de forma real en
`src/stores/useSettingsStore.ts` (línea 4), que las usa para tipar y sembrar el estado
(línea 25: spread de `DEFAULT_SETTINGS`).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna | — | — | — |

El archivo no importa nada.

## Componentes que dependen de este archivo

Referencias reales encontradas con búsqueda sobre el código fuente:

- `src/stores/useSettingsStore.ts` (línea 4): `import { AppSettings, DEFAULT_SETTINGS } from '../types/Settings'` — estado tipado y estado inicial con spread de `DEFAULT_SETTINGS` (línea 25).

Consumidores indirectos (a través del store): pantallas de ajustes y el servicio de wake
word, que leen `triggerWords`, `wakeWordSensitivity` y `alertCountdownSeconds` desde el
store.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `DEFAULT_SETTINGS` | Objeto con los valores de la tabla siguiente | `AppSettings` (constante exportada) | Estado inicial por defecto de la configuración | `useSettingsStore.ts` (línea 25) |

## Estructura (funciones / clases / tipos)

- Interfaz (`export interface`): `AppSettings`.
- Constante (`export const`): `DEFAULT_SETTINGS`.

## Análisis línea por línea

```ts
export interface AppSettings {
  triggerWords: string[];
  messageTemplate: string;
  audioEnabled: boolean;
  hasSubscription: boolean;
  // true cuando el usuario cerró el aviso de suscripción vencida sin pagar
  paymentOverdue: boolean;
  guardModeEnabled: boolean;
  reminderNotificationsEnabled: boolean;
  reminderHour: number;
  wakeWordSensitivity: number; // 0.0 - 1.0
  alertCountdownSeconds: number; // seconds to cancel before sending
}
```

**Explicación de las líneas 1–13:**

- **Línea 1**: apertura de `AppSettings`, configuración persistente de la app.
- **Línea 2**: `triggerWords`, palabras/frases que activan la alerta.
- **Línea 3**: `messageTemplate`, plantilla del mensaje de alerta con placeholders
  `{name}`, `{location}` y `{time}` (interpolados por `MessageFormatter`).
- **Línea 4**: `audioEnabled`, habilita la grabación de audio en la alerta.
- **Línea 5**: `hasSubscription`, indica suscripción activa.
- **Líneas 6–7**: comentario y `paymentOverdue`: true cuando el usuario cerró el aviso de
  suscripción vencida sin pagar.
- **Línea 8**: `guardModeEnabled`, modo guardián.
- **Línea 9**: `reminderNotificationsEnabled`, recordatorios de seguridad activados.
- **Línea 10**: `reminderHour`, hora del recordatorio diario.
- **Línea 11**: `wakeWordSensitivity`, sensibilidad de detección entre 0.0 y 1.0 (comentario).
- **Línea 12**: `alertCountdownSeconds`, segundos de cuenta atrás para cancelar antes del
  envío (comentario: "seconds to cancel before sending").
- **Línea 13**: cierre de la interfaz.

```ts
export const DEFAULT_SETTINGS: AppSettings = {
  triggerWords: ['ayuda', 'socorro', 'auxilio', 'help'],
  messageTemplate:
    '{name} necesita ayuda urgente! Ubicación: {location} — Hora: {time}',
  audioEnabled: true,
  hasSubscription: false,
  paymentOverdue: false,
  guardModeEnabled: false,
  reminderNotificationsEnabled: false,
  reminderHour: 9,
  wakeWordSensitivity: 0.7,
  alertCountdownSeconds: 3,
};
```

**Explicación de las líneas 15–27:**

- **Línea 15**: apertura de `DEFAULT_SETTINGS`, tipada como `AppSettings`.
- **Línea 16**: `triggerWords` por defecto con cuatro palabras en español e inglés:
  `'ayuda'`, `'socorro'`, `'auxilio'`, `'help'`.
- **Líneas 17–18**: plantilla por defecto:
  `'{name} necesita ayuda urgente! Ubicación: {location} — Hora: {time}'`; los tres
  placeholders coinciden con los que reemplaza `MessageFormatter.format`.
- **Línea 19**: `audioEnabled: true`, audio activo por defecto.
- **Línea 20**: `hasSubscription: false`, sin suscripción al inicio.
- **Línea 21**: `paymentOverdue: false`.
- **Línea 22**: `guardModeEnabled: false`, modo guardián apagado por defecto.
- **Línea 23**: `reminderNotificationsEnabled: false`.
- **Línea 24**: `reminderHour: 9` (9:00 como hora de recordatorio por defecto).
- **Línea 25**: `wakeWordSensitivity: 0.7`, sensibilidad por defecto dentro de 0.0-1.0.
- **Línea 26**: `alertCountdownSeconds: 3`, cuenta atrás de 3 segundos antes del envío.
- **Línea 27**: cierre del objeto.

## Fichas de funciones y métodos

El archivo no contiene funciones.

## Clases / interfaces / tipos

### Interfaz `AppSettings` (líneas 1–13)

| Campo | Tipo | Obligatorio | Uso real encontrado |
| --- | --- | --- | --- |
| triggerWords | string[] | Sí | Consumido por `useSettingsStore` y `triggerWords.ts` (pantallas de ajustes y Home) |
| messageTemplate | string | Sí | Consumido por `AlertService` → `MessageFormatter.format` (plantilla del SMS) |
| audioEnabled | boolean | Sí | Flag de grabación de audio |
| hasSubscription | boolean | Sí | Control de funciones de pago |
| paymentOverdue | boolean | Sí | Aviso de suscripción vencida |
| guardModeEnabled | boolean | Sí | Modo guardián |
| reminderNotificationsEnabled | boolean | Sí | Recordatorios de seguridad |
| reminderHour | number | Sí | Hora del recordatorio |
| wakeWordSensitivity | number | Sí | Sensibilidad 0.0-1.0 del wake word |
| alertCountdownSeconds | number | Sí | Cuenta atrás (3 s por defecto) |

- Responsabilidad: contrato único de la configuración persistente; evita duplicar campos
  sueltos entre store y pantallas.
- Relaciones: definida junto a `DEFAULT_SETTINGS`; el store `useSettingsStore` la usa como
  tipo de estado y como valor inicial.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA]: la plantilla por defecto (líneas 17-18) usa el em-dash
  `—` dentro del texto. El generador DOCX de la auditoría no admite emojis ni caracteres
  de control, pero esto no afecta al código: es un carácter Unicode válido en runtime.
- [OBSERVACIÓN TÉCNICA]: no hay en este archivo mecanismo de migración de versión de
  configuración: si `AppSettings` gana campos en el futuro, los estados persistidos
  antiguos quedarán sin esos campos (el store debería hacer merge con `DEFAULT_SETTINGS`,
  como ya hace en línea 25 del store).
- [NIVEL DE CERTEZA: Confirmado por código] para el uso en `useSettingsStore.ts`.

## Seguridad

- INFORMATIVO: `messageTemplate` y `triggerWords` son contenido de usuario que se inserta
  en mensajes SMS y en lógica de detección; deben tratarse como texto plano sin
  interpretación (no hay riesgo de inyección porque `MessageFormatter` solo hace
  sustitución de placeholders).
- No se detectan hallazgos CRÍTICOS, ALTOS ni MEDIOS en este archivo de tipos.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN]: centralizar la migración de la configuración (versión de esquema) para
  cuando `AppSettings` evolucione, evitando estados parciales en instalaciones antiguas.
- [RECOMENDACIÓN]: documentar el rango y unidad de `wakeWordSensitivity` y
  `alertCountdownSeconds` en un único punto (ya anotados en comentarios) y validar los
  valores en la pantalla de ajustes antes de persistir.
