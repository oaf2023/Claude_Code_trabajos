/* ============================================================================
* Archivo         : bienvenida.tsx
* Descripción     : Onboarding inicial con validación real y captura de selfie obligatoria.
* Autor           : oafon
* Fecha           : 2026-03-30
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Uso             : Pantalla inicial de alta del usuario con selfie.
* ============================================================================ */

import React, { useState, useRef } from 'react';
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
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { COLORS, COLLECTION_USERS } from '../src/config/constants';
import { isValidPhone, toE164 } from '../src/utils/formatPhone';

export default function BienvenidaScreen() {
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [selfie, setSelfie] = useState<string | null>(null);
  const [paso, setPaso] = useState<1 | 2 | 3>(1);
  const [isUploading, setIsUploading] = useState(false);
  
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const setOnboarded = useSettingsStore((s) => s.setOnboarded);
  const setUserPhone = useSettingsStore((s) => s.setUserPhone);
  const setUserName = useSettingsStore((s) => s.setUserName);
  const setUserSelfieUrl = useSettingsStore((s) => s.setUserSelfieUrl);

  /* ============================================================================
  * Función         : continuarPaso1
  * Descripción     : Valida el nombre antes de avanzar al segundo paso del onboarding.
  * Fecha           : 2026-03-30
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
  * Función         : continuarPaso2
  * Descripción     : Valida el teléfono antes de avanzar al tercer paso (selfie).
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Estado local, isValidPhone
  * Ingesta         : Sin argumentos
  * Devolución      : void
  * Uso             : onPress={continuarPaso2}
  * ============================================================================ */
  const continuarPaso2 = () => {
    if (!isValidPhone(telefono)) {
      Alert.alert(
        'Número inválido',
        'Escribí tu número con código de país o un formato válido para poder identificarte.'
      );
      return;
    }
    setPaso(3);
  };

  /* ============================================================================
  * Función         : tomarFoto
  * Descripción     : Captura una imagen con la cámara frontal.
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : expo-camera
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : onPress={tomarFoto}
  * ============================================================================ */
  const tomarFoto = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permiso denegado', 'Necesitamos la cámara para tomar tu selfie de seguridad.');
        return;
      }
    }

    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: false,
          exif: false,
        });
        if (photo) setSelfie(photo.uri);
      } catch (error) {
        console.error('Error capturando foto:', error);
        Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.');
      }
    }
  };

  /* ============================================================================
  * Función         : finalizar
  * Descripción     : Sube la selfie a Firebase Storage y crea el usuario en Firestore.
  * Fecha           : 2026-03-30
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : Firebase Firestore, Firebase Storage, useSettingsStore
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : onPress={finalizar}
  * ============================================================================ */
  const finalizar = async () => {
    if (!selfie) {
      Alert.alert('¡Falta tu selfie!', 'Toma una foto para que podamos identificarte visualmente.');
      return;
    }

    setIsUploading(true);
    try {
      const phoneE164 = toE164(telefono);
      const filename = `selfies/${phoneE164}_${Date.now()}.jpg`;
      const reference = storage().ref(filename);

      // Subir archivo
      await reference.putFile(selfie);
      const downloadURL = await reference.getDownloadURL();

      // Guardar en Firestore para activar el trigger de PythonAnywhere
      await firestore().collection(COLLECTION_USERS).doc(phoneE164).set({
        userName: nombre.trim(),
        userPhone: phoneE164,
        selfieUrl: downloadURL,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // Guardar localmente
      setUserName(nombre.trim());
      setUserPhone(phoneE164);
      setUserSelfieUrl(downloadURL);
      setOnboarded(true);

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error al finalizar el registro:', error);
      Alert.alert('Error de conexión', 'No pudimos guardar tus datos. Revisa tu conexión.');
    } finally {
      setIsUploading(false);
    }
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
            />
          </View>

          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={continuarPaso1}
          >
            <Text style={styles.botonTexto}>CONTINUAR →</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  if (paso === 2) {
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
              placeholder="Ej: +54 9 3364..."
              placeholderTextColor={COLORS.textMuted}
              value={telefono}
              onChangeText={setTelefono}
              keyboardType="phone-pad"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={continuarPaso2}
            />
          </View>

          <TouchableOpacity
            style={styles.botonPrincipal}
            onPress={continuarPaso2}
          >
            <Text style={styles.botonTexto}>CONTINUAR →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaso(1)}
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

  // Paso 3: Selfie
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.escudo}>📸</Text>
        <Text style={styles.titulo}>Foto de Perfil</Text>
        <Text style={styles.subtitulo}>Es obligatoria para que tus contactos te identifiquen visualmente.</Text>

        <View style={styles.cameraContainer}>
          {selfie ? (
            <Image source={{ uri: selfie }} style={styles.preview} />
          ) : (
            <CameraView 
               style={styles.camera} 
               facing="front" 
               ref={cameraRef}
            />
          )}
        </View>

        {isUploading ? (
          <ActivityIndicator size="large" color={COLORS.white} />
        ) : (
          <>
            {selfie ? (
              <View style={{ width: '100%', gap: 10 }}>
                <TouchableOpacity style={styles.botonPrincipal} onPress={finalizar}>
                  <Text style={styles.botonTexto}>¡TODO LISTO! 🚀</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelfie(null)}>
                  <Text style={styles.botonSecundarioTexto}>Tomar otra foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.botonPrincipal} onPress={tomarFoto}>
                <Text style={styles.botonTexto}>TOMAR FOTO 📸</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setPaso(2)}>
              <Text style={styles.botonSecundarioTexto}>← Volver al teléfono</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 18,
    color: '#FEE2E2',
    textAlign: 'center',
    marginBottom: 10,
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
    backgroundColor: '#F9FAFB',
  },
  inputPhone: { fontSize: 24 },
  botonPrincipal: {
    backgroundColor: COLORS.white,
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 48,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  botonTexto: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.danger,
    letterSpacing: 1,
  },
  botonSecundarioTexto: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cameraContainer: {
    width: 280,
    height: 280,
    borderRadius: 140,
    overflow: 'hidden',
    borderWidth: 5,
    borderColor: COLORS.white,
    backgroundColor: '#333',
  },
  camera: { flex: 1 },
  preview: { flex: 1 },
  nota: {
    fontSize: 12,
    color: '#FEE2E2',
    textAlign: 'center',
    opacity: 0.8,
  },
});