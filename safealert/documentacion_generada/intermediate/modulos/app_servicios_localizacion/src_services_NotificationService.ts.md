# Archivo: src/services/NotificationService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/NotificationService.ts | 80 | TypeScript 5.9 | 2654 | Servicio de notificaciones locales y recordatorios diarios | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Servicio de notificaciones locales del cliente móvil SafeAlert. Configura el manejador global de notificaciones de `expo-notifications`, crea el canal Android para "Recordatorios diarios", expone el estado/solicitud de permisos de notificación y programa/cancela un recordatorio diario único (identificador fijo `daily-safety-reminder`) que invita al usuario a revisar contactos y permisos para mantener el SOS operativo. Su uso principal está en el arranque de la app y en la pantalla de ajustes.

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — Consumido por `app/_layout.tsx` (líneas 29, 250, 253: `configure()` y `scheduleDailyReminder(reminderHour)`) y por `app/(tabs)/settings.tsx` (líneas 28, 119, 128, 130, 140: `requestPermissions`, `scheduleDailyReminder`, `cancelDailyReminder`). El archivo `app/_layout.tsx.bak` también lo referencia (copia de respaldo, no activa).

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `* as Notifications` de `expo-notifications` | externa | Handler global, canal, permisos, programación | Sí |
| `Platform` de `react-native` | externa | Rama Android para canal | Sí |

## Componentes que dependen de este archivo

- `app/_layout.tsx` (líneas 29, 250, 253): `configure()` al iniciar la app y `scheduleDailyReminder` según ajustes persistidos.
- `app/(tabs)/settings.tsx` (líneas 28, 119–130, 140): activación/desactivación del recordatorio diario y cambio de hora.
- `app/_layout.tsx.bak`: copia de respaldo que importa el mismo servicio (no es ruta ejecutable del router).

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `REMINDER_IDENTIFIER` | `'daily-safety-reminder'` | string | Identificador fijo del recordatorio diario (evita duplicados) | Líneas 14, 56, 73 |

Otros valores literales: canal `'reminders'` (línea 28); nombre visible `'Recordatorios diarios'`; importancia `AndroidImportance.DEFAULT`; patrón de vibración `[0, 250, 150, 250]`; color `#DC2626` (rojo de la marca); título `'Revisión diaria de SafeAlert'` y cuerpo `'Comprueba tus contactos y permisos para que el SOS siga listo.'`; hora `hour` con `minute: 0`.

## Estructura (funciones / clases / tipos)

Objeto exportado `NotificationService`:

- Handler global de notificaciones (registro en 16–23)
- `configure()` (26–35)
- `getPermissionsStatus()` (37–39)
- `requestPermissions()` (41–44)
- `scheduleDailyReminder(hour)` (46–68)
- `cancelDailyReminder()` (70–79)

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : NotificationService.ts
* Descripción     : Gestión de notificaciones locales y recordatorios del MVP.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : NotificationService.configure() y scheduleDailyReminder()
* ============================================================================ */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_IDENTIFIER = 'daily-safety-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
```

**Explicación de las líneas 1–23:**

- **Líneas 1–9**: Cabecera estándar del proyecto.
- **Línea 11**: Importa toda la API de notificaciones de Expo.
- **Línea 12**: `Platform` para el canal Android.
- **Línea 14**: Identificador fijo del recordatorio.
- **Líneas 16–23**: Registra el manejador global de notificaciones **como efecto secundario al importar el módulo**. Define que las notificaciones mostradas suenen (`shouldPlaySound`), no alteren el badge (`shouldSetBadge: false`), muestren banner y lista (iOS). `[OBSERVACIÓN TÉCNICA]`: como el registro ocurre en tiempo de importación, cualquier test o importación indirecta del servicio configura el handler; debe estar mockeado en tests que importen el módulo.

```ts
export const NotificationService = {
  async configure(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Recordatorios diarios',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: '#DC2626',
      });
    }
  },
