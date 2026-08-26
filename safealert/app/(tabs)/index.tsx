/* ============================================================================
* Archivo         : index.tsx
* Descripción     : Pantalla principal simplificada con design system,
*                   iconos Material y chequeo de protección visible.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Pantalla Home de la app.
* ============================================================================ */

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
  Linking,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { WakeWordService } from '../../src/services/WakeWordService';
import { DeviceService } from '../../src/services/DeviceService';
import { PaymentService } from '../../src/services/PaymentService';
import { PaymentModal } from '../../src/components/PaymentModal';
import { useGuardStore } from '../../src/stores/useGuardStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useContactsStore } from '../../src/stores/useContactsStore';
import { useAlert } from '../../src/hooks/useAlert';
import { useContacts } from '../../src/hooks/useContacts';
import { buildVisibleTriggerWords } from '../../src/utils/triggerWords';
import {
  REMOTE_AUDIO_GUARD_CONFIGURED,
  WAKE_WORD_FOREGROUND_ONLY,
} from '../../src/config/features';
import { color, spacing, borderRadius, typography, shadow } from '../../src/theme';
import { Icon } from '../../src/theme/Icon';
import { Button } from '../../src/theme/Button';
import { Card } from '../../src/theme/Card';
import { DeviceDiagnostic, ProtectionLevel } from '../../src/services/DeviceDiagnostic';
import { WebModeBanner } from '../../src/components/WebModeBanner';

function resolveGuardIcon(isArmed: boolean, alertPhase: string, status: string | null): { icon: React.ComponentProps<typeof Icon>['name']; label: string } {
  if (!isArmed) return { icon: 'lock-open', label: 'ACTIVAR\nGUARDIA' };
  if (alertPhase === 'countdown') return { icon: 'warning', label: 'ALERTA\nDETECTADA' };
  if (alertPhase === 'capturing' || alertPhase === 'sending') return { icon: 'send', label: 'ENVIANDO\nALERTA' };
  const s = (status || '').toLowerCase();
  if (s.includes('analizando')) return { icon: 'psychology', label: 'ANALIZANDO\nAUDIO' };
  if (s.includes('detecté') || s.includes('coincidencia')) return { icon: 'emergency', label: 'ALERTA\nPOR VOZ' };
  if (s.includes('grab')) return { icon: 'mic', label: 'GRABANDO\nAUDIO' };
  if (s.includes('problema') || s.includes('error')) return { icon: 'warning', label: 'REVISAR\nGUARDIA' };
  return { icon: 'shield', label: 'GUARDIA\nACTIVA' };
}

