# Archivo: src/services/LocationService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/LocationService.ts | 258 | TypeScript 5.9 | 9078 | Servicio de localización (cliente móvil) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Servicio central de obtención de ubicación del cliente móvil SafeAlert. Su responsabilidad es resolver la posición actual del dispositivo en distintos escenarios (permiso concedido, denegado, sin fix GPS, desarrollo/emulador) y devolver siempre un objeto normalizado `AlertLocation` que clasifica el **origen** de la coordenada (`GPS`, `NAVEGADOR`, `IP`, `MANUAL`) y el **estado del permiso** (`GRANTED`, `DENIED`, `PROMPT`, etc.), conforme al diseño del "Prompt Maestro". Además persiste la última ubicación en el store global Zustand `useGuardStore` y gestiona tareas de ubicación en segundo plano vía `expo-task-manager` (activables mediante feature flag). El resultado alimenta el flujo de alerta SOS (`AlertService`), que incorpora la ubicación y su enlace a Google Maps al payload de la alerta.

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — El servicio se importa y ejecuta desde `src/services/AlertService.ts` (líneas 15, 201 y 211) y desde la pantalla `app/ubicacion/manual.tsx` (líneas 15 y 51), y está cubierto por tests unitarios. La parte de actualizaciones en segundo plano (`startBackgroundUpdates`/`stopBackgroundUpdates` + `TaskManager.defineTask`) existe pero queda condicionada al flag `BACKGROUND_LOCATION_ENABLED`, que por defecto es `false` en `src/config/features.ts` (líneas 123–126); por tanto la monitorización de fondo es `PARCIALMENTE IMPLEMENTADA` / dependiente de configuración.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `* as Location` de `expo-location` | externa | Permisos, posición actual, última posición, tareas de fondo, proveedor de red | Sí |
| `* as TaskManager` de `expo-task-manager` | externa | Definición de la tarea `background-location-task` | Sí |
| `Platform` de `react-native` | externa | Detección de Android/emulador | Sí |
| `AlertLocation`, `LocationSource`, `PermissionStatusValue` de `../types/Alert` | interna | Tipado del resultado y clasificación de origen | Sí |
| `buildMapsLink` de `../utils/googleMapsLink` | interna | Método `buildMapsLink` del servicio (delegación) | Sí |
| `useGuardStore` de `../stores/useGuardStore` | interna | Persistir/leer `lastLocation` | Sí |
| `DEV_FALLBACK_LOCATION`, `GPS_FRESH_FIX_TIMEOUT_MS`, `LOCATION_UPDATE_INTERVAL_MS` de `../config/constants` | interna | Fallback de desarrollo, timeout de fix y intervalo de fondo | Sí |
| `BACKGROUND_LOCATION_ENABLED` de `../config/features` | interna | Guardas de las tareas de segundo plano | Sí |

## Componentes que dependen de este archivo

- `src/services/AlertService.ts` (líneas 15, 201, 211): llama a `LocationService.getCurrentLocation()` durante el envío de la alerta y a `LocationService.buildMapsLink(location)` para el enlace de mapas.
- `app/ubicacion/manual.tsx` (líneas 15, 51): pantalla de alta manual de ubicación; usa `LocationService.getManualLocation(lat, lon, direccion)`.
- `src/services/__tests__/AlertService.test.ts` (líneas 14, 24–25 y siguientes): mockea `LocationService` completo.
- `src/services/__tests__/LocationService.test.ts`: test unitario dedicado (analizado aparte).
- `src/stores/useGuardStore.ts` usa los tipos `AlertLocation` que produce el servicio (no importa el servicio en sí).

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `BACKGROUND_LOCATION_TASK` | `'background-location-task'` | string | Identificador único de la tarea de ubicación en segundo plano | Líneas 26, 69, 95–96, 99, 115–116, 119 |

Valores mágicos y de contexto (importados de constantes):

