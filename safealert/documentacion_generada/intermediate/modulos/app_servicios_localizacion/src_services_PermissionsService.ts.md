# Archivo: src/services/PermissionsService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/PermissionsService.ts | 143 | TypeScript 5.9 | 4129 | Servicio de verificación y solicitud de permisos nativos | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Servicio que centraliza la verificación y solicitud de los permisos críticos del MVP de SafeAlert: micrófono, ubicación en primer plano, ubicación en segundo plano y notificaciones. Abstrae las diferencias entre iOS y Android (`react-native-permissions`) y entre permisos de notificación (`expo-notifications`), devuelve un estado unificado (`PermissionsStatus`) y ofrece utilidades como abrir los ajustes del sistema y determinar si los permisos críticos están concedidos. La pantalla `app/permissions.tsx` y el servicio de activación por voz (`WakeWordService`) lo consumen.

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — Consumido por `app/permissions.tsx` (líneas 22–24, 58, 76, 87, 99, 114, 149, 192) y por `src/services/WakeWordService.ts` (línea 26 y 142: `requestMicrophone`). Nota: la ubicación en segundo plano depende del flag `BACKGROUND_LOCATION_ENABLED` (desactivado por defecto), por lo que esa rama es condicional. En web devuelve todo como `unavailable` (la app PWA no usa permisos nativos por esta vía).

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `Platform` de `react-native` | externa | Selección de permisos iOS/Android y rama web | Sí |
| `check`, `request`, `PERMISSIONS`, `RESULTS`, `openSettings` de `react-native-permissions` | externa | Verificación/solicitud de permisos de micrófono y ubicación | Sí |
| `* as Notifications` de `expo-notifications` | externa | Permisos de notificación | Sí |
| `BACKGROUND_LOCATION_ENABLED` de `../config/features` | interna | Condiciona el chequeo/solicitud de ubicación en segundo plano | Sí |

## Componentes que dependen de este archivo

- `app/permissions.tsx` (líneas 22–24 y usos): pantalla de concesión de permisos del onboarding; usa `checkAll`, `requestMicrophone`, `requestLocationForeground`, `requestNotifications`, `requestLocationBackground`, `areAllCriticalGranted` y `openAppSettings`.
- `src/services/WakeWordService.ts` (líneas 26, 142): pide permiso de micrófono antes de iniciar la escucha de la palabra de activación.
- Tipos exportados consumidos por pantallas (`PermissionsStatus`, `PermissionKey`, `PermissionStatus`).

## Variables globales y constantes

No hay constantes de módulo en el archivo. Valores contextuales: el flag `BACKGROUND_LOCATION_ENABLED` (default `false`) condiciona las rutas de ubicación en segundo plano (líneas 77–83 y 117).

## Estructura (funciones / clases / tipos)

Tipos exportados:

- `PermissionKey` (22–26)
- `PermissionStatus` (28–32)
- `PermissionsStatus` (34–39)

Función auxiliar:

- `mapResult(result)` (41–53)

Objeto exportado `PermissionsService`:

- `checkAll()` (56–96)
- `requestMicrophone()` (98–105)
- `requestLocationForeground()` (107–114)
- `requestLocationBackground()` (116–125)
- `requestNotifications()` (127–131)
- `openAppSettings()` (133–135)
- `areAllCriticalGranted(status)` (137–142)

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : PermissionsService.ts
* Descripción     : Verificación y solicitud de permisos del MVP real.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : PermissionsService.checkAll()
* ============================================================================ */

import { Platform } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';
import * as Notifications from 'expo-notifications';
import { BACKGROUND_LOCATION_ENABLED } from '../config/features';

export type PermissionKey =
  | 'microphone'
  | 'locationForeground'
  | 'locationBackground'
  | 'notifications';

export type PermissionStatus =
  | 'granted'
  | 'denied'
  | 'blocked'
  | 'unavailable';

