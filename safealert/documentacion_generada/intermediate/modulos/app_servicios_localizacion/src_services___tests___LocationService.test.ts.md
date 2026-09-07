# Archivo: src/services/__tests__/LocationService.test.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/__tests__/LocationService.test.ts | 273 | TypeScript 5.9 / Jest | 9601 | Tests unitarios de LocationService | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Suite de pruebas unitarias (Jest) del servicio `LocationService`. Verifica los escenarios principales de obtención de ubicación: fix GPS fresco con permiso, clasificación `NAVEGADOR` por baja precisión, permiso denegado (con y sin última ubicación), fallback de desarrollo, caída a última posición conocida en producción, ubicación de emergencia sin fuentes, ubicación manual y el generador de enlaces de Google Maps. También cubre el comportamiento no-op de las actualizaciones en segundo plano cuando el flag está desactivado. Aísla el módulo con mocks de `expo-location`, `expo-task-manager` y `config/features`, y resetea el store Zustand en cada test.

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — Suite ejecutable con `npx jest src/services/__tests__/LocationService.test.ts` (según su cabecera). Referenciada junto con otras suites del proyecto (`AlertService.test.ts` mockea a `LocationService` de forma similar). No se ejecutó en esta auditoría (prohibido ejecutar scripts), por lo que no se verifica su estado de paso actual.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `LocationService` de `../LocationService` | interna | Objeto bajo prueba | Sí |
| `useGuardStore` de `../../stores/useGuardStore` | interna | Reset/inspección del estado de última ubicación | Sí |
| `jest.mock('expo-location', ...)` | externa (mock) | Mock completo de la API de ubicación | Sí |
| `jest.mock('expo-task-manager', ...)` | externa (mock) | Mock de `defineTask` (efecto de importación) | Sí |
| `* as Location` de `expo-location` (post-mock) | externa (mock) | Ajuste de mocks en `beforeEach` | Sí |
| `BACKGROUND_LOCATION_ENABLED` de `../../config/features` | interna | Forzado a `false` en el mock del módulo | Sí |
| `jest.mock('../../config/features', ...)` | interna (mock) | Fuerza el flag de background a `false` | Sí |

## Componentes que dependen de este archivo

- Es un archivo de prueba: lo "consume" Jest (configuración del proyecto). No es importado por código de producción.
- Se relaciona con `src/services/__tests__/AlertService.test.ts`, que mockea `LocationService` (patrón similar de mock de `expo-location` no requerido allí porque el servicio se mockea entero).

## Variables globales y constantes

No hay constantes de módulo propias del test. Constantes usadas en expectativas: coordenadas de prueba `-34.6037` / `-58.3816` (Buenos Aires, coinciden con `DEV_FALLBACK_LOCATION`), precisión `5` m (clasifica GPS) y `50` m (clasifica NAVEGADOR), `timestamp` `1700000000000`, dirección de prueba `'Av. Corrientes 1234'`.

## Estructura (funciones / clases / tipos)

Bloques de test:

- `jest.mock` de dependencias (18–49)
- `describe('LocationService')` (51)
  - `beforeEach` (52–80)
  - `describe('getCurrentLocation')` (82) con 7 `it`
  - `describe('getManualLocation')` (231) con 1 `it`
  - `describe('buildMapsLink')` (246) con 1 `it`
  - `describe('background updates')` (263) con 1 `it`

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : LocationService.test.ts
* Descripción     : Tests unitarios de LocationService: obtención de ubicación
*                   con permiso, fallback de desarrollo, timeout de fix fresco,
*                   última posición conocida y ubicación manual.
* Autor           : oafon
* Fecha           : 2026-08-22
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9 / Jest
* Uso             : npx jest src/services/__tests__/LocationService.test.ts
* ============================================================================ */

import { LocationService } from '../LocationService';
import { useGuardStore } from '../../stores/useGuardStore';

// ─── Mocks de expo-location y expo-task-manager ──────────────────────────

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3, High: 5 },
  getProviderStatusAsync: jest.fn().mockResolvedValue({ locationServicesEnabled: true }),
  getForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted', granted: true }),
  requestForegroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted', granted: true }),
  requestBackgroundPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted', granted: true }),
  getCurrentPositionAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  enableNetworkProviderAsync: jest.fn().mockResolvedValue(undefined),
  hasStartedLocationUpdatesAsync: jest.fn().mockResolvedValue(false),
  startLocationUpdatesAsync: jest.fn().mockResolvedValue(undefined),
  stopLocationUpdatesAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-task-manager', () => ({
  defineTask: jest.fn(),
}));
```

**Explicación de las líneas 1–40:**

- **Líneas 1–11**: Cabecera estándar del proyecto (Jest + TypeScript 5.9).
- **Línea 13**: Importa el servicio bajo prueba.
- **Línea 14**: Importa el store real de Zustand (no mockeado) para resetear estado e inspeccionar `lastLocation`.
- **Líneas 18–36**: `jest.mock('expo-location')`: reemplaza el módulo nativo por funciones `jest.fn()`. Se define un `Accuracy` parcial (`Balanced: 3`, `High: 5`) y valores por defecto: permisos concedidos, proveedor habilitado, tareas de fondo no iniciadas y llamadas resueltas. `getCurrentPositionAsync` y `getLastKnownPositionAsync` se dejan como `jest.fn()` sin implementación (se configuran por test).
- **Líneas 38–40**: `jest.mock('expo-task-manager')`: `defineTask` pasa a ser un no-op, evitando el registro global real de la tarea al importar `LocationService`.
- **[NOTA]**: los mocks por defecto simulan un escenario "todo concedido"; cada test particular sobrescribe lo necesario.

```ts
import * as Location from 'expo-location';
import { BACKGROUND_LOCATION_ENABLED } from '../../config/features';

// Force el flag de background a false para tests deterministas
jest.mock('../../config/features', () => {
  const actual = jest.requireActual('../../config/features');
  return { ...actual, BACKGROUND_LOCATION_ENABLED: false };
});
```

**Explicación de las líneas 42–49:**

- **Línea 42**: Importa el módulo mockeado para ajustar los mocks con `(Location.getX as jest.Mock)`.
- **Línea 43**: Importa el flag (se usa implícitamente vía `LocationService`; la importación directa sirve de verificación del mock).
- **Líneas 46–49**: `jest.mock('../../config/features')`: copia el módulo real con `jest.requireActual` y fuerza `BACKGROUND_LOCATION_ENABLED: false`, garantizando determinismo en los tests de actualizaciones de fondo. `[OBSERVACIÓN TÉCNICA]`: si en el futuro el flag real fuera `true` por entorno, los tests seguirían forzándolo a `false`; los métodos de fondo solo se prueban en su rama "deshabilitado".

```ts
describe('LocationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useGuardStore.getState().resetAlertState();
    useGuardStore.setState({ lastLocation: null, isArmed: false });
    // Restaurar los valores por defecto del factory (clearAllMocks no lo hace)
    (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      granted: true,
    });
    (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      granted: true,
    });
    (Location.getProviderStatusAsync as jest.Mock).mockResolvedValue({
      locationServicesEnabled: true,
    });
    (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
      coords: {
        latitude: -34.6037,
        longitude: -58.3816,
        accuracy: 5,
        altitude: 25,
        speed: 0,
        heading: 90,
      },
      timestamp: 1700000000000,
    });
    (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue(null);
  });
```

**Explicación de las líneas 51–80:**

- **Línea 51**: Describe el grupo principal.
- **Línea 53**: `jest.clearAllMocks()` limpia llamadas y configuraciones de los mocks.
- **Líneas 54–55**: Resetea el estado del guard store: `resetAlertState()` (fase de alerta) y `setState` para limpiar `lastLocation` y `isArmed` entre tests.
- **Líneas 56–79**: Restaura los valores por defecto de los mocks (el comentario de la línea 56 lo explica: `clearAllMocks` no restaura las implementaciones por defecto del factory). Fija: permisos concedidos, proveedor habilitado, posición actual válida (Buenos Aires, precisión 5 m → GPS) y última posición conocida `null`.
- **[NOTA]**: El `beforeEach` configura un "caso feliz" completo; los tests que necesiten otros escenarios sobrescriben solo el mock relevante.

```ts
  describe('getCurrentLocation', () => {
    it('should return a fresh GPS fix when permission granted', async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: -34.6037,
          longitude: -58.3816,
          accuracy: 5,
          altitude: 25,
          speed: 0,
          heading: 90,
        },
        timestamp: 1700000000000,
      });

      const loc = await LocationService.getCurrentLocation();

      expect(loc.lat).toBe(-34.6037);
      expect(loc.lon).toBe(-58.3816);
      expect(loc.source).toBe('GPS'); // accuracy < 10 → GPS
      expect(loc.isStale).toBe(false);
      expect(loc.permissionStatus).toBe('GRANTED');
      expect(useGuardStore.getState().lastLocation?.lat).toBe(-34.6037);
    });
