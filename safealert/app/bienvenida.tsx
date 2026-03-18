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

export default function BienvenidaScreen() {
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [paso, setPaso] = useState<1 | 2>(1);
  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const setUserPhone = useSettingsStore((s) => s.setUserPhone);
  const setUserName = useSettingsStore((s) => s.setUserName);

  const continuarPaso1 = () => {
    if (!nombre.trim()) {
      Alert.alert('¡Falta tu nombre!', 'Escribí tu nombre para continuar.');
      return;
    }
    setPaso(2);
  };

  const finalizar = () => {
    const tel = telefono.replace(/\D/g, '');
    if (tel.length < 8) {
      Alert.alert(
        '¡Número incompleto!',
        'Escribí tu número de teléfono completo.'
      );
      return;
    }
    setUserName(nombre.trim());
    setUserPhone(tel);
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
              fontSize={22}
            />
          </View>

          <TouchableOpacity style={styles.botonPrincipal} onPress={continuarPaso1}>
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
          <Text style={styles.ayuda}>
            Tus contactos de confianza verán este número cuando les mandes una alerta
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 3364286176"
            placeholderTextColor={COLORS.textMuted}
            value={telefono}
            onChangeText={setTelefono}
            keyboardType="phone-pad"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={finalizar}
            maxLength={15}
            fontSize={26}
          />
        </View>

        <TouchableOpacity style={styles.botonPrincipal} onPress={finalizar}>
          <Text style={styles.botonTexto}>¡EMPEZAR! 🚀</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.botonSecundario} onPress={() => setPaso(1)}>
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
