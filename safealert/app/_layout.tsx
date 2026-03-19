import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ensureAuthenticated } from '../src/config/firebase';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { COLORS } from '../src/config/constants';

export default function RootLayout() {
  const setUserId = useSettingsStore((s) => s.setUserId);
  const isOnboarded = useSettingsStore((s) => s.isOnboarded);
  const userPhone = useSettingsStore((s) => s.userPhone);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const intentar = async () => {
      try {
        console.log('[RootLayout] Iniciando autenticación anónima de Firebase...');
        
        // Agregamos un timeout manual por si Firebase se cuelga (típico en emuladores sin Play Services)
        const firebaseAuthPromise = ensureAuthenticated();
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Firebase auth timeout')), 3000));
        
        const uid = await Promise.race([firebaseAuthPromise, timeoutPromise]) as string;
        
        console.log('[RootLayout] Autenticación Firebase exitosa. UID:', uid);
        setUserId(uid);
      } catch (e: any) {
        console.warn('[RootLayout] Error o Timeout en Firebase:', e.message);
        // Si Firebase falla, usamos el teléfono como ID local
        if (userPhone) {
          console.log('[RootLayout] Usando userPhone local como UID:', userPhone);
          setUserId(userPhone);
        }
      } finally {
        console.log('[RootLayout] Inicialización terminada, marcando como listo.');
        setListo(true);
      }
    };
    intentar();
  }, []);

  useEffect(() => {
    if (!listo) return;
    if (!isOnboarded) {
      router.replace('/bienvenida');
    }
  }, [listo, isOnboarded]);

  if (!listo) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.danger} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: COLORS.danger },
          headerTintColor: COLORS.white,
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="bienvenida" options={{ headerShown: false }} />
        <Stack.Screen
          name="contacts/[id]"
          options={{ title: 'Contacto', presentation: 'modal' }}
        />
        <Stack.Screen
          name="permissions"
          options={{ title: 'Permisos requeridos', presentation: 'modal' }}
        />
        <Stack.Screen
          name="test-alert"
          options={{ title: 'Probar Alerta', presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}