| Nombre | Valor | Significado |
| --- | --- | --- |
| `DEV_FALLBACK_LOCATION` | lat `-34.6037`, lon `-58.3816`, accuracy `5000` | Ubicación simulada de Buenos Aires usada solo en desarrollo/emulador |
| `GPS_FRESH_FIX_TIMEOUT_MS` | `8000` | Timeout máximo de espera de un fix fresco (8 s) |
| `LOCATION_UPDATE_INTERVAL_MS` | `300000` (5 min) | Intervalo de actualización de ubicación en segundo plano |
| Umbral de precisión `< 10` m | 10 | Clasifica el origen como `GPS` si la precisión es menor de 10 m; si no, `NAVEGADOR` |
| `distanceInterval: 100` | 100 m | Distancia mínima para nueva actualización en segundo plano |
| `staleMinutes` redondeo | 60000 ms | División para calcular minutos de antigüedad |

## Estructura (funciones / clases / tipos)

Funciones auxiliares no exportadas:

- `isAndroidEmulator()` (28–40)
- `shouldUseDevelopmentLocationFallback()` (42–44)
- `buildEmergencyFallbackLocation(lastKnownTimestamp?)` (46–58)
- `mapPermissionStatus(permStatus)` (60–67)
- Callback global de `TaskManager.defineTask` (69–88)

Objeto exportado `LocationService` con métodos:

- `startBackgroundUpdates()` (91–111)
- `stopBackgroundUpdates()` (113–121)
- `getCurrentLocation()` (123–233)
- `getManualLocation(lat, lon, address?)` (236–253)
- `buildMapsLink(location)` (255–257)

Tipos usados (definidos en `../types/Alert.ts`): `AlertLocation`, `LocationSource`, `PermissionStatusValue`.

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : LocationService.ts
* Descripción     : Obtención de ubicación con clasificación de origen según
*                   Prompt Maestro (GPS, NAVEGADOR, IP, MANUAL) y registro
*                   de precisión documentada.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : LocationService.getCurrentLocation()
* ============================================================================ */
```

**Explicación de las líneas 1–11:**

Cabecera estándar del proyecto. Aporta metadatos: versión 2.0.0 (coherente con la ampliación de clasificación de origen) y autor. No tiene lógica ejecutable.

```ts
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { AlertLocation, LocationSource, PermissionStatusValue } from '../types/Alert';
import { buildMapsLink } from '../utils/googleMapsLink';
import { useGuardStore } from '../stores/useGuardStore';
import {
  DEV_FALLBACK_LOCATION,
  GPS_FRESH_FIX_TIMEOUT_MS,
  LOCATION_UPDATE_INTERVAL_MS,
} from '../config/constants';
import { BACKGROUND_LOCATION_ENABLED } from '../config/features';

const BACKGROUND_LOCATION_TASK = 'background-location-task';
```

**Explicación de las líneas 13–26:**

- **Línea 13**: Importa la API completa de `expo-location` (permisos, posición, tareas de fondo).
- **Línea 14**: Importa `expo-task-manager`, necesario para registrar la tarea de fondo de forma global.
- **Línea 15**: `Platform` de React Native para ramificar comportamiento Android.
- **Línea 16**: Importa los tipos del dominio de alertas que tipan el resultado.
- **Línea 17**: Función utilitaria que genera enlace de Google Maps.
- **Línea 18**: Store global Zustand donde se persiste la última ubicación.
- **Líneas 19–23**: Constantes de configuración (fallback de desarrollo, timeouts e intervalo).
- **Línea 24**: Feature flag que habilita el modo segundo plano.
- **Línea 26**: Constante con el nombre canónico de la tarea de fondo; evita strings mágicos repetidos.

```ts
function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') return false;
  const constants = Platform.constants as {
    Brand?: string; Manufacturer?: string; Model?: string;
    Fingerprint?: string; Device?: string;
  };
  const emulatorHints = [
    constants.Brand, constants.Manufacturer, constants.Model,
    constants.Fingerprint, constants.Device,
  ].filter(Boolean).join(' ').toLowerCase();
  return ['generic', 'emulator', 'sdk_gphone', 'ranchu', 'vbox', 'goldfish']
    .some((hint) => emulatorHints.includes(hint));
}

function shouldUseDevelopmentLocationFallback(): boolean {
  return __DEV__ || process.env.NODE_ENV !== 'production' || isAndroidEmulator();
}
```

**Explicación de las líneas 28–44:**

- **Línea 29**: En iOS no se aplica la heurística de emulador por propiedades de `Platform.constants` (diseñada para Android).
- **Líneas 30–33**: Lee campos crudos de `Platform.constants` con un molde de tipo local (`Brand`, `Manufacturer`, `Model`, `Fingerprint`, `Device`).
- **Líneas 34–37**: Concatena los valores presentes, en minúsculas, para formar una única cadena de heurística.
- **Líneas 38–39**: Lista de subcadenas típicas de emuladores Android (AVD, Genymotion, etc.); si alguna aparece, se considera emulador.
- **Línea 43**: El fallback de desarrollo se usa si: compilación de desarrollo (`__DEV__`), entorno distinto de producción o dispositivo emulado. Es la condición que activa la ubicación simulada de Buenos Aires.

```ts
function buildEmergencyFallbackLocation(lastKnownTimestamp?: number): AlertLocation {
  const timestamp = lastKnownTimestamp ?? Date.now();
  return {
    lat: DEV_FALLBACK_LOCATION.lat,
    lon: DEV_FALLBACK_LOCATION.lon,
    accuracy: DEV_FALLBACK_LOCATION.accuracy,
    timestamp,
    isStale: true,
    staleMinutes: Math.max(0, Math.round((Date.now() - timestamp) / 60000)),
    source: 'IP',
    permissionStatus: 'NO_DISPONIBLE',
  };
}
```

**Explicación de las líneas 46–58:**

- **Línea 47**: Usa la marca temporal recibida o la actual.
- **Líneas 48–57**: Construye un `AlertLocation` de emergencia con las coordenadas fijas de `DEV_FALLBACK_LOCATION` (Buenos Aires), `source: 'IP'` y `permissionStatus: 'NO_DISPONIBLE'`. Marca `isStale: true` y calcula `staleMinutes`.
- **Línea 54**: `Math.max(0, ...)` evita minutos negativos si la marca es futura.

```ts
function mapPermissionStatus(permStatus: Location.PermissionStatus): PermissionStatusValue {
  switch (permStatus) {
    case 'granted': return 'GRANTED';
    case 'denied': return 'DENIED';
    case 'undetermined': return 'PROMPT';
    default: return 'NO_DISPONIBLE';
  }
}
```

**Explicación de las líneas 60–67:**

- **Línea 60**: Traduce el estado de permiso de `expo-location` al vocabulario propio del dominio `PermissionStatusValue`.
- **Líneas 62–65**: Mapeo directo `granted`→`GRANTED`, `denied`→`DENIED`, `undetermined`→`PROMPT`; cualquier otro valor (p. ej. iOS `limited` si apareciera) cae en `NO_DISPONIBLE`.

```ts
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  if (locations && locations.length > 0) {
    const loc = locations[0];
    const alertLocation: AlertLocation = {
      lat: loc.coords.latitude,
      lon: loc.coords.longitude,
      accuracy: loc.coords.accuracy ?? 0,
      timestamp: loc.timestamp,
      isStale: false,
      source: loc.coords.accuracy !== null && loc.coords.accuracy < 10 ? 'GPS' : 'NAVEGADOR',
      permissionStatus: 'GRANTED',
      altitude: loc.coords.altitude ?? undefined,
      speed: loc.coords.speed ?? undefined,
      direction: loc.coords.heading ?? undefined,
    };
    useGuardStore.getState().setLastLocation(alertLocation);
  }
});
```

**Explicación de las líneas 69–88:**

- **Línea 69**: Registra a nivel global el callback que ejecutará el sistema operativo en segundo plano cuando haya nuevas ubicaciones. Es un efecto secundario en tiempo de importación del módulo.
- **Línea 70**: Si el sistema notifica un error de tarea, aborta sin procesar.
- **Línea 71**: Extrae el arreglo de ubicaciones del payload con un molde de tipo local.
- **Líneas 72–73**: Solo procesa si existe al menos una ubicación y toma la primera.
- **Líneas 74–85**: Normaliza a `AlertLocation`. Reutiliza el criterio de precisión `< 10` m para clasificar `GPS` vs `NAVEGADOR` y propaga altitud, velocidad y rumbo si existen.
- **Línea 86**: Persiste la última ubicación en `useGuardStore`, de modo que el resto de la app puede leerla sin permisos de fondo repetidos.

```ts
export const LocationService = {
  async startBackgroundUpdates(): Promise<void> {
    if (!BACKGROUND_LOCATION_ENABLED) return;
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') return;
    const isRegistered = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    ).catch(() => false);
    if (!isRegistered) {
      await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: LOCATION_UPDATE_INTERVAL_MS,
        distanceInterval: 100,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'SafeAlert activo',
          notificationBody: 'Monitoreando tu ubicación en segundo plano',
          notificationColor: '#DC2626',
        },
      });
    }
  },
