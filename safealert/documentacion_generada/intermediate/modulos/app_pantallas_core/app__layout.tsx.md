# Archivo: app/_layout.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| app/_layout.tsx | 425 | TypeScript 5.9 / TSX (React Native + expo-router) | 14895 | Layout raíz del enrutador (shell de la aplicación) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Es el layout raíz que expo-router carga automáticamente para toda la aplicación. Su responsabilidad es triple:

1. Controlar el arranque: esperar la hidratación del store persistido de ajustes (`useSettingsStore.persist`), ocultar la splash nativa y decidir cuándo la UI queda "lista".
2. Gestionar el estado de sesión: llamar a `ensureAuthenticated()` de Firebase con un timeout configurable y un fallback local (número de teléfono persistido) para no bloquear el primer render.
3. Declarar el `Stack` de navegación raíz (tabs, bienvenida y pantallas modales) y montar tres modales globales de monetización/estado de pago: pago vencido, pasarela de pago y período de prueba vencido.

Además arranca en segundo plano (tareas diferidas con `requestIdleCallback` o `setTimeout`) la configuración de notificaciones, el recordatorio diario, la restauración del modo guardia por voz y la recuperación de alertas encoladas no confirmadas. Todo el componente se exporta envuelto en `Sentry.wrap`.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE — [NIVEL DE CERTEZA: Confirmado por código]. El archivo es el layout raíz activo (existe una copia de seguridad `app/_layout.tsx.bak` marcada como CÓDIGO LEGADO). Todas las rutas de la app dependen de su `Stack`; los modales globales y los efectos de arranque están conectados con servicios reales de `src/services` y `src/stores`.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `../src/config/sentry` | Interna | `Sentry.wrap(RootLayout)` (línea 425) | Sí |
| `react` (`useCallback`, `useEffect`, `useState`) | Estándar (React 19) | Estado y efectos de `RootLayout` | Sí |
| `react-native` (`View`, `ActivityIndicator`, `Text`, `TouchableOpacity`, `LogBox`) | Estándar (React Native) | Spinners, pantalla de error, LogBox | Sí |
| `expo-router` (`Stack`) | Externa (Expo SDK 55) | Navegación stack raíz | Sí |
| `expo-status-bar` (`StatusBar`) | Externa | Barra de estado clara sobre color danger | Sí |
| `expo-splash-screen` (`SplashScreen`) | Externa | `hideAsync` al montar (línea 110) | Sí |
| `../src/config/firebase` (`ensureAuthenticated`, `alertsCol`) | Interna | Autenticación (205) y reintento de alertas (295) | Sí |
| `../src/stores/useSettingsStore` | Interna | Ajustes persistidos, pago y usuario | Sí |
| `../src/stores/useGuardStore` | Interna | Estado de guardia y aviso de pago vencido | Sí |
| `../src/theme` (`color`) | Interna | Paleta de colores de la UI | Sí |
| `../src/config/features` (`AUTHENTICATION_TIMEOUT_MS`) | Interna | Timeout de autenticación (línea 209) | Sí |
| `../src/services/NotificationService` | Interna | `configure` y `scheduleDailyReminder` | Sí |
| `../src/services/WakeWordService` | Interna | `restoreAfterBoot` | Sí |
| `../src/services/AlertService` (`recoverIncompleteAlerts`) | Interna | Recuperación de alertas encoladas | Sí |
| `../src/components/PaymentOverdueModal` | Interna | Modal de pago vencido (386) | Sí |
| `../src/components/PaymentModal` | Interna | Pasarela de pago (399) | Sí |
| `../src/components/TrialExpiredModal` | Interna | Modal de prueba vencida (413) | Sí |
| `../src/services/DeviceService` | Interna | `getDeviceId` para el modal de pago | Sí |
| `../src/services/TrialService` | Interna | `checkPrueba` al iniciar | Sí |

Todas las importaciones se utilizan; no se detectaron importaciones aparentemente innecesarias.

## Componentes que dependen de este archivo

