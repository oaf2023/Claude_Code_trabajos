/* ============================================================================
* Archivo         : NotificationService.ts
* Descripción     : Gestión de notificaciones locales y recordatorios del MVP.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : NotificationService.configure() y scheduleDailyReminder()
* ============================================================================ */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const REMINDER_IDENTIFIER = 'daily-safety-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const NotificationService = {
  async configure(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Recordatorios diarios',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 150, 250],
        lightColor: '#DC2626',
      });
    }
  },

  async getPermissionsStatus(): Promise<Notifications.NotificationPermissionsStatus> {
    return Notifications.getPermissionsAsync();
  },

  async requestPermissions(): Promise<Notifications.PermissionStatus> {
    const response = await Notifications.requestPermissionsAsync();
    return response.status;
  },

  async scheduleDailyReminder(hour: number): Promise<string | null> {
    const permissions = await this.getPermissionsStatus();
    if (!(permissions.granted || permissions.status === 'granted')) {
      return null;
    }

    await this.cancelDailyReminder();

    return Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: {
        title: 'Revisión diaria de SafeAlert',
        body: 'Comprueba tus contactos y permisos para que el SOS siga listo.',
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute: 0,
      },
    });
  },

  async cancelDailyReminder(): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const reminder = scheduled.find(
      (notification) => notification.identifier === REMINDER_IDENTIFIER
    );

    if (reminder) {
      await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
    }
  },
};