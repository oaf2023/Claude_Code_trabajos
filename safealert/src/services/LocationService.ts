/* ============================================================================
* Archivo         : LocationService.ts
* Descripción     : Obtención de ubicación puntual y actualización local opcional.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
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
* Descripción     : Detecta heurísticamente si la app corre sobre un emulador Android para habilitar fallback GPS estable.
* Fecha           : 2026-03-28
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
    Manufacturer?: string;
    Model?: string;
    Fingerprint?: string;
    Device?: string;
  };

  const emulatorHints = [
    constants.Brand,
    constants.Manufacturer,
    constants.Model,
    constants.Fingerprint,
    constants.Device,
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
    'goldfish',
  ].some((hint) => emulatorHints.includes(hint));
}

/* ============================================================================
* Función         : shouldUseDevelopmentLocationFallback
* Descripción     : Habilita fallback seguro de ubicación en builds de desarrollo y emuladores para no bloquear el flujo SOS.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : LocationService.getCurrentLocation
* Ingesta         : Sin argumentos
* Devolución      : boolean
* Uso             : if (shouldUseDevelopmentLocationFallback()) { ... }
* ============================================================================ */
function shouldUseDevelopmentLocationFallback(): boolean {
  return __DEV__ || process.env.NODE_ENV !== 'production' || isAndroidEmulator();
}

/* ============================================================================
* Función         : buildEmergencyFallbackLocation
* Descripción     : Genera una ubicación de emergencia marcada como no confiable para no bloquear el envío del SOS.
* Fecha           : 2026-03-28
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : LocationService.getCurrentLocation
* Ingesta         : lastKnownTimestamp?: number
* Devolución      : AlertLocation
* Uso             : const fallback = buildEmergencyFallbackLocation()
* ============================================================================ */
function buildEmergencyFallbackLocation(lastKnownTimestamp?: number): AlertLocation {
  const timestamp = lastKnownTimestamp ?? Date.now();
  return {
    lat: DEV_FALLBACK_LOCATION.lat,
    lon: DEV_FALLBACK_LOCATION.lon,
    accuracy: DEV_FALLBACK_LOCATION.accuracy,
    timestamp,
    isStale: true,
    staleMinutes: Math.max(0, Math.round((Date.now() - timestamp) / 60000)),
  };
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

    if (Platform.OS === 'android' && providerStatus?.locationServicesEnabled !== false) {
      await Location.enableNetworkProviderAsync().catch(() => null);
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

    if (shouldUseDevelopmentLocationFallback()) {
      const simulatedLocation: AlertLocation = {
        lat: DEV_FALLBACK_LOCATION.lat,
        lon: DEV_FALLBACK_LOCATION.lon,
        accuracy: DEV_FALLBACK_LOCATION.accuracy,
        timestamp: Date.now(),
        isStale: true,
        staleMinutes: 0,
      };

      console.warn(
        '[LocationService] Usando ubicación simulada de desarrollo por falta de fix GPS.',
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

    const emergencyFallbackLocation = buildEmergencyFallbackLocation();
    console.warn(
      '[LocationService] Sin fix GPS ni última ubicación utilizable. Se envía ubicación de emergencia para no bloquear la alerta.',
      providerStatus
    );
    useGuardStore.getState().setLastLocation(emergencyFallbackLocation);
    return emergencyFallbackLocation;
  },

  buildMapsLink(location: AlertLocation): string {
    return buildMapsLink(location.lat, location.lon);
  },
};