Ningún import directo del archivo (grep sin resultados): en expo-router el layout raíz se resuelve por convención de archivos. Dependen de él todas las rutas declaradas en su `Stack`: `(tabs)`, `bienvenida`, `contacts/[id]`, `permissions`, `test-alert`, `como-funciona`, además de las rutas empujadas por otras pantallas mediante `router.push`.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `AUTHENTICATION_TIMEOUT_MS` | Importada de `src/config/features` (valor numérico de configuración, no expuesto) | number | Timeout máximo de la autenticación Firebase | Líneas 28, 209 |
| `hidratado` | Inicial: `useSettingsStore.persist.hasHydrated()` | boolean | Indica si el store persistido terminó de hidratarse | 84, 178-184, 311 |
| `listo` | Inicial: `false` | boolean | Indica que el arranque (hidratación + sesión) finalizó | 85, 201, 226, 237, 311 |
| `authError` | Inicial: `null` | string \| null | Mensaje de error de autenticación | 86, 202, 220, 236, 319 |
| `showOverdueModal` | `false` | boolean | Controla el modal de pago vencido | 98, 134, 142, 386 |
| `overdueIsAfterAlert` | `false` | boolean | Distingue aviso al abrir vs. tras disparar alerta | 99, 133, 141, 388 |
| `showPaymentModal` | `false` | boolean | Controla la pasarela de pago | 100, 391, 399 |
| `deviceId` | `''` | string | Identificador de dispositivo para el pago | 101, 117-121, 401 |
| `showTrialExpiredModal` | `false` | boolean | Controla el modal de prueba vencida | 104, 155, 413 |
| `estado` (en efecto de prueba) | Retorno de `TrialService.checkPrueba` | objeto con `activo`, `expirado`, `pago` | Decide si mostrar modal de prueba vencida | 153-155 |

Valores mágicos relevantes: `30000` no aparece aquí; sí se usan colores de la paleta `color.danger`, `color.background`, `color.textInverse`, etc. (sin significado adicional). El texto de timeout ("Firebase Authentication agotó el tiempo de espera.") está en línea 208.

## Estructura (funciones / clases / tipos)

- `runWhenIdle(task: () => void): () => void` — helper local (no exportado) de ejecución diferida.
- `RootLayout(): JSX.Element` — componente raíz (export por defecto mediante `Sentry.wrap`).
- `iniciarAutenticacion` — callback memoizado dentro de `RootLayout`.
- Efectos de arranque (varios `useEffect` internos).
- No hay clases ni interfaces declaradas en el archivo.

## Análisis línea por línea

**Bloque de las líneas 1–37 (cabecera de archivo e importaciones):**

```tsx
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
import { recoverIncompleteAlerts } from '../src/services/AlertService';
import { alertsCol } from '../src/config/firebase';
import { PaymentOverdueModal } from '../src/components/PaymentOverdueModal';
import { PaymentModal } from '../src/components/PaymentModal';
import { TrialExpiredModal } from '../src/components/TrialExpiredModal';
import { DeviceService } from '../src/services/DeviceService';
import { TrialService } from '../src/services/TrialService';
```

**Explicación de las líneas 1–37:**

- **Líneas 1–9**: cabecera de metadatos del archivo (autor, fecha, versión 1.0.0, lenguaje TypeScript 5.9). No aporta lógica pero documenta autoría y versionado.
- **Línea 11** (`import * as Sentry`): importa el módulo de configuración de Sentry del proyecto (wrapper sobre el SDK de Sentry para React Native). Se usa al final para instrumentar el componente.
- **Línea 13**: hooks base de React 19.
- **Líneas 14–20**: primitivas de React Native; `LogBox` se usará solo en desarrollo para silenciar avisos.
- **Línea 21**: `Stack` de expo-router, base del navegador de pila raíz.
- **Línea 22**: `StatusBar` para estilo de barra de estado.
- **Línea 23**: `expo-splash-screen` para ocultar la splash nativa manualmente.
- **Línea 24**: `ensureAuthenticated` — lógica central de sesión Firebase (configurada en `src/config/firebase`).
- **Línea 25**: store persistido de ajustes (usuario, onboarding, suscripción, recordatorios).
- **Línea 26**: store de guardia (estado de escucha y aviso de pago vencido).
- **Línea 27**: paleta de colores del design system.
- **Línea 28**: timeout de autenticación desde flags de funcionalidad.
- **Línea 29**: servicio de notificaciones locales.
- **Línea 30**: servicio de activación por voz (wake word).
- **Línea 31**: `recoverIncompleteAlerts` para reintentar alertas encoladas no confirmadas.
- **Línea 32**: `alertsCol` — referencia a la colección Firestore `users/{uid}/alerts`.
- **Líneas 33–35**: los tres modales globales de pago/prueba.
- **Línea 36**: `DeviceService` para obtener el identificador de dispositivo.
- **Línea 37**: `TrialService` para verificar el estado del período de prueba.

