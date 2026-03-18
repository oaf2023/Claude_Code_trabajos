import { Platform } from 'react-native';
import {
  check,
  request,
  PERMISSIONS,
  RESULTS,
  openSettings,
} from 'react-native-permissions';

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

export const PermissionsService = {
  async checkAll(): Promise<PermissionsStatus> {
    const [mic, locFg, locBg] = await Promise.all([
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
      check(
        Platform.OS === 'ios'
          ? PERMISSIONS.IOS.LOCATION_ALWAYS
          : PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION
      ),
    ]);

    return {
      microphone: mapResult(mic),
      locationForeground: mapResult(locFg),
      locationBackground: mapResult(locBg),
      notifications: 'granted', // simplified; use expo-notifications for real check
    };
  },

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
    const result = await request(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_ALWAYS
        : PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION
    );
    return mapResult(result);
  },

  openAppSettings(): void {
    openSettings();
  },

  areAllCriticalGranted(status: PermissionsStatus): boolean {
    return (
      status.microphone === 'granted' &&
      status.locationForeground === 'granted'
    );
  },
};
