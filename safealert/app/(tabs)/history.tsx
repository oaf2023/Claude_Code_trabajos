/* ============================================================================
* Archivo         : history.tsx
* Descripción     : Historial transparente de alertas con estado de entrega
*                   por contacto. Permite ver alertas pasadas y confirmaciones.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Tab de historial en navegación inferior.
* ============================================================================ */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { alertsCol } from '../../src/config/firebase';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { Alert } from '../../src/types/Alert';
import { color, spacing } from '../../src/theme';
import { Icon } from '../../src/theme/Icon';
import { Card } from '../../src/theme/Card';

const PAGE_SIZE = 20;

function statusConfig(status: string) {
  switch (status) {
    case 'sent': return { icon: 'check-circle' as const, color: color.safe, label: 'Enviada' };
    case 'partial': return { icon: 'warning' as const, color: color.warning, label: 'Envío parcial' };
    case 'pending': return { icon: 'schedule' as const, color: color.warning, label: 'Pendiente' };
    case 'failed': return { icon: 'close' as const, color: color.danger, label: 'Falló' };
    default: return { icon: 'help' as const, color: color.neutral400, label: status };
  }
}

function AlertHistoryItem({ item }: { item: Alert }) {
  const cfg = statusConfig(item.status);
  const date = new Date(item.triggeredAt);
  const isTest = item.isTest;

  return (
    <Card style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <Icon name={cfg.icon} size={20} color={cfg.color} />
        <View style={{ flex: 1 }}>
          <Text style={styles.alertStatus}>{cfg.label}</Text>
          {isTest ? (
            <Text style={styles.alertTestBadge}>PRUEBA</Text>
          ) : null}
        </View>
        <Text style={styles.alertDate}>
          {date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
        </Text>
        <Text style={styles.alertTime}>
          {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>

      <Text style={styles.alertTrigger}>
        Activada por: <Text style={{ fontWeight: '700' }}>{item.triggerWord}</Text>
      </Text>

      {item.mapsLink ? (
        <Text style={styles.alertLink} numberOfLines={1}>{item.mapsLink}</Text>
      ) : null}

      {item.contacts.length > 0 ? (
        <View style={styles.contactsSection}>
          <Text style={styles.contactsTitle}>Entregas:</Text>
          {item.contacts.map((contact, idx) => (
            <View key={idx} style={styles.contactRow}>
              <Icon
                name={contact.smsStatus === 'sent' ? 'check-circle' : contact.smsStatus === 'failed' ? 'close' : 'schedule'}
                size={14}
                color={contact.smsStatus === 'sent' ? color.safe : contact.smsStatus === 'failed' ? color.danger : color.warning}
              />
              <Text style={styles.contactName}>{contact.name}</Text>
              {contact.lastError ? (
                <Text style={styles.contactError} numberOfLines={1}>{contact.lastError}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

export default function HistoryScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const userId = useSettingsStore((s) => s.userId);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const ref = alertsCol(userId).orderBy('triggeredAt', 'desc').limit(PAGE_SIZE);

    const unsub = ref.onSnapshot((snapshot) => {
      const items: Alert[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data() as Omit<Alert, 'id'>;
        if (data) {
          items.push({ id: doc.id, ...data });
        }
      });
      setAlerts(items);
      setLoading(false);
      setRefreshing(false);
    }, (error) => {
      console.warn('[HistoryScreen] Error fetching alerts:', error);
      setLoading(false);
      setRefreshing(false);
    });

    return unsub;
  }, [userId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={color.danger} size="large" />
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.centered}>
        <Icon name="error" size={48} color={color.neutral400} />
        <Text style={styles.emptyTitle}>Sesión no disponible</Text>
        <Text style={styles.emptySub}>Iniciá sesión para ver tu historial.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {alerts.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="history" size={64} color={color.neutral400} />
          <Text style={styles.emptyTitle}>Sin alertas aún</Text>
          <Text style={styles.emptySub}>
            Las alertas que envíes aparecerán aquí con el detalle de entregas.
          </Text>
        </View>
      ) : (
        <FlatList
          data={alerts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <AlertHistoryItem item={item} />}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.danger} />
          }
          ListHeaderComponent={
            <Text style={styles.listHeader}>
              {alerts.length} alerta{alerts.length !== 1 ? 's' : ''}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  centered: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    padding: 40, gap: 12,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: color.textPrimary },
  emptySub: {
    fontSize: 14, color: color.textSecondary, textAlign: 'center', lineHeight: 20,
  },
  list: { padding: spacing.md, gap: spacing.sm, paddingBottom: 100 },
  listHeader: {
    fontSize: 13, color: color.textSecondary, textAlign: 'center',
    marginBottom: spacing.sm,
  },

  alertCard: { gap: spacing.sm },
  alertHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  alertStatus: { fontSize: 15, fontWeight: '600', color: color.textPrimary },
  alertTestBadge: {
    fontSize: 11, fontWeight: '700', color: color.warning, marginTop: 1,
  },
  alertDate: {
    fontSize: 12, color: color.textSecondary,
  },
  alertTime: {
    fontSize: 12, color: color.textSecondary,
  },

  alertTrigger: {
    fontSize: 13, color: color.textSecondary,
  },
  alertLink: {
    fontSize: 12, color: color.safe, marginTop: -4,
  },

  contactsSection: {
    borderTopWidth: 1, borderTopColor: color.border, paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  contactsTitle: {
    fontSize: 12, fontWeight: '600', color: color.textSecondary,
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  contactName: {
    fontSize: 13, color: color.textPrimary, flex: 1,
  },
  contactError: {
    fontSize: 11, color: color.danger, maxWidth: '40%',
  },
});
