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

import * as Location from 'expo-location';
import { BACKGROUND_LOCATION_ENABLED } from '../../config/features';

// Force el flag de background a false para tests deterministas
jest.mock('../../config/features', () => {
  const actual = jest.requireActual('../../config/features');
  return { ...actual, BACKGROUND_LOCATION_ENABLED: false };
});

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
