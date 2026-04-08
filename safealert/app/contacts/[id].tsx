/* ============================================================================
* Archivo         : [id].tsx
* Descripción     : Alta y edición de contactos con validación operativa y accesibilidad.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Formulario para crear o editar contactos.
* ============================================================================ */

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
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useContacts } from '../../src/hooks/useContacts';
import { useContactsStore } from '../../src/stores/useContactsStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { DeviceService } from '../../src/services/DeviceService';
import { isValidPhone } from '../../src/utils/formatPhone';
import { COLORS } from '../../src/config/constants';
import {
  PAYMENTS_DISABLED_REASON,
  PAYMENTS_ENABLED,
} from '../../src/config/features';
import { PaymentModal } from '../../src/components/PaymentModal';

/* ============================================================================
* Función         : AddEditContactScreen
* Descripción     : Alta y edición de contactos con prioridad operativa.
* Fecha           : 2026-03-26
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : useContacts, useContactsStore, PaymentModal
* Ingesta         : Sin argumentos
* Devolución      : JSX.Element
* Uso             : Pantalla de ruta /contacts/[id]
* ============================================================================ */
export default function AddEditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const { addContact, updateContact, prioritizeContact } = useContacts();
  const existingContact = useContactsStore((s) =>
    s.contacts.find((c) => c.id === id)
  );

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [makePrimary, setMakePrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ name: '', phone: '' });

  // Payment states
  const [showPayment, setShowPayment] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const { contacts } = useContactsStore();
  const hasSubscription = useSettingsStore(s => s.hasSubscription);
  const userName = useSettingsStore(s => s.userName ?? '');
  const userPhone = useSettingsStore(s => s.userPhone ?? '');

  useEffect(() => {
    DeviceService.getDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    if (!isNew && existingContact) {
      setName(existingContact.name);
      setPhone(existingContact.phone);
      setMakePrimary(existingContact.priority === 0);
    }
  }, [id, existingContact, isNew]);

  /* ============================================================================
  * Función         : validate
  * Descripción     : Valida nombre y teléfono antes de guardar el contacto.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : handleSave, formatPhone
  * Ingesta         : Sin argumentos
  * Devolución      : boolean
  * Uso             : if (!validate()) return
  * ============================================================================ */
  const validate = (): boolean => {
    const newErrors = { name: '', phone: '' };
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';
    else if (name.trim().length < 2) newErrors.name = 'Escribe al menos 2 letras';
    if (!phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    else if (!isValidPhone(phone))
      newErrors.phone = 'Número inválido (ej: +54 9 11 1234-5678)';
    setErrors(newErrors);
    return !newErrors.name && !newErrors.phone;
  };

  /* ============================================================================
  * Función         : handleSave
  * Descripción     : Guarda el contacto luego de validar y mostrar errores operativos.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useContacts, router
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : onPress={handleSave}
  * ============================================================================ */
  const handleSave = async () => {
    if (!validate()) return;

    if (!PAYMENTS_ENABLED) {
      await performActualSave();
      return;
    }

    // Primer contacto gratis; a partir del segundo se requiere suscripción
    const isFirstContact = contacts.length === 0 && isNew;

    if (!hasSubscription && !isFirstContact) {
      setShowPayment(true);
      return;
    }

    await performActualSave();
  };

  const performActualSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const created = await addContact({
          name: name.trim(),
          phone,
        });
        if (makePrimary) {
          await prioritizeContact(created.id);
        }
      } else {
        await updateContact(id as string, {
          name: name.trim(),
          phone,
        });
        if (makePrimary) {
          await prioritizeContact(id as string);
        }
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el contacto.');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    useSettingsStore.getState().setHasSubscription(true);
    Alert.alert('¡Suscripción activa!', 'Guardando tu contacto...', [
      { text: 'OK', onPress: () => performActualSave() }
    ]);
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
          Esta persona recibirá tu ubicación y mensaje en emergencias. Evita duplicar teléfonos.
        </Text>

        {!PAYMENTS_ENABLED ? (
          <View style={styles.testingBanner}>
            <Text style={styles.testingBannerTitle}>Pruebas activas</Text>
            <Text style={styles.testingBannerText}>{PAYMENTS_DISABLED_REASON}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            value={name}
            onChangeText={setName}
            placeholder="Ej: María García"
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel="Nombre completo del contacto"
            accessibilityHint="Escribe el nombre de la persona de confianza"
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
            accessibilityLabel="Teléfono del contacto"
            accessibilityHint="Incluye el código de país para SMS y llamada asistida"
          />
          {errors.phone ? (
            <Text style={styles.errorText}>{errors.phone}</Text>
          ) : null}
          <Text style={styles.hint}>
            Incluye el código de país (ej: +54 para Argentina, +1 para EE.UU.)
          </Text>
        </View>

        <View style={styles.primaryRow}>
          <View style={styles.primaryInfo}>
            <Text style={styles.label}>Usar como contacto principal</Text>
            <Text style={styles.hint}>
              Se prioriza para la llamada asistida y para encabezar la lista de alertas.
            </Text>
          </View>
          <Switch
            value={makePrimary}
            onValueChange={setMakePrimary}
            trackColor={{ false: COLORS.border, true: COLORS.warningLight }}
            thumbColor={makePrimary ? COLORS.warning : COLORS.neutral}
            accessibilityLabel="Usar como contacto principal"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={isNew ? 'Agregar contacto de confianza' : 'Guardar cambios del contacto'}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : isNew ? 'Agregar contacto' : 'Guardar cambios'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelLink}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cancelar edición de contacto"
        >
          <Text style={styles.cancelLinkText}>Cancelar</Text>
        </TouchableOpacity>

        {PAYMENTS_ENABLED ? (
          <PaymentModal
            visible={showPayment}
            deviceId={deviceId}
            userName={userName || name.trim()}
            userPhone={userPhone || phone}
            onClose={() => setShowPayment(false)}
            onSuccess={handlePaymentSuccess}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, gap: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },
  subtitle: { fontSize: 14, color: COLORS.textMuted, lineHeight: 20 },
  testingBanner: {
    backgroundColor: COLORS.warningLight,
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  testingBannerTitle: { fontSize: 14, fontWeight: '700', color: COLORS.warning },
  testingBannerText: { fontSize: 12, color: COLORS.text, lineHeight: 18 },

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
  deliveryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },
  deliveryOptions: {
    gap: 10,
  },
  deliveryOption: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    gap: 4,
    backgroundColor: COLORS.background,
  },
  deliveryOptionSelected: {
    borderColor: COLORS.warning,
    backgroundColor: COLORS.warningLight,
  },
  deliveryOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  deliveryOptionTitleSelected: {
    color: COLORS.warning,
  },
  deliveryOptionDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
  },
  fallbackRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryRow: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryInfo: {
    flex: 1,
    gap: 4,
  },

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
