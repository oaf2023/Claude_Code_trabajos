/* ============================================================================
* Archivo         : permissions.tsx
* Descripción     : Pantalla de permisos alineada con las capacidades del MVP.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Modal de permisos y transparencia operativa.
* ============================================================================ */

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
import { color, spacing, borderRadius, shadow } from '../src/theme';
import { Icon } from '../src/theme/Icon';
import { BACKGROUND_LOCATION_ENABLED } from '../src/config/features';
import { useGuardStore } from '../src/stores/useGuardStore';

type PermissionItem = {
  key: keyof PermissionsStatus;
  title: string;
  icon: React.ComponentProps<typeof Icon>['name'];
  description: string;
  critical: boolean;
  onRequest: () => Promise<void>;
};

/* ============================================================================
* Función         : PermissionsScreen
* Descripción     : Presenta permisos críticos y opcionales con acciones accesibles.
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : PermissionsService, router
* Ingesta         : Sin argumentos
* Devolución      : JSX.Element
* Uso             : Pantalla /permissions
* ============================================================================ */

export default function PermissionsScreen() {
  const [status, setStatus] = useState<PermissionsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLocation = useGuardStore((s) => s.lastLocation);

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
      title: 'Micrófono',
      icon: 'mic' as const,
      description:
        'Opcional. Solo se usa si decides adjuntar un mensaje de voz a la alerta.',
      critical: false,
      onRequest: async () => {
        await PermissionsService.requestMicrophone();
        await refresh();
      },
    },
    {
      key: 'locationForeground',
      title: 'Ubicación (cuando se usa)',
      icon: 'location-on' as const,
      description: 'Para enviar tu posición a los contactos.',
      critical: true,
      onRequest: async () => {
        await PermissionsService.requestLocationForeground();
        await refresh();
      },
    },
    {
      key: 'notifications',
      title: 'Notificaciones',
      icon: 'notifications' as const,
      description:
        'Necesarias para recordatorios locales y para avisarte del estado de la app.',
      critical: true,
      onRequest: async () => {
        await PermissionsService.requestNotifications();
        await refresh();
      },
    },
  ];

  if (BACKGROUND_LOCATION_ENABLED) {
    permissions.push({
      key: 'locationBackground',
      title: 'Ubicación en segundo plano',
      icon: 'map' as const,
      description:
        'Opcional. Solo se habilita en compilaciones que realmente usen seguimiento en segundo plano.',
      critical: false,
      onRequest: async () => {
        await PermissionsService.requestLocationBackground();
        await refresh();
      },
    });
  }

  const statusColor = (s: string) => {
    if (s === 'granted') return color.safe;
    if (s === 'blocked') return color.danger;
    return color.warning;
  };

  const statusIcon = (s: string): React.ComponentProps<typeof Icon>['name'] => {
    if (s === 'granted') return 'check-circle';
    if (s === 'blocked') return 'cancel';
    if (s === 'denied') return 'warning';
    return 'help';
  };

  const statusLabel = (s: string) => {
    if (s === 'granted') return 'Concedido';
    if (s === 'blocked') return 'Bloqueado';
    if (s === 'denied') return 'No concedido';
    return 'No disponible';
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={color.danger} size="large" />
      </View>
    );
  }

  const allCriticalGranted =
    status && PermissionsService.areAllCriticalGranted(status);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Permisos requeridos</Text>
      <Text style={styles.subtitle}>
        SafeAlert solo pide permisos vinculados al MVP real: ubicación para el SOS,
        notificaciones para recordatorios y micrófono opcional para audio.
      </Text>

      {permissions.map((perm) => {
        const currentStatus = status?.[perm.key] ?? 'unavailable';
        const isGranted = currentStatus === 'granted';
        const isBlocked = currentStatus === 'blocked';

        return (
          <View key={perm.key} style={styles.permCard}>
            <View style={styles.permHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                <Icon name={perm.icon} size={20} color={color.textPrimary} />
                <Text style={styles.permTitle}>
                  {perm.title}
                  {perm.critical && (
                    <Text style={styles.requiredBadge}> (requerido)</Text>
                  )}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon name={statusIcon(currentStatus)} size={16} color={statusColor(currentStatus)} />
                <Text style={[styles.permStatus, { color: statusColor(currentStatus) }]}>
                  {statusLabel(currentStatus)}
                </Text>
              </View>
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
                accessibilityRole="button"
                accessibilityLabel={isBlocked ? `Abrir configuración para ${perm.title}` : `Conceder permiso de ${perm.title}`}
                accessibilityHint={perm.critical ? 'Es un permiso necesario para el funcionamiento principal del MVP' : 'Es un permiso opcional para funciones complementarias'}
              >
                <Text style={styles.permButtonText}>
                  {isBlocked ? 'Abrir configuración' : 'Conceder permiso'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {/* Prompt Maestro: mostrar origen de ubicación actual */}
      <View style={styles.permCard}>
        <View style={styles.permHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 }}>
            <Icon name="my-location" size={20} color={color.textPrimary} />
            <Text style={styles.permTitle}>Origen de ubicación</Text>
          </View>
        </View>
        <Text style={styles.permDesc}>
          {lastLocation?.source
            ? `Origen: ${lastLocation.source}${lastLocation.accuracy ? ` · Precisión: ${Math.round(lastLocation.accuracy)}m` : ''}${lastLocation.isStale ? ' · (dato previo)' : ''}`
            : 'Sin ubicación registrada aún'}
        </Text>
        <TouchableOpacity
          style={styles.permButton}
          onPress={() => router.push('/ubicacion/manual')}
          accessibilityRole="button"
          accessibilityLabel="Ingresar ubicación manualmente"
        >
          <Text style={styles.permButtonText}>Ingresar ubicación manual</Text>
        </TouchableOpacity>
      </View>

      {allCriticalGranted && (
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cerrar pantalla de permisos"
          accessibilityHint="Vuelve a la pantalla anterior porque los permisos críticos ya están listos"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="check-circle" size={20} color={color.textInverse} />
            <Text style={styles.doneButtonText}>Todo listo</Text>
          </View>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 22, fontWeight: 'bold', color: color.textPrimary },
  subtitle: { fontSize: 14, color: color.textSecondary, lineHeight: 20 },

  permCard: {
    backgroundColor: color.surface,
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
  permTitle: { fontSize: 15, fontWeight: '600', color: color.textPrimary, flex: 1 },
  requiredBadge: { fontSize: 12, color: color.danger, fontWeight: '400' },
  permStatus: { fontSize: 13, fontWeight: '500' },
  permDesc: { fontSize: 13, color: color.textSecondary, lineHeight: 18 },
  permButton: {
    backgroundColor: color.danger,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  permButtonBlocked: { backgroundColor: color.neutral400 },
  permButtonText: { color: color.textInverse, fontWeight: '600', fontSize: 14 },

  doneButton: {
    backgroundColor: color.safe,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  doneButtonText: { color: color.textInverse, fontWeight: 'bold', fontSize: 16 },
});
