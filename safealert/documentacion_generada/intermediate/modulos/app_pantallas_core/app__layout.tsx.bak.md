# Archivo: app/_layout.tsx.bak

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| app/_layout.tsx.bak | 236 | TypeScript 5.9 / TSX (React Native + expo-router) | 7687 | Copia de seguridad del layout raíz (CÓDIGO LEGADO) | CÓDIGO LEGADO | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Es una copia de respaldo con extensión `.bak` del layout raíz. expo-router solo carga archivos `_layout.tsx` (sin extensión adicional), por lo que este archivo no participa en el enrutamiento. Contiene una versión anterior (1.1.0, fechada 2026-03-20) de `app/_layout.tsx` con la lógica base de hidratación, autenticación con timeout, arranque de notificaciones y restauración del modo guardia, pero sin los modales de pago, sin recuperación de alertas encoladas y sin instrumentación Sentry que sí tiene la versión activa (1.2.0).

## Clasificación y estado

[CÓDIGO LEGADO] — [NIVEL DE CERTEZA: Confirmado por código]. La extensión `.bak` impide que expo-router o TypeScript lo compilen como ruta o layout (no se encontraron importaciones del archivo; grep sin resultados). No hay ningún flujo activo que lo referencie; es material de respaldo/consulta de una versión previa.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react` (`useCallback`, `useEffect`, `useState`) | Estándar | Estado y efectos de `RootLayout` | Sí (en esta copia) |
| `react-native` (`View`, `ActivityIndicator`, `Text`, `TouchableOpacity`, `InteractionManager`) | Estándar | UI de carga/error y diferimiento de tareas | Sí (en esta copia) |
| `expo-router` (`Stack`, `Redirect`) | Externa | Navegación y redirección a bienvenida | Sí (en esta copia) |
| `expo-status-bar` (`StatusBar`) | Externa | Barra de estado | Sí (en esta copia) |
| `../src/config/firebase` (`ensureAuthenticated`) | Interna | Autenticación | Sí (en esta copia) |
| `../src/stores/useSettingsStore` | Interna | Ajustes persistidos | Sí (en esta copia) |
| `../src/stores/useGuardStore` | Interna | Estado de guardia | Sí (en esta copia) |
| `../src/config/constants` (`COLORS`) | Interna | Paleta de colores (versión anterior del tema) | Sí (en esta copia) |
| `../src/config/features` (`AUTHENTICATION_TIMEOUT_MS`) | Interna | Timeout de autenticación | Sí (en esta copia) |
| `../src/services/NotificationService` | Interna | Notificaciones | Sí (en esta copia) |
| `../src/services/WakeWordService` | Interna | Restauración del modo guardia | Sí (en esta copia) |

## Componentes que dependen de este archivo

Ninguno. La extensión `.bak` excluye el archivo de la resolución de rutas de expo-router y no existe ningún `import` hacia él. [NIVEL DE CERTEZA: Confirmado por código].

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `AUTHENTICATION_TIMEOUT_MS` | Importada de `src/config/features` | number | Timeout de autenticación | Línea 26 |
| `COLORS.danger`, `COLORS.white`, `COLORS.background`, `COLORS.text`, `COLORS.textMuted` | Paleta anterior en `src/config/constants` | string | Colores de UI | Líneas 25, 163-199 |
| `hidratado`, `listo`, `authError` | Estado local (igual que la versión activa) | boolean / string \| null | Control de arranque | 50-52 |

## Estructura (funciones / clases / tipos)

- `RootLayout(): JSX.Element` — componente raíz exportado por defecto (sin `Sentry.wrap`).
- `iniciarAutenticacion` — callback interno de autenticación con timeout.
- Efectos de hidratación, notificaciones y restauración del modo guardia.
- Sin clases ni interfaces declaradas.

## Análisis línea por línea

**Bloque de las líneas 1–28 (cabecera e importaciones):**

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

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  InteractionManager,
} from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Redirect } from 'expo-router';
import { ensureAuthenticated } from '../src/config/firebase';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { useGuardStore } from '../src/stores/useGuardStore';
import { COLORS } from '../src/config/constants';
import { AUTHENTICATION_TIMEOUT_MS } from '../src/config/features';
import { NotificationService } from '../src/services/NotificationService';
import { WakeWordService } from '../src/services/WakeWordService';
```

**Explicación de las líneas 1–28:**

- **Líneas 1–9**: cabecera documental idéntica a la del archivo activo (misma versión 1.0.0 de cabecera aunque el contenido difiere).
- **Línea 11**: hooks de React.
- **Líneas 12–18**: primitivas de React Native; destaca `InteractionManager` (línea 17), API deprecada que la versión activa reemplazó por `runWhenIdle`.
- **Líneas 19–21**: `Stack` y `Redirect` de expo-router (el `Redirect` ya no se usa en la versión activa).
- **Líneas 22–28**: autenticación, stores, `COLORS` (constantes de color anteriores al design system `src/theme/color`), flag de timeout, notificaciones y wake word. No importa `alertsCol`, `recoverIncompleteAlerts`, `Sentry`, modales de pago, `DeviceService` ni `TrialService` (diferencias clave con la versión activa).

