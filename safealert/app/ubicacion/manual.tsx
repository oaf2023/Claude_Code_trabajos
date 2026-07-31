/* ============================================================================
* Archivo         : manual.tsx
* Descripción     : Pantalla de carga manual de ubicación (Prompt Maestro).
*                   El usuario selecciona un punto en el mapa o escribe una
*                   dirección. Origen = MANUAL.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9 / Expo Router
* ============================================================================ */

import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { LocationService } from '../../src/services/LocationService';
import { LocationApiClient } from '../../src/services/LocationApiClient';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { color, spacing, typography, borderRadius } from '../../src/theme/tokens';

export default function UbicacionManualScreen() {
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  const userId = useSettingsStore((s) => s.userId);

  const handleConfirmar = useCallback(async () => {
    const lat = parseFloat(latitud);
    const lon = parseFloat(longitud);

    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Error', 'Ingresa latitud y longitud válidas.');
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert('Error', 'Latitud debe estar entre -90 y 90.');
      return;
    }

    if (lon < -180 || lon > 180) {
      Alert.alert('Error', 'Longitud debe estar entre -180 y 180.');
      return;
    }

    setGuardando(true);

    try {
      await LocationService.getManualLocation(lat, lon, direccion || undefined);

      if (userId) {
        await LocationApiClient.enviarUbicacionManual({
          usuario_id: userId,
          latitud: lat,
          longitud: lon,
          origen: 'MANUAL',
          permiso_ubicacion: 'NO_SOLICITADO',
          direccion_confirmada: direccion || undefined,
          observaciones: observaciones || undefined,
        });
      }

      Alert.alert('Ubicación guardada', 'Tu ubicación manual ha sido registrada.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la ubicación.');
    } finally {
      setGuardando(false);
    }
  }, [latitud, longitud, direccion, observaciones, userId]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresar ubicación manual</Text>
      <Text style={styles.subtitle}>
        Ingresa las coordenadas o una dirección para registrar tu ubicación.
      </Text>

      <Text style={styles.label}>Latitud (-90 a 90)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: -34.603722"
        placeholderTextColor={color.neutral400}
        value={latitud}
        onChangeText={setLatitud}
        keyboardType="decimal-pad"
        editable={!guardando}
      />

      <Text style={styles.label}>Longitud (-180 a 180)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: -58.381592"
        placeholderTextColor={color.neutral400}
        value={longitud}
        onChangeText={setLongitud}
        keyboardType="decimal-pad"
        editable={!guardando}
      />

      <Text style={styles.label}>Dirección (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Av. Corrientes 1234, CABA"
        placeholderTextColor={color.neutral400}
        value={direccion}
        onChangeText={setDireccion}
        editable={!guardando}
      />

      <Text style={styles.label}>Observaciones (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Ej: Cerca de la entrada principal"
        placeholderTextColor={color.neutral400}
        value={observaciones}
        onChangeText={setObservaciones}
        multiline
        numberOfLines={3}
        editable={!guardando}
      />

      <TouchableOpacity
        style={[styles.button, guardando && styles.buttonDisabled]}
        onPress={handleConfirmar}
        disabled={guardando}
      >
        <Text style={styles.buttonText}>
          {guardando ? 'Guardando...' : 'Confirmar ubicación'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={guardando}
      >
        <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.headline,
    fontWeight: '700',
    color: color.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body,
    color: color.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.caption,
    fontWeight: '600',
    color: color.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.body,
    color: color.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: color.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '700',
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cancelText: {
    color: color.textSecondary,
    fontSize: typography.body,
  },
});
