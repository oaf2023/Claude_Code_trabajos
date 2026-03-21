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
import { COLORS } from '../src/config/constants';

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
        <Text style={styles.headerEmoji}>🧪</Text>
        <Text style={styles.title}>Prueba de alerta</Text>
        <Text style={styles.subtitle}>
          Simula el envío de una alerta real. Los mensajes tendrán el prefijo
          [TEST] para que los contactos sepan que es una prueba.
        </Text>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>¿Qué hará esta prueba?</Text>
        <Text style={styles.infoItem}>📍 Capturará tu ubicación GPS</Text>
        <Text style={styles.infoItem}>
          💬 Registrará una alerta en la base de datos
        </Text>
        <Text style={styles.infoItem}>
          📱 Los contactos recibirán un SMS con [TEST]
        </Text>
        <Text style={styles.infoItem}>🔇 No grabará audio</Text>
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
          <Text style={styles.successTitle}>✅ Prueba completada</Text>
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
          <Text style={styles.testButtonText}>
            {alertPhase === 'capturing'
              ? '📍 Obteniendo ubicación...'
              : alertPhase === 'sending'
              ? '📤 Enviando...'
              : '🧪 Ejecutar prueba'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>← Volver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, gap: 20, paddingBottom: 40 },

  header: { alignItems: 'center', gap: 8 },
  headerEmoji: { fontSize: 48 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.text },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },

  infoBox: {
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
  infoTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  infoItem: { fontSize: 14, color: COLORS.textMuted },

  contactsPreview: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  contactsTitle: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  contactItem: { fontSize: 13, color: COLORS.textMuted },

  testButton: {
    backgroundColor: COLORS.warning,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  testButtonDisabled: { backgroundColor: '#FDE68A' },
  testButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },

  successBox: {
    backgroundColor: COLORS.safeLight,
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.safe,
  },
  successTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.safe },
  successSub: { fontSize: 13, color: COLORS.text },

  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: { fontSize: 15, color: COLORS.textMuted },
});
