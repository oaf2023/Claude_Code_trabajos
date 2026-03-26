/* ============================================================================
* Archivo         : AudioRecordingService.ts
* Descripción     : Grabación opcional y subida segura de audio de alertas.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AudioRecordingService.recordAndUpload(userId, alertId)
* ============================================================================ */

import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import storage from '@react-native-firebase/storage';
import { AUDIO_RECORDING_SECONDS } from '../config/constants';
import { buildAlertAudioStoragePath } from '../config/features';
import { auth, ensureAuthenticated } from '../config/firebase';

export const AudioRecordingService = {
  async configure(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1, // InterruptionModeIOS.DuckOthers
      interruptionModeAndroid: 2, // InterruptionModeAndroid.DuckOthers
      shouldDuckAndroid: true,
    });
  },

  async recordAndUpload(
    userId: string,
    alertId: string
  ): Promise<{ audioUrl: string; audioPath: string } | null> {
    try {
      if (__DEV__ && Platform.OS === 'android') {
        console.warn(
          '[AudioRecordingService] Se omite la subida del audio en Android dev para evitar falsos negativos de Storage durante las pruebas locales.',
          { userId, alertId }
        );
        return null;
      }

      const authenticatedUserId = await ensureAuthenticated().catch(() => null);
      if (!authenticatedUserId || authenticatedUserId !== userId) {
        console.warn(
          '[AudioRecordingService] Se omite la subida del audio porque la sesión Firebase no coincide con la alerta activa.',
          { authenticatedUserId, alertUserId: userId }
        );
        return null;
      }

      await auth().currentUser?.getIdToken(true);

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return null;

      await this.configure();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      // Auto-stop after AUDIO_RECORDING_SECONDS
      await new Promise((resolve) =>
        setTimeout(resolve, AUDIO_RECORDING_SECONDS * 1000)
      );

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) return null;

      const audioPath = buildAlertAudioStoragePath(userId, alertId);
      const ref = storage().ref(audioPath);
      try {
        await ref.putFile(uri);
      } catch (error: any) {
        if (error?.code === 'storage/unauthorized') {
          console.warn(
            '[AudioRecordingService] Firebase Storage rechazó la subida del audio. Se continúa sin adjunto.',
            { userId, alertId }
          );
          return null;
        }

        throw error;
      }

      const audioUrl = await ref.getDownloadURL();

      return { audioUrl, audioPath };
    } catch (error) {
      console.warn('[AudioRecordingService] Error recording audio:', error);
      return null;
    }
  },
};
