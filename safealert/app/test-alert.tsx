import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAlert } from '../src/hooks/useAlert';
import { useContactsStore } from '../src/stores/useContactsStore';
import { color, spacing, borderRadius, shadow } from '../src/theme';
import { Icon } from '../src/theme/Icon';

export default function TestAlertScreen() {
  const { triggerTest, alertPhase, lastAlert } = useAlert();
  const contacts = useContactsStore((s) => s.activeContacts());
  const [ran, setRan] = useState(false);

  const handleTest = async () => {
    if (contacts.length === 0) {
      Alert.alert(
        'Sin contactos',
        'Agrega contactos antes de probar la alerta.'
      );
      return;
    }
    try {
      await triggerTest();
      setRan(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo ejecutar la prueba.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Icon name="science" size={48} color={color.textPrimary} />
        <Text style={styles.title}>Prueba de alerta</Text>
        <Text style={styles.subtitle}>
          Simula el envío de una alerta real. Los mensajes tendrán el prefijo
          [TEST] para que los contactos sepan que es una prueba.
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>¿Qué hará esta prueba?</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 }}>
          <Icon name="location-on" size={16} color={color.textSecondary} />
          <Text style={styles.infoItem}>Capturará tu ubicación GPS</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 }}>
          <Icon name="chat" size={16} color={color.textSecondary} />
          <Text style={styles.infoItem}>Registrará una alerta en la base de datos</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 }}>
          <Icon name="smartphone" size={16} color={color.textSecondary} />
          <Text style={styles.infoItem}>Los contactos recibirán un SMS con [TEST]</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 2 }}>
          <Icon name="mic-off" size={16} color={color.textSecondary} />
          <Text style={styles.infoItem}>No grabará audio</Text>
        </View>
      </View>

      <View style={styles.contactsPreview}>
        <Text style={styles.contactsTitle}>
          Se enviará a {contacts.length} contacto{contacts.length !== 1 ? 's' : ''}:
        </Text>
        {contacts.map((c) => (
          <Text key={c.id} style={styles.contactItem}>
            • {c.priority === 0 ? '[Principal] ' : ''}{c.name} ({c.phone})
          </Text>
        ))}
      </View>

      {ran && alertPhase === 'sent' && lastAlert ? (
        <View style={styles.successBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="check-circle" size={20} color={color.safe} />
            <Text style={styles.successTitle}>Prueba completada</Text>
          </View>
          <Text style={styles.successSub}>
            Alerta enviada a {lastAlert.contacts.length} contactos con el
            prefijo [TEST].
          </Text>
          <Text style={styles.successSub}>
            Ubicación: {lastAlert.mapsLink}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[
            styles.testButton,
            alertPhase === 'capturing' || alertPhase === 'sending'
              ? styles.testButtonDisabled
              : null,
          ]}
          onPress={handleTest}
          disabled={
            alertPhase === 'capturing' || alertPhase === 'sending'
          }
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon
              name={alertPhase === 'capturing' ? 'location-on' : alertPhase === 'sending' ? 'send' : 'science'}
              size={20} color={color.textInverse}
            />
            <Text style={styles.testButtonText}>
              {alertPhase === 'capturing'
                ? 'Obteniendo ubicación...'
                : alertPhase === 'sending'
                ? 'Enviando...'
                : 'Ejecutar prueba'}
            </Text>
          </View>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon name="arrow-back" size={16} color={color.textSecondary} />
          <Text style={styles.backLinkText}>Volver</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  content: { padding: 24, gap: 20, paddingBottom: 40 },

  header: { alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: color.textPrimary },
  subtitle: {
    fontSize: 14,
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },

  infoBox: {
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
  infoTitle: { fontSize: 15, fontWeight: '600', color: color.textPrimary },
  infoItem: { fontSize: 14, color: color.textSecondary },

  contactsPreview: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  contactsTitle: { fontSize: 14, fontWeight: '600', color: color.textPrimary },
  contactItem: { fontSize: 13, color: color.textSecondary },

  testButton: {
    backgroundColor: color.warning,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  testButtonDisabled: { backgroundColor: '#FDE68A' },
  testButtonText: { fontSize: 16, fontWeight: 'bold', color: color.textInverse },

  successBox: {
    backgroundColor: color.safeLight,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: color.safe,
  },
  successTitle: { fontSize: 16, fontWeight: 'bold', color: color.safe },
  successSub: { fontSize: 13, color: color.textPrimary },

  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 15, color: color.textSecondary },
});