**Bloque de las líneas 39–62 (helper `runWhenIdle`):**

```tsx
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
```

**Explicación de las líneas 39–62:**

- **Líneas 39–49**: cabecera de documentación de la función según plantilla del proyecto.
- **Línea 50**: definición de `runWhenIdle`; recibe una tarea y devuelve una función de cancelación.
- **Línea 51**: comprueba si el entorno expone `requestIdleCallback` (no existe de forma nativa en React Native; sí en web; en RN suele faltar y se usa el fallback).
- **Líneas 52–57**: agenda la tarea con `requestIdleCallback` y devuelve un cancelador que usa `cancelIdleCallback` si existe.
- **Líneas 60–61**: fallback `setTimeout(task, 0)` con cancelación vía `clearTimeout`. Este patrón pospone trabajo no crítico (notificaciones, wake word, recuperación de alertas) hasta después del primer render.

**Bloque de las líneas 64–86 (componente `RootLayout`: selectores y estado de arranque):**

```tsx
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
```

**Explicación de las líneas 64–86:**

- **Líneas 64–74**: cabecera documental de `RootLayout` (versión 1.2.0, fecha 2026-04-13).
- **Línea 75**: firma del componente sin props.
- **Línea 76**: `setUserId` — permite guardar el identificador de usuario tras autenticar.
- **Línea 77**: `isOnboarded` — determina si el usuario completó la bienvenida/onboarding.
- **Línea 78**: `userPhone` — teléfono persistido, usado como fallback de identidad.
- **Línea 79**: `isArmed` — modo guardia activo (del store de guardia).
- **Líneas 80–83**: preferencias de recordatorio diario (habilitado y hora).
- **Línea 84**: estado `hidratado` inicializado directamente con `useSettingsStore.persist.hasHydrated()`. [NOTA] El nombre mezcla ortografía ("hidratado") y origen ("hydration").
- **Línea 85**: `listo` — arranque completo pendiente.
- **Línea 86**: `authError` — mensaje de error de sesión o `null`.

**Bloque de las líneas 88–128 (estado de modales, ocultar splash y cargar `deviceId`):**

```tsx
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
```

**Explicación de las líneas 88–128:**

- **Líneas 89–96**: selectores del store de ajustes relacionados con pago (`paymentOverdue`, `hasSubscription`) y del store de guardia (`showOverdueAlert`), más sus setters.
- **Líneas 98–101**: estado local de los modales y `deviceId`.
- **Línea 104**: estado del modal de prueba vencida.
- **Líneas 106–111**: al montar se llama `SplashScreen.hideAsync()` con `catch` vacío. El comentario explica por qué es necesario: los renders anticipados (spinner de carga o error) impiden que expo-router la oculte.
- **Líneas 113–128**: efecto que resuelve `DeviceService.getDeviceId()` y guarda el id en estado; usa el flag `active` para evitar `setState` tras desmontaje y `catch` silencioso. El `deviceId` alimenta la pasarela de pago (modal).

**Bloque de las líneas 130–163 (aviso de pago vencido y verificación de prueba):**

```tsx
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
```

**Explicación de las líneas 130–163:**

- **Líneas 131–136**: si la app está lista, hay onboarding completado y `paymentOverdue` es verdadero sin suscripción activa, abre el modal de pago vencido (contexto "al abrir la app").
- **Líneas 139–145**: cuando `AlertService` marca `showOverdueAlert` (alerta disparada con pago vencido), abre el mismo modal pero con `overdueIsAfterAlert = true` y limpia el flag del store de guardia.
- **Líneas 148–163**: solo cuando hay `deviceId`, llama a `TrialService.checkPrueba(deviceId)`; si la prueba está activa pero expirada y sin pago, muestra `TrialExpiredModal`. Los errores se registran con `console.warn` (sin secretos aparentes).

**Bloque de las líneas 165–187 (LogBox en desarrollo e hidratación del store):**

```tsx
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
```

**Explicación de las líneas 165–187:**

- **Líneas 165–175**: solo en `__DEV__` silencia avisos de deprecación conocidos de `expo-av`, las API namespaced de React Native Firebase e `InteractionManager` (esto último coherente con la migración del `.bak` que usaba `InteractionManager`). No afecta producción.
- **Líneas 177–187**: suscribe a `onFinishHydration` del store persistido para poner `hidratado = true`; además comprueba el estado actual por si la hidratación ya terminó. Devuelve `unsubscribeHydration` como limpieza.