**Bloque de las líneas 30–64 (docblock del componente, selectores, estado y efecto de hidratación):**

```tsx
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

**Explicación de las líneas 30–64:**

- **Líneas 30–40**: docblock del componente; la fecha (2026-03-20) y versión (1.1.0) confirman que esta copia quedó desactualizada respecto a la versión activa (2026-04-13, v1.2.0).
- **Línea 41**: `export default function RootLayout()` — exportación directa; la versión activa exporta `Sentry.wrap(RootLayout)` al final del archivo.
- **Líneas 42–52**: selectores de stores y estado de arranque idénticos a la versión activa (`setUserId`, `isOnboarded`, `userPhone`, `isArmed`, recordatorios, `hidratado`, `listo`, `authError`).
- **Líneas 54–64**: efecto de suscripción a la hidratación del store persistido, igual que en la versión activa.

**Bloque de las líneas 66–119 (autenticación y efecto principal):**

```tsx
  /* ============================================================================
  * Función         : iniciarAutenticacion
  * Descripción     : Inicializa la sesión segura con timeout y fallback local para no bloquear el primer render.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.1
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useSettingsStore.persist, ensureAuthenticated, NotificationService, WakeWordService
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

**Explicación de las líneas 66–119:**

- **Líneas 66–76**: docblock de `iniciarAutenticacion` (observar que el bloque "Conexiones" repite el texto del componente: copia textual previa, sin impacto técnico).
- **Líneas 77–105**: implementación idéntica a la versión activa: `Promise.race` entre `ensureAuthenticated()` y un timeout (`AUTHENTICATION_TIMEOUT_MS`); en éxito guarda el `uid`; en fallo usa `userPhone` como id local o muestra error; `finally` marca `listo`. Mismo comportamiento y mismo riesgo de fallback de identidad.
- **Líneas 107–119**: efecto principal: espera hidratación; si no hay onboarding marca listo sin autenticar; si hay onboarding llama `iniciarAutenticacion`. Igual que la versión activa.

**Bloque de las líneas 121–159 (notificaciones y restauración del modo guardia con InteractionManager):**

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

    const task = InteractionManager.runAfterInteractions(() => {
      bootstrapNotifications().catch((error) => {
        console.error('[RootLayout] No se pudieron preparar las notificaciones:', error);
      });
    });

    return () => {
      task.cancel();
    };
  }, [listo, reminderNotificationsEnabled, reminderHour]);

  useEffect(() => {
    if (!listo || authError || !isOnboarded || !isArmed) {
      return;
    }

    const task = InteractionManager.runAfterInteractions(() => {
      WakeWordService.restoreAfterBoot().catch((error) => {
        console.error('[RootLayout] No se pudo restaurar el modo guardia:', error);
      });
    });

    return () => {
      task.cancel();
    };
  }, [authError, isArmed, isOnboarded, listo]);
```

**Explicación de las líneas 121–159:**

- **Líneas 121–143**: configura notificaciones y agenda el recordatorio diario cuando la app está lista. Diferencia con la versión activa: usa `InteractionManager.runAfterInteractions` (API deprecada en React Native; la versión activa la sustituyó por `runWhenIdle` con `requestIdleCallback`/`setTimeout`).
- **Líneas 145–159**: restauración del modo guardia por voz tras el arranque con las mismas condiciones (`listo`, sin `authError`, `isOnboarded`, `isArmed`) y también con `InteractionManager`.

**Bloque de las líneas 161–206 (renders de carga y de error de autenticación):**

```tsx
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

  if (!isOnboarded) {
    return <Redirect href="/bienvenida" />;
  }
```

**Explicación de las líneas 161–206:**

- **Líneas 161–167**: spinner de carga sobre `COLORS.danger` mientras no haya hidratación o arranque; equivalente visual de la versión activa pero con la paleta `COLORS` antigua.
- **Líneas 169–202**: pantalla de error con el mismo texto visible ("No se pudo iniciar SafeAlert", "Reintentar autenticación") que la versión activa, usando `COLORS.text`/`COLORS.textMuted` en lugar de `color.textPrimary`/`color.textSecondary`.
- **Líneas 204–206**: [DIFERENCIA CLAVE] cuando no hay onboarding, esta versión devuelve `<Redirect href="/bienvenida" />`; la versión activa en cambio evita autenticar y usa `initialRouteName="bienvenida"` en el `Stack`. Este `Redirect` además se evalúa tras la autenticación (en la versión activa el orden lógico cambió para no autenticar a usuarios sin onboarding).

**Bloque de las líneas 208–236 (render con el Stack y cierre):**

```tsx
  return (
    <>
      <StatusBar style="light" backgroundColor={COLORS.danger} />
      <Stack
        initialRouteName="(tabs)"
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
```

**Explicación de las líneas 208–236:**

- **Líneas 210–218**: `StatusBar` y `Stack` con `initialRouteName="(tabs)"` fijo (la versión activa lo hace dinámico según `isOnboarded`).
- **Líneas 219–233**: pantallas registradas: `(tabs)`, `bienvenida`, `contacts/[id]` (modal "Contacto"), `permissions` (modal "Permisos requeridos") y `test-alert` (modal "Probar Alerta"). [DIFERENCIA CLAVE] falta la pantalla `como-funciona` (modal "Cómo Funciona SafeAlert") que sí está registrada en la versión activa.
- **Líneas 234–236**: cierre del fragmento y del componente. No hay modales de pago, ni `Sentry.wrap`, ni `export default` separado.

## Fichas de funciones y métodos

### RootLayout (líneas 41–236)

- Firma: `export default function RootLayout(): JSX.Element`
- Propósito: mismo rol que la versión activa (arranque, sesión, navegación) pero de una iteración anterior del código.
- Parámetros: ninguno. Retorno: JSX condicional.
- Dependencias: stores, `ensureAuthenticated`, notificaciones, wake word, `COLORS`.
- Flujo: hidratación → (opcional) autenticación con timeout → notificaciones y guardia → renders de carga/error → `Redirect` o `Stack`.
- Efectos secundarios y riesgos: idénticos a la versión activa en el fallback de sesión; se suma el `Redirect` condicional.

### iniciarAutenticacion (líneas 77–105)

- Misma firma, flujo y riesgos que la versión activa (ver ficha en `app/_layout.tsx.md`). Diferencia: dependencias de importación (mismas internas) y ausencia del reintento de alertas encoladas en el flujo general.

## Clases / interfaces / tipos

No hay clases ni interfaces declaradas. Tipos usados: `string | null`, `Promise<void>`, inferencia de Zustand.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Archivo con extensión `.bak`: no es compilado por expo-router ni importado; su presencia en `app/` es solo de respaldo. [NIVEL DE CERTEZA: Confirmado por código].
- [OBSERVACIÓN TÉCNICA] Diferencias principales detectadas frente a `app/_layout.tsx` (versión activa):
  1. Sin `Sentry.wrap` en la exportación.
  2. Sin efectos de ocultar splash, `deviceId`, verificación de prueba ni recuperación de alertas encoladas.
  3. Sin modales globales de pago (`PaymentOverdueModal`, `PaymentModal`, `TrialExpiredModal`).
  4. Usa `InteractionManager.runAfterInteractions` (deprecado) en lugar de `runWhenIdle`.
  5. Usa `COLORS` de `src/config/constants` en lugar del design system `src/theme/color`.
  6. Usa `Redirect href="/bienvenida"` en lugar del `initialRouteName` dinámico.
  7. `initialRouteName="(tabs)"` fijo y sin pantalla `como-funciona` registrada.
- [OBSERVACIÓN TÉCNICA] El "Conexiones" del docblock de `iniciarAutenticacion` (líneas 71–73) copia el texto del componente padre; es un error documental menor heredado.
- [POTENCIALMENTE NO UTILIZADO] El archivo completo: sin referencias activas; candidato a eliminarse del repositorio tras la auditoría (mantener si se desea trazabilidad histórica en git; no se recomienda conservar respaldos dentro de `app/` porque pueden confundir herramientas de ruteo).

## Seguridad

- [MEDIO] Mismo fallback de identidad que la versión activa: `setUserId(userPhone)` sin verificación cuando falla la autenticación Firebase. [NIVEL DE CERTEZA: Confirmado por código]. Al ser CÓDIGO LEGADO el impacto real es nulo mientras no se use, pero conviene eliminarlo para evitar que alguien lo restaure.
- [INFORMATIVO] Sin secretos, tokens ni claves en el archivo; sin logs de datos sensibles.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] [RECOMENDACIÓN] Mantener un `.bak` dentro del árbol de `app/` puede llevar a confusión o a restauraciones accidentales de lógica desactualizada (sin modales de pago ni recuperación de alertas). Recomendación: eliminar el respaldo del repositorio (el historial de git lo conserva) o moverlo fuera del árbol de rutas.
- [RIESGO] Si se restaurara este archivo como `_layout.tsx`, la app perdería: instrumentación Sentry, recuperación de alertas encoladas y avisos de pago/prueba, y reintroduciría `InteractionManager` deprecado. Recomendación: tratar siempre la versión activa como fuente de verdad.