```

**Explicación de las líneas 90–111:**

- **Línea 92**: Si el flag `BACKGROUND_LOCATION_ENABLED` es falso, la operación es un no-op (por defecto está desactivado).
- **Línea 93**: Solicita el permiso de ubicación en segundo plano.
- **Línea 94**: Si el usuario no lo concede, no inicia la tarea.
- **Líneas 95–97**: Comprueba si la tarea ya está registrada/activa; ante error lo interpreta como "no registrada".
- **Líneas 98–110**: Inicia las actualizaciones con precisión balanceada, intervalo de 5 minutos, distancia mínima de 100 m e indicador de ubicación en segundo plano visible. En Android configura un servicio en primer plano con notificación de color rojo `#DC2626` (identidad visual de alerta).

```ts
  async stopBackgroundUpdates(): Promise<void> {
    if (!BACKGROUND_LOCATION_ENABLED) return;
    const isRegistered = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    ).catch(() => false);
    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  },
```

**Explicación de las líneas 113–121:**

- **Línea 114**: Misma guarda de feature flag.
- **Líneas 115–120**: Comprueba si la tarea está activa y, en ese caso, la detiene. Es idempotente.

```ts
  async getCurrentLocation(): Promise<AlertLocation> {
    const lastLocation = useGuardStore.getState().lastLocation;
    const providerStatus = await Location.getProviderStatusAsync().catch(() => null);

    const currentPermission = await Location.getForegroundPermissionsAsync();
    const permForStatus = currentPermission.status === 'granted'
      ? currentPermission
      : await Location.requestForegroundPermissionsAsync();
    const permissionStatus = mapPermissionStatus(permForStatus.status);

    if (permForStatus.status !== 'granted') {
      if (lastLocation) {
        const staleMinutes = Math.round(
          (Date.now() - lastLocation.timestamp) / 60000
        );
        return { ...lastLocation, isStale: true, staleMinutes, permissionStatus };
      }
      throw new Error('Debes conceder ubicación para poder enviar la alerta.');
    }

    if (Platform.OS === 'android' && providerStatus?.locationServicesEnabled !== false) {
      await Location.enableNetworkProviderAsync().catch(() => null);
    }

    const freshLocationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }).catch(() => null);

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), GPS_FRESH_FIX_TIMEOUT_MS)
    );

    const result = await Promise.race([freshLocationPromise, timeoutPromise]);
```

**Explicación de las líneas 123–155:**

- **Línea 124**: Lee la última ubicación conocida desde el store Zustand (posible uso posterior como degradación).
- **Línea 125**: Consulta el estado del proveedor de ubicación (GPS activado/desactivado); ante error, `null`.
- **Líneas 127–131**: Obtiene el permiso en primer plano; si no está concedido lo solicita automáticamente. Esto implica que llamar a `getCurrentLocation()` puede disparar el diálogo nativo de permisos sin intervención previa de UI.
- **Línea 132**: Normaliza el estado al vocabulario de dominio.
- **Líneas 133–141**: Si el permiso no está concedido: con última ubicación disponible devuelve una copia marcada como obsoleta (no lanza error); sin ella lanza una excepción con mensaje orientado a usuario.
- **Líneas 143–145**: En Android, si los servicios de ubicación están habilitados (o el estado es desconocido), intenta activar el proveedor de red. `[OBSERVACIÓN TÉCNICA]`: la condición `!== false` ejecuta la llamada también cuando el estado es `undefined` (fallo de API) y la llamada a `enableNetworkProviderAsync` está obsoleta en versiones recientes de `expo-location`; además no se solicita al usuario activar el GPS si está apagado (`locationServicesEnabled === false` queda sin manejo).
- **Líneas 147–149**: Lanza la petición de posición actual con precisión balanceada; ante error resuelve `null` (nunca rechaza).
- **Líneas 151–153**: Promesa de timeout que resuelve `null` a los `GPS_FRESH_FIX_TIMEOUT_MS` (8 s).
- **Línea 155**: Carrera entre el fix fresco y el timeout; gana lo primero que resuelva.