function ProtectionBadge({ level }: { level: ProtectionLevel }) {
  const config = {
    active: { icon: 'check-circle' as const, color: color.safe, bg: color.safeLight, label: 'Protección activa' },
    limited: { icon: 'warning' as const, color: color.warning, bg: color.warningLight, label: 'Protección limitada' },
    stopped: { icon: 'cancel' as const, color: color.danger, bg: color.dangerLight, label: 'Protección detenida' },
  };
  const c = config[level];
  return (
    <View style={[localStyles.protectionBadge, { backgroundColor: c.bg }]}>
      <Icon name={c.icon} size={16} color={c.color} />
      <Text style={[localStyles.protectionBadgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const isArmed = useGuardStore((s) => s.isArmed);
  const setArmed = useGuardStore((s) => s.setArmed);
  const resetAlertState = useGuardStore((s) => s.resetAlertState);
  const setLastAlert = useGuardStore((s) => s.setLastAlert);
  const guardStatusMessage = useGuardStore((s) => s.guardStatusMessage);
  const lastHeardTranscript = useGuardStore((s) => s.lastHeardTranscript);

  const {
    alertPhase,
    countdownSeconds,
    lastAlert,
    detectedKeyword,
    triggerManual,
    cancelCountdown,
    isAlerting,
  } = useAlert();

  const { loading: contactsLoading } = useContacts();
  const contacts = useContactsStore((s) => s.contacts);
  const activeCount = contacts.filter((c) => c.active).length;
  const userId = useSettingsStore((s) => s.userId);
  const triggerWords = useSettingsStore((s) => s.triggerWords);
  const hasSubscription = useSettingsStore((s) => s.hasSubscription);
  const userName = useSettingsStore((s) => s.userName ?? '');
  const userPhone = useSettingsStore((s) => s.userPhone ?? '');
  const visibleTriggerWords = buildVisibleTriggerWords(triggerWords);
  const wakeWordAvailable = WakeWordService.isAvailable();
  const guardEngineLabel = REMOTE_AUDIO_GUARD_CONFIGURED
    ? 'API remota de audio'
    : 'motor local de wake word';
  const guardButton = resolveGuardIcon(isArmed, alertPhase, guardStatusMessage);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isSendingManual, setIsSendingManual] = useState(false);
  const [isBlackScreen, setIsBlackScreen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [protectionLevel, setProtectionLevel] = useState<ProtectionLevel>('active');

  useEffect(() => {
    DeviceService.getDeviceId().then((id) => {
      setDeviceId(id);
      PaymentService.checkSubscription(id);
    });
    DeviceDiagnostic.run().then((r) => setProtectionLevel(r.level));
    const stop = DeviceDiagnostic.startPolling(30000);
    return stop;
  }, []);

  useEffect(() => {
    if (isArmed) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [isArmed, pulseAnim]);

  const dismissAlertFeedback = () => { resetAlertState(); setLastAlert(null); };

  const alertStatusLabel = !lastAlert ? ''
    : lastAlert.status === 'pending' ? 'Alerta registrada. Pendiente de procesamiento.'
    : lastAlert.status === 'partial' ? `Alerta enviada parcialmente a ${lastAlert.contacts.length} contactos`
    : lastAlert.status === 'failed' ? 'La alerta no pudo enviarse desde el backend.'
    : `Alerta enviada a ${lastAlert.contacts.length} contactos`;

  const alertStatusSubLabel = !lastAlert ? ''
    : lastAlert.status === 'pending' ? 'El backend todavía no confirmó el envío.'
    : lastAlert.status === 'failed'
      ? lastAlert.contacts.find((c) => c.lastError)?.lastError || 'Revisá la configuración de Functions.'
    : lastAlert.status === 'partial' ? 'Al menos un contacto no recibió la notificación.'
    : new Date(lastAlert.triggeredAt).toLocaleTimeString('es-AR');

  const toggleBlackScreen = () => { setIsBlackScreen(!isBlackScreen); Vibration.vibrate(100); };

  const toggleGuard = async () => {
    if (!wakeWordAvailable) {
      Alert.alert('No disponible', WakeWordService.getUnavailableReason());
      return;
    }
    if (!userId) return;
    if (activeCount === 0) {
      Alert.alert('Sin contactos', 'Agrega al menos un contacto antes de activar el modo guardia.',
        [{ text: 'Ir a Contactos', onPress: () => router.push('/contacts') }]);
      return;
    }
    try {
      if (isArmed) {
        await WakeWordService.stop();
        setArmed(false);
      } else {
        if (!hasSubscription) { setShowPayment(true); return; }
        await WakeWordService.start();
        setArmed(true);
      }
      Vibration.vibrate(200);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo activar el modo guardia.',
        [{ text: 'Ver Permisos', onPress: () => router.push('/permissions') }]);
    }
  };

  const handlePanicButton = async () => {
    if (!userId) { Alert.alert('Sesión no disponible', 'Reintenta en unos segundos.'); return; }
    if (contactsLoading) { Alert.alert('Cargando', 'Esperá mientras cargamos tus contactos.'); return; }
    if (activeCount === 0) { Alert.alert('Sin contactos', 'Agregá contactos de confianza primero.'); return; }
    if (!hasSubscription) { setShowPayment(true); return; }
    setIsSendingManual(true);
    Vibration.vibrate([0, 200, 100, 200]);
    try { await triggerManual(); }
    catch (e: any) { Alert.alert('Error', e.message || 'No se pudo enviar la alerta.'); }
    finally { setIsSendingManual(false); }
  };

  if (isBlackScreen) {
    return (
      <TouchableOpacity activeOpacity={1} onLongPress={toggleBlackScreen} delayLongPress={5000}
        style={localStyles.blackScreen}
        accessibilityRole="button" accessibilityLabel="Salir del modo incógnito"
        accessibilityHint="Mantén pulsado cinco segundos para volver"
      >
        <StatusBar hidden />
      </TouchableOpacity>
    );
  }

  if (alertPhase === 'countdown') {
    return (
      <View style={localStyles.countdownOverlay}>
        <Icon name="warning" size={48} color="#FCA5A5" />
        <Text style={localStyles.countdownTitle}>ALERTA DETECTADA</Text>
        <Text style={localStyles.countdownWord}>Palabra: "{detectedKeyword}"</Text>
        <View style={localStyles.countdownCircle}>
          <Text style={localStyles.countdownNumber}>{countdownSeconds}</Text>
        </View>
        <Text style={localStyles.countdownSub}>Enviando alerta a {activeCount} contactos...</Text>
        <TouchableOpacity style={localStyles.cancelButton} onPress={cancelCountdown}
          accessibilityRole="button" accessibilityLabel="Cancelar alerta"
        >
          <Text style={localStyles.cancelButtonText}>CANCELAR</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={localStyles.container} contentContainerStyle={localStyles.content}>
      {/* Web mode banner — solo visible en navegador */}
      {Platform.OS === 'web' && <WebModeBanner />}

      {/* Protection badge */}
      <ProtectionBadge level={protectionLevel} />

      {/* Alert feedback banner */}
      {lastAlert ? (
        <Card variant={lastAlert.status === 'failed' ? 'warning' : lastAlert.status === 'partial' ? 'warning' : 'success'}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name={lastAlert.status === 'failed' ? 'close' : lastAlert.status === 'partial' ? 'warning' : 'check-circle'}
              size={20} color={lastAlert.status === 'failed' ? color.danger : lastAlert.status === 'partial' ? color.warning : color.safe} />
            <Text style={localStyles.successBannerText}>{alertStatusLabel}</Text>
          </View>
          <Text style={localStyles.successBannerSub}>{alertStatusSubLabel}</Text>

          {lastAlert.audioUrl ? (
            <Text style={{ fontSize: 12, color: color.safe, marginTop: spacing.sm, fontWeight: '600' }}>
              Audio de seguimiento adjunto a la alerta.
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <TouchableOpacity style={localStyles.incognitoToggle} onPress={toggleBlackScreen}
              accessibilityRole="button" accessibilityLabel="Modo incógnito">
              <Icon name="visibility-off" size={16} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>INCÓGNITO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={localStyles.clearAlertButton} onPress={dismissAlertFeedback}
              accessibilityRole="button" accessibilityLabel="Terminar alerta">
              <Text style={{ color: color.textInverse, fontSize: 14, fontWeight: '700' }}>TERMINAR</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : null}

      {alertPhase === 'capturing' || alertPhase === 'sending' ? (
        <View style={localStyles.sendingBanner}>
          <Icon name="location-on" size={18} color={color.warning} />
          <Text style={localStyles.sendingText}>
            {alertPhase === 'capturing' ? 'Obteniendo ubicación...' : 'Enviando alerta...'}
          </Text>
        </View>
      ) : null}

      {/* Guard section */}
      {wakeWordAvailable ? (
        <View style={localStyles.guardSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Icon name="circle" size={10} color={isArmed ? color.safe : color.neutral400} />
            <Text style={localStyles.guardLabel}>
              {isArmed ? 'Modo guardia ACTIVO' : 'Modo guardia INACTIVO'}
            </Text>
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[localStyles.guardButton, isArmed && localStyles.guardButtonArmed]}
              onPress={toggleGuard} activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={isArmed ? 'Desactivar modo guardia' : 'Activar modo guardia'}
            >
              <Icon name={guardButton.icon} size={40} color={color.textInverse} />
              <Text style={localStyles.guardButtonText}>{guardButton.label}</Text>
            </TouchableOpacity>
          </Animated.View>

          {isArmed ? (
            <Text style={localStyles.guardHint}>
              {WAKE_WORD_FOREGROUND_ONLY
                ? 'Detección activa mientras SafeAlert permanezca abierto.'
                : 'Detección automática activa.'}
            </Text>
          ) : null}

          <Text style={localStyles.guardHint}>Motor: {guardEngineLabel}</Text>

          {isArmed && guardStatusMessage ? (
            <Card variant="elevated">
              <Text style={{ fontWeight: '700', color: color.textPrimary }}>Estado de escucha</Text>
              <Text style={{ fontSize: 14, color: color.textSecondary, lineHeight: 20 }}>{guardStatusMessage}</Text>
              {lastHeardTranscript ? (
                <Text style={{ fontSize: 13, color: color.safe }}>Te escuché: "{lastHeardTranscript}"</Text>
              ) : null}
            </Card>
          ) : null}
        </View>
      ) : (
        <Card>
          <Text style={{ fontWeight: '700', color: color.textPrimary }}>Modo guardia automático</Text>
          <Text style={{ fontSize: 14, color: color.textSecondary, lineHeight: 20 }}>
            {WakeWordService.getUnavailableReason()} Usá el botón SOS manual.
          </Text>
        </Card>
      )}

      {/* Contacts card */}
      <Card onPress={() => router.push('/contacts')}
        style={activeCount === 0 ? { backgroundColor: color.warningLight } : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Icon name={activeCount === 0 ? 'warning' : 'people'} size={28}
            color={activeCount === 0 ? color.warning : color.neutral400} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: color.textPrimary }}>
              {contactsLoading ? 'Cargando contactos...'
                : activeCount === 0 ? 'Sin contactos de confianza'
                : `${activeCount} contacto${activeCount !== 1 ? 's' : ''} activo${activeCount !== 1 ? 's' : ''}`}
            </Text>
            <Text style={{ fontSize: 12, color: color.textSecondary, marginTop: 2 }}>
              {activeCount === 0 ? 'Tocá para agregar contactos' : 'Recibirán tu ubicación en emergencias'}
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={color.neutral400} />
        </View>
      </Card>

      {/* Panic button */}
      <TouchableOpacity
        style={[localStyles.panicButton, (isSendingManual || isAlerting) && { backgroundColor: '#FCA5A5' }]}
        onPress={handlePanicButton}
        disabled={isSendingManual || isAlerting}
        activeOpacity={0.7}
        accessibilityRole="button" accessibilityLabel="Enviar alerta SOS"
      >
        <Icon name="emergency" size={28} color={color.textInverse} />
        <Text style={localStyles.panicButtonText}>
          {isSendingManual ? 'Enviando...' : 'ENVIAR ALERTA AHORA'}
        </Text>
        <Text style={{ fontSize: 12, color: '#FEE2E2', marginTop: 4 }}>Ubicación a tus contactos</Text>
      </TouchableOpacity>

      {/* Test alert */}
      <Button title="Probar alerta (sin SMS real)" variant="ghost" size="sm"
        onPress={() => router.push('/test-alert')}
        accessibilityLabel="Probar alerta sin SMS real" />

      {wakeWordAvailable ? (
        <Card onPress={() => router.push('/settings')}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: color.textPrimary }}>Palabras de activación</Text>
          <Text style={{ fontSize: 12, color: color.textSecondary }}>
            {visibleTriggerWords.join(' · ')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {visibleTriggerWords.map((word) => (
              <View key={word} style={{ backgroundColor: color.dangerLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, color: color.danger, fontWeight: '500' }}>{word}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <PaymentModal
        visible={showPayment}
        deviceId={deviceId}
        userName={userName}
        userPhone={userPhone}
        onClose={() => setShowPayment(false)}
        onSuccess={() => { setShowPayment(false); useSettingsStore.getState().setHasSubscription(true); }}
      />
    </ScrollView>
  );
}

const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  content: { padding: spacing.xl, gap: spacing.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },

  protectionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, alignSelf: 'flex-start',
  },
  protectionBadgeText: { fontSize: 13, fontWeight: '600' },

  countdownOverlay: {
    flex: 1, backgroundColor: color.dangerDark, alignItems: 'center',
    justifyContent: 'center', padding: spacing['3xl'], gap: spacing.xl,
  },
  countdownTitle: { ...typography.h1, color: color.textInverse, textAlign: 'center' },
  countdownWord: { fontSize: 18, color: '#FCA5A5', textAlign: 'center' },
  countdownCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#FCA5A5',
  },
  countdownNumber: { fontSize: 56, fontWeight: 'bold', color: color.textInverse },
  countdownSub: { fontSize: 16, color: '#FEE2E2', textAlign: 'center' },
  cancelButton: {
    backgroundColor: color.warning, paddingHorizontal: 48, paddingVertical: 20,
    borderRadius: borderRadius.xl, marginTop: spacing.xl, minWidth: 260,
    alignItems: 'center', justifyContent: 'center', ...shadow.lg,
  },
  cancelButtonText: { ...typography.button, color: color.textInverse },

  successBannerText: { fontSize: 15, fontWeight: '600', color: color.safe, flex: 1 },
  successBannerSub: { fontSize: 12, color: color.textSecondary, marginTop: spacing.xs },
  sendingBanner: {
    backgroundColor: color.warningLight, borderRadius: borderRadius.md, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  sendingText: { fontSize: 15, color: color.warning },
  incognitoToggle: {
    backgroundColor: '#000', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  clearAlertButton: {
    backgroundColor: color.danger, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center',
  },

  guardSection: { alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  guardLabel: { fontSize: 14, fontWeight: '600', color: color.textSecondary },
  guardButton: {
    width: 180, height: 180, borderRadius: 90, backgroundColor: color.neutral500,
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm, ...shadow.md,
  },
  guardButtonArmed: { backgroundColor: color.safe },
  guardButtonText: { ...typography.buttonSmall, color: color.textInverse, textAlign: 'center' },
  guardHint: { fontSize: 13, color: color.safe, textAlign: 'center', fontStyle: 'italic' },

  panicButton: {
    backgroundColor: color.danger, borderRadius: borderRadius.lg, padding: spacing['2xl'],
    alignItems: 'center', gap: spacing.sm, ...shadow.md,
  },
  panicButtonText: { ...typography.button, color: color.textInverse },

  blackScreen: { flex: 1, backgroundColor: '#000' },
});
