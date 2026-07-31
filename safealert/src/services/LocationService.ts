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

function mapPermissionStatus(permStatus: Location.PermissionStatus): PermissionStatusValue {
  switch (permStatus) {
    case 'granted': return 'GRANTED';
    case 'denied': return 'DENIED';
    case 'undetermined': return 'PROMPT';
    default: return 'NO_DISPONIBLE';
  }
}

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

    const emergencyFallbackLocation = buildEmergencyFallbackLocation();
    console.warn(
      '[LocationService] Sin fix GPS. Usando ubicación de emergencia.',
      providerStatus
    );
    useGuardStore.getState().setLastLocation(emergencyFallbackLocation);
    return emergencyFallbackLocation;
  },

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

  buildMapsLink(location: AlertLocation): string {
    return buildMapsLink(location.lat, location.lon);
  },
};