export interface PermissionsStatus {
  microphone: PermissionStatus;
  locationForeground: PermissionStatus;
  locationBackground: PermissionStatus;
  notifications: PermissionStatus;
}
```

**Explicación de las líneas 1–39:**

- **Líneas 1–9**: Cabecera estándar del proyecto.
- **Línea 11**: `Platform` para elegir permisos por SO y detectar web.
- **Líneas 12–18**: Importa las funciones de `react-native-permissions`.
- **Línea 19**: Notificaciones vía Expo.
- **Línea 20**: Flag de ubicación en segundo plano.
- **Líneas 22–26**: Tipo unión de claves de permiso del MVP.
- **Líneas 28–32**: Tipo unión de estado unificado (granted/denied/blocked/unavailable).
- **Líneas 34–39**: Interfaz del estado completo de los cuatro permisos.

```ts
function mapResult(result: string): PermissionStatus {
  switch (result) {
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return 'granted';
    case RESULTS.DENIED:
      return 'denied';
    case RESULTS.BLOCKED:
      return 'blocked';
    default:
      return 'unavailable';
  }
}
```

**Explicación de las líneas 41–53:**

- **Línea 41**: Normaliza el resultado crudo de `react-native-permissions` al tipo propio.
- **Líneas 43–45**: `GRANTED` y `LIMITED` (iOS: uso limitado de ubicación) se consideran `granted`. `[NOTA]`: tratar `LIMITED` como `granted` es razonable para no bloquear la app, pero en ubicación iOS `LIMITED` implica precisión aproximada; conviene distinguir si la precisión es crítica.
- **Líneas 46–47**: `DENIED` → `denied` (solicitable de nuevo).
- **Líneas 48–49**: `BLOCKED` → `blocked` (no solicitable; requiere ajustes).
- **Líneas 50–52**: `UNAVAILABLE` y otros → `unavailable`.

```ts
export const PermissionsService = {
  async checkAll(): Promise<PermissionsStatus> {
    if (Platform.OS === 'web') {
      return {
        microphone: 'unavailable',
        locationForeground: 'unavailable',
        locationBackground: 'unavailable',
        notifications: 'unavailable',
      };
    }

    const [mic, locFg, locBg, notifs] = await Promise.all([
      check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.MICROPHONE
          : PERMISSIONS.ANDROID.RECORD_AUDIO
      ),
      check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
          : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
      ),
      BACKGROUND_LOCATION_ENABLED
        ? check(
            Platform.OS === 'ios'
              ? PERMISSIONS.IOS.LOCATION_ALWAYS
              : PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION
          )
        : Promise.resolve(RESULTS.UNAVAILABLE),
      Notifications.getPermissionsAsync(),
    ]);

    const n = notifs as any;
    const notifStatus = n.status === 'granted' || n.granted ? 'granted' : 'denied';

    return {
      microphone: mapResult(mic),
      locationForeground: mapResult(locFg),
      locationBackground: mapResult(locBg),
      notifications: notifStatus as PermissionStatus,
    };
  },
```

**Explicación de las líneas 55–96:**

- **Líneas 57–64**: En web devuelve un estado fijo `unavailable` para los cuatro permisos; `[OBSERVACIÓN TÉCNICA]`: la PWA de SafeAlert (`public/`) puede necesitar permisos web (micrófono vía `getUserMedia`), pero este servicio no los gestiona; la pantalla web debe tener lógica propia.
- **Líneas 66–85**: Ejecuta en paralelo (`Promise.all`) el chequeo de micrófono, ubicación en primer plano, ubicación en segundo plano (solo si el flag está activo; si no, resuelve `UNAVAILABLE`) y estado de notificaciones.
- **Líneas 71, 75, 80, 81**: Selección de permiso según plataforma: iOS `MICROPHONE`/`LOCATION_WHEN_IN_USE`/`LOCATION_ALWAYS`; Android `RECORD_AUDIO`/`ACCESS_FINE_LOCATION`/`ACCESS_BACKGROUND_LOCATION`.
- **Líneas 87–88**: Normaliza el estado de notificaciones (`n.status === 'granted' || n.granted`) con cast `as any`.
- **Líneas 90–95**: Compone el estado unificado aplicando `mapResult` a micrófono y ubicaciones.
- `[OBSERVACIÓN TÉCNICA]`: mezcla dos librerías de permisos (react-native-permissions y expo-notifications) con modelos distintos; el estado de notificaciones se reduce a `granted`/`denied` perdiendo `blocked`/`unavailable`.

```ts
  async requestMicrophone(): Promise<PermissionStatus> {
    const result = await request(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO
    );
    return mapResult(result);
  },

  async requestLocationForeground(): Promise<PermissionStatus> {
    const result = await request(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
    );
    return mapResult(result);
  },

  async requestLocationBackground(): Promise<PermissionStatus> {
    if (!BACKGROUND_LOCATION_ENABLED) return 'unavailable';

    const result = await request(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_ALWAYS
        : PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION
    );
    return mapResult(result);
  },

  async requestNotifications(): Promise<PermissionStatus> {
    const response = await Notifications.requestPermissionsAsync();
    const r = response as any;
    return r.status === 'granted' ? 'granted' : 'denied';
  },
