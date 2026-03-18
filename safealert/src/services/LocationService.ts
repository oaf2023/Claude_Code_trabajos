import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AlertLocation } from '../types/Alert';
import { buildMapsLink } from '../utils/googleMapsLink';
import { useGuardStore } from '../stores/useGuardStore';
import { GPS_FRESH_FIX_TIMEOUT_MS, LOCATION_UPDATE_INTERVAL_MS } from '../config/constants';

const BACKGROUND_LOCATION_TASK = 'background-location-task';

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
    const isRegistered = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK
    ).catch(() => false);

    if (isRegistered) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  },

  async getCurrentLocation(): Promise<AlertLocation> {
    const lastLocation = useGuardStore.getState().lastLocation;

    // Try to get a fresh fix with timeout
    const freshLocationPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), GPS_FRESH_FIX_TIMEOUT_MS)
    );

    const result = await Promise.race([freshLocationPromise, timeoutPromise]);

    if (result) {
      return {
        lat: result.coords.latitude,
        lon: result.coords.longitude,
        accuracy: result.coords.accuracy ?? 0,
        timestamp: result.timestamp,
        isStale: false,
      };
    }

    // Fall back to last known location
    if (lastLocation) {
      const staleMinutes = Math.round(
        (Date.now() - lastLocation.timestamp) / 60000
      );
      return { ...lastLocation, isStale: true, staleMinutes };
    }

    // Last resort: expo last known position
    const lastKnown = await Location.getLastKnownPositionAsync();
    if (lastKnown) {
      const staleMinutes = Math.round(
        (Date.now() - lastKnown.timestamp) / 60000
      );
      return {
        lat: lastKnown.coords.latitude,
        lon: lastKnown.coords.longitude,
        accuracy: lastKnown.coords.accuracy ?? 0,
        timestamp: lastKnown.timestamp,
        isStale: true,
        staleMinutes,
      };
    }

    throw new Error('No se pudo obtener la ubicación');
  },

  buildMapsLink(location: AlertLocation): string {
    return buildMapsLink(location.lat, location.lon);
  },
};