```ts
    if (result) {
      /* Prompt Maestro: clasificar origen según precisión */
      const source: LocationSource =
        result.coords.accuracy !== null && result.coords.accuracy < 10
          ? 'GPS'
          : 'NAVEGADOR';

      const freshLocation: AlertLocation = {
        lat: result.coords.latitude,
        lon: result.coords.longitude,
        accuracy: result.coords.accuracy ?? 0,
        timestamp: result.timestamp,
        isStale: false,
        source,
        permissionStatus,
        altitude: result.coords.altitude ?? undefined,
        speed: result.coords.speed ?? undefined,
        direction: result.coords.heading ?? undefined,
      };

      useGuardStore.getState().setLastLocation(freshLocation);
      return freshLocation;
    }
```

**Explicación de las líneas 157–179:**

- **Línea 157**: Solo se entra si el fix fresco llegó antes del timeout.
- **Líneas 158–162**: Clasificación de origen según precisión: `< 10` m se considera fijación GPS real; en caso contrario `NAVEGADOR` (red/celular). Si `accuracy` fuese `null` se clasifica como `NAVEGADOR` porque la condición requiere `!== null`.
- **Líneas 164–175**: Construye el `AlertLocation` fresco con todos los campos opcionales de altitud/velocidad/rumbo.
- **Líneas 177–178**: Persiste la ubicación fresca en el store y la devuelve.

```ts
    if (shouldUseDevelopmentLocationFallback()) {
      const simulatedLocation: AlertLocation = {
        lat: DEV_FALLBACK_LOCATION.lat,
        lon: DEV_FALLBACK_LOCATION.lon,
        accuracy: DEV_FALLBACK_LOCATION.accuracy,
        timestamp: Date.now(),
        isStale: true,
        staleMinutes: 0,
        source: 'NAVEGADOR',
        permissionStatus,
      };
      console.warn(
        '[LocationService] Usando ubicación simulada de desarrollo.',
        providerStatus
      );
      useGuardStore.getState().setLastLocation(simulatedLocation);
      return simulatedLocation;
    }
```

**Explicación de las líneas 181–198:**

- **Línea 181**: Se alcanza cuando no hubo fix fresco (timeout o error). En desarrollo/emulador se devuelve la ubicación simulada de Buenos Aires.
- **Líneas 182–191**: La ubicación simulada se marca `isStale: true` con `staleMinutes: 0`, origen `NAVEGADOR` y la precisión ficticia de 5000 m; conserva el estado de permiso real.
- **Líneas 192–195**: Log de advertencia con el estado del proveedor, útil en depuración.
- **Líneas 196–197**: Persiste y retorna la simulada.
- **[RIESGO]**: Si un APK de producción se compilase con `__DEV__` o `NODE_ENV !== 'production'`, una alerta SOS podría enviar coordenadas falsas de Buenos Aires. La guarda depende de la correcta configuración del bundle de producción.

```ts
    if (lastLocation) {
      const staleMinutes = Math.round(
        (Date.now() - lastLocation.timestamp) / 60000
      );
      return { ...lastLocation, isStale: true, staleMinutes, permissionStatus };
    }

    const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
    if (lastKnown) {
      const staleMinutes = Math.round(
        (Date.now() - lastKnown.timestamp) / 60000
      );
      const fallbackLocation: AlertLocation = {
        lat: lastKnown.coords.latitude,
        lon: lastKnown.coords.longitude,
        accuracy: lastKnown.coords.accuracy ?? 0,
        timestamp: lastKnown.timestamp,
        isStale: true,
        staleMinutes,
        source: 'NAVEGADOR',
        permissionStatus,
      };
      useGuardStore.getState().setLastLocation(fallbackLocation);
      return fallbackLocation;
    }
```