**Bloque de las líneas 189–242 (autenticación con timeout y efecto principal):**

```tsx
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
```

**Explicación de las líneas 189–242:**

- **Líneas 189–199**: cabecera documental de `iniciarAutenticacion`.
- **Líneas 200–201**: `useCallback` que al inicio marca `listo = false` (la app vuelve a "cargando") y limpia errores.
- **Líneas 204–213**: compite `ensureAuthenticated()` contra una promesa de timeout (`AUTHENTICATION_TIMEOUT_MS`); si gana Firebase, `uid` se guarda con `setUserId`.
- **Líneas 215–224**: si falla (timeout o error) y existe `userPhone` persistido, se usa el teléfono como identificador local (fallback de sesión); si no hay teléfono, se limpia el id y se muestra mensaje de error al usuario.
- **Líneas 225–227**: `finally` marca `listo = true` siempre.
- **Líneas 230–242**: efecto principal de arranque: sin hidratación no hace nada; si el usuario no completó onboarding, no autentica y marca listo (para que `Stack` arranque en `bienvenida`); si ya hizo onboarding, invoca `iniciarAutenticacion`.

**Bloque de las líneas 244–282 (notificaciones y restauración del modo guardia):**

```tsx
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
```

**Explicación de las líneas 244–282:**

- **Líneas 244–266**: cuando la app queda lista, agenda (diferido) `NotificationService.configure()` y, si los recordatorios están habilitados, `scheduleDailyReminder(reminderHour)`. Depende de `reminderNotificationsEnabled` y `reminderHour`, por lo que reprograma al cambiar la preferencia. Errores a `console.error`.
- **Líneas 268–282**: solo si hay sesión sin errores, onboarding completado y guardia armada (`isArmed`), restaura el modo guardia por voz tras el arranque (`WakeWordService.restoreAfterBoot()`), también diferido y con cancelación en la limpieza.

**Bloque de las líneas 284–317 (recuperación de alertas encoladas y render de carga):**

```tsx
  // Recuperar alertas encoladas localmente que no se confirmaron (offline,
  // cierre abrupto o reinicio). Al marcar de nuevo status 'pending', la
  // Cloud Function sendAlertSMS (onDocumentWritten) reintenta el envío SMS.
  useEffect(() => {
    if (!listo || authError || !isOnboarded) {
      return;
    }

    const cancelTask = runWhenIdle(() => {
      recoverIncompleteAlerts(async (alert) => {
        try {
          await alertsCol(alert.userId).doc(alert.id).update({ status: 'pending' });
          return true;
        } catch (error) {
          console.warn('[RootLayout] No se pudo reintentar la alerta encolada:', error);
          return false;
        }
      }).catch((error) => {
        console.warn('[RootLayout] No se pudieron recuperar alertas pendientes:', error);
      });
    });

    return () => {
      cancelTask();
    };
  }, [authError, isOnboarded, listo]);

  if (!hidratado || !listo) {
    return (
      <View style={{ flex: 1, backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={color.textInverse} />
      </View>
    );
  }
```

**Explicación de las líneas 284–317:**

- **Líneas 284–309**: recuperación de alertas encoladas localmente (no confirmadas por corte o reinicio). Por cada alerta pendiente de confirmar actualiza en Firestore `status: 'pending'` en `users/{userId}/alerts/{alertId}`, lo que según el comentario hace que la Cloud Function `sendAlertSMS` (disparador `onDocumentWritten`) reintente el envío SMS. Si la actualización falla, registra advertencia y devuelve `false`.
- **Líneas 311–317**: si falta hidratación o el arranque no terminó, muestra una pantalla de carga con `ActivityIndicator` sobre fondo `color.danger` (evita renderizar el `Stack` antes de tiempo).

**Bloque de las líneas 319–352 (render de error de autenticación):**

```tsx
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
```

**Explicación de las líneas 319–352:**

- **Línea 319**: si existe `authError`, se muestra una pantalla de bloqueo completa (no se renderiza la app).
- **Líneas 331–336**: título "No se pudo iniciar SafeAlert" y el mensaje de error técnico mostrado al usuario.
- **Líneas 337–349**: botón "Reintentar autenticación" que vuelve a invocar `iniciarAutenticacion`. Texto visible correcto y accionable; no hay opción de "usar sin sesión" aquí.

