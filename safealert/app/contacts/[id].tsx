import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useContacts } from '../../src/hooks/useContacts';
import { useContactsStore } from '../../src/stores/useContactsStore';
import { isValidPhone } from '../../src/utils/formatPhone';
import { COLORS } from '../../src/config/constants';

export default function AddEditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const { addContact, updateContact } = useContacts();
  const existingContact = useContactsStore((s) =>
    s.contacts.find((c) => c.id === id)
  );

  const [name, setName] = useState(existingContact?.name ?? '');
  const [phone, setPhone] = useState(existingContact?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ name: '', phone: '' });

  const validate = (): boolean => {
    const newErrors = { name: '', phone: '' };
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    else if (!isValidPhone(phone))
      newErrors.phone = 'Número inválido (ej: +54 9 11 1234-5678)';
    setErrors(newErrors);
    return !newErrors.name && !newErrors.phone;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isNew) {
        await addContact({ name: name.trim(), phone });
      } else {
        await updateContact(id, { name: name.trim(), phone });
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el contacto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {isNew ? 'Nuevo contacto' : 'Editar contacto'}
        </Text>
        <Text style={styles.subtitle}>
          Esta persona recibirá tu ubicación y mensaje en emergencias.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            value={name}
            onChangeText={setName}
            placeholder="Ej: María García"
            autoCapitalize="words"
            returnKeyType="next"
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Teléfono (con código de país)</Text>
          <TextInput
            style={[styles.input, errors.phone ? styles.inputError : null]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+54 9 11 1234-5678"
            keyboardType="phone-pad"
            returnKeyType="done"
          />
          {errors.phone ? (
            <Text style={styles.errorText}>{errors.phone}</Text>
          ) : null}
          <Text style={styles.hint}>
            Incluye el código de país (ej: +54 para Argentina, +1 para EE.UU.)
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : isNew ? 'Agregar contacto' : 'Guardar cambios'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()}>
          <Text style={styles.cancelLinkText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, gap: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },

  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
  },
  inputError: { borderColor: COLORS.danger },
  errorText: { fontSize: 12, color: COLORS.danger },
  hint: { fontSize: 12, color: COLORS.textMuted },

  saveButton: {
    backgroundColor: COLORS.danger,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { backgroundColor: '#FCA5A5' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: COLORS.white },

  cancelLink: { alignItems: 'center', paddingVertical: 8 },
  cancelLinkText: { fontSize: 15, color: COLORS.textMuted },
});