```

**Explicación de las líneas 82–104:**

- **Líneas 83–94**: Test del caso feliz: configura un fix fresco con precisión 5 m.
- **Línea 96**: Ejecuta `getCurrentLocation()`.
- **Líneas 98–103**: Verifica lat/lon, clasificación `GPS` (precisión `< 10`), frescura (`isStale: false`), estado de permiso `GRANTED` y que la ubicación quedó persistida en el store.
- **Línea 100**: Comentario que documenta la regla de clasificación (`accuracy < 10 → GPS`).

```ts
    it('should classify as NAVEGADOR when accuracy is low', async () => {
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue({
        coords: {
          latitude: -34.6037,
          longitude: -58.3816,
          accuracy: 50,
          altitude: null,
          speed: null,
          heading: null,
        },
        timestamp: 1700000000000,
      });

      const loc = await LocationService.getCurrentLocation();

      expect(loc.source).toBe('NAVEGADOR');
    });
```

**Explicación de las líneas 106–122:**

- **Líneas 107–117**: Configura una posición con precisión 50 m y campos opcionales `null`.
- **Líneas 119–121**: Verifica que con precisión `>= 10` la clasificación es `NAVEGADOR`.
- **[NOTA]**: cubre también que `altitude/speed/heading` nulos se normalizan con `?? undefined` sin romper (assert implícito al no lanzar).

```ts
    it('should throw when permission denied and no last location', async () => {
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        granted: false,
      });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        granted: false,
      });

      await expect(LocationService.getCurrentLocation()).rejects.toThrow(
        'Debes conceder ubicación'
      );
    });
```

**Explicación de las líneas 124–137:**

- **Líneas 125–132**: Simula permiso denegado (consulta y solicitud devuelven `denied`); el `beforeEach` dejó `lastLocation` en `null`.
- **Líneas 134–136**: Verifica que la promesa rechaza con el mensaje `'Debes conceder ubicación...'` (matcher parcial `toThrow` con subcadena).

```ts
    it('should return stale last location when permission denied', async () => {
      useGuardStore.setState({
        lastLocation: {
          lat: -34.6037,
          lon: -58.3816,
          accuracy: 10,
          timestamp: Date.now() - 5 * 60 * 1000,
          isStale: false,
          source: 'GPS',
          permissionStatus: 'GRANTED',
        },
      });
      (Location.getForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        granted: false,
      });
      (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
        granted: false,
      });

      const loc = await LocationService.getCurrentLocation();

      expect(loc.isStale).toBe(true);
      expect(loc.staleMinutes).toBe(5);
      expect(loc.permissionStatus).toBe('DENIED');
    });
```

**Explicación de las líneas 139–165:**

- **Líneas 140–150**: Precarga una última ubicación en el store con `timestamp` de hace 5 minutos.
- **Líneas 151–158**: Permiso denegado.
- **Líneas 160–164**: Verifica la degradación: devuelve la última ubicación marcada `isStale: true`, `staleMinutes: 5` y `permissionStatus: 'DENIED'` (sin lanzar error).

```ts
    it('should use dev fallback on GPS timeout in development', async () => {
      // Simula el timeout de fix fresco: la promesa de posición resuelve null
      (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(null);
      (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue(null);
      jest.useFakeTimers();
      try {
        const loc = await LocationService.getCurrentLocation();

        expect(loc.isStale).toBe(true);
        expect(loc.source).toBe('NAVEGADOR');
        expect(loc.lat).toBe(-34.6037); // DEV_FALLBACK_LOCATION
      } finally {
        jest.useRealTimers();
      }
    });
```

**Explicación de las líneas 167–181:**

- **Líneas 169–170**: El fix fresco y la última posición resuelven `null` (simula timeout/ausencia de datos).
- **Línea 171**: Activa timers falsos para no esperar el timeout real de `GPS_FRESH_FIX_TIMEOUT_MS`; la promesa de la posición ya resolvió `null`, por lo que `Promise.race` no depende del temporizador en este caso.
- **Líneas 172–180**: En entorno por defecto (`__DEV__` activo en Jest), espera el fallback de desarrollo: `isStale: true`, `source: 'NAVEGADOR` y coordenadas de `DEV_FALLBACK_LOCATION` (`-34.6037`). El bloque `finally` restaura timers reales aunque falle.
- **[NOTA]**: Este test verifica la rama "dev fallback" y depende de que Jest ejecute con `__DEV__ === true`.

```ts
    it('should fall back to last known position when no fresh fix', async () => {
      // Simular entorno de producción (sin dev fallback)
      const origDev = (global as any).__DEV__;
      const origEnv = process.env.NODE_ENV;
      (global as any).__DEV__ = false;
      process.env.NODE_ENV = 'production';
      jest.useFakeTimers();
      try {
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(null);
        (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue({
          coords: { latitude: -31.42, longitude: -64.18, accuracy: 20 },
          timestamp: Date.now() - 30 * 60 * 1000,
        });

        const loc = await LocationService.getCurrentLocation();

        expect(loc.lat).toBe(-31.42);
        expect(loc.isStale).toBe(true);
        expect(loc.staleMinutes).toBe(30);
      } finally {
        jest.useRealTimers();
        (global as any).__DEV__ = origDev;
        process.env.NODE_ENV = origEnv;
      }
    });
```

**Explicación de las líneas 183–207:**

- **Líneas 185–188**: Guarda los valores originales de `__DEV__` y `NODE_ENV` y los fuerza a entorno de producción (evita el fallback de desarrollo).
- **Líneas 191–195**: Sin fix fresco; última posición conocida disponible (Córdoba: `-31.42`, `-64.18`, precisión 20 m, hace 30 min).
- **Líneas 197–201**: Verifica la caída a última posición conocida con `isStale: true` y `staleMinutes: 30`.
- **Líneas 202–206**: Restaura timers, `__DEV__` y `NODE_ENV` en `finally` (higiene del entorno global).

```ts
    it('should return emergency fallback when nothing available', async () => {
      const origDev = (global as any).__DEV__;
      const origEnv = process.env.NODE_ENV;
      (global as any).__DEV__ = false;
      process.env.NODE_ENV = 'production';
      jest.useFakeTimers();
      try {
        (Location.getCurrentPositionAsync as jest.Mock).mockResolvedValue(null);
        (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue(null);

        const loc = await LocationService.getCurrentLocation();

        expect(loc.isStale).toBe(true);
        expect(loc.source).toBe('IP');
      } finally {
        jest.useRealTimers();
        (global as any).__DEV__ = origDev;
        process.env.NODE_ENV = origEnv;
      }
    });
  });
```

**Explicación de las líneas 209–229:**

- **Líneas 210–214**: Entorno de producción.
- **Líneas 216–217**: Ninguna fuente de posición disponible.
- **Líneas 219–222**: Verifica la ubicación de emergencia: `isStale: true` y `source: 'IP'` (coordenadas fijas de `DEV_FALLBACK_LOCATION`).
- **Líneas 223–228**: Restaura el entorno global.
- **[NOTA]**: El test confirma que en producción el peor caso devuelve coordenadas fijas de Buenos Aires marcadas como IP/obsoleta (ver riesgos en el análisis de `LocationService`).

```ts
  describe('getManualLocation', () => {
    it('should store location with MANUAL source', async () => {
      const loc = await LocationService.getManualLocation(
        -34.6037,
        -58.3816,
        'Av. Corrientes 1234'
      );

      expect(loc.source).toBe('MANUAL');
      expect(loc.permissionStatus).toBe('NO_SOLICITADO');
      expect(loc.address).toBe('Av. Corrientes 1234');
      expect(useGuardStore.getState().lastLocation?.source).toBe('MANUAL');
    });
  });
```

**Explicación de las líneas 231–244:**

- **Líneas 232–237**: Llama a `getManualLocation` con coordenadas y dirección.
- **Líneas 239–242**: Verifica `source: 'MANUAL'`, `permissionStatus: 'NO_SOLICITADO'`, la dirección conservada y la persistencia en el store.

```ts
  describe('buildMapsLink', () => {
    it('should build a google maps link', () => {
      const link = LocationService.buildMapsLink({
        lat: -34.6037,
        lon: -58.3816,
        accuracy: 10,
        timestamp: Date.now(),
        source: 'GPS',
        permissionStatus: 'GRANTED',
      });

      expect(link).toContain('maps.google.com');
      expect(link).toContain('-34.6037');
      expect(link).toContain('-58.3816');
    });
  });

  describe('background updates', () => {
    it('should no-op when background location disabled', async () => {
      // BACKGROUND_LOCATION_ENABLED es false (mockeado arriba)
      await LocationService.startBackgroundUpdates();
      await LocationService.stopBackgroundUpdates();

      expect(Location.startLocationUpdatesAsync).not.toHaveBeenCalled();
      expect(Location.stopLocationUpdatesAsync).not.toHaveBeenCalled();
    });
  });
});
```

**Explicación de las líneas 246–273:**

- **Líneas 246–261**: Verifica que `buildMapsLink` genera una URL de `maps.google.com` con las coordenadas interpoladas.
- **Líneas 263–272**: Con `BACKGROUND_LOCATION_ENABLED` forzado a `false`, `startBackgroundUpdates` y `stopBackgroundUpdates` no deben invocar las APIs de tareas de expo-location (no-op).
- **[NOTA]**: este es el único test de la rama de segundo plano y solo cubre el caso "flag desactivado"; no hay tests de las ramas con flag activado (permiso concedido/denegado, tarea ya iniciada, parada).

## Fichas de funciones y métodos

No hay funciones de producción; el archivo declara suites y casos de test. Resumen de casos:

| Bloque de test | Líneas | Escenario cubierto |
| --- | --- | --- |
| `jest.mock` de dependencias | 18–49 | Aislamiento de módulos nativos y flag |
| `beforeEach` | 52–80 | Reset de mocks y store; caso feliz por defecto |
| fix GPS fresco | 83–104 | Permiso concedido, precisión 5 → GPS, persistencia |
| NAVEGADOR por precisión | 106–122 | Precisión 50 → NAVEGADOR; opcionales nulos |
| permiso denegado sin última | 124–137 | Rechazo con mensaje |
| permiso denegado con última | 139–165 | Degradación stale con `staleMinutes` |
| fallback de desarrollo | 167–181 | Dev fallback (coordenadas DEV_FALLBACK_LOCATION) |
| última posición conocida | 183–207 | Entorno producción, sin fix, con última conocida |
| emergencia | 209–228 | Entorno producción, sin fuentes → source IP |
| manual | 231–244 | MANUAL / NO_SOLICITADO / address / store |
| maps link | 246–261 | URL Google Maps con coordenadas |
| background no-op | 263–272 | Flag desactivado → sin llamadas a tareas |

## Clases / interfaces / tipos

No se declaran tipos en el archivo; usa los tipos de `AlertLocation`/`LocationService` indirectamente mediante objetos literales compatibles en expectativas.

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 46–49): el mock de `config/features` fuerza `BACKGROUND_LOCATION_ENABLED: false` de forma global para la suite; la rama con flag activado de `LocationService` queda sin cobertura de test.
- `[OBSERVACIÓN TÉCNICA]` (líneas 185–188, 210–213): los tests mutan `global.__DEV__` y `process.env.NODE_ENV`; la restauración en `finally` es correcta, pero si un test intermedio lanzara fuera del patrón, el entorno quedaría contaminado para el resto de la suite.
- `[OBSERVACIÓN TÉCNICA]` (líneas 124–137): el caso de permiso denegado depende de que el `beforeEach` haya dejado `lastLocation: null`; la cobertura de la rama "permiso denegado con última ubicación" existe (139–165), pero no se prueba la variante con `requestForegroundPermissionsAsync` que devuelve `granted` mientras `getForegroundPermissionsAsync` devuelve `denied` (solicitud exitosa tras denegación previa).
- `[NOTA]` La suite no verifica el cálculo exacto del timeout real (`GPS_FRESH_FIX_TIMEOUT_MS`) porque los mocks resuelven antes; el temporizador de 8 s no se ejercita de verdad (se usan fake timers para evitar esperas).
- `[NOTA]` `TaskManager.defineTask` se mockea como `jest.fn()` sin verificar su registro con el nombre correcto de tarea.
- `[NIVEL DE CERTEZA: Confirmado por código]` Los mocks usan `jest.requireActual` solo para `config/features`; los módulos nativos se sustituyen por completo, por lo que los tests no dependen de runtime nativo (ejecutables en Node/Jest).

## Seguridad

- `[INFORMATIVO]` Los tests usan coordenadas de ejemplo de dominio público (Buenos Aires y Córdoba) y una dirección ficticia; no contienen datos personales reales ni secretos.
- `[INFORMATIVO]` No hay credenciales ni tokens en el archivo. Los mocks no replican flujos de red reales.
- `[INFORMATIVO]` No se prueban aquí aspectos de seguridad (p. ej., manipulación de la ubicación devuelta por el sistema o inyección de coordenadas); la suite es funcional.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Cobertura parcial de las ramas de segundo plano y de timeout real; recomendar añadir casos con `BACKGROUND_LOCATION_ENABLED: true` (permiso concedido/denegado, tarea ya iniciada) y un test que verifique el rechazo por timeout usando timers falsos con avance controlado.
- `[RECOMENDACIÓN]` Extraer la manipulación de `__DEV__`/`NODE_ENV` a helpers (p. ej. `withProductionEnv(fn)`) para reducir riesgo de contaminación global.
- `[RECOMENDACIÓN]` Verificar en un caso de test que `TaskManager.defineTask` se registra con el identificador `'background-location-task'` cuando el flag esté activo.
- `[RECOMENDACIÓN]` Añadir un caso para la rama de `enableNetworkProviderAsync` en Android y para `locationServicesEnabled: false`.
