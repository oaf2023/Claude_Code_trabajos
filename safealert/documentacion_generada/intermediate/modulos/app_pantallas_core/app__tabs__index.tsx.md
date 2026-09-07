# Archivo: app/(tabs)/index.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| app/(tabs)/index.tsx | 456 | TypeScript 5.9 / TSX (React Native + expo-router) | 20995 | Pantalla principal (tab Inicio) — activación de alerta y modo guardia | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Es la pantalla Home de SafeAlert y el centro operativo de la protección. Su responsabilidad principal es el **flujo de activación de alerta** en sus dos vías:

1. **Manual (botón SOS "ENVIAR ALERTA AHORA")**: dispara `triggerManual()` del hook `useAlert` (envío inmediato de alerta con ubicación a los contactos).
2. **Automática (modo guardia)**: activación por voz mediante `WakeWordService` (motor local o API remota de audio según flags); cuando el servicio detecta la palabra, `useAlert` gestiona la cuenta atrás (`countdown`), la captura de ubicación (`capturing`) y el envío (`sending`).

Además muestra: estado de protección (`ProtectionBadge` basado en `DeviceDiagnostic`, con polling cada 30 s), retroalimentación de la última alerta, botón de pánico, tarjeta de contactos, palabras de activación visibles, un modo incógnito (pantalla negra con salida por pulsación larga de 5 s) y un modal de pago cuando no hay suscripción.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE — [NIVEL DE CERTEZA: Confirmado por código]. Todos los flujos están conectados con stores (`useGuardStore`, `useSettingsStore`, `useContactsStore`), hooks (`useAlert`, `useContacts`) y servicios (`WakeWordService`, `DeviceService`, `PaymentService`, `DeviceDiagnostic`). No hay TODOs/FIXME en el archivo.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react` (`useEffect`, `useRef`, `useState`) | Estándar | Estado, animación y efectos | Sí |
| `react-native` (`View`, `Text`, `TouchableOpacity`, `StyleSheet`, `ScrollView`, `Alert`, `Animated`, `Vibration`, `Linking`, `StatusBar`, `Platform`) | Estándar | UI, animación de pulso, vibración, enlaces, barra de estado | Sí (todas) |
| `expo-router` (`router`) | Externa | Navegación a /contacts, /permissions, /test-alert, /settings | Sí |
| `../../src/services/WakeWordService` | Interna | `isAvailable`, `start`, `stop`, `getUnavailableReason` | Sí |
| `../../src/services/DeviceService` | Interna | `getDeviceId` | Sí |
| `../../src/services/PaymentService` | Interna | `checkSubscription(id)` | Sí |
| `../../src/components/PaymentModal` | Interna | Modal de pago al activar guardia/SOS sin suscripción | Sí |
| `../../src/stores/useGuardStore` | Interna | Estado de guardia, alerta, mensajes | Sí |
| `../../src/stores/useSettingsStore` | Interna | Usuario, palabras, suscripción | Sí |
| `../../src/stores/useContactsStore` | Interna | Contactos para conteo de activos | Sí |
| `../../src/hooks/useAlert` | Interna | Máquina de estados de la alerta | Sí |
| `../../src/hooks/useContacts` | Interna | Carga de contactos | Sí |
| `../../src/utils/triggerWords` (`buildVisibleTriggerWords`) | Interna | Palabras visibles | Sí |
| `../../src/config/features` (`REMOTE_AUDIO_GUARD_CONFIGURED`, `WAKE_WORD_FOREGROUND_ONLY`) | Interna | Textos del motor de guardia | Sí |
| `../../src/theme` (`color`, `spacing`, `borderRadius`, `typography`, `shadow`) | Interna | Design system | Sí |
| `../../src/theme/Icon` | Interna | Iconos Material | Sí |
| `../../src/theme/Button`, `../../src/theme/Card` | Interna | Componentes base | Sí |
| `../../src/services/DeviceDiagnostic` (`DeviceDiagnostic`, `ProtectionLevel`) | Interna | Diagnóstico de protección | Sí |
| `../../src/components/WebModeBanner` | Interna | Aviso en web | Sí |

## Componentes que dependen de este archivo

Ningún import directo: `app/(tabs)/index.tsx` es la ruta `index` del grupo `(tabs)`, registrada por `app/(tabs)/_layout.tsx` (tab "Inicio") y visible como ruta inicial de la app (`/` o `/tabs`). Se navega hacia ella desde `bienvenida` mediante `router.replace('/(tabs)')`. [NIVEL DE CERTEZA: Confirmado por código].

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `pulseAnim` | `useRef(new Animated.Value(1))` | Animated.Value | Escala pulsante del botón de guardia | 108, 127-137, 283 |
| `isSendingManual` | `false` inicial | boolean | Estado de envío del botón SOS | 109, 188, 192, 346 |
| `isBlackScreen` | `false` inicial | boolean | Modo incógnito (pantalla negra) | 110, 154, 195 |
| `showPayment` | `false` inicial | boolean | Controla el `PaymentModal` local | 111, 172, 187, 380 |
| `deviceId` | `''` inicial | string | Id de dispositivo para suscripción/pago | 112, 116-118, 382 |
| `protectionLevel` | `'active'` inicial | ProtectionLevel | Nivel de protección del badge | 113, 120, 232 |
| `activeCount` | Contactos activos del store | number | Contactos que reciben alertas | 95, 162, 186, 216, 326-334 |
| Intervalo de polling de diagnóstico | `30000` (30 s) | number | Re-evaluación periódica del nivel de protección | Línea 121 |
| Duración de vibración | 100 / 200 ms; patrón `[0, 200, 100, 200]` | number | Feedback háptico (modo incógnito, guardia, SOS) | 154, 176, 189 |
| Animación de pulso | `1 → 1.12`, 1200 ms por fase | number | Efecto visual del guardia activo | 129-131 |

## Estructura (funciones / clases / tipos)

- `resolveGuardIcon(isArmed, alertPhase, status)` — decide icono y etiqueta del botón central de guardia (líneas 48–58).
- `ProtectionBadge({ level })` — insignia de estado de protección (líneas 60–73).
- `HomeScreen()` — pantalla por defecto (líneas 75–390), con manejadores internos:
  - `dismissAlertFeedback` (línea 139).
  - `toggleBlackScreen` (línea 154).
  - `toggleGuard` (líneas 156–181).
  - `handlePanicButton` (líneas 183–193).
- `localStyles` — hoja de estilos (líneas 392–456).
- Tipos importados: `ProtectionLevel` y props de `Icon`.

## Análisis línea por línea

**Bloque de las líneas 1–46 (cabecera e importaciones):**

```tsx
/* ============================================================================
* Archivo         : index.tsx
* Descripción     : Pantalla principal simplificada con design system,
*                   iconos Material y chequeo de protección visible.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Pantalla Home de la app.
* ============================================================================ */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Animated,
  Vibration,
  Linking,
  StatusBar,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { WakeWordService } from '../../src/services/WakeWordService';
