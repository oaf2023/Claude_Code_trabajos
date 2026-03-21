/* ============================================================================
* Archivo         : settings.tsx
* Descripción     : Ajustes operativos del MVP y capacidades disponibles.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Pantalla de ajustes accesible desde las tabs.
* ============================================================================ */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { COLORS } from '../../src/config/constants';
import { WAKE_WORD_FOREGROUND_ONLY } from '../../src/config/features';
import { WakeWordService } from '../../src/services/WakeWordService';
import { NotificationService } from '../../src/services/NotificationService';

export default function SettingsScreen() {
  const settings = useSettingsStore();
  const updateSettings = useSettingsStore((s) => s.updateSettings);

  const [messageTemplate, setMessageTemplate] = useState(
    settings.messageTemplate
  );
  const [newKeyword, setNewKeyword] = useState('');

  const addKeyword = () => {
    const word = newKeyword.trim().toLowerCase();
    if (!word) return;
    if (settings.triggerWords.includes(word)) {
      Alert.alert('Ya existe', `"${word}" ya está en la lista.`);
      return;
    }
    updateSettings({ triggerWords: [...settings.triggerWords, word] });
    setNewKeyword('');
  };

  const removeKeyword = (word: string) => {
    if (settings.triggerWords.length <= 1) {
      Alert.alert('Mínimo 1', 'Debe haber al menos una palabra de activación.');
      return;
    }
    updateSettings({
      triggerWords: settings.triggerWords.filter((w) => w !== word),
    });
  };

  const saveMessageTemplate = () => {
    updateSettings({ messageTemplate });
    Alert.alert('Guardado', 'Plantilla de mensaje actualizada.');
  };

  const toggleDailyReminder = async (enabled: boolean) => {
    if (enabled) {
      const permissionStatus = await NotificationService.requestPermissions();
      if (permissionStatus !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Activa las notificaciones para usar recordatorios diarios.'
        );
        return;
      }

      await NotificationService.scheduleDailyReminder(settings.reminderHour);
    } else {
      await NotificationService.cancelDailyReminder();
    }

    updateSettings({ reminderNotificationsEnabled: enabled });
  };

  const updateReminderHour = async (hour: number) => {
    updateSettings({ reminderHour: hour });

    if (settings.reminderNotificationsEnabled) {
      await NotificationService.scheduleDailyReminder(hour);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Permisos */}
      <TouchableOpacity
        style={styles.permissionsLink}
        onPress={() => router.push('/permissions')}
      >
        <Text style={styles.permissionsLinkText}>
          🔐 Ver estado de permisos →
        </Text>
      </TouchableOpacity>

      {/* Audio toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mensaje de voz</Text>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Grabar mensaje de voz</Text>
            <Text style={styles.rowSub}>
              Graba 10 segundos de audio y lo envía como segundo mensaje
            </Text>
          </View>
          <Switch
            value={settings.audioEnabled}
            onValueChange={(v) => updateSettings({ audioEnabled: v })}
            trackColor={{ false: COLORS.border, true: COLORS.dangerLight }}
            thumbColor={settings.audioEnabled ? COLORS.danger : COLORS.neutral}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recordatorios diarios</Text>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Activar recordatorio local</Text>
            <Text style={styles.rowSub}>
              Te recuerda revisar permisos y contactos una vez al día.
            </Text>
          </View>
          <Switch
            value={settings.reminderNotificationsEnabled}
            onValueChange={toggleDailyReminder}
            trackColor={{ false: COLORS.border, true: COLORS.dangerLight }}
            thumbColor={
              settings.reminderNotificationsEnabled ? COLORS.danger : COLORS.neutral
            }
          />
        </View>
        <View style={styles.sensitivityButtons}>
          {[9, 14, 20].map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[
                styles.sensitivityBtn,
                settings.reminderHour === hour && styles.sensitivityBtnActive,
              ]}
              onPress={() => updateReminderHour(hour)}
            >
              <Text
                style={[
                  styles.sensitivityBtnText,
                  settings.reminderHour === hour && styles.sensitivityBtnTextActive,
                ]}
              >
                {hour}:00
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Message template */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plantilla de mensaje</Text>
        <Text style={styles.sectionSub}>
          Usa {'{location}'} para la ubicación y {'{time}'} para la hora.
        </Text>
        <TextInput
          style={styles.textarea}
          value={messageTemplate}
          onChangeText={setMessageTemplate}
          multiline
          numberOfLines={4}
          placeholder="Ej: ¡Necesito ayuda! Ubicación: {location} — {time}"
        />
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveMessageTemplate}
        >
          <Text style={styles.saveButtonText}>Guardar plantilla</Text>
        </TouchableOpacity>
      </View>

      {/* Trigger words */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activación por voz</Text>
        {WakeWordService.isAvailable() ? (
          <>
            <Text style={styles.sectionSub}>
              El modelo español instalado escucha en Android. Mantén esta lista alineada con el modelo cargado para evitar falsas expectativas.
            </Text>
            <View style={styles.keywordsList}>
              {settings.triggerWords.map((word) => (
                <TouchableOpacity
                  key={word}
                  style={styles.keywordChip}
                  onPress={() => removeKeyword(word)}
                >
                  <Text style={styles.keywordChipText}>{word}</Text>
                  <Text style={styles.keywordChipRemove}> ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addKeywordRow}>
              <TextInput
                style={styles.addKeywordInput}
                value={newKeyword}
                onChangeText={setNewKeyword}
                placeholder="Nueva palabra..."
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={addKeyword}
              />
              <TouchableOpacity style={styles.addKeywordBtn} onPress={addKeyword}>
                <Text style={styles.addKeywordBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.sectionSub}>{WakeWordService.getUnavailableReason()}</Text>
        )}
      </View>

      {/* Sensitivity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sensibilidad de detección</Text>
        {WakeWordService.isAvailable() ? (
          <>
            <Text style={styles.sectionSub}>
              Sensibilidad actual: {Math.round(settings.wakeWordSensitivity * 100)}%
              {WAKE_WORD_FOREGROUND_ONLY
                ? ' · Solo escucha en primer plano.'
                : ''}
            </Text>
            <View style={styles.sensitivityButtons}>
              {[
                { label: 'Baja\n(menos falsos)', value: 0.4 },
                { label: 'Media\n(recomendado)', value: 0.7 },
                { label: 'Alta\n(más detección)', value: 0.9 },
              ].map(({ label, value }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.sensitivityBtn,
                    Math.abs(settings.wakeWordSensitivity - value) < 0.05 &&
                      styles.sensitivityBtnActive,
                  ]}
                  onPress={() => updateSettings({ wakeWordSensitivity: value })}
                >
                  <Text
                    style={[
                      styles.sensitivityBtnText,
                      Math.abs(settings.wakeWordSensitivity - value) < 0.05 &&
                        styles.sensitivityBtnTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.sectionSub}>
            Ajusta esta sensibilidad cuando el motor de voz y su licencia estén operativos en tu Android.
          </Text>
        )}
      </View>

      {/* Countdown seconds */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tiempo para cancelar</Text>
        {WakeWordService.isAvailable() ? (
          <>
            <Text style={styles.sectionSub}>
              Segundos para cancelar una alerta accidental
            </Text>
            <View style={styles.sensitivityButtons}>
              {[3, 5, 10].map((secs) => (
                <TouchableOpacity
                  key={secs}
                  style={[
                    styles.sensitivityBtn,
                    settings.alertCountdownSeconds === secs &&
                      styles.sensitivityBtnActive,
                  ]}
                  onPress={() =>
                    updateSettings({ alertCountdownSeconds: secs })
                  }
                >
                  <Text
                    style={[
                      styles.sensitivityBtnText,
                      settings.alertCountdownSeconds === secs &&
                        styles.sensitivityBtnTextActive,
                    ]}
                  >
                    {secs}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.sectionSub}>
            El conteo regresivo se activará cuando el motor de voz esté listo y autorizado.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 16, paddingBottom: 40 },

  permissionsLink: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  permissionsLinkText: { fontSize: 15, color: COLORS.text, fontWeight: '500' },

  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  sectionSub: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  rowSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },

  textarea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.white },

  keywordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordChip: {
    backgroundColor: COLORS.dangerLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  keywordChipText: { fontSize: 14, color: COLORS.danger, fontWeight: '500' },
  keywordChipRemove: { fontSize: 11, color: COLORS.danger },
  addKeywordRow: { flexDirection: 'row', gap: 8 },
  addKeywordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  addKeywordBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
  },
  addKeywordBtnText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },

  sensitivityButtons: { flexDirection: 'row', gap: 8 },
  sensitivityBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  sensitivityBtnActive: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerLight,
  },
  sensitivityBtnText: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  sensitivityBtnTextActive: { color: COLORS.danger, fontWeight: '600' },
});