```

**Explicación de las líneas 98–131:**

- **Líneas 98–105**: Solicita micrófono y mapea el resultado. Efecto: diálogo nativo.
- **Líneas 107–114**: Solicita ubicación en primer plano (`ACCESS_FINE_LOCATION`/`LOCATION_WHEN_IN_USE`). En iOS el primer diálogo puede ofrecer "Mientras se usa la app"; en Android 12+ puede abrir "Preciso/Aproximado".
- **Líneas 116–125**: Solicita ubicación en segundo plano solo si el flag está activo; en iOS la concesión de `LOCATION_ALWAYS` normalmente requiere pasar antes por `WHEN_IN_USE` (el sistema muestra el diálogo de "Always").
- **Líneas 127–131**: Solicita notificaciones vía expo-notifications y reduce a `granted`/`denied`.
- `[OBSERVACIÓN TÉCNICA]` (línea 130): no se distingue `blocked`; si el usuario bloqueó notificaciones en ajustes, `requestPermissionsAsync` devuelve `denied` y el llamador no puede ofrecer "abrir ajustes" específicamente.

```ts
  openAppSettings(): void {
    openSettings();
  },

  areAllCriticalGranted(status: PermissionsStatus): boolean {
    return (
      status.locationForeground === 'granted' &&
      status.notifications === 'granted'
    );
  },
};
```

**Explicación de las líneas 133–142:**

- **Líneas 133–135**: Abre los ajustes del sistema (delegación directa a `openSettings`).
- **Líneas 137–142**: Define "críticos" como ubicación en primer plano + notificaciones. `[OBSERVACIÓN TÉCNICA]`: el **micrófono no se considera crítico**, pese a que la propuesta de valor central de SafeAlert es la alerta SOS por voz; la pantalla `permissions.tsx` lo solicita por separado, pero la función de "todo listo" podría dar por completado el onboarding sin micrófono.
- **[NOTA]**: `locationBackground` tampoco se exige (coherente con flag desactivado por defecto).

## Fichas de funciones y métodos

### mapResult (líneas 41–53)

- Firma: `function mapResult(result: string): PermissionStatus`
- Propósito: normalizar resultados de `react-native-permissions`.
- Retorno: `PermissionStatus`.

### PermissionsService.checkAll (líneas 56–96)

- Firma: `async checkAll(): Promise<PermissionsStatus>`
- Propósito: verificar los cuatro permisos sin diálogos.
- Llamado desde: `app/permissions.tsx` (línea 58).
- Efectos: ninguno (solo lectura). Riesgo: en web devuelve `unavailable` constante.

### PermissionsService.requestMicrophone (líneas 98–105)

- Firma: `async requestMicrophone(): Promise<PermissionStatus>`
- Propósito: solicitar micrófono. Llamado desde: `WakeWordService.ts` (línea 142) y `permissions.tsx` (línea 76).
- Efectos: diálogo nativo. Riesgo: si está `blocked`, `react-native-permissions` no vuelve a mostrar diálogo.

### PermissionsService.requestLocationForeground (líneas 107–114)

- Firma: `async requestLocationForeground(): Promise<PermissionStatus>`
- Propósito: solicitar ubicación en primer plano. Llamado desde: `permissions.tsx` (línea 87).

### PermissionsService.requestLocationBackground (líneas 116–125)

- Firma: `async requestLocationBackground(): Promise<PermissionStatus>`
- Propósito: solicitar ubicación en segundo plano (condicionado al flag). Llamado desde: `permissions.tsx` (línea 114).

### PermissionsService.requestNotifications (líneas 127–131)

- Firma: `async requestNotifications(): Promise<PermissionStatus>`
- Propósito: solicitar notificaciones. Llamado desde: `permissions.tsx` (línea 99).

### PermissionsService.openAppSettings (líneas 133–135)

- Firma: `openAppSettings(): void`
- Propósito: abrir ajustes del sistema. Llamado desde: `permissions.tsx` (línea 192) cuando hay permisos `blocked`.

### PermissionsService.areAllCriticalGranted (líneas 137–142)

- Firma: `areAllCriticalGranted(status: PermissionsStatus): boolean`
- Propósito: decidir si los permisos críticos están concedidos (ubicación fg + notificaciones).
- Llamado desde: `permissions.tsx` (línea 149).

## Clases / interfaces / tipos

| Tipo | Responsabilidad | Campos/valores |
| --- | --- | --- |
| `PermissionKey` | Claves de permisos del MVP | `'microphone'`, `'locationForeground'`, `'locationBackground'`, `'notifications'` |
| `PermissionStatus` | Estado unificado | `'granted' \| 'denied' \| 'blocked' \| 'unavailable'` |
| `PermissionsStatus` | Estado agregado | cuatro campos `PermissionStatus` |

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 137–142): el micrófono no forma parte de `areAllCriticalGranted`; una alerta por voz (núcleo del producto) no funcionará sin él, pero la app puede declarar "todo listo". `[NIVEL DE CERTEZA: Altamente probable]` de impacto funcional.
- `[OBSERVACIÓN TÉCNICA]` (líneas 57–64): en web devuelve siempre `unavailable`, lo que puede impedir que la PWA valide permisos; revisar la estrategia web del MVP.
- `[OBSERVACIÓN TÉCNICA]` (líneas 87–88, 129–130): los casts `as any` sobre respuestas de notificaciones y la pérdida de `blocked`/`unavailable` para notificaciones reducen la información disponible para la UI.
- `[OBSERVACIÓN TÉCNICA]` (línea 44): `LIMITED` se mapea a `granted`; en iOS con ubicación limitada la precisión puede ser aproximada y la clasificación de origen `GPS` vs `NAVEGADOR` del `LocationService` podría no corresponderse.
- `[NIVEL DE CERTEZA: Confirmado por código]` Las solicitudes de ubicación de fondo son no-op (`unavailable`) mientras `BACKGROUND_LOCATION_ENABLED` sea `false`.

## Seguridad

- `[INFORMATIVO]` Datos personales: este servicio gestiona el acceso a micrófono y geolocalización, fuentes de datos personales sensibles; no lee ni transmite datos, solo gestiona permisos.
- `[BAJO]` El estado de permisos (especialmente ubicación) se considera `granted` para `LIMITED` en iOS; la app podría asumir precisión completa cuando el usuario concedió solo uso aproximado, con implicaciones de exactitud en alertas (no de fuga).
- `[INFORMATIVO]` No hay registro de auditoría de concesión/denegación en este servicio (la gestión de consentimiento se canaliza vía `PrivacyService`/`LocationApiClient`).
- `[INFORMATIVO]` No se imprimen secretos ni datos. `openSettings` no expone datos.
- `[INFORMATIVO]` Android: `ACCESS_BACKGROUND_LOCATION` solo es solicitable si el manifiesto lo declara; `react-native-permissions` requiere la configuración del plugin correcta. Revisar `app.json`/manifiesto (fuera de alcance).

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Onboarding "completado" sin micrófono: recomendar incluir `microphone === 'granted'` en `areAllCriticalGranted` o exponer una advertencia persistente cuando el micrófono falte (el SOS por voz no podrá activarse).
- `[RIESGO]` iOS `LIMITED` de ubicación: recomendar advertir al usuario que la precisión puede ser aproximada y ajustar la clasificación de origen en consecuencia.
- `[RECOMENDACIÓN]` Unificar la gestión de permisos de notificación en una sola librería o normalizar bien `blocked`/`unavailable`.
- `[RECOMENDACIÓN]` Definir una estrategia de permisos para la PWA web (navigator.permissions) separada del servicio nativo.
- `[RECOMENDACIÓN]` Al detectar `blocked`, la UI ya redirige a ajustes (`openAppSettings`); tras regresar de ajustes conviene re-ejecutar `checkAll` para refrescar el estado.
