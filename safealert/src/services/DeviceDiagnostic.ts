/* ============================================================================
* Archivo         : DeviceDiagnostic.ts
* Descripción     : Diagnóstico continuo de disponibilidad del sistema.
*                   Evalúa batería, red, permisos, micrófono y servicio
*                   para determinar si la protección está activa, limitada
*                   o detenida. No interfiere con el flujo de alerta.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : DeviceDiagnostic.run()
* ============================================================================ */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { check, PERMISSIONS, RESULTS } from 'react-native-permissions';

export type ProtectionLevel = 'active' | 'limited' | 'stopped';

export interface DiagnosticResult {
  level: ProtectionLevel;
  checks: {
    network: boolean;
    location: boolean;
    notifications: boolean;
    microphone: boolean;
    battery: boolean;
  };
  messages: string[];
}

async function hasNetwork(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://clients3.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}

async function hasLocationPermission(): Promise<boolean> {
  try {
    const result = await check(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
    );
    return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
  } catch {
    return false;
  }
}

async function hasNotificationPermission(): Promise<boolean> {
  try {
    const response = await Notifications.getPermissionsAsync();
    return (response as any).granted;
  } catch {
    return false;
  }
}

async function hasMicrophonePermission(): Promise<boolean> {
  try {
    const result = await check(
      Platform.OS === 'ios'
        ? PERMISSIONS.IOS.MICROPHONE
        : PERMISSIONS.ANDROID.RECORD_AUDIO
    );
    return result === RESULTS.GRANTED || result === RESULTS.LIMITED;
  } catch {
    return false;
  }
}

async function hasLowBattery(): Promise<boolean> {
  try {
    const Battery = await import('expo-battery');
    const level = await Battery.getBatteryLevelAsync();
    return level > 0.05;
  } catch {
    return true;
  }
}

let lastResult: DiagnosticResult | null = null;

export const DeviceDiagnostic = {
  async run(): Promise<DiagnosticResult> {
    const messages: string[] = [];

    const [network, location, notifications, microphone, battery] =
      await Promise.all([
        hasNetwork(),
        hasLocationPermission(),
        hasNotificationPermission(),
        hasMicrophonePermission(),
        hasLowBattery(),
      ]);

    if (!network) messages.push('Sin conexión a internet. Las alertas se encolarán localmente.');
    if (!location) messages.push('Permiso de ubicación no concedido. Las alertas se enviarán sin coordenadas.');
    if (!notifications) messages.push('Permiso de notificaciones no concedido.');
    if (!microphone) messages.push('Permiso de micrófono no concedido. El audio no se grabará.');
    if (!battery) messages.push('Batería baja. Algunas funciones en segundo plano pueden estar restringidas.');

    const criticalPass = network;
    const allCritical = location && notifications;
    const optionalMissing = !microphone || !battery;

    let level: ProtectionLevel;
    if (!criticalPass) {
      level = 'stopped';
    } else if (!allCritical || optionalMissing) {
      level = 'limited';
    } else {
      level = 'active';
    }

    lastResult = { level, checks: { network, location, notifications, microphone, battery }, messages };
    return lastResult;
  },

  getLastResult(): DiagnosticResult | null {
    return lastResult;
  },

  startPolling(intervalMs = 30000): () => void {
    this.run();
    const interval = setInterval(() => this.run(), intervalMs);
    return () => clearInterval(interval);
  },
};