import { DeviceService } from '../../src/services/DeviceService';
import { PaymentService } from '../../src/services/PaymentService';
import { PaymentModal } from '../../src/components/PaymentModal';
import { useGuardStore } from '../../src/stores/useGuardStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { useContactsStore } from '../../src/stores/useContactsStore';
import { useAlert } from '../../src/hooks/useAlert';
import { useContacts } from '../../src/hooks/useContacts';
import { buildVisibleTriggerWords } from '../../src/utils/triggerWords';
import {
  REMOTE_AUDIO_GUARD_CONFIGURED,
  WAKE_WORD_FOREGROUND_ONLY,
} from '../../src/config/features';
import { color, spacing, borderRadius, typography, shadow } from '../../src/theme';
import { Icon } from '../../src/theme/Icon';
import { Button } from '../../src/theme/Button';
import { Card } from '../../src/theme/Card';
import { DeviceDiagnostic, ProtectionLevel } from '../../src/services/DeviceDiagnostic';
import { WebModeBanner } from '../../src/components/WebModeBanner';
```

**Explicación de las líneas 1–46:**

- **Líneas 1–10**: cabecera documental (versión 2.0.0, 2026-06-29).
- **Línea 12**: hooks de React.
- **Líneas 13–25**: primitivas de RN; se usan todas: `Alert` (diálogos), `Animated` (pulso), `Vibration` (hápticos), `Linking` (importado; ver observación sobre su uso aparente), `StatusBar` (ocultar en modo incógnito), `Platform` (banner web), `ScrollView`, `TouchableOpacity`, `StyleSheet`, `Text`, `View`.
- **Línea 26**: `router` de expo-router para navegar.
- **Líneas 27–46**: servicios, stores, hooks, utilidades, flags de features y componentes del design system. Todos verificados en uso a lo largo del archivo.
- [OBSERVACIÓN TÉCNICA] `Linking` (línea 22) se importa pero no se encontró ningún uso posterior (no aparece `Linking.openURL` ni similar en el resto del archivo). Marcar como [POTENCIALMENTE NO UTILIZADO] a nivel de import.

**Bloque de las líneas 48–73 (helpers `resolveGuardIcon` y `ProtectionBadge`):**

```tsx
function resolveGuardIcon(isArmed: boolean, alertPhase: string, status: string | null): { icon: React.ComponentProps<typeof Icon>['name']; label: string } {
  if (!isArmed) return { icon: 'lock-open', label: 'ACTIVAR\nGUARDIA' };
  if (alertPhase === 'countdown') return { icon: 'warning', label: 'ALERTA\nDETECTADA' };
  if (alertPhase === 'capturing' || alertPhase === 'sending') return { icon: 'send', label: 'ENVIANDO\nALERTA' };
  const s = (status || '').toLowerCase();
  if (s.includes('analizando')) return { icon: 'psychology', label: 'ANALIZANDO\nAUDIO' };
  if (s.includes('detecté') || s.includes('coincidencia')) return { icon: 'emergency', label: 'ALERTA\nPOR VOZ' };
  if (s.includes('grab')) return { icon: 'mic', label: 'GRABANDO\nAUDIO' };
  if (s.includes('problema') || s.includes('error')) return { icon: 'warning', label: 'REVISAR\nGUARDIA' };
  return { icon: 'shield', label: 'GUARDIA\nACTIVA' };
}

