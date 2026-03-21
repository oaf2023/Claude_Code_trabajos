/* ============================================================================
* Archivo         : bienvenida.tsx
* Descripción     : Onboarding inicial con validación real y accesibilidad básica.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Pantalla inicial de alta del usuario.
* ============================================================================ */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { COLORS } from '../src/config/constants';
import { isValidPhone, toE164 } from '../src/utils/formatPhone';

export default function BienvenidaScreen() {
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [paso, setPaso] = useState<1 | 2>(1);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const setUserPhone = useSettingsStore((s) => s.setUserPhone);
  const setUserName = useSettingsStore((s) => s.setUserName);

  /* ============================================================================
  * Función         : continuarPaso1
  * Descripción     : Valida el nombre antes de avanzar al segundo paso del onboarding.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Estado local del onboarding
  * Ingesta         : Sin argumentos
  * Devolución      : void
  * Uso             : onPress={continuarPaso1}
  * ============================================================================ */
  const continuarPaso1 = () => {
    if (!nombre.trim()) {
      Alert.alert('¡Falta tu nombre!', 'Escribí tu nombre para continuar.');
      return;
    }

    if (nombre.trim().length < 2) {
      Alert.alert('Nombre demasiado corto', 'Escribí al menos dos letras para identificarte.');
      return;
    }

    setPaso(2);
  };

  /* ============================================================================
  * Función         : finalizar
  * Descripción     : Cierra el onboarding guardando nombre y teléfono normalizado.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useSettingsStore, formatPhone, router
  * Ingesta         : Sin argumentos
  * Devolución      : void
  * Uso             : onPress={finalizar}
  * ============================================================================ */
  const finalizar = () => {
    if (!isValidPhone(telefono)) {
      Alert.alert(
        'Número inválido',
        'Escribí tu número con código de país o un formato válido para poder identificarte.'
      );
      return;
    }

    setUserName(nombre.trim());
    setUserPhone(toE164(telefono));
    setOnboarded(true);
    router.replace('/(tabs)');
  };

  if (paso === 1) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.escudo}>🛡️</Text>
          <Text style={styles.titulo}>SafeAlert</Text>
          <Text style={styles.subtitulo}>Tu seguridad, siempre a mano</Text>

          <View style={styles.tarjeta}>
            <Text style={styles.pregunta}>¿Cuál es tu nombre?</Text>
            <Text style={styles.ayuda}>Para personalizar tu alerta de emergencia</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: María García"
              placeholderTextColor={COLORS.textMuted}
              value={nombre}
              onChangeText={setNombre}
              autoFocus
              returnKeyType="next"
              onSubmitEditing={continuarPaso1}
              autoCapitalize="words"
              accessibilityLabel="Tu nombre"
              accessibilityHint="Se usa para personalizar tus alertas"
            />
          </View>

          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={continuarPaso1}
            accessibilityRole="button"
            accessibilityLabel="Continuar al paso del teléfono"
          >
            <Text style={styles.botonTexto}>CONTINUAR →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.escudo}>📱</Text>
        <Text style={styles.titulo}>Hola, {nombre}!</Text>
        <Text style={styles.subtitulo}>¿Cuál es tu número de teléfono?</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.pregunta}>Número para identificar tus alertas</Text>
          <Text style={styles.ayuda}>
            Tus contactos de confianza verán este número cuando les mandes una alerta
          </Text>
          <TextInput
            style={[styles.input, styles.inputPhone]}
            placeholder="Ej: +54 9 3364 286176"
            placeholderTextColor={COLORS.textMuted}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={finalizar}
            maxLength={20}
            accessibilityLabel="Tu número de teléfono"
            accessibilityHint="Incluye el código de país para que tus contactos te reconozcan"
          />
        </View>

        <TouchableOpacity
          style={styles.botonPrincipal}
          onPress={finalizar}
          accessibilityRole="button"
          accessibilityLabel="Finalizar onboarding y entrar a la app"
        >
          <Text style={styles.botonTexto}>¡EMPEZAR! 🚀</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonSecundario}
          onPress={() => setPaso(1)}
          accessibilityRole="button"
          accessibilityLabel="Volver al paso anterior"
        >
          <Text style={styles.botonSecundarioTexto}>← Volver</Text>
        </TouchableOpacity>

        <Text style={styles.nota}>
          🔒 Tu número solo se usa para identificarte en emergencias.
          No se comparte con terceros.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.danger },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 20,
  },
  escudo: { fontSize: 80 },
  titulo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 18,
    color: '#FEE2E2',
    textAlign: 'center',
  },
  tarjeta: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  pregunta: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
  },
  ayuda: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: COLORS.danger,
    borderRadius: 14,
    padding: 16,
    color: COLORS.text,
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 8,
  },
  inputPhone: {
    fontSize: 26,
  },
  botonPrincipal: {
    backgroundColor: COLORS.white,
    borderRadius: 50,
    paddingVertical: 20,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
  },
  botonTexto: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  botonSecundario: {
    paddingVertical: 12,
  },
  botonSecundarioTexto: {
    fontSize: 16,
    color: '#FEE2E2',
  },
  nota: {
    fontSize: 12,
    color: '#FEE2E2',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