**Explicación de las líneas 200–224:**

- **Líneas 200–205**: En producción, si existe una ubicación previa en el store, devuelve una copia obsoleta con sus minutos de antigüedad.
- **Línea 207**: Consulta la última posición conocida del sistema (`getLastKnownPositionAsync`), tolerando errores.
- **Líneas 208–224**: Si existe, la convierte en `AlertLocation` obsoleta con origen `NAVEGADOR` (la última conocida del sistema no garantiza precisión GPS), la persiste y la devuelve.

```ts
    const emergencyFallbackLocation = buildEmergencyFallbackLocation();
    console.warn(
      '[LocationService] Sin fix GPS. Usando ubicación de emergencia.',
      providerStatus
    );
    useGuardStore.getState().setLastLocation(emergencyFallbackLocation);
    return emergencyFallbackLocation;
  },
```

**Explicación de las líneas 226–233:**

- **Línea 226**: Sin ninguna fuente disponible, construye la ubicación de emergencia con coordenadas fijas (origen `IP`).
- **Líneas 227–230**: Advertencia en consola con el estado del proveedor.
- **Líneas 231–232**: Persiste y devuelve. `[OBSERVACIÓN TÉCNICA]`: en producción, ante un fallo total del GPS, la app puede emitir una alerta SOS con coordenadas de Buenos Aires sin que el emisor lo note claramente; solo `source: 'IP'` e `isStale: true` lo delatan.

```ts
  /* Prompt Maestro: ubicación con origen MANUAL */
  async getManualLocation(
    lat: number,
    lon: number,
    address?: string
  ): Promise<AlertLocation> {
    const location: AlertLocation = {
      lat,
      lon,
      accuracy: 0,
      timestamp: Date.now(),
      isStale: false,
      source: 'MANUAL',
      permissionStatus: 'NO_SOLICITADO',
      address,
    };
    useGuardStore.getState().setLastLocation(location);
    return location;
  },
```

**Explicación de las líneas 235–253:**

- **Líneas 236–240**: Firma que recibe coordenadas y dirección opcional (usada por la pantalla de ubicación manual).
- **Líneas 241–250**: Construye un `AlertLocation` con `source: 'MANUAL'`, precisión 0 (no aplica), `isStale: false` y `permissionStatus: 'NO_SOLICITADO'` (no requiere permiso porque el usuario la indica a mano).
- **Líneas 251–252**: Persiste en el store y devuelve.

```ts
  buildMapsLink(location: AlertLocation): string {
    return buildMapsLink(location.lat, location.lon);
  },
};
```

**Explicación de las líneas 255–257:**

- **Línea 255**: Método de conveniencia que delega en la utilidad `buildMapsLink` de `src/utils/googleMapsLink.ts`, generando `https://maps.google.com/?q=lat,lon`. Se usa desde `AlertService` para incluir el enlace en la alerta.

## Fichas de funciones y métodos

### isAndroidEmulator (líneas 28–40)

- Firma: `function isAndroidEmulator(): boolean`
- Propósito técnico: detectar ejecución en emulador Android mediante propiedades crudas de `Platform.constants`.
- Parámetros: ninguno. Retorno: `boolean`. Excepciones: ninguna.
- Dependencias: `Platform` de `react-native`.
- Flujo: si no es Android retorna `false`; concatena Brand/Manufacturer/Model/Fingerprint/Device en minúsculas y busca subcadenas típicas de emulador.
- Efectos secundarios: ninguno. Riesgo: heurística frágil ante firmas nuevas de emuladores.

### shouldUseDevelopmentLocationFallback (líneas 42–44)

- Firma: `function shouldUseDevelopmentLocationFallback(): boolean`
- Propósito: decidir si se debe usar ubicación simulada (desarrollo o emulador).
- Retorno: `boolean`. Riesgo: si un entorno de staging se ejecuta con `NODE_ENV !== 'production'`, todas las alertas usarían la ubicación simulada.