function ProtectionBadge({ level }: { level: ProtectionLevel }) {
  const config = {
    active: { icon: 'check-circle' as const, color: color.safe, bg: color.safeLight, label: 'Protección activa' },
    limited: { icon: 'warning' as const, color: color.warning, bg: color.warningLight, label: 'Protección limitada' },
    stopped: { icon: 'cancel' as const, color: color.danger, bg: color.dangerLight, label: 'Protección detenida' },
  };
  const c = config[level];
  return (
    <View style={[localStyles.protectionBadge, { backgroundColor: c.bg }]}>
      <Icon name={c.icon} size={16} color={c.color} />
      <Text style={[localStyles.protectionBadgeText, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}
```

**Explicación de las líneas 48–73:**

- **Línea 48**: `resolveGuardIcon` devuelve icono Material + etiqueta (con salto de línea) para el botón central según el estado.
- **Línea 49**: desarmado: candado abierto y "ACTIVAR GUARDIA".
- **Líneas 50–51**: durante cuenta atrás o envío muestra "ALERTA DETECTADA" / "ENVIANDO ALERTA".
- **Líneas 52–56**: interpreta el `guardStatusMessage` en minúsculas con subcadenas ("analizando", "detecté"/"coincidencia", "grab", "problema"/"error") para elegir icono y etiqueta de escucha. [OBSERVACIÓN TÉCNICA] Es un acoplamiento frágil por coincidencia de subcadenas en texto libre del servicio; si cambia la redacción del mensaje, el estado visual cambia.
- **Línea 57**: estado por defecto armado: escudo y "GUARDIA ACTIVA".
- **Líneas 60–73**: `ProtectionBadge` mapea el nivel (`active`/`limited`/`stopped`) a icono, colores y etiqueta visibles ("Protección activa", "Protección limitada", "Protección detenida") y lo pinta como píldora con fondo suave.

**Bloque de las líneas 75–113 (inicio de `HomeScreen`, selectores y estado local):**

```tsx
export default function HomeScreen() {
  const isArmed = useGuardStore((s) => s.isArmed);
  const setArmed = useGuardStore((s) => s.setArmed);
  const resetAlertState = useGuardStore((s) => s.resetAlertState);
  const setLastAlert = useGuardStore((s) => s.setLastAlert);
  const guardStatusMessage = useGuardStore((s) => s.guardStatusMessage);
  const lastHeardTranscript = useGuardStore((s) => s.lastHeardTranscript);

  const {
    alertPhase,
    countdownSeconds,
    lastAlert,
    detectedKeyword,
    triggerManual,
    cancelCountdown,
    isAlerting,
  } = useAlert();

  const { loading: contactsLoading } = useContacts();
  const contacts = useContactsStore((s) => s.contacts);
  const activeCount = contacts.filter((c) => c.active).length;
  const userId = useSettingsStore((s) => s.userId);
  const triggerWords = useSettingsStore((s) => s.triggerWords);
  const hasSubscription = useSettingsStore((s) => s.hasSubscription);
  const userName = useSettingsStore((s) => s.userName ?? '');
  const userPhone = useSettingsStore((s) => s.userPhone ?? '');
  const visibleTriggerWords = buildVisibleTriggerWords(triggerWords);
  const wakeWordAvailable = WakeWordService.isAvailable();
  const guardEngineLabel = REMOTE_AUDIO_GUARD_CONFIGURED
    ? 'API remota de audio'
    : 'motor local de wake word';
  const guardButton = resolveGuardIcon(isArmed, alertPhase, guardStatusMessage);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isSendingManual, setIsSendingManual] = useState(false);
  const [isBlackScreen, setIsBlackScreen] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const [protectionLevel, setProtectionLevel] = useState<ProtectionLevel>('active');
```

**Explicación de las líneas 75–113:**

- **Líneas 75–81**: selectores del store de guardia: estado armado, setters, reseteo de alerta, mensaje de escucha y último transcripto oído.
- **Líneas 83–91**: hook `useAlert` — expone la máquina de fases de alerta (`alertPhase`: idle/countdown/capturing/sending/…), segundos de cuenta atrás, última alerta, palabra detectada, disparo manual, cancelación e `isAlerting`.
- **Línea 93**: carga de contactos vía hook (solo interesa `loading`).
- **Líneas 94–95**: contactos del store y conteo de activos (`activeCount`), clave para habilitar guardia/SOS.
- **Líneas 96–100**: `userId`, palabras de activación, suscripción, nombre y teléfono (para el modal de pago).
- **Línea 101**: `visibleTriggerWords` — filtra palabras internas/reservadas para mostrar solo las visibles.
- **Líneas 102–103**: disponibilidad del wake word y etiqueta del motor según flag `REMOTE_AUDIO_GUARD_CONFIGURED`.
- **Línea 106**: `guardButton` — icono/etiqueta calculados una vez por render.
- **Líneas 108–113**: estado local: valor animado de pulso, envío manual, pantalla negra, modal de pago, `deviceId` y nivel de protección inicial "activo".

**Bloque de las líneas 115–137 (efectos de arranque, suscripción, diagnóstico y animación):**

```tsx
  useEffect(() => {
    DeviceService.getDeviceId().then((id) => {
      setDeviceId(id);
      PaymentService.checkSubscription(id);
    });
    DeviceDiagnostic.run().then((r) => setProtectionLevel(r.level));
    const stop = DeviceDiagnostic.startPolling(30000);
    return stop;
  }, []);

  useEffect(() => {
    if (isArmed) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    pulseAnim.setValue(1);
  }, [isArmed, pulseAnim]);
```

**Explicación de las líneas 115–137:**

- **Líneas 115–123**: efecto de montaje: obtiene el `deviceId` (para pagos) y en cadena llama `PaymentService.checkSubscription(id)`; ejecuta `DeviceDiagnostic.run()` para el nivel inicial de protección y arranca `startPolling(30000)` (re-chequeo cada 30 s). Devuelve `stop` para detener el polling al desmontar.
- **Líneas 125–137**: si la guardia está armada, lanza un bucle de animación que escala el botón entre 1 y 1.12 (fases de 1200 ms con `useNativeDriver`); al desarmarse detiene el bucle y resetea la escala a 1.

**Bloque de las líneas 139–193 (manejadores y textos de estado de alerta):**

```tsx
  const dismissAlertFeedback = () => { resetAlertState(); setLastAlert(null); };

  const alertStatusLabel = !lastAlert ? ''
    : lastAlert.status === 'pending' ? 'Alerta registrada. Pendiente de procesamiento.'
    : lastAlert.status === 'partial' ? `Alerta enviada parcialmente a ${lastAlert.contacts.length} contactos`
    : lastAlert.status === 'failed' ? 'La alerta no pudo enviarse desde el backend.'
    : `Alerta enviada a ${lastAlert.contacts.length} contactos`;

  const alertStatusSubLabel = !lastAlert ? ''
    : lastAlert.status === 'pending' ? 'El backend todavía no confirmó el envío.'
    : lastAlert.status === 'failed'
      ? lastAlert.contacts.find((c) => c.lastError)?.lastError || 'Revisá la configuración de Functions.'
    : lastAlert.status === 'partial' ? 'Al menos un contacto no recibió la notificación.'
    : new Date(lastAlert.triggeredAt).toLocaleTimeString('es-AR');

  const toggleBlackScreen = () => { setIsBlackScreen(!isBlackScreen); Vibration.vibrate(100); };

  const toggleGuard = async () => {
    if (!wakeWordAvailable) {
      Alert.alert('No disponible', WakeWordService.getUnavailableReason());
      return;
    }
    if (!userId) return;
    if (activeCount === 0) {
      Alert.alert('Sin contactos', 'Agrega al menos un contacto antes de activar el modo guardia.',
        [{ text: 'Ir a Contactos', onPress: () => router.push('/contacts') }]);
      return;
    }
    try {
      if (isArmed) {
        await WakeWordService.stop();
        setArmed(false);
      } else {
        if (!hasSubscription) { setShowPayment(true); return; }
        await WakeWordService.start();
        setArmed(true);
      }
      Vibration.vibrate(200);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo activar el modo guardia.',
        [{ text: 'Ver Permisos', onPress: () => router.push('/permissions') }]);
    }
  };

  const handlePanicButton = async () => {
    if (!userId) { Alert.alert('Sesión no disponible', 'Reintenta en unos segundos.'); return; }
    if (contactsLoading) { Alert.alert('Cargando', 'Esperá mientras cargamos tus contactos.'); return; }
    if (activeCount === 0) { Alert.alert('Sin contactos', 'Agregá contactos de confianza primero.'); return; }
    if (!hasSubscription) { setShowPayment(true); return; }
    setIsSendingManual(true);
    Vibration.vibrate([0, 200, 100, 200]);
    try { await triggerManual(); }
    catch (e: any) { Alert.alert('Error', e.message || 'No se pudo enviar la alerta.'); }
    finally { setIsSendingManual(false); }
  };
```

**Explicación de las líneas 139–193:**

- **Línea 139**: `dismissAlertFeedback` — limpia el estado de alerta y la última alerta (botón "TERMINAR").
- **Líneas 141–145**: `alertStatusLabel` — texto principal del banner según `status` de la última alerta: "Alerta registrada. Pendiente de procesamiento." (pending), "Alerta enviada parcialmente a N contactos" (partial), "La alerta no pudo enviarse desde el backend." (failed) o "Alerta enviada a N contactos" (sent). Expone datos al usuario de forma clara.
- **Líneas 147–152**: `alertStatusSubLabel` — detalle: para `failed` muestra el primer `lastError` de un contacto (o texto de configuración de Functions); para `sent` la hora local con locale `es-AR`. [NOTA] `lastError` de un contacto se muestra tal cual en pantalla; verificar que no contenga datos sensibles del proveedor SMS.
- **Línea 154**: `toggleBlackScreen` — alterna modo incógnito con vibración corta (100 ms).
- **Líneas 156–181**: `toggleGuard` (ver ficha completa más abajo). Resumen de validaciones: disponibilidad de wake word → sesión (`userId`) → al menos un contacto activo (con acceso directo a Contactos) → suscripción activa si se va a armar. Desarmar solo llama `WakeWordService.stop()`. El bloque `catch` ofrece acceso a la pantalla de permisos.
- **Líneas 183–193**: `handlePanicButton` (ver ficha): validaciones de sesión, carga y contactos; exige suscripción; activa bandera de envío, patrón de vibración `[0, 200, 100, 200]` y dispara `triggerManual()` con manejo de error y limpieza en `finally`.

**Bloque de las líneas 195–224 (modo incógnito y overlay de cuenta atrás):**

```tsx
  if (isBlackScreen) {
    return (
      <TouchableOpacity activeOpacity={1} onLongPress={toggleBlackScreen} delayLongPress={5000}
        style={localStyles.blackScreen}
        accessibilityRole="button" accessibilityLabel="Salir del modo incógnito"
        accessibilityHint="Mantén pulsado cinco segundos para volver"
      >
        <StatusBar hidden />
      </TouchableOpacity>
    );
  }

  if (alertPhase === 'countdown') {
    return (
      <View style={localStyles.countdownOverlay}>
        <Icon name="warning" size={48} color="#FCA5A5" />
        <Text style={localStyles.countdownTitle}>ALERTA DETECTADA</Text>
        <Text style={localStyles.countdownWord}>Palabra: "{detectedKeyword}"</Text>
        <View style={localStyles.countdownCircle}>
          <Text style={localStyles.countdownNumber}>{countdownSeconds}</Text>
        </View>
        <Text style={localStyles.countdownSub}>Enviando alerta a {activeCount} contactos...</Text>
        <TouchableOpacity style={localStyles.cancelButton} onPress={cancelCountdown}
          accessibilityRole="button" accessibilityLabel="Cancelar alerta"
        >
          <Text style={localStyles.cancelButtonText}>CANCELAR</Text>
        </TouchableOpacity>
      </View>
    );
  }
```

**Explicación de las líneas 195–224:**

- **Líneas 195–205**: si el modo incógnito está activo, la pantalla entera es un `TouchableOpacity` negro que oculta la `StatusBar`; salir requiere pulsación larga de 5000 ms (`delayLongPress`). Accesibilidad declarada (rol botón, etiqueta y sugerencia). [NOTA] La salida por pulsación larga es intencionada para privacidad (evitar toques accidentales), pero también exige paciencia al usuario.
- **Líneas 207–224**: durante la fase `countdown` de `useAlert` (alerta de voz detectada o SOS con cuenta atrás), se muestra un overlay a pantalla completa: título "ALERTA DETECTADA", palabra detectada, círculo con segundos restantes, aviso "Enviando alerta a N contactos..." y botón "CANCELAR" que llama `cancelCountdown`. Es la oportunidad del usuario de abortar una falsa activación.

**Bloque de las líneas 226–262 (render principal: banner web, badge y feedback de alerta):**

```tsx
  return (
    <ScrollView style={localStyles.container} contentContainerStyle={localStyles.content}>
      {/* Web mode banner — solo visible en navegador */}
      {Platform.OS === 'web' && <WebModeBanner />}

      {/* Protection badge */}
      <ProtectionBadge level={protectionLevel} />

      {/* Alert feedback banner */}
      {lastAlert ? (
        <Card variant={lastAlert.status === 'failed' ? 'warning' : lastAlert.status === 'partial' ? 'warning' : 'success'}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name={lastAlert.status === 'failed' ? 'close' : lastAlert.status === 'partial' ? 'warning' : 'check-circle'}
              size={20} color={lastAlert.status === 'failed' ? color.danger : lastAlert.status === 'partial' ? color.warning : color.safe} />
            <Text style={localStyles.successBannerText}>{alertStatusLabel}</Text>
          </View>
          <Text style={localStyles.successBannerSub}>{alertStatusSubLabel}</Text>

          {lastAlert.audioUrl ? (
            <Text style={{ fontSize: 12, color: color.safe, marginTop: spacing.sm, fontWeight: '600' }}>
              Audio de seguimiento adjunto a la alerta.
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
            <TouchableOpacity style={localStyles.incognitoToggle} onPress={toggleBlackScreen}
              accessibilityRole="button" accessibilityLabel="Modo incógnito">
              <Icon name="visibility-off" size={16} color="#FFF" />
              <Text style={{ color: '#FFF', fontSize: 12, fontWeight: 'bold' }}>INCÓGNITO</Text>
            </TouchableOpacity>
            <TouchableOpacity style={localStyles.clearAlertButton} onPress={dismissAlertFeedback}
              accessibilityRole="button" accessibilityLabel="Terminar alerta">
              <Text style={{ color: color.textInverse, fontSize: 14, fontWeight: '700' }}>TERMINAR</Text>
            </TouchableOpacity>
          </View>
        </Card>
      ) : null}
```

**Explicación de las líneas 226–262:**

- **Líneas 227–228**: `ScrollView` principal con contenedor centrado (ancho máximo 720 en la hoja de estilos, alineado al centro para web).
- **Línea 229**: banner de modo web solo en `Platform.OS === 'web'` (`WebModeBanner`).
- **Línea 232**: insignia de protección.
- **Líneas 235–262**: si existe `lastAlert`, tarjeta de retroalimentación con variante según estado (`failed`/`partial` → warning; resto → success): icono y `alertStatusLabel`, subtítulo `alertStatusSubLabel`, indicador opcional "Audio de seguimiento adjunto a la alerta." cuando hay `audioUrl`, y dos acciones: "INCÓGNITO" (pantalla negra) y "TERMINAR" (descarta el feedback). Accesibilidad presente en ambos botones.

**Bloque de las líneas 264–322 (banner de envío y sección de guardia):**

```tsx
      {alertPhase === 'capturing' || alertPhase === 'sending' ? (
        <View style={localStyles.sendingBanner}>
          <Icon name="location-on" size={18} color={color.warning} />
          <Text style={localStyles.sendingText}>
            {alertPhase === 'capturing' ? 'Obteniendo ubicación...' : 'Enviando alerta...'}
          </Text>
        </View>
      ) : null}

      {/* Guard section */}
      {wakeWordAvailable ? (
        <View style={localStyles.guardSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Icon name="circle" size={10} color={isArmed ? color.safe : color.neutral400} />
            <Text style={localStyles.guardLabel}>
              {isArmed ? 'Modo guardia ACTIVO' : 'Modo guardia INACTIVO'}
            </Text>
          </View>

          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={[localStyles.guardButton, isArmed && localStyles.guardButtonArmed]}
              onPress={toggleGuard} activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={isArmed ? 'Desactivar modo guardia' : 'Activar modo guardia'}
            >
              <Icon name={guardButton.icon} size={40} color={color.textInverse} />
              <Text style={localStyles.guardButtonText}>{guardButton.label}</Text>
            </TouchableOpacity>
          </Animated.View>

          {isArmed ? (
            <Text style={localStyles.guardHint}>
              {WAKE_WORD_FOREGROUND_ONLY
                ? 'Detección activa mientras SafeAlert permanezca abierto.'
                : 'Detección automática activa.'}
            </Text>
          ) : null}

          <Text style={localStyles.guardHint}>Motor: {guardEngineLabel}</Text>

          {isArmed && guardStatusMessage ? (
            <Card variant="elevated">
              <Text style={{ fontWeight: '700', color: color.textPrimary }}>Estado de escucha</Text>
              <Text style={{ fontSize: 14, color: color.textSecondary, lineHeight: 20 }}>{guardStatusMessage}</Text>
              {lastHeardTranscript ? (
                <Text style={{ fontSize: 13, color: color.safe }}>Te escuché: "{lastHeardTranscript}"</Text>
              ) : null}
            </Card>
          ) : null}
        </View>
      ) : (
        <Card>
          <Text style={{ fontWeight: '700', color: color.textPrimary }}>Modo guardia automático</Text>
          <Text style={{ fontSize: 14, color: color.textSecondary, lineHeight: 20 }}>
            {WakeWordService.getUnavailableReason()} Usá el botón SOS manual.
          </Text>
        </Card>
      )}
```

**Explicación de las líneas 264–322:**

- **Líneas 264–271**: banner transitorio durante captura de ubicación o envío ("Obteniendo ubicación..." / "Enviando alerta...").
- **Líneas 274–314**: sección de guardia solo si el wake word está disponible: indicador de estado ("Modo guardia ACTIVO/INACTIVO"), botón circular de 180 px con escala animada (icono 40 px + etiqueta de `resolveGuardIcon`), nota sobre `WAKE_WORD_FOREGROUND_ONLY` (si solo escucha en primer plano, informa que la detección depende de que la app esté abierta), etiqueta del motor y, cuando está armado, una tarjeta "Estado de escucha" con `guardStatusMessage` y el último transcripto ("Te escuché: ..."). [NOTA] mostrar el transcripto al usuario confirma la detección por voz, pero también implica que el texto oído se almacena en estado/UI.
- **Líneas 315–322**: si el wake word NO está disponible, tarjeta informativa con el motivo (`getUnavailableReason()`) y la sugerencia de usar el botón SOS manual.

**Bloque de las líneas 324–390 (tarjeta de contactos, botón SOS, prueba y palabras, modal de pago):**

```tsx
      {/* Contacts card */}
      <Card onPress={() => router.push('/contacts')}
        style={activeCount === 0 ? { backgroundColor: color.warningLight } : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Icon name={activeCount === 0 ? 'warning' : 'people'} size={28}
            color={activeCount === 0 ? color.warning : color.neutral400} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: color.textPrimary }}>
              {contactsLoading ? 'Cargando contactos...'
                : activeCount === 0 ? 'Sin contactos de confianza'
                : `${activeCount} contacto${activeCount !== 1 ? 's' : ''} activo${activeCount !== 1 ? 's' : ''}`}
            </Text>
            <Text style={{ fontSize: 12, color: color.textSecondary, marginTop: 2 }}>
              {activeCount === 0 ? 'Tocá para agregar contactos' : 'Recibirán tu ubicación en emergencias'}
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={color.neutral400} />
        </View>
      </Card>

      {/* Panic button */}
      <TouchableOpacity
        style={[localStyles.panicButton, (isSendingManual || isAlerting) && { backgroundColor: '#FCA5A5' }]}
        onPress={handlePanicButton}
        disabled={isSendingManual || isAlerting}
        activeOpacity={0.7}
        accessibilityRole="button" accessibilityLabel="Enviar alerta SOS"
      >
        <Icon name="emergency" size={28} color={color.textInverse} />
        <Text style={localStyles.panicButtonText}>
          {isSendingManual ? 'Enviando...' : 'ENVIAR ALERTA AHORA'}
        </Text>
        <Text style={{ fontSize: 12, color: '#FEE2E2', marginTop: 4 }}>Ubicación a tus contactos</Text>
      </TouchableOpacity>

      {/* Test alert */}
      <Button title="Probar alerta (sin SMS real)" variant="ghost" size="sm"
        onPress={() => router.push('/test-alert')}
        accessibilityLabel="Probar alerta sin SMS real" />

      {wakeWordAvailable ? (
        <Card onPress={() => router.push('/settings')}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: color.textPrimary }}>Palabras de activación</Text>
          <Text style={{ fontSize: 12, color: color.textSecondary }}>
            {visibleTriggerWords.join(' · ')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {visibleTriggerWords.map((word) => (
              <View key={word} style={{ backgroundColor: color.dangerLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, color: color.danger, fontWeight: '500' }}>{word}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <PaymentModal
        visible={showPayment}
        deviceId={deviceId}
        userName={userName}
        userPhone={userPhone}
        onClose={() => setShowPayment(false)}
        onSuccess={() => { setShowPayment(false); useSettingsStore.getState().setHasSubscription(true); }}
      />
    </ScrollView>
  );
}
```

**Explicación de las líneas 324–390:**

- **Líneas 325–342**: tarjeta de contactos, navegable a `/contacts`; cambia de fondo a `warningLight` y a icono de advertencia cuando no hay contactos activos. Texto dinámico: "Cargando contactos...", "Sin contactos de confianza" o "N contacto(s) activo(s)", con subtítulo orientativo.
- **Líneas 345–357**: botón SOS de pánico (fondo rojo, icono `emergency`); se deshabilita mientras `isSendingManual`/`isAlerting` y cambia a tono claro con el texto "Enviando..."; subtítulo "Ubicación a tus contactos".
- **Líneas 360–362**: acceso de prueba al modal `/test-alert` ("Probar alerta (sin SMS real)") — útil en desarrollo/demo.
- **Líneas 364–378**: tarjeta (solo si wake word disponible) con las palabras de activación visibles como chips, navegable a `/settings`.
- **Líneas 380–387**: `PaymentModal` local cuando no hay suscripción; en éxito actualiza el store (`setHasSubscription(true)`). El `userPhone` se comparte con la pasarela: dato personal manejado por el flujo de pago.
- **Líneas 388–390**: cierre del `ScrollView` y del componente.

**Bloque de las líneas 392–456 (hoja de estilos `localStyles`):**

```tsx
const localStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  content: { padding: spacing.xl, gap: spacing.lg, width: '100%', maxWidth: 720, alignSelf: 'center' },

  protectionBadge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: borderRadius.full, alignSelf: 'flex-start',
  },
  protectionBadgeText: { fontSize: 13, fontWeight: '600' },

  countdownOverlay: {
    flex: 1, backgroundColor: color.dangerDark, alignItems: 'center',
    justifyContent: 'center', padding: spacing['3xl'], gap: spacing.xl,
  },
  countdownTitle: { ...typography.h1, color: color.textInverse, textAlign: 'center' },
  countdownWord: { fontSize: 18, color: '#FCA5A5', textAlign: 'center' },
  countdownCircle: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: '#FCA5A5',
  },
  countdownNumber: { fontSize: 56, fontWeight: 'bold', color: color.textInverse },
  countdownSub: { fontSize: 16, color: '#FEE2E2', textAlign: 'center' },
  cancelButton: {
    backgroundColor: color.warning, paddingHorizontal: 48, paddingVertical: 20,
    borderRadius: borderRadius.xl, marginTop: spacing.xl, minWidth: 260,
    alignItems: 'center', justifyContent: 'center', ...shadow.lg,
  },
  cancelButtonText: { ...typography.button, color: color.textInverse },

  successBannerText: { fontSize: 15, fontWeight: '600', color: color.safe, flex: 1 },
  successBannerSub: { fontSize: 12, color: color.textSecondary, marginTop: spacing.xs },
  sendingBanner: {
    backgroundColor: color.warningLight, borderRadius: borderRadius.md, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
  },
  sendingText: { fontSize: 15, color: color.warning },
  incognitoToggle: {
    backgroundColor: '#000', paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
  },
  clearAlertButton: {
    backgroundColor: color.danger, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm, alignItems: 'center', justifyContent: 'center',
  },

  guardSection: { alignItems: 'center', gap: spacing.md, marginVertical: spacing.sm },
  guardLabel: { fontSize: 14, fontWeight: '600', color: color.textSecondary },
  guardButton: {
    width: 180, height: 180, borderRadius: 90, backgroundColor: color.neutral500,
    alignItems: 'center', justifyContent: 'center', gap: spacing.sm, ...shadow.md,
  },
  guardButtonArmed: { backgroundColor: color.safe },
  guardButtonText: { ...typography.buttonSmall, color: color.textInverse, textAlign: 'center' },
  guardHint: { fontSize: 13, color: color.safe, textAlign: 'center', fontStyle: 'italic' },

  panicButton: {
    backgroundColor: color.danger, borderRadius: borderRadius.lg, padding: spacing['2xl'],
    alignItems: 'center', gap: spacing.sm, ...shadow.md,
  },
  panicButtonText: { ...typography.button, color: color.textInverse },

  blackScreen: { flex: 1, backgroundColor: '#000' },
});
```

**Explicación de las líneas 392–456:**

- **Línea 392**: `StyleSheet.create` con todos los estilos locales.
- **Líneas 393–394**: contenedor con fondo `background`; `content` centra el contenido con ancho máximo 720 (diseño adaptable a web).
- **Líneas 396–401**: píldora del badge de protección.
- **Líneas 403–421**: estilos del overlay de cuenta atrás (fondo `dangerDark`, círculo de 120 px con borde `#FCA5A5`, número de 56 px, botón CANCELAR sobre fondo `warning` con sombra `shadow.lg`).
- **Líneas 423–437**: banner de éxito/feedback y banner de envío; botones "INCÓGNITO" (fondo negro) y "TERMINAR" (fondo `danger`).
- **Líneas 439–447**: sección de guardia: botón circular de 180 px gris (`neutral500`) que pasa a verde (`safe`) al armarse; etiqueta con tipografía `buttonSmall`; nota en cursiva verde.
- **Líneas 449–453**: botón SOS con relleno amplio (`spacing['2xl']`) sobre `danger`.
- **Línea 455**: pantalla negra del modo incógnito.
- Los colores de tonalidades claras usan valores literales (`#FCA5A5`, `#FEE2E2`, `#FFF`) junto a la paleta del tema: mantenerlos sincronizados al evolucionar el tema. [NOTA]

## Fichas de funciones y métodos

### resolveGuardIcon (líneas 48–58)

- Firma: `function resolveGuardIcon(isArmed: boolean, alertPhase: string, status: string | null): { icon: ...; label: string }`
- Propósito: derivar el aspecto del botón central de guardia.
- Parámetros: `isArmed`, `alertPhase`, `status` (`guardStatusMessage`). Retorno: par icono/etiqueta.
- Flujo: prioridad a desarmado y fases de alerta; luego matcheo por subcadenas del mensaje; por defecto "GUARDIA ACTIVA".
- Riesgos: dependencia de redacción de mensajes del servicio (ver Observaciones).

### ProtectionBadge (líneas 60–73)

- Firma: `function ProtectionBadge({ level }: { level: ProtectionLevel })`
- Propósito: mostrar el estado del diagnóstico de protección.
- Parámetros: `level` ('active' | 'limited' | 'stopped'). Retorno: píldora con icono y texto.
- Efectos secundarios: ninguno (presentacional).

### toggleGuard (líneas 156–181)

- Firma: `const toggleGuard = async () => {...}`
- Propósito técnico/funcional: armar o desarmar la detección por voz (modo guardia).
- Validaciones previas: wake word disponible; `userId` presente (si no, retorno silencioso); al menos un contacto activo (con acceso directo a `/contacts`); suscripción activa para armar (si no, abre `PaymentModal`).
- Flujo: desarmar → `WakeWordService.stop()` + `setArmed(false)`; armar → `WakeWordService.start()` + `setArmed(true)`; vibración de 200 ms en éxito; en error, `Alert` con acción "Ver Permisos" (`router.push('/permissions')`).
- Excepciones: capturadas en `catch (e: any)`.
- Riesgos: si `start()` falla a mitad, el estado no se actualiza; el usuario queda informado vía diálogo.

### handlePanicButton (líneas 183–193)

- Firma: `const handlePanicButton = async () => {...}`
- Propósito: disparo manual inmediato de la alerta SOS.
- Validaciones: sesión disponible; contactos no en carga; al menos un contacto activo; suscripción activa (si no, modal de pago).
- Flujo: `setIsSendingManual(true)` → patrón de vibración → `await triggerManual()` → en error `Alert` → `finally setIsSendingManual(false)`.
- Dependencias: `useAlert.triggerManual`, `PaymentModal`.
- Riesgos: el botón SOS queda bloqueado por paywall si no hay suscripción; ver Observaciones y Seguridad.

### dismissAlertFeedback / toggleBlackScreen (líneas 139 y 154)

- `dismissAlertFeedback`: limpia el estado de la última alerta (acciones: reset del store de guardia y de `lastAlert`).
- `toggleBlackScreen`: alterna el modo incógnito y vibra 100 ms; salida requiere pulsación larga de 5 s.

### HomeScreen (líneas 75–390)

- Firma: `export default function HomeScreen(): JSX.Element`
- Propósito: pantalla central de operación de alertas y guardia.
- Parámetros: ninguno. Retorno: `ScrollView` o renders alternativos (incógnito/cuenta atrás).
- Dependencias: `useAlert`, `useGuardStore`, `useSettingsStore`, `useContactsStore`, `useContacts`, `WakeWordService`, `DeviceService`, `PaymentService`, `DeviceDiagnostic`.
- Efectos secundarios: polling de diagnóstico cada 30 s mientras está montada; inicio/parada del servicio de voz; vibraciones; navegación; apertura del modal de pago.

## Clases / interfaces / tipos

- No hay clases. Tipos: `ProtectionLevel` (importado), props de `Icon`/`Button`/`Card`, tipo `Alert` implícito desde `useAlert` (no importado aquí directamente). Los datos de `lastAlert` se consumen por propiedades (status, contacts, triggeredAt, audioUrl) sin validación de esquema en este archivo.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Líneas 52–56: el estado visual de escucha depende de subcadenas de `guardStatusMessage` en minúsculas ("analizando", "detecté", "coincidencia", "grab", "problema", "error"). [NIVEL DE CERTEZA: Confirmado por código]. Cambios de redacción en `WakeWordService` romperían silenciosamente los estados mostrados.
- [OBSERVACIÓN TÉCNICA] Línea 22: `Linking` se importa de react-native pero no se usa en el archivo. [POTENCIALMENTE NO UTILIZADO].
- [OBSERVACIÓN TÉCNICA] Líneas 172 y 187: armar el modo guardia y enviar una alerta SOS quedan condicionados a `hasSubscription`. [NIVEL DE CERTEZA: Confirmado por código]. En una app de emergencias, bloquear el envío de la alerta por falta de pago es una decisión de producto con riesgo operativo (el cobro se puede resolver después del evento; el envío, no).
- [OBSERVACIÓN TÉCNICA] Líneas 195–205: la salida del modo incógnito exige 5 s de pulsación; intencional para privacidad, pero si el usuario no lo conoce puede quedar "atrapado" en pantalla negra (el único indicio es la sugerencia de accesibilidad).
- [OBSERVACIÓN TÉCNICA] Líneas 141–152: `lastError` de un contacto se muestra literal en el subtítulo del banner; conviene validar que el proveedor SMS no incluya datos sensibles.
- [NOTA] Línea 216: durante la cuenta atrás el texto dice "Enviando alerta a N contactos..." aunque todavía no se envió (se enviará al terminar la cuenta atrás); mensaje impreciso desde el punto de vista del usuario. [NIVEL DE CERTEZA: Confirmado por código].
- [NOTA] `lastHeardTranscript` se muestra en la UI: el texto capturado por el micrófono se presenta al usuario; es un dato de audio transcrito que permanece en memoria/UI.

## Seguridad

- [MEDIO] Paywall sobre funciones de emergencia: `handlePanicButton` y `toggleGuard` no envían/arman sin `hasSubscription`. El flag vive en el store cliente (Zustand persistido), por lo que es modificable localmente; la verificación real depende del backend (`PaymentService.checkSubscription`). [NIVEL DE CERTEZA: Confirmado por código para la UI; backend fuera de alcance]. Riesgo: elusión del pago o, al contrario, bloqueo indebido de emergencias por estado local incorrecto.
- [INFORMATIVO] `userPhone` se pasa a `PaymentModal` (dato personal hacia la pasarela); asegurar que el componente/backend no lo registre innecesariamente.
- [INFORMATIVO] La app muestra el transcripto de voz detectado (`lastHeardTranscript`): información de audio personal en la UI; revisar retención y logs.
- [INFORMATIVO] No se detectan secretos ni tokens en este archivo; los errores se muestran con `Alert` o `console` sin datos de autenticación.
- [INFORMATIVO] `Vibration`, `Alert` y navegación no introducen vectores de inyección; sin SQL, paths dinámicos o CORS en este archivo.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] [RECOMENDACIÓN] Reconsiderar el bloqueo por suscripción del botón SOS: en emergencias reales debe priorizarse el envío y permitir el cobro posterior (diseño "grace period"), o al menos distinguir entre estado de pago verificado por servidor y flag local.
- [RIESGO] [RECOMENDACIÓN] Sustituir el matcheo por subcadenas de `guardStatusMessage` por un enum/estado tipado compartido entre `WakeWordService` y la UI.
- [RIESGO] [RECOMENDACIÓN] Eliminar el import sin uso de `Linking` y revisar si alguna funcionalidad de enlace (p. ej. abrir el mapa) quedó pendiente.
- [RIESGO] [RECOMENDACIÓN] Considerar un temporizador de auto-salida o un indicador en pantalla para el modo incógnito y revisar el copy "Enviando alerta a N contactos..." durante la cuenta atrás.
- [NOTA] Colores literales `#FCA5A5`, `#FEE2E2`, `#FFF` fuera de la paleta: migrar a tokens del tema si se quiere consistencia total.