**Bloque de las líneas 354–383 (render principal con el `Stack`):**

```tsx
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
```

**Explicación de las líneas 354–383:**

- **Línea 356**: `StatusBar` con texto claro y fondo `color.danger` (rojo corporativo).
- **Líneas 357–364**: `Stack` raíz; `initialRouteName` se elige dinámicamente: `(tabs)` si hay onboarding, `bienvenida` si no. Encabezados con fondo rojo y títulos en negrita.
- **Línea 365**: `(tabs)` (pestañas Inicio/Historial/Contactos/Ajustes) sin cabecera propia (cada tab la define).
- **Línea 366**: `bienvenida` sin cabecera (flujo de onboarding).
- **Líneas 367–370**: `contacts/[id]` presentado como modal con título "Contacto" (detalle/alta-edición de contacto).
- **Líneas 371–374**: `permissions` modal "Permisos requeridos".
- **Líneas 375–378**: `test-alert` modal "Probar Alerta".
- **Líneas 379–382**: `como-funciona` modal "Cómo Funciona SafeAlert".
- [NOTA] `ubicacion/manual` y otras rutas sin declarar aquí heredan opciones por defecto del `Stack`.

**Bloque de las líneas 385–425 (modales globales y exportación):**

```tsx
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
```

**Explicación de las líneas 385–425:**

- **Líneas 386–396**: `PaymentOverdueModal` global; si el usuario paga, cierra este modal y abre `PaymentModal`; si lo descarta, solo se cierra.
- **Líneas 399–410**: `PaymentModal` con `deviceId`, `userName` y `userPhone` para la transacción; en `onSuccess` actualiza el store (`hasSubscription = true`, `paymentOverdue = false`).
- **Líneas 413–420**: `TrialExpiredModal`; "Suscribirse" abre la pasarela de pago; "Cerrar" solo descarta.
- **Líneas 421–423**: cierre del fragmento y de la función.
- **Línea 425**: exportación por defecto de `RootLayout` envuelto en `Sentry.wrap(...)` para instrumentación de errores.

## Fichas de funciones y métodos

### runWhenIdle (líneas 50–62)

- Firma: `function runWhenIdle(task: () => void): () => void`
- Propósito técnico: agenda una tarea para cuando el hilo esté libre; funcional: evita que el arranque de servicios secundarios bloquee el primer render.
- Parámetros: `task` — función a ejecutar de forma diferida. Retorno: función canceladora. Excepciones: ninguna declarada (el error lo captura el llamador).
- Dependencias: `globalThis.requestIdleCallback` / `cancelIdleCallback` (web) y `setTimeout` / `clearTimeout`.
- Flujo: si existe `requestIdleCallback` agenda y devuelve cancelador; si no, agenda con `setTimeout(0)`.
- Efectos secundarios: ejecuta `task` de forma asíncrona; cancelador para evitar ejecución tras desmontaje.
- Riesgos: en entornos donde no exista `requestIdleCallback` la tarea se ejecuta en el siguiente tick (equivalente a un `setTimeout(0)`).

### iniciarAutenticacion (líneas 200–228)

- Firma: `const iniciarAutenticacion = useCallback(async () => {...}, [setUserId, userPhone])`
- Propósito técnico: autentica contra Firebase con límite de tiempo; funcional: garantiza identidad de usuario o fallback local antes de mostrar la app.
- Parámetros: ninguno. Retorno: `Promise<void>`. Excepciones: internamente capturadas (no propaga).
- Dependencias: `ensureAuthenticated`, `AUTHENTICATION_TIMEOUT_MS`, `setUserId`, `userPhone`.
- Flujo: 1) `setListo(false)`; 2) `Promise.race` entre Firebase y timeout; 3) éxito: `setUserId(uid)`; 4) fallo con teléfono: `setUserId(userPhone)`; 5) fallo sin teléfono: error visible; 6) `finally`: `setListo(true)`.
- Efectos secundarios: modifica `listo`, `authError` y `userId` persistido.
- Riesgos: el fallback usa el teléfono como identificador sin verificación Firebase (ver Seguridad).

### RootLayout (líneas 75–423)

