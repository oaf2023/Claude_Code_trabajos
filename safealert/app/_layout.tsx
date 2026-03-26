/* ============================================================================
* Archivo         : _layout.tsx
* Descripción     : Layout raíz con autenticación controlada y fallback seguro.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Shell principal de Expo Router.
* ============================================================================ */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  LogBox,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { ensureAuthenticated } from '../src/config/firebase';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { useGuardStore } from '../src/stores/useGuardStore';
import { COLORS } from '../src/config/constants';
import { AUTHENTICATION_TIMEOUT_MS } from '../src/config/features';
import { NotificationService } from '../src/services/NotificationService';
import { WakeWordService } from '../src/services/WakeWordService';

/* ============================================================================
* Función         : runWhenIdle
* Descripción     : Ejecuta una tarea diferida usando requestIdleCallback con fallback a setTimeout.
* Fecha           : 2026-03-25
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : RootLayout
* Ingesta         : task: () => void
* Devolución      : () => void
* Uso             : const cancel = runWhenIdle(() => {...})
* ============================================================================ */
function runWhenIdle(task: () => void): () => void {
  if (typeof globalThis.requestIdleCallback === 'function') {
    const handle = globalThis.requestIdleCallback(() => task());
    return () => {
      if (typeof globalThis.cancelIdleCallback === 'function') {
        globalThis.cancelIdleCallback(handle);
      }
    };
  }

  const timeoutId = setTimeout(task, 0);
  return () => clearTimeout(timeoutId);
}

/* ============================================================================
* Función         : RootLayout
* Descripción     : Layout raíz con espera explícita de hidratación, autenticación y fallback seguro.
* Fecha           : 2026-03-20
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : useSettingsStore.persist, ensureAuthenticated, NotificationService, WakeWordService
* Ingesta         : Sin argumentos
* Devolución      : JSX.Element
* Uso             : Shell principal de Expo Router.
* ============================================================================ */
export default function RootLayout() {
  const setUserId = useSettingsStore((s) => s.setUserId);
  const isOnboarded = useSettingsStore((s) => s.isOnboarded);
  const userPhone = useSettingsStore((s) => s.userPhone);
  const isArmed = useGuardStore((s) => s.isArmed);
  const reminderNotificationsEnabled = useSettingsStore(
    (s) => s.reminderNotificationsEnabled
  );
  const reminderHour = useSettingsStore((s) => s.reminderHour);
  const [hidratado, setHidratado] = useState(useSettingsStore.persist.hasHydrated());
  const [listo, setListo] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Ocultar splash screen nativa al montar el componente.
  // expo-router sólo llama SplashScreen.hideAsync() cuando <Stack> monta pero
  // nuestro return anticipado (spinner) lo impide → la splash blanca persiste.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    LogBox.ignoreLogs([
      '[expo-av]: Expo AV has been deprecated',
      'This method is deprecated (as well as all React Native Firebase namespaced API)',
      'InteractionManager has been deprecated',
    ]);
  }, []);

  useEffect(() => {
    const unsubscribeHydration = useSettingsStore.persist.onFinishHydration(() => {
      setHidratado(true);
    });

    if (useSettingsStore.persist.hasHydrated()) {
      setHidratado(true);
    }

    return unsubscribeHydration;
  }, []);

  /* ============================================================================
  * Función         : iniciarAutenticacion
  * Descripción     : Inicializa la sesión segura con timeout y fallback local para no bloquear el primer render.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.1
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : ensureAuthenticated, useSettingsStore
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : await iniciarAutenticacion()
  * ============================================================================ */
  const iniciarAutenticacion = useCallback(async () => {
    setListo(false);
    setAuthError(null);

    try {
      const firebaseAuthPromise = ensureAuthenticated();
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Firebase Authentication agotó el tiempo de espera.')),
          AUTHENTICATION_TIMEOUT_MS
        )
      );

      const uid = (await Promise.race([firebaseAuthPromise, timeoutPromise])) as string;
      setUserId(uid);
    } catch (error: any) {
      if (userPhone) {
        setUserId(userPhone);
      } else {
        setUserId('');
        setAuthError(
          error?.message ||
            'No se pudo iniciar la sesión segura con Firebase. Revisa la configuración nativa.'
        );
      }
    } finally {
      setListo(true);
    }
  }, [setUserId, userPhone]);

  useEffect(() => {
    if (!hidratado) {
      return;
    }

    if (!isOnboarded) {
      setAuthError(null);
      setListo(true);
      return;
    }

    iniciarAutenticacion();
  }, [hidratado, iniciarAutenticacion, isOnboarded]);

  useEffect(() => {
    if (!listo) {
      return;
    }

    const bootstrapNotifications = async () => {
      await NotificationService.configure();

      if (reminderNotificationsEnabled) {
        await NotificationService.scheduleDailyReminder(reminderHour);
      }
    };

    const cancelTask = runWhenIdle(() => {
      bootstrapNotifications().catch((error) => {
        console.error('[RootLayout] No se pudieron preparar las notificaciones:', error);
      });
    });

    return () => {
      cancelTask();
    };
  }, [listo, reminderNotificationsEnabled, reminderHour]);

  useEffect(() => {
    if (!listo || authError || !isOnboarded || !isArmed) {
      return;
    }

    const cancelTask = runWhenIdle(() => {
      WakeWordService.restoreAfterBoot().catch((error) => {
        console.error('[RootLayout] No se pudo restaurar el modo guardia:', error);
      });
    });

    return () => {
      cancelTask();
    };
  }, [authError, isArmed, isOnboarded, listo]);

  if (!hidratado || !listo) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.white} />
      </View>
    );
  }

  if (authError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '700', color: COLORS.text, textAlign: 'center' }}>
          No se pudo iniciar SafeAlert
        </Text>
        <Text style={{ fontSize: 15, color: COLORS.textMuted, textAlign: 'center', lineHeight: 22 }}>
          {authError}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: COLORS.danger,
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 12,
          }}
          onPress={iniciarAutenticacion}
        >
          <Text style={{ color: COLORS.white, fontSize: 15, fontWeight: '600' }}>
            Reintentar autenticación
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.danger} />
      <Stack
        initialRouteName={isOnboarded ? "(tabs)" : "bienvenida"}
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
