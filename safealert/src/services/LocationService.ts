/* ============================================================================
* Archivo         : LocationService.ts
* Descripción     : Obtención de ubicación puntual y actualización local opcional.
* Autor           : oafon
* Fecha           : 2026-03-27
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : LocationService.getCurrentLocation()
* ============================================================================ */

import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';
import { AlertLocation } from '../types/Alert';
import { buildMapsLink } from '../utils/googleMapsLink';
import { useGuardStore } from '../stores/useGuardStore';
import {
  DEV_FALLBACK_LOCATION,
  GPS_FRESH_FIX_TIMEOUT_MS,
  LOCATION_UPDATE_INTERVAL_MS,
} from '../config/constants';
import { BACKGROUND_LOCATION_ENABLED } from '../config/features';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

/* ============================================================================
* Función         : isAndroidEmulator
* Descripción     : Detecta heurísticamente si la app corre en un emulador Android.
* Fecha           : 2026-03-27
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : LocationService.getCurrentLocation
* Ingesta         : Sin argumentos
* Devolución      : boolean
* Uso             : if (isAndroidEmulator()) { ... }
* ============================================================================ */
function isAndroidEmulator(): boolean {
  if (Platform.OS !== 'android') {
    return false;
  }

  const constants = Platform.constants as {
    Brand?: string;
    Fingerprint?: string;
    Manufacturer?: string;
    Model?: string;
    Product?: string;
  };

  const emulatorFingerprint = [
    constants.Brand,
    constants.Fingerprint,
    constants.Manufacturer,
    constants.Model,
    constants.Product,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return [
    'generic',
    'emulator',
    'sdk_gphone',
    'ranchu',
    'vbox',
  ].some((token) => emulatorFingerprint.includes(token));
}

// Register background task for location updates
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
    };
    useGuardStore.getState().setLastLocation(alertLocation);
  }
});

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
        distanceInterval: 100, // also update if moved 100m
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'SafeAlert activo',
          notificationBody: 'Monitoreando tu ubicación en segundo plano',
          notificationColor: '#DC2626',
        },
      });
    }
  },

  async stopBackgroundUpdates(): Promise<void> {
    if (!BACKGROUND_LOCATION_ENABLED) return;

    const isRegistered = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    ).catch(() => false);

    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  },

  async getCurrentLocation(): Promise<AlertLocation> {
    const lastLocation = useGuardStore.getState().lastLocation;
    const providerStatus = await Location.getProviderStatusAsync().catch(() => null);

    const currentPermission = await Location.getForegroundPermissionsAsync();
    const permissionStatus =
      currentPermission.status === 'granted'
        ? currentPermission
        : await Location.requestForegroundPermissionsAsync();

    if (permissionStatus.status !== 'granted') {
      if (lastLocation) {
        const staleMinutes = Math.round(
          (Date.now() - lastLocation.timestamp) / 60000
        );
        return { ...lastLocation, isStale: true, staleMinutes };
      }

      throw new Error('Debes conceder ubicación para poder enviar la alerta.');
    }

    // Try to get a fresh fix with timeout
    const freshLocationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }).catch(() => null);

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), GPS_FRESH_FIX_TIMEOUT_MS)
    );

    const result = await Promise.race([freshLocationPromise, timeoutPromise]);

    if (result) {
      const freshLocation: AlertLocation = {
        lat: result.coords.latitude,
        lon: result.coords.longitude,
        accuracy: result.coords.accuracy ?? 0,
        timestamp: result.timestamp,
        isStale: false,
      };

      useGuardStore.getState().setLastLocation(freshLocation);
      return freshLocation;
    }

    if (__DEV__ || isAndroidEmulator()) {
      const simulatedLocation: AlertLocation = {
        lat: DEV_FALLBACK_LOCATION.lat,
        lon: DEV_FALLBACK_LOCATION.lon,
        accuracy: DEV_FALLBACK_LOCATION.accuracy,
        timestamp: Date.now(),
        isStale: true,
        staleMinutes: 0,
      };

      console.warn(
        '[LocationService] Usando ubicación simulada por falta de fix GPS.',
        providerStatus
      );
      useGuardStore.getState().setLastLocation(simulatedLocation);
      return simulatedLocation;
    }

    // Fall back to last known location
    if (lastLocation) {
      const staleMinutes = Math.round(
        (Date.now() - lastLocation.timestamp) / 60000
      );
      return { ...lastLocation, isStale: true, staleMinutes };
    }

    // Last resort: expo last known position
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
      };

      useGuardStore.getState().setLastLocation(fallbackLocation);
      return fallbackLocation;
    }

    throw new Error(
      providerStatus?.locationServicesEnabled === false
        ? 'El GPS del dispositivo está desactivado. Actívalo y vuelve a intentarlo.'
        : 'No se pudo obtener la ubicación. Activa GPS o vuelve a intentarlo en unos segundos.'
    );
  },

  buildMapsLink(location: AlertLocation): string {
    return buildMapsLink(location.lat, location.lon);
  },
};