- Firma: `function RootLayout(): JSX.Element`
- Propósito: componente raíz que orquesta arranque, sesión, notificaciones, guardia por voz, recuperación de alertas, navegación y modales de pago.
- Parámetros: ninguno. Retorno: JSX (spinner, pantalla de error o fragmento con `Stack` y modales).
- Dependencias: servicios y stores citados en la tabla de importaciones.
- Flujo: ver análisis línea por línea (efectos de hidratación, autenticación, notificaciones, guardia y recuperación de alertas, luego render condicional).
- Efectos secundarios: oculta splash, agenda recordatorios, actualiza documentos Firestore en recuperación de alertas.
- Riesgos: reintento de SMS vía reescritura de `status` (ver Observaciones técnicas y Seguridad).

## Clases / interfaces / tipos

No hay clases ni interfaces declaradas en este archivo. Los tipos usados son inferidos por TypeScript (`string | null`, objetos de estado). `Alert`, `Contact` y demás provienen de módulos importados (`src/types`).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Línea 84: la variable se llama `hidratado` pero su origen es la hidratación del store (`hasHydrated`); incoherencia de nomenclatura menor (español vs. inglés).
- [OBSERVACIÓN TÉCNICA] Líneas 215–224: si la autenticación Firebase falla pero existe `userPhone`, la app continúa con el teléfono como `userId`. [NIVEL DE CERTEZA: Confirmado por código]. Impacto: si las reglas de Firestore no validan realmente la identidad, cualquier valor persistido podría usarse como id de usuario; el teléfono además es un dato personal tratado como clave.
- [OBSERVACIÓN TÉCNICA] Líneas 284–309: el reintento reescribe `status: 'pending'` sobre alertas encoladas, lo que según el comentario vuelve a disparar la Cloud Function `sendAlertSMS`. [NIVEL DE CERTEZA: Altamente probable]. Riesgo: posibilidad de reintentos múltiples de SMS si la alerta no se confirma (coste y duplicados). No se observa límite de reintentos en este archivo.
- [OBSERVACIÓN TÉCNICA] Líneas 165–175: `LogBox.ignoreLogs` silencia avisos de deprecación en desarrollo; oculta señales que podrían ser útiles al migrar dependencias.
- [OBSERVACIÓN TÉCNICA] El archivo contiene una versión de respaldo `app/_layout.tsx.bak` con la misma lógica base pero sin modales de pago, sin `Sentry.wrap`, sin recuperación de alertas y usando `InteractionManager` y `Redirect` (ver análisis del `.bak`, CÓDIGO LEGADO). [NIVEL DE CERTEZA: Confirmado por código].
- [NOTA] Los modales de pago (monetización) se montan a nivel raíz: el acceso a la app no se bloquea por falta de pago, solo se muestran avisos modales.

## Seguridad

- [MEDIO] Fallback de identidad: cuando `ensureAuthenticated` falla, `setUserId(userPhone)` usa el número de teléfono persistido como identificador sin verificación en el backend. [NIVEL DE CERTEZA: Confirmado por código]. Impacto potencial: suplantación si las reglas de Firestore no exigen `auth.uid`. Depende de la política de seguridad del backend (fuera de este archivo).
- [INFORMATIVO] El error de Firebase se muestra directamente al usuario (líneas 220–223 y 335): puede filtrar detalles de configuración en pantalla. Bajo impacto porque es local al dispositivo.
- [INFORMATIVO] `console.warn`/`console.error` registran errores de servicios; no se observa impresión de tokens ni secretos.
- [INFORMATIVO] No se manipulan rutas ni se ejecuta SQL en este archivo; no hay riesgo de inyección aquí.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] [RECOMENDACIÓN] Revisar el fallback de sesión con teléfono: si Firebase no está disponible, la app opera con identidad local no verificada. Recomendación: exigir sesión Firebase para acciones sensibles (activar guardia, enviar alertas) o degradar explícitamente a un modo de solo lectura.
- [RIESGO] [RECOMENDACIÓN] El reintento de alertas encoladas puede generar múltiples envíos SMS. Recomendación: limitar reintentos por alerta y controlar idempotencia en la Cloud Function.
- [RIESGO] [RECOMENDACIÓN] El layout raíz concentra mucha lógica (sesión, pagos, notificaciones, guardia, recuperación de alertas); dificulta pruebas y mantenimiento. Recomendación: extraer a hooks dedicados (ya existen `useSettingsStore`/`useGuardStore`; faltaría un `useAppBootstrap`).
- [RIESGO] Mantener sincronizados `_layout.tsx` y su `.bak` genera confusión; recomendación eliminar el respaldo una vez auditado o versionarlo en git (fuera del alcance de esta auditoría: no se modifica nada).
