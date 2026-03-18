import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  PermissionsService,
  PermissionsStatus,
} from '../src/services/PermissionsService';
import { COLORS } from '../src/config/constants';

type PermissionItem = {
  key: keyof PermissionsStatus;
  title: string;
  description: string;
  critical: boolean;
  onRequest: () => Promise<void>;
};

export default function PermissionsScreen() {
  const [status, setStatus] = useState<PermissionsStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const s = await PermissionsService.checkAll();
    setStatus(s);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const permissions: PermissionItem[] = [
    {
      key: 'microphone',
      title: '🎙️ Micrófono',
      description:
        'Necesario para detectar tu palabra clave y grabar mensajes de voz.',
      critical: true,
      onRequest: async () => {
        await PermissionsService.requestMicrophone();
        await refresh();
      },
    },
    {
      key: 'locationForeground',
      title: '📍 Ubicación (cuando se usa)',
      description: 'Para enviar tu posición a los contactos.',
      critical: true,
      onRequest: async () => {
        await PermissionsService.requestLocationForeground();
        await refresh();
      },
    },
    {
      key: 'locationBackground',
      title: '🗺️ Ubicación en segundo plano',
      description:
        'Para mantener tu ubicación actualizada cuando la pantalla está bloqueada.',
      critical: false,
      onRequest: async () => {
        await PermissionsService.requestLocationBackground();
        await refresh();
      },
    },
  ];

  const statusColor = (s: string) => {
    if (s === 'granted') return COLORS.safe;
    if (s === 'blocked') return COLORS.danger;
    return COLORS.warning;
  };

  const statusLabel = (s: string) => {
    if (s === 'granted') return '✅ Concedido';
    if (s === 'blocked') return '🚫 Bloqueado';
    if (s === 'denied') return '⚠️ No concedido';
    return '❓ No disponible';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.danger} size="large" />
      </View>
    );
  }

  const allCriticalGranted =
    status && PermissionsService.areAllCriticalGranted(status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Permisos requeridos</Text>
      <Text style={styles.subtitle}>
        SafeAlert necesita estos permisos para funcionar correctamente en
        situaciones de emergencia.
      </Text>

      {permissions.map((perm) => {
        const currentStatus = status?.[perm.key] ?? 'unavailable';
        const isGranted = currentStatus === 'granted';
        const isBlocked = currentStatus === 'blocked';

        return (
          <View key={perm.key} style={styles.permCard}>
            <View style={styles.permHeader}>
              <Text style={styles.permTitle}>
                {perm.title}
                {perm.critical && (
                  <Text style={styles.requiredBadge}> (requerido)</Text>
                )}
              </Text>
              <Text
                style={[
                  styles.permStatus,
                  { color: statusColor(currentStatus) },
                ]}
              >
                {statusLabel(currentStatus)}
              </Text>
            </View>
            <Text style={styles.permDesc}>{perm.description}</Text>
            {!isGranted && (
              <TouchableOpacity
                style={[
                  styles.permButton,
                  isBlocked && styles.permButtonBlocked,
                ]}
                onPress={
                  isBlocked
                    ? () => PermissionsService.openAppSettings()
                    : perm.onRequest
                }
              >
                <Text style={styles.permButtonText}>
                  {isBlocked ? 'Abrir configuración' : 'Conceder permiso'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {allCriticalGranted && (
        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>✅ Todo listo</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },

  permCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  permHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  permTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, flex: 1 },
  requiredBadge: { fontSize: 12, color: COLORS.danger, fontWeight: '400' },
  permStatus: { fontSize: 13, fontWeight: '500' },
  permDesc: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  permButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  permButtonBlocked: { backgroundColor: COLORS.neutral },
  permButtonText: { color: COLORS.white, fontWeight: '600', fontSize: 14 },

  doneButton: {
    backgroundColor: COLORS.safe,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});
