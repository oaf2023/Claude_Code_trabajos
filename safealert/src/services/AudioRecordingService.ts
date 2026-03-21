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
import storage from '@react-native-firebase/storage';
import { AUDIO_RECORDING_SECONDS } from '../config/constants';
import { buildAlertAudioStoragePath } from '../config/features';

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
      await ref.putFile(uri);
      const audioUrl = await ref.getDownloadURL();

      return { audioUrl, audioPath };
    } catch (error) {
      console.warn('[AudioRecordingService] Error recording audio:', error);
      return null;
    }
  },
};
