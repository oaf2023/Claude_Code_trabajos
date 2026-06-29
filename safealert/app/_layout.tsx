/* ============================================================================
* Archivo         : _layout.tsx
* Descripción     : Layout raíz con autenticación controlada y fallback seguro.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Shell principal de Expo Router.
* ============================================================================ */

import * as Sentry from '../src/config/sentry';

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
import { color } from '../src/theme';
import { AUTHENTICATION_TIMEOUT_MS } from '../src/config/features';
import { NotificationService } from '../src/services/NotificationService';
import { WakeWordService } from '../src/services/WakeWordService';
import { PaymentOverdueModal } from '../src/components/PaymentOverdueModal';
import { PaymentModal } from '../src/components/PaymentModal';
import { TrialExpiredModal } from '../src/components/TrialExpiredModal';
import { DeviceService } from '../src/services/DeviceService';
import { TrialService } from '../src/services/TrialService';

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
* Fecha           : 2026-04-13
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : useSettingsStore.persist, ensureAuthenticated, NotificationService, WakeWordService
* Ingesta         : Sin argumentos
* Devolución      : JSX.Element
* Uso             : Shell principal de Expo Router.
* ============================================================================ */
function RootLayout() {
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

  // ── Estado de modales de pago vencido ──────────────────────────────────────
  const paymentOverdue = useSettingsStore((s) => s.paymentOverdue);
  const hasSubscription = useSettingsStore((s) => s.hasSubscription);
  const setHasSubscription = useSettingsStore((s) => s.setHasSubscription);
  const setPaymentOverdue = useSettingsStore((s) => s.setPaymentOverdue);
  const userName = useSettingsStore((s) => s.userName ?? '');
  const userPhoneForPayment = useSettingsStore((s) => s.userPhone ?? '');
  const showOverdueAlert = useGuardStore((s) => s.showOverdueAlert);
  const setShowOverdueAlert = useGuardStore((s) => s.setShowOverdueAlert);

  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [overdueIsAfterAlert, setOverdueIsAfterAlert] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [deviceId, setDeviceId] = useState('');

  // ── Estado de modal de período de prueba vencido ───────────────────────────
  const [showTrialExpiredModal, setShowTrialExpiredModal] = useState(false);

  // Ocultar splash screen nativa al montar el componente.
  // expo-router sólo llama SplashScreen.hideAsync() cuando <Stack> monta pero
  // nuestro return anticipado (spinner) lo impide → la splash blanca persiste.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Cargar deviceId para el modal de pago
  useEffect(() => {
    let active = true;

    DeviceService.getDeviceId()
      .then((resolvedDeviceId) => {
        if (active) {
          setDeviceId(resolvedDeviceId);
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  // Mostrar aviso de pago vencido al abrir la app si hay deuda registrada
  useEffect(() => {
    if (listo && isOnboarded && paymentOverdue && !hasSubscription) {
      setOverdueIsAfterAlert(false);
      setShowOverdueModal(true);
    }
  }, [listo, isOnboarded, paymentOverdue, hasSubscription]);

  // Mostrar aviso cuando AlertService disparó alerta con pago vencido
  useEffect(() => {
    if (showOverdueAlert) {
      setOverdueIsAfterAlert(true);
      setShowOverdueModal(true);
      setShowOverdueAlert(false);
    }
  }, [showOverdueAlert, setShowOverdueAlert]);

  // Verificar período de prueba al iniciar la app
  useEffect(() => {
    if (!listo || !isOnboarded || !deviceId) return;

    const verificarPrueba = async () => {
      try {
        const estado = await TrialService.checkPrueba(deviceId);
        if (estado.activo && estado.expirado && !estado.pago) {
          setShowTrialExpiredModal(true);
        }
      } catch (error) {
        console.warn('[RootLayout] Error verificando período de prueba:', error);
      }
    };

    void verificarPrueba();
  }, [deviceId, listo, isOnboarded]);

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
      <View style={{ flex: 1, backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={color.textInverse} />
      </View>
    );
  }

  if (authError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color.background,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
        }}
      >
        <Text style={{ fontSize: 22, fontWeight: '700', color: color.textPrimary, textAlign: 'center' }}>
          No se pudo iniciar SafeAlert
        </Text>
        <Text style={{ fontSize: 15, color: color.textSecondary, textAlign: 'center', lineHeight: 22 }}>
          {authError}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: color.danger,
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 12,
          }}
          onPress={iniciarAutenticacion}
        >
          <Text style={{ color: color.textInverse, fontSize: 15, fontWeight: '600' }}>
            Reintentar autenticación
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={color.danger} />
      <Stack
        initialRouteName={isOnboarded ? "(tabs)" : "bienvenida"}
        screenOptions={{
          headerStyle: { backgroundColor: color.danger },
          headerTintColor: color.textInverse,
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
        <Stack.Screen
          name="como-funciona"
          options={{ title: 'Cómo Funciona SafeAlert', presentation: 'modal' }}
        />
      </Stack>

      {/* Modal global: aviso de suscripción vencida */}
      <PaymentOverdueModal
        visible={showOverdueModal}
        afterAlert={overdueIsAfterAlert}
        onPay={() => {
          setShowOverdueModal(false);
          setShowPaymentModal(true);
        }}
        onDismissed={() => {
          setShowOverdueModal(false);
        }}
      />

      {/* Modal global: pasarela de pago */}
      <PaymentModal
        visible={showPaymentModal}
        deviceId={deviceId}
        userName={userName}
        userPhone={userPhoneForPayment}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          setHasSubscription(true);
          setPaymentOverdue(false);
        }}
      />

      {/* Modal global: período de prueba vencido */}
      <TrialExpiredModal
        visible={showTrialExpiredModal}
        onSuscribirse={() => {
          setShowTrialExpiredModal(false);
          setShowPaymentModal(true);
        }}
        onCerrar={() => setShowTrialExpiredModal(false)}
      />
    </>
  );
}

export default Sentry.wrap(RootLayout);