### buildEmergencyFallbackLocation (líneas 46–58)

- Firma: `function buildEmergencyFallbackLocation(lastKnownTimestamp?: number): AlertLocation`
- Propósito: fabricar una ubicación de emergencia con coordenadas fijas y origen `IP`.
- Parámetros: `lastKnownTimestamp` (opcional, marca de la última ubicación conocida). Retorno: `AlertLocation`.
- Efectos: ninguno externo. Riesgo: puede producirse una "ubicación fantasma" si se consume sin validar `source`/`isStale`.

### mapPermissionStatus (líneas 60–67)

- Firma: `function mapPermissionStatus(permStatus: Location.PermissionStatus): PermissionStatusValue`
- Propósito: traducción del estado de permiso de expo-location al dominio.
- Retorno: `PermissionStatusValue`.

### LocationService.startBackgroundUpdates (líneas 91–111)

- Firma: `async startBackgroundUpdates(): Promise<void>`
- Propósito: iniciar la monitorización de ubicación en segundo plano si el flag lo permite.
- Dependencias: `Location.requestBackgroundPermissionsAsync`, `hasStartedLocationUpdatesAsync`, `startLocationUpdatesAsync`; constante `BACKGROUND_LOCATION_TASK`.
- Efectos secundarios: solicita permiso de fondo (diálogo nativo) y crea una tarea con servicio en primer plano en Android. Riesgo: consumo de batería y exposición continua de geolocalización; por defecto deshabilitado.

### LocationService.stopBackgroundUpdates (líneas 113–121)

- Firma: `async stopBackgroundUpdates(): Promise<void>`
- Propósito: detener la tarea de fondo si está activa. Idempotente y sin riesgo.

### LocationService.getCurrentLocation (líneas 123–233)

- Firma: `async getCurrentLocation(): Promise<AlertLocation>`
- Propósito: resolver la ubicación actual con degradaciones encadenadas: fix fresco → ubicación simulada (dev) → última del store → última conocida del sistema → emergencia fija.
- Parámetros: ninguno. Retorno: `AlertLocation`. Excepción: `Error('Debes conceder ubicación...')` si no hay permiso ni última ubicación.
- Dependencias: `useGuardStore`, expo-location, constantes de configuración.
- Flujo interno: descrito en el análisis línea por línea (líneas 123–233).
- Efectos secundarios: puede abrir diálogos de permiso; persiste `lastLocation` en Zustand; escribe `console.warn`.
- Riesgos: coordenadas simuladas/emergencia en contexto real; diálogo de permisos inesperado; doble petición de permisos si la UI ya lo gestionó (ver `PermissionsService`).

### LocationService.getManualLocation (líneas 236–253)

- Firma: `async getManualLocation(lat: number, lon: number, address?: string): Promise<AlertLocation>`
- Propósito: registrar una ubicación indicada manualmente por el usuario (sin permisos).
- Efectos: persiste en el store. Riesgo: no valida rangos válidos de lat/lon.

### LocationService.buildMapsLink (líneas 255–257)

- Firma: `buildMapsLink(location: AlertLocation): string`
- Propósito: envoltorio de `buildMapsLink` utilitario. Retorno: URL de Google Maps.

## Clases / interfaces / tipos

Este archivo no declara clases ni interfaces propias; consume tipos definidos en `src/types/Alert.ts`:

| Tipo | Responsabilidad | Campos |
| --- | --- | --- |
| `AlertLocation` (externa) | Modelo canónico de ubicación | `lat`, `lon`, `accuracy`, `timestamp`, `isStale?`, `staleMinutes?`, `source?`, `permissionStatus?`, `altitude?`, `speed?`, `direction?`, `address?` |
| `LocationSource` (externa) | Origen de la coordenada | `'GPS' \| 'NAVEGADOR' \| 'IP' \| 'MANUAL'` |
| `PermissionStatusValue` (externa) | Estado de permiso | `'GRANTED' \| 'DENIED' \| 'PROMPT' \| 'NO_DISPONIBLE' \| 'NO_SOLICITADO' \| 'ERROR'` |

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 143–145): `enableNetworkProviderAsync` se invoca incluso si el estado del proveedor es `undefined` y la API está obsoleta en versiones nuevas de `expo-location`. Además, si `locationServicesEnabled === false` (GPS apagado) no se informa ni se guía al usuario a activarlo.
- `[OBSERVACIÓN TÉCNICA]` (líneas 181–198 y 226–232): existen dos caminos que pueden devolver coordenadas fijas de Buenos Aires (`DEV_FALLBACK_LOCATION`) en ejecuciones reales (dev/emulador o fallo total de GPS en producción). El consumidor debe validar `source` e `isStale` antes de enviar la alerta; en `AlertService` la ubicación se incorpora directamente al payload.
- `[OBSERVACIÓN TÉCNICA]` (línea 69): `TaskManager.defineTask` se ejecuta como efecto de importación; si algún test importa el módulo sin mockear `expo-task-manager`, el registro global puede interferir. Los tests existentes sí lo mockean.
- `[NIVEL DE CERTEZA: Confirmado por código]`: `getCurrentLocation` puede abrir el diálogo de permisos de forma autónoma (líneas 127–131), por lo que existe una doble vía de solicitud de permisos con `PermissionsService`/pantalla `app/permissions.tsx`.
- `[NIVEL DE CERTEZA: Confirmado por código]`: el flag de segundo plano está desactivado por defecto (`BACKGROUND_LOCATION_ENABLED = false`), por lo que `startBackgroundUpdates`/`stopBackgroundUpdates` y la tarea definida son inalcanzables en la configuración actual del MVP.

## Seguridad

- `[INFORMATIVO]` Datos personales: el servicio lee geolocalización precisa (lat/lon, altitud, velocidad, rumbo) del dispositivo. Es un dato personal protegido (GDPR/DAMMA). No se registra en logs el valor de las coordenadas frescas, pero los `console.warn` de líneas 192–195 y 227–230 sí vuelcan `providerStatus` a consola (sin coordenadas).
- `[INFORMATIVO]` Consentimiento: la solicitud de permisos se hace a través de los diálogos nativos del sistema (expo-location) y vía `requestForegroundPermissionsAsync`. No hay gestión de consentimiento explícito previo en este archivo (la gestión de consentimiento de ubicación se delega en `PrivacyService`/`LocationApiClient.registrarConsentimiento`).
- `[BAJO]` La ubicación de emergencia o simulada puede adjuntarse a una alerta SOS sin indicador visible para el destinatario más allá de los campos `source`/`isStale`. Riesgo de seguridad personal si un contacto de confianza recibe coordenadas incorrectas creyéndolas reales.
- `[INFORMATIVO]` La ubicación en segundo plano (cuando se habilite) expone de forma continua la geolocalización del usuario; la notificación del servicio en primer plano informa de ello (`'Monitoreando tu ubicación en segundo plano'`).
- No se imprimen secretos ni tokens en este archivo. No hay autenticación/validación de entrada: `getManualLocation` no valida rangos de lat/lon.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Alertas con coordenadas falsas: recomendar validar en el consumidor (`AlertService`) que `location.source !== 'IP'` (o un flag explícito `isFallback`) antes de enviar el SOS, o marcar el mensaje como "ubicación aproximada/no disponible".
- `[RIESGO]` Doble solicitud de permisos: coordinar la llamada a `getCurrentLocation()` con la pantalla de permisos para evitar diálogos duplicados o solicitudes en momentos no esperados (p. ej., durante el conteo regresivo de la alerta).
- `[RECOMENDACIÓN]` Manejar explícitamente `locationServicesEnabled === false` (GPS apagado) guiando al usuario a la configuración del sistema.
- `[RECOMENDACIÓN]` Revisar la vigencia de `enableNetworkProviderAsync` en el SDK de `expo-location` usado (Expo SDK 55) y sustituirla por la API actual si está obsoleta.
- `[RECOMENDACIÓN]` Considerar un registro de auditoría local (sin datos sensibles) del origen de la ubicación usada en cada alerta para trazabilidad de calidad.
