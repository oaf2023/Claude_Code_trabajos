import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Vibration,
} from 'react-native';
import { router } from 'expo-router';
import { WakeWordService } from '../../src/services/WakeWordService';
import { LocationService } from '../../src/services/LocationService';
import { useGuardStore } from '../../src/stores/useGuardStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useContactsStore } from '../../src/stores/useContactsStore';
import { useAlert } from '../../src/hooks/useAlert';
import { useContacts } from '../../src/hooks/useContacts';
import { COLORS } from '../../src/config/constants';

export default function HomeScreen() {
  const isArmed = useGuardStore((s) => s.isArmed);
  const setArmed = useGuardStore((s) => s.setArmed);
  const {
    alertPhase,
    countdownSeconds,
    lastAlert,
    detectedKeyword,
    triggerManual,
    cancelCountdown,
    isAlerting,
  } = useAlert();

  useContacts(); // subscribe to contacts
  const contacts = useContactsStore((s) => s.contacts);
  const activeCount = contacts.filter((c) => c.active).length;
  const userId = useSettingsStore((s) => s.userId);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isSendingManual, setIsSendingManual] = useState(false);

  // Pulse animation for active guard mode
  useEffect(() => {
    if (isArmed) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isArmed]);

  const toggleGuard = async () => {
    if (!userId) return;
    if (activeCount === 0) {
      Alert.alert(
        'Sin contactos',
        'Agrega al menos un contacto antes de activar el modo guardia.',
        [{ text: 'Ir a Contactos', onPress: () => router.push('/contacts') }]
      );
      return;
    }

    if (isArmed) {
      await WakeWordService.stop();
      await LocationService.stopBackgroundUpdates();
      setArmed(false);
    } else {
      try {
        await WakeWordService.start();
        await LocationService.startBackgroundUpdates();
        setArmed(true);
        Vibration.vibrate(200);
      } catch (e) {
        Alert.alert(
          'Error',
          'No se pudo activar el modo guardia. Verifica los permisos.',
          [{ text: 'Ver Permisos', onPress: () => router.push('/permissions') }]
        );
      }
    }
  };

  const handlePanicButton = async () => {
    if (activeCount === 0) {
      Alert.alert('Sin contactos', 'Agrega contactos de confianza primero.');
      return;
    }
    setIsSendingManual(true);
    Vibration.vibrate([0, 200, 100, 200]);
    try {
      await triggerManual();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo enviar la alerta.');
    } finally {
      setIsSendingManual(false);
    }
  };

  // Countdown overlay
  if (alertPhase === 'countdown') {
    return (
      <View style={styles.countdownOverlay}>
        <Text style={styles.countdownTitle}>⚠️ ALERTA DETECTADA</Text>
        <Text style={styles.countdownWord}>Palabra: "{detectedKeyword}"</Text>
        <View style={styles.countdownCircle}>
          <Text style={styles.countdownNumber}>{countdownSeconds}</Text>
        </View>
        <Text style={styles.countdownSub}>
          Enviando alerta a {activeCount} contactos...
        </Text>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={cancelCountdown}
        >
          <Text style={styles.cancelButtonText}>✕ CANCELAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Status banner */}
      {alertPhase === 'sent' && lastAlert && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>
            ✅ Alerta enviada a {lastAlert.contacts.length} contactos
          </Text>
          <Text style={styles.successBannerSub}>
            {new Date(lastAlert.triggeredAt).toLocaleTimeString('es-AR')}
          </Text>
        </View>
      )}

      {alertPhase === 'capturing' || alertPhase === 'sending' ? (
        <View style={styles.sendingBanner}>
          <Text style={styles.sendingText}>
            {alertPhase === 'capturing'
              ? '📍 Obteniendo ubicación...'
              : '📤 Enviando alerta...'}
          </Text>
        </View>
      ) : null}

      {/* Guard Mode Toggle */}
      <View style={styles.guardSection}>
        <Text style={styles.guardLabel}>
          {isArmed ? '🟢 Modo guardia ACTIVO' : '⚪ Modo guardia INACTIVO'}
        </Text>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.guardButton, isArmed && styles.guardButtonArmed]}
            onPress={toggleGuard}
            activeOpacity={0.8}
          >
            <Text style={styles.guardButtonIcon}>{isArmed ? '🛡️' : '🔓'}</Text>
            <Text style={styles.guardButtonText}>
              {isArmed ? 'DESACTIVAR\nGUARDIA' : 'ACTIVAR\nGUARDIA'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {isArmed && (
          <Text style={styles.guardHint}>
            Di "ayuda" o "socorro" para activar la alerta
          </Text>
        )}
      </View>

      {/* Contact count */}
      <View
        style={[
          styles.infoCard,
          activeCount === 0 && styles.infoCardWarning,
        ]}
      >
        <Text style={styles.infoCardEmoji}>
          {activeCount === 0 ? '⚠️' : '👥'}
        </Text>
        <View>
          <Text style={styles.infoCardTitle}>
            {activeCount === 0
              ? 'Sin contactos de confianza'
              : `${activeCount} contacto${activeCount !== 1 ? 's' : ''} activo${activeCount !== 1 ? 's' : ''}`}
          </Text>
          <Text style={styles.infoCardSub}>
            {activeCount === 0
              ? 'Toca para agregar contactos'
              : 'Recibirán tu ubicación en emergencias'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/contacts')}>
          <Text style={styles.infoCardLink}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Manual panic button */}
      <TouchableOpacity
        style={[
          styles.panicButton,
          (isSendingManual || isAlerting) && styles.panicButtonDisabled,
        ]}
        onPress={handlePanicButton}
        disabled={isSendingManual || isAlerting}
        activeOpacity={0.7}
      >
        <Text style={styles.panicButtonText}>
          {isSendingManual ? '📤 Enviando...' : '🆘 ENVIAR ALERTA AHORA'}
        </Text>
        <Text style={styles.panicButtonSub}>
          Envía tu ubicación inmediatamente
        </Text>
      </TouchableOpacity>

      {/* Test alert link */}
      <TouchableOpacity
        style={styles.testLink}
        onPress={() => router.push('/test-alert')}
      >
        <Text style={styles.testLinkText}>🧪 Probar alerta (sin SMS real)</Text>
      </TouchableOpacity>

      {/* Keywords info */}
      <View style={styles.keywordsCard}>
        <Text style={styles.keywordsTitle}>Palabras de activación</Text>
        <View style={styles.keywordsList}>
          {['ayuda', 'socorro', 'auxilio'].map((word) => (
            <View key={word} style={styles.keywordBadge}>
              <Text style={styles.keywordBadgeText}>{word}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Text style={styles.editKeywords}>Personalizar →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 16 },

  // Countdown overlay
  countdownOverlay: {
    flex: 1,
    backgroundColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  countdownTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  countdownWord: { fontSize: 18, color: '#FCA5A5', textAlign: 'center' },
  countdownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FCA5A5',
  },
  countdownNumber: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  countdownSub: { fontSize: 16, color: '#FEE2E2', textAlign: 'center' },
  cancelButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 50,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.danger,
  },

  // Banners
  successBanner: {
    backgroundColor: COLORS.safeLight,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.safe,
  },
  successBannerText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.safe,
  },
  successBannerSub: { fontSize: 12, color: COLORS.neutral, marginTop: 2 },
  sendingBanner: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 12,
    padding: 14,
  },
  sendingText: { fontSize: 15, color: COLORS.warning, textAlign: 'center' },

  // Guard button
  guardSection: { alignItems: 'center', gap: 12, marginVertical: 8 },
  guardLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textMuted },
  guardButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  guardButtonArmed: { backgroundColor: COLORS.safe },
  guardButtonIcon: { fontSize: 40 },
  guardButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  guardHint: {
    fontSize: 13,
    color: COLORS.safe,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Info card
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  infoCardWarning: { backgroundColor: COLORS.warningLight },
  infoCardEmoji: { fontSize: 28 },
  infoCardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  infoCardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  infoCardLink: { fontSize: 20, color: COLORS.neutral },

  // Panic button
  panicButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  panicButtonDisabled: { backgroundColor: '#FCA5A5' },
  panicButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  panicButtonSub: { fontSize: 12, color: '#FEE2E2', marginTop: 4 },

  // Test link
  testLink: { alignItems: 'center', paddingVertical: 8 },
  testLinkText: { fontSize: 14, color: COLORS.textMuted },

  // Keywords card
  keywordsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  keywordsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  keywordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordBadge: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  keywordBadgeText: { fontSize: 13, color: COLORS.danger, fontWeight: '500' },
  editKeywords: { fontSize: 13, color: COLORS.textMuted },
});
