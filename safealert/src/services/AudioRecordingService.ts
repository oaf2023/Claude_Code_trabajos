import { Audio } from 'expo-av';
import storage from '@react-native-firebase/storage';
import { AUDIO_RECORDING_SECONDS } from '../config/constants';

export const AudioRecordingService = {
  async configure(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1, // InterruptionModeIOS.DuckOthers
      interruptionModeAndroid: 2, // InterruptionModeAndroid.DuckOthers
      shouldDuckAndroid: true,
    });
  },

  async recordAndUpload(alertId: string): Promise<string | null> {
    try {
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

      // Upload to Firebase Storage
      const remotePath = `alerts/${alertId}/voice.m4a`;
      const ref = storage().ref(remotePath);
      await ref.putFile(uri);
      const downloadUrl = await ref.getDownloadURL();

      return downloadUrl;
    } catch (error) {
      console.warn('[AudioRecordingService] Error recording audio:', error);
      return null;
    }
  },
};