```

**Explicación de las líneas 25–35:**

- **Línea 27**: Solo Android necesita canales explícitos.
- **Líneas 28–33**: Crea/actualiza el canal `reminders` con nombre visible, importancia DEFAULT (sin sonido urgente, no interrumpe), patrón de vibración corto y luz LED roja `#DC2626`.
- **[NOTA]**: `configure()` debe ejecutarse antes de programar notificaciones en Android (así lo hace `_layout.tsx` en el arranque).

```ts
  async getPermissionsStatus(): Promise<Notifications.NotificationPermissionsStatus> {
    return Notifications.getPermissionsAsync();
  },

  async requestPermissions(): Promise<Notifications.PermissionStatus> {
    const response = await Notifications.requestPermissionsAsync();
    return (response as any).status;
  },
```

**Explicación de las líneas 37–44:**

- **Líneas 37–39**: Devuelve el estado actual de permisos sin solicitarlos.
- **Líneas 41–44**: Solicita permisos y extrae `status` con un cast `as any`. `[OBSERVACIÓN TÉCNICA]`: el tipado real de `requestPermissionsAsync` en Expo SDK 55 devuelve `NotificationPermissionsStatus` con campo `status`; el cast `as any` esconde el tipo y podría eliminarse. Si el usuario deniega de forma permanente (iOS/Android 13+), `status` será `'denied'` y el llamador debe redirigir a ajustes.

```ts
  async scheduleDailyReminder(hour: number): Promise<string | null> {
    const permissions = await this.getPermissionsStatus();
    const p = permissions as any;
    if (!(p.granted || p.status === 'granted')) {
      return null;
    }

    await this.cancelDailyReminder();

    return Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: {
        title: 'Revisión diaria de SafeAlert',
        body: 'Comprueba tus contactos y permisos para que el SOS siga listo.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  },
```

**Explicación de las líneas 46–68:**

- **Línea 47**: Consulta el estado de permisos.
- **Líneas 48–51**: Comprueba si las notificaciones están concedidas (`granted` o `status === 'granted'`) mediante `as any`. Si no, retorna `null` sin programar.
- **Línea 53**: Cancela primero cualquier recordatorio existente (evita duplicados, ya que el identificador es fijo).
- **Líneas 55–67**: Programa la notificación diaria con identificador fijo, título/body de recordatorio de seguridad, sonido por defecto y disparador diario a la `hour` indicada con minuto 0.
- **[NOTA]**: `scheduleDailyReminder` solo programa el recordatorio si el permiso ya está concedido; no solicita el permiso por sí mismo (la solicitud ocurre en `settings.tsx` antes de llamarla).
- **Línea 68**: Retorna el identificador de la notificación programada o `null`.

```ts
  async cancelDailyReminder(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const reminder = scheduled.find(
      (notification) => notification.identifier === REMINDER_IDENTIFIER
    );

    if (reminder) {
      await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
    }
  },
};
```

**Explicación de las líneas 70–79:**

- **Línea 71**: Obtiene todas las notificaciones programadas.
- **Líneas 72–74**: Busca la que coincide con `REMINDER_IDENTIFIER`.
- **Líneas 76–78**: Si existe, la cancela. No lanza error si no existe (idempotente).

## Fichas de funciones y métodos

### Handler global de notificaciones (líneas 16–23)

- Registro en tiempo de importación: define cómo se comportan las notificaciones mostradas (sonido sí, badge no, banner y lista sí).
- Efectos secundarios: configuración global del runtime de notificaciones. Riesgo en tests: debe mockearse `expo-notifications`.

### NotificationService.configure (líneas 26–35)

- Firma: `async configure(): Promise<void>`
- Propósito: crear el canal Android de recordatorios.
- Llamado desde: `app/_layout.tsx` (línea 250).

### NotificationService.getPermissionsStatus (líneas 37–39)

- Firma: `async getPermissionsStatus(): Promise<Notifications.NotificationPermissionsStatus>`
- Propósito: consultar permisos sin diálogo.

### NotificationService.requestPermissions (líneas 41–44)

- Firma: `async requestPermissions(): Promise<Notifications.PermissionStatus>`
- Propósito: solicitar permiso de notificación.
- Llamado desde: `app/(tabs)/settings.tsx` (línea 119).
- Efectos: muestra el diálogo nativo de permisos.

### NotificationService.scheduleDailyReminder (líneas 46–68)

- Firma: `async scheduleDailyReminder(hour: number): Promise<string | null>`
- Propósito: programar el recordatorio diario de revisión de seguridad.
- Parámetros: `hour` (0–23). Retorno: identificador de la notificación o `null` si no hay permiso.
- Llamado desde: `_layout.tsx` (253) y `settings.tsx` (128, 140).
- Efectos secundarios: cancela el recordatorio previo y programa uno nuevo (idempotente).

### NotificationService.cancelDailyReminder (líneas 70–79)

- Firma: `async cancelDailyReminder(): Promise<void>`
- Propósito: cancelar el recordatorio si existe. Llamado desde: `settings.tsx` (130) y dentro de `scheduleDailyReminder`.

## Clases / interfaces / tipos

No declara clases/interfaces propias. Tipos externos usados: `Notifications.NotificationPermissionsStatus`, `Notifications.PermissionStatus`, `Notifications.SchedulableTriggerInputTypes.DAILY` (enum de `expo-notifications`).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 16–23): el `setNotificationHandler` se ejecuta en el import; el archivo `_layout.tsx.bak` (respaldo) también lo importa — confirmar que el `.bak` no participa del bundle.
- `[OBSERVACIÓN TÉCNICA]` (líneas 43, 48): los casts `as any` sobre las respuestas de permisos son innecesarios con el tipado del SDK actual y ocultan errores de tipos.
- `[NOTA]` El recordatorio no se reprograma automáticamente si el usuario cambia la hora mientras las notificaciones están desactivadas; `settings.tsx` orquesta esa lógica (llama a `requestPermissions` antes de `scheduleDailyReminder`).
- `[NIVEL DE CERTEZA: Confirmado por código]` Solo existe una notificación diaria programada a la vez (identificador fijo + cancelación previa).

## Seguridad

- `[INFORMATIVO]` Datos personales: la notificación no incluye datos personales del usuario ni coordenadas; solo texto genérico de recordatorio.
- `[INFORMATIVO]` Permisos: solicitud y comprobación gestionadas por el sistema (expo-notifications). En iOS el primer intento se solicita desde `settings.tsx`; si se deniega permanentemente, el sistema no volverá a mostrar el diálogo y el servicio devuelve `null`/`denied`.
- `[BAJO]` No se registra el consentimiento/estado de notificaciones en el backend desde este servicio (la gestión de consentimiento de notificaciones está en `PrivacyService`/`LocationApiClient` con tipo `NOTIFICACIONES`).
- No se imprimen secretos ni datos sensibles en logs. Sin validación de entrada: `scheduleDailyReminder(hour)` aceptaría horas fuera de 0–23 (el SDK lo rechazaría o comportaría de forma indefinida).

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` En Android 13+ y iOS, si el usuario denegó el permiso en el pasado, `scheduleDailyReminder` retorna `null` silenciosamente y el ajuste "recordatorio activado" podría guardarse sin efecto real; recomendar consultar el estado y guiar a ajustes del sistema.
- `[RECOMENDACIÓN]` Eliminar los casts `as any` tipando correctamente las respuestas del SDK.
- `[RECOMENDACIÓN]` Validar `hour` en el rango 0–23 y registrar (sin datos personales) cuándo se programa/cancela el recordatorio para trazabilidad.
- `[RECOMENDACIÓN]` Confirmar que `_layout.tsx.bak` no forma parte del bundle de producción (expo-router solo enruta archivos sin `.bak`).
