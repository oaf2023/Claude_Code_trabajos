# Archivo: app/(tabs)/settings.tsx

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| app/(tabs)/settings.tsx | 532 | TypeScript 5.9 / TSX (React Native + expo-router) | 19483 | Pantalla de configuración (tab Ajustes) | FUNCIONALIDAD EXISTENTE | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla de ajustes operativos del MVP. Agrupa las preferencias persistidas en `useSettingsStore` (Zustand + persistencia): grabación de mensaje de voz al enviar alertas (`audioEnabled`), recordatorios diarios locales (con selección de hora 9/14/20), plantilla de mensaje de alerta con placeholders `{location}` y `{time}`, gestión de palabras de activación por voz (alta/baja con normalización y mínimo de una palabra), sensibilidad de detección del wake word (0.4/0.7/0.9), segundos de la cuenta atrás de cancelación (3/5/10) y acceso a la gestión de datos personales (exportación y eliminación de cuenta vía `PrivacyService`, importado dinámicamente). También enlaza a las pantallas "Cómo funciona" (`/como-funciona`) y "Ver estado de permisos" (`/permissions`).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE — [NIVEL DE CERTEZA: Confirmado por código]. Todos los controles escriben en el store persistido y/o invocan servicios (`WakeWordService`, `NotificationService`, `PrivacyService`). No hay TODO/FIXME.

## Dependencias e importaciones

| Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `react` (`useState`) | Estándar | Estado local de plantilla y nueva palabra | Sí |
| `react-native` (`View`, `Text`, `TextInput`, `Switch`, `TouchableOpacity`, `ScrollView`, `StyleSheet`, `Alert`) | Estándar | UI completa | Sí (todas) |
| `expo-router` (`router`) | Externa | Navegación a /como-funciona y /permissions | Sí |
| `../../src/stores/useSettingsStore` | Interna | Ajustes persistidos | Sí |
| `../../src/theme` (`color`, `spacing`, `borderRadius`, `shadow`) | Interna | Design system | Sí |
| `../../src/theme/Icon` | Interna | Iconos Material | Sí |
| `../../src/config/features` (`WAKE_WORD_FOREGROUND_ONLY`) | Interna | Nota "solo escucha en primer plano" | Sí |
| `../../src/services/WakeWordService` | Interna | Disponibilidad del motor de voz | Sí |
| `../../src/services/NotificationService` | Interna | Permisos, programación y cancelación de recordatorios | Sí |
| `../../src/utils/triggerWords` (`buildVisibleTriggerWords`, `normalizeTriggerWord`) | Interna | Normalización de palabras | Sí |
| `../../src/services/PrivacyService` (import dinámico) | Interna | Exportación/eliminación de datos | Sí (carga bajo demanda, línea 383) |

## Componentes que dependen de este archivo

Ningún import directo: es la ruta `settings` del grupo `(tabs)`, registrada en `app/(tabs)/_layout.tsx` (tab "Config"/"Configuración"). Otras pantallas navegan a `/settings` (p. ej. la tarjeta de palabras en `index.tsx`). [NIVEL DE CERTEZA: Confirmado por código].

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `settings` | Store completo de `useSettingsStore()` | objeto | Acceso a todas las preferencias | 47, 51-52, 179-182, 197-203, 211-224, 296-314, 348-374 |
| `updateSettings` | Setter del store | función | Persistir cambios parciales | 48, 81, 107, 113, 133, 137, 180 |
| `visibleTriggerWords` | Derivado de `settings.triggerWords` | string[] | Palabras visibles (sin internas/reservadas) | 49, 259, 372 |
| `messageTemplate` | Inicial: `settings.messageTemplate` | string | Borrador de plantilla del mensaje | 51-53, 112-114, 236-237 |
| `newKeyword` | `''` | string | Input de nueva palabra de activación | 54, 69, 82, 273 |
| Horas de recordatorio | `[9, 14, 20]` | number[] | Presets de hora del recordatorio | Línea 206 |
| Sensibilidades | `0.4` / `0.7` / `0.9` | number | Presets Baja/Media/Alta | Líneas 302–305 |
| Segundos de cancelación | `3`, `5`, `10` | number | Presets de la cuenta atrás | Línea 345 |
| Umbral de comparación | `< 0.05` | number | Detección de preset activo de sensibilidad | Líneas 311, 319 |

## Estructura (funciones / clases / tipos)

- `SettingsScreen(): JSX.Element` — pantalla por defecto (líneas 46–430), con manejadores internos:
  - `addKeyword` (líneas 68–83).
  - `removeKeyword` (líneas 97–110).
  - `saveMessageTemplate` (líneas 112–115).
  - `toggleDailyReminder` (líneas 117–134).
  - `updateReminderHour` (líneas 136–142).
- `styles` — hoja de estilos (líneas 432–532).
- Sin clases ni interfaces con nombre.

## Análisis línea por línea

**Bloque de las líneas 1–54 (cabecera, imports, inicio del componente, selectores y estado):**

```tsx
/* ============================================================================
* Archivo         : settings.tsx
* Descripción     : Ajustes operativos del MVP y capacidades disponibles.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Pantalla de ajustes accesible desde las tabs.
* ============================================================================ */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { color, spacing, borderRadius, shadow } from '../../src/theme';
import { Icon } from '../../src/theme/Icon';
import { WAKE_WORD_FOREGROUND_ONLY } from '../../src/config/features';
import { WakeWordService } from '../../src/services/WakeWordService';
import { NotificationService } from '../../src/services/NotificationService';
import {
  buildVisibleTriggerWords,
  normalizeTriggerWord,
} from '../../src/utils/triggerWords';

/* ============================================================================

* Función         : SettingsScreen
* Descripción     : Renderiza ajustes operativos y la gestión de palabras de activación.
* Fecha           : 2026-03-30
* Versión         : 1.1.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : useSettingsStore, WakeWordService, NotificationService
* Ingesta         : Sin argumentos
* Devolución      : JSX.Element
* Uso             : Pantalla de configuración accesible desde tabs.
* ============================================================================ */
export default function SettingsScreen() {
  const settings = useSettingsStore();
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const visibleTriggerWords = buildVisibleTriggerWords(settings.triggerWords);

  const [messageTemplate, setMessageTemplate] = useState(
    settings.messageTemplate
  );
  const [newKeyword, setNewKeyword] = useState('');
```

**Explicación de las líneas 1–54:**

- **Líneas 1–9**: cabecera documental (descripción indica que es el set de ajustes del MVP).
- **Líneas 11–21**: imports de React y RN; todos usados (interfaz con `Switch`, `TextInput`, `Alert`).
- **Líneas 22–33**: `router`, store de ajustes, tema/iconos, flag de features, servicios de voz y notificaciones, y utilidades de palabras.
- **Líneas 34–45**: docblock de la pantalla (versión 1.1.0). [NOTA] Se aprecia una línea en blanco extra dentro del bloque de comentario (línea 35); irrelevante.
- **Línea 46**: exportación por defecto de `SettingsScreen`.
- **Línea 47**: `const settings = useSettingsStore();` — suscripción al store COMPLETO sin selector: el componente se re-renderiza con cualquier cambio de cualquier campo de ajustes. [OBSERVACIÓN TÉCNICA] rendimiento potencial; funcionalmente correcto.
- **Línea 48**: `updateSettings` para persistir cambios parciales.
- **Línea 49**: palabras visibles derivadas.
- **Líneas 51–54**: estado local: borrador de plantilla (inicializado desde el store) y texto de la nueva palabra.

**Bloque de las líneas 56–115 (docblock y funciones `addKeyword`, `removeKeyword`, `saveMessageTemplate`):**

```tsx
  /* ============================================================================

  * Función         : addKeyword
  * Descripción     : Agrega una nueva palabra de activación usando el último estado persistido.
  * Fecha           : 2026-03-30
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useSettingsStore, normalizeTriggerWord, buildVisibleTriggerWords
  * Ingesta         : Sin argumentos
  * Devolución      : void
  * Uso             : onPress y onSubmitEditing del input de nueva palabra.
  * ============================================================================ */
  const addKeyword = () => {
    const word = normalizeTriggerWord(newKeyword);
    if (!word) return;

    const currentTriggerWords = buildVisibleTriggerWords(
      useSettingsStore.getState().triggerWords
    );

    if (currentTriggerWords.includes(word)) {
      Alert.alert('Ya existe', `"${word}" ya está en la lista.`);
      return;
    }

    updateSettings({ triggerWords: [...currentTriggerWords, word] });
    setNewKeyword('');
  };

  /* ============================================================================

  * Función         : removeKeyword
  * Descripción     : Quita una palabra de activación sin permitir que la lista quede vacía.
  * Fecha           : 2026-03-30
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useSettingsStore, buildVisibleTriggerWords
  * Ingesta         : word: string
  * Devolución      : void
  * Uso             : removeKeyword('socorro')
  * ============================================================================ */
  const removeKeyword = (word: string) => {
    const currentTriggerWords = buildVisibleTriggerWords(
      useSettingsStore.getState().triggerWords
    );

    if (currentTriggerWords.length <= 1) {
      Alert.alert('Mínimo 1', 'Debe haber al menos una palabra de activación.');
      return;
    }

    updateSettings({
      triggerWords: currentTriggerWords.filter((currentWord) => currentWord !== word),
    });
  };

  const saveMessageTemplate = () => {
    updateSettings({ messageTemplate });
    Alert.alert('Guardado', 'Plantilla de mensaje actualizada.');
  };
```

**Explicación de las líneas 56–115:**

- **Líneas 56–67**: docblock de `addKeyword`.
- **Líneas 68–83**: `addKeyword` — 1) normaliza la entrada (`normalizeTriggerWord`, p. ej. minúsculas/acentos); 2) si queda vacía retorna sin acción; 3) relee el estado ACTUAL del store con `useSettingsStore.getState()` (fuera del ciclo de render, para no depender de un cierre desactualizado); 4) rechaza duplicados con "Ya existe"; 5) persiste la lista ampliada y limpia el input. [NOTA] No hay límite máximo de palabras.
- **Líneas 85–96**: docblock de `removeKeyword`.
- **Líneas 97–110**: `removeKeyword` — relee el estado actual, impide quedar con cero palabras (mínimo 1) y persiste la lista sin la palabra indicada. Se invoca al pulsar una "chip" de palabra (línea 263).
- **Líneas 112–115**: `saveMessageTemplate` — persiste el borrador y confirma con "Guardado". [NOTA] No valida que la plantilla contenga `{location}` o `{time}`.

**Bloque de las líneas 117–142 (recordatorios diarios):**

```tsx
  const toggleDailyReminder = async (enabled: boolean) => {
    if (enabled) {
      const permissionStatus = await NotificationService.requestPermissions();
      if (permissionStatus !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Activa las notificaciones para usar recordatorios diarios.'
        );
        return;
      }

      await NotificationService.scheduleDailyReminder(settings.reminderHour);
    } else {
      await NotificationService.cancelDailyReminder();
    }

    updateSettings({ reminderNotificationsEnabled: enabled });
  };

  const updateReminderHour = async (hour: number) => {
    updateSettings({ reminderHour: hour });

    if (settings.reminderNotificationsEnabled) {
      await NotificationService.scheduleDailyReminder(hour);
    }
  };
```

**Explicación de las líneas 117–142:**

- **Líneas 117–134**: `toggleDailyReminder` — al activar solicita permiso de notificaciones (`requestPermissions`); si no es `'granted'` avisa y no activa. Si lo concede, programa el recordatorio con la hora actual del store. Al desactivar, cancela el recordatorio. Solo al final persiste el flag (`reminderNotificationsEnabled`).
- **Líneas 136–142**: `updateReminderHour` — persiste la hora y, si el recordatorio estaba activo, reprograma con la nueva hora. [OBSERVACIÓN TÉCNICA] Lee `settings.reminderNotificationsEnabled` del render (no del estado fresco), pero al ser el valor persistido antes de la interacción es aceptable en la práctica. [NIVEL DE CERTEZA: Inferido].

**Bloque de las líneas 144–185 (render: enlaces y toggle de mensaje de voz):**

```tsx
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Cómo Funciona */}
      <TouchableOpacity
        style={styles.permissionsLink}
        onPress={() => router.push('/como-funciona')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="info" size={20} color={color.textPrimary} />
          <Text style={styles.permissionsLinkText}>Cómo funciona SafeAlert →</Text>
        </View>
      </TouchableOpacity>

      {/* Permisos */}
      <TouchableOpacity
        style={styles.permissionsLink}
        onPress={() => router.push('/permissions')}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="lock" size={20} color={color.textPrimary} />
          <Text style={styles.permissionsLinkText}>Ver estado de permisos →</Text>
        </View>
      </TouchableOpacity>

      {/* Audio toggle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mensaje de voz</Text>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Grabar mensaje de voz</Text>
            <Text style={styles.rowSub}>
              Graba 10 segundos de audio y lo envía como segundo mensaje
            </Text>
          </View>
          <Switch
            value={settings.audioEnabled}
            onValueChange={(v) => updateSettings({ audioEnabled: v })}
            trackColor={{ false: color.border, true: color.dangerLight }}
            thumbColor={settings.audioEnabled ? color.danger : color.neutral400}
          />
        </View>
      </View>
```

**Explicación de las líneas 144–185:**

- **Líneas 145–146**: `ScrollView` contenedor.
- **Líneas 147–155**: enlace a "Cómo funciona SafeAlert" (`/como-funciona`, modal declarado en el layout raíz).
- **Líneas 158–166**: enlace a "Ver estado de permisos" (`/permissions`, modal).
- **Líneas 169–185**: sección "Mensaje de voz": texto "Grabar mensaje de voz" con subtítulo "Graba 10 segundos de audio y lo envía como segundo mensaje" y un `Switch` que persiste `audioEnabled` directamente. [NOTA] Aunque el subtítulo menciona la duración (10 s), la duración real la fija el servicio de grabación (fuera de este archivo).

**Bloque de las líneas 187–248 (recordatorios y plantilla de mensaje):**

```tsx
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recordatorios diarios</Text>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Activar recordatorio local</Text>
            <Text style={styles.rowSub}>
              Te recuerda revisar permisos y contactos una vez al día.
            </Text>
          </View>
          <Switch
            value={settings.reminderNotificationsEnabled}
            onValueChange={toggleDailyReminder}
            trackColor={{ false: color.border, true: color.dangerLight }}
            thumbColor={
              settings.reminderNotificationsEnabled ? color.danger : color.neutral400
            }
          />
        </View>
        <View style={styles.sensitivityButtons}>
          {[9, 14, 20].map((hour) => (
            <TouchableOpacity
              key={hour}
              style={[
                styles.sensitivityBtn,
                settings.reminderHour === hour && styles.sensitivityBtnActive,
              ]}
              onPress={() => updateReminderHour(hour)}
            >
              <Text
                style={[
                  styles.sensitivityBtnText,
                  settings.reminderHour === hour && styles.sensitivityBtnTextActive,
                ]}
              >
                {hour}:00
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Message template */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plantilla de mensaje</Text>
        <Text style={styles.sectionSub}>
          Usa {'{location}'} para la ubicación y {'{time}'} para la hora.
        </Text>
        <TextInput
          style={styles.textarea}
          value={messageTemplate}
          onChangeText={setMessageTemplate}
          multiline
          numberOfLines={4}
          placeholder="Ej: ¡Necesito ayuda! Ubicación: {location} — {time}"
        />
        <TouchableOpacity
          style={styles.saveButton}
          onPress={saveMessageTemplate}
        >
          <Text style={styles.saveButtonText}>Guardar plantilla</Text>
        </TouchableOpacity>
      </View>
```

**Explicación de las líneas 187–248:**

- **Líneas 187–226**: sección "Recordatorios diarios": `Switch` ligado a `toggleDailyReminder` y botones de hora 9:00/14:00/20:00 (estilo activo cuando coincide con `settings.reminderHour`) que llaman `updateReminderHour`. El estilo reutiliza `sensitivityBtn` (nomenclatura heredada de sensibilidad; [NOTA] de nomenclatura).
- **Líneas 228–248**: sección "Plantilla de mensaje": instrucción de placeholders `{location}` y `{time}`; `TextInput` multilinea (4 líneas) con placeholder de ejemplo; botón "Guardar plantilla". La plantilla es la base del SMS/notificación de alerta.

**Bloque de las líneas 250–334 (palabras de activación y sensibilidad):**

```tsx
      {/* Trigger words */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activación por voz</Text>
        {WakeWordService.isAvailable() ? (
          <>
            <Text style={styles.sectionSub}>
              El modelo español instalado escucha en Android. Mantén esta lista alineada con el modelo cargado para evitar falsas expectativas.
            </Text>
            <View style={styles.keywordsList}>
              {visibleTriggerWords.map((word) => (
                <TouchableOpacity
                  key={word}
                  style={styles.keywordChip}
                  onPress={() => removeKeyword(word)}
                >
                  <Text style={styles.keywordChipText}>{word}</Text>
                  <Icon name="close" size={14} color={color.danger} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.addKeywordRow}>
              <TextInput
                style={styles.addKeywordInput}
                value={newKeyword}
                onChangeText={setNewKeyword}
                placeholder="Nueva palabra..."
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={addKeyword}
              />
              <TouchableOpacity style={styles.addKeywordBtn} onPress={addKeyword}>
                <Text style={styles.addKeywordBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <Text style={styles.sectionSub}>{WakeWordService.getUnavailableReason()}</Text>
        )}
      </View>

      {/* Sensitivity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sensibilidad de detección</Text>
        {WakeWordService.isAvailable() ? (
          <>
            <Text style={styles.sectionSub}>
              Sensibilidad actual: {Math.round(settings.wakeWordSensitivity * 100)}%
              {WAKE_WORD_FOREGROUND_ONLY
                ? ' · Solo escucha en primer plano.'
                : ''}
            </Text>
            <View style={styles.sensitivityButtons}>
              {[
                { label: 'Baja\n(menos falsos)', value: 0.4 },
                { label: 'Media\n(recomendado)', value: 0.7 },
                { label: 'Alta\n(más detección)', value: 0.9 },
              ].map(({ label, value }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.sensitivityBtn,
                    Math.abs(settings.wakeWordSensitivity - value) < 0.05 &&
                      styles.sensitivityBtnActive,
                  ]}
                  onPress={() => updateSettings({ wakeWordSensitivity: value })}
                >
                  <Text
                    style={[
                      styles.sensitivityBtnText,
                      Math.abs(settings.wakeWordSensitivity - value) < 0.05 &&
                        styles.sensitivityBtnTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.sectionSub}>
            Ajusta esta sensibilidad cuando el motor de voz quede disponible en tu Android.
          </Text>
        )}
      </View>
```

**Explicación de las líneas 250–334:**

- **Líneas 251–288**: sección "Activación por voz", solo operativa si `WakeWordService.isAvailable()`; si no, muestra el motivo (`getUnavailableReason`). Texto de ayuda advierte de mantener la lista alineada con el modelo cargado (el modelo español escucha en Android). Chips por palabra con icono de cierre que elimina al pulsar (`removeKeyword`); fila con input (autoCapitalize none, tecla "done", envío con `addKeyword`) y botón "Agregar".
- **Líneas 291–334**: sección "Sensibilidad de detección": muestra porcentaje (`Math.round(wakeWordSensitivity * 100)`) y, según `WAKE_WORD_FOREGROUND_ONLY`, la nota "Solo escucha en primer plano". Tres presets etiquetados "Baja (menos falsos)"/"Media (recomendado)"/"Alta (más detección)" con valores 0.4/0.7/0.9; el activo se detecta con tolerancia `< 0.05` para evitar problemas de coma flotante. Al pulsar persiste el valor. Si el motor no está disponible, mensaje informativo.

**Bloque de las líneas 336–430 (tiempo de cancelación y privacidad):**

```tsx
      {/* Countdown seconds */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tiempo para cancelar</Text>
        {WakeWordService.isAvailable() ? (
          <>
            <Text style={styles.sectionSub}>
              Segundos para cancelar una alerta accidental
            </Text>
            <View style={styles.sensitivityButtons}>
              {[3, 5, 10].map((secs) => (
                <TouchableOpacity
                  key={secs}
                  style={[
                    styles.sensitivityBtn,
                    settings.alertCountdownSeconds === secs &&
                      styles.sensitivityBtnActive,
                  ]}
                  onPress={() =>
                    updateSettings({ alertCountdownSeconds: secs })
                  }
                >
                  <Text
                    style={[
                      styles.sensitivityBtnText,
                      settings.alertCountdownSeconds === secs &&
                        styles.sensitivityBtnTextActive,
                    ]}
                  >
                    {secs}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.sectionSub}>
            El conteo regresivo se activará cuando el motor de voz quede disponible.
          </Text>
        )}
      </View>

      {/* Privacy section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacidad y datos</Text>
        <TouchableOpacity
          style={styles.row}
          onPress={async () => {
            const { PrivacyService } = await import('../../src/services/PrivacyService');
            Alert.alert(
              'Gestión de datos',
              'Exportar: descargá todos tus datos almacenados.\nEliminar: borrá tu cuenta y todos los datos asociados.',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Exportar datos',
                  onPress: async () => {
                    const result = await PrivacyService.requestDataExport(settings.userId || '');
                    Alert.alert(result.success ? 'Solicitado' : 'Error', result.message);
                  },
                },
                {
                  text: 'Eliminar cuenta',
                  style: 'destructive',
                  onPress: () => {
                    Alert.alert(
                      '¿Eliminar cuenta?',
                      'Esta acción borrará todos tus datos locales. Los datos en servidores pueden tardar hasta 30 días en eliminarse.',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        {
                          text: 'Eliminar',
                          style: 'destructive',
                          onPress: async () => {
                            const result = await PrivacyService.deleteAccount(settings.userId || '');
                            Alert.alert(result.success ? 'Cuenta eliminada' : 'Error', result.message);
                          },
                        },
                      ]
                    );
                  },
                },
              ]
            );
          }}
        >
          <Icon name="shield" size={20} color={color.textPrimary} />
          <Text style={{ fontSize: 15, fontWeight: '500', color: color.textPrimary, flex: 1 }}>
            Administrar mis datos
          </Text>
          <Icon name="chevron-right" size={20} color={color.neutral400} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
```

**Explicación de las líneas 336–430:**

- **Líneas 337–375**: sección "Tiempo para cancelar": presets 3 s/5 s/10 s que persisten `alertCountdownSeconds` (cuenta atrás para cancelar una alerta accidental). Si el motor no está disponible, mensaje informativo de que el conteo se activará cuando esté disponible.
- **Líneas 378–427**: sección "Privacidad y datos" con la fila "Administrar mis datos". Al pulsarla carga dinámicamente `PrivacyService` (`await import(...)`, carga diferida) y ofrece en un `Alert`: "Exportar datos" (`requestDataExport(userId)`) y "Eliminar cuenta" (`deleteAccount(userId)`, doble confirmación con advertencia de que los datos locales se borran y los del servidor pueden tardar hasta 30 días). Resultados mostrados en `Alert` ("Solicitado"/"Error", "Cuenta eliminada"/"Error"). [NOTA] La confirmación de eliminación no pide reautenticación visible ni código; el resultado depende de `PrivacyService`.
- **Líneas 428–430**: cierre del `ScrollView` y del componente.

**Bloque de las líneas 432–532 (hoja de estilos):**

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 16, paddingBottom: 40 },

  permissionsLink: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  permissionsLinkText: { fontSize: 15, color: color.textPrimary, fontWeight: '500' },

  section: {
    backgroundColor: color.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: color.textPrimary },
  sectionSub: { fontSize: 13, color: color.textSecondary, lineHeight: 18 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: color.textPrimary },
  rowSub: { fontSize: 12, color: color.textSecondary, marginTop: 2 },

  textarea: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: color.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: color.danger,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: { fontSize: 14, fontWeight: '600', color: color.textInverse },

  keywordsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  keywordChip: {
    backgroundColor: color.dangerLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  keywordChipText: { fontSize: 14, color: color.danger, fontWeight: '500' },
  addKeywordRow: { flexDirection: 'row', gap: 8 },
  addKeywordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  addKeywordBtn: {
    backgroundColor: color.danger,
    borderRadius: 8,
    padding: 10,
    justifyContent: 'center',
  },
  addKeywordBtnText: { color: color.textInverse, fontWeight: '600', fontSize: 13 },

  sensitivityButtons: { flexDirection: 'row', gap: 8 },
  sensitivityBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  sensitivityBtnActive: {
    borderColor: color.danger,
    backgroundColor: color.dangerLight,
  },
  sensitivityBtnText: {
    fontSize: 12,
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  sensitivityBtnTextActive: { color: color.danger, fontWeight: '600' },
});
```

**Explicación de las líneas 432–532:**

- **Línea 432**: `StyleSheet.create`.
- **Líneas 433–434**: contenedor y espaciado vertical (padding 20, gap 16, fondo 40).
- **Líneas 436–445**: estilo compartido de los enlaces superiores ("Cómo funciona"/"Permisos") con tarjeta de superficie y sombra/elevación.
- **Líneas 448–460**: tarjetas de sección (`section`) y títulos/subtítulos.
- **Líneas 462–465**: filas con label/sub (utilizadas en switches y en privacidad).
- **Líneas 467–483**: `textarea` multilinea (altura mínima 90, texto alineado arriba) y botón de guardado rojo.
- **Líneas 485–510**: chips de palabras (fondo `dangerLight`, radio 20), input y botón "Agregar".
- **Líneas 512–531**: botones de selección reutilizados para sensibilidad, horas y segundos, con estado activo (borde y fondo `danger`/`dangerLight`).

## Fichas de funciones y métodos

### SettingsScreen (líneas 46–430)

- Firma: `export default function SettingsScreen(): JSX.Element`
- Propósito: exponer y persistir los ajustes operativos de la app.
- Parámetros: ninguno. Retorno: `ScrollView`.
- Dependencias: `useSettingsStore` (suscripción total), `WakeWordService`, `NotificationService`, `PrivacyService` (dinámico), `router`.
- Efectos secundarios: solicita permisos de notificación al activar recordatorios; programa/cancela recordatorios; persiste ajustes; puede solicitar exportación o eliminación de cuenta.

### addKeyword (líneas 68–83)

- Firma: `const addKeyword = () => void`
- Propósito: agregar una palabra de activación normalizada y no duplicada.
- Parámetros: ninguno (usa `newKeyword`). Retorno: `void`.
- Flujo: normalizar → vacío? retorno → releer estado actual → duplicado? alerta → persistir + limpiar input.
- Riesgos: sin límite superior de palabras; sin persistencia si el store falla (sin manejo de error).

### removeKeyword (líneas 97–110)

- Firma: `const removeKeyword = (word: string) => void`
- Propósito: quitar una palabra garantizando mínimo una.
- Parámetros: `word`. Retorno: `void`.
- Flujo: releer estado → si queda 1 o menos, alerta y retorno → persistir filtrado.

### saveMessageTemplate (líneas 112–115)

- Firma: `const saveMessageTemplate = () => void`
- Propósito: persistir la plantilla de mensaje y confirmar.
- Sin validación de placeholders requeridos.

### toggleDailyReminder (líneas 117–134)

- Firma: `const toggleDailyReminder = async (enabled: boolean) => Promise<void>`
- Propósito: activar/desactivar recordatorio local.
- Flujo: activar → pedir permiso (si no concedido, alerta y retorno) → `scheduleDailyReminder(hora)`; desactivar → `cancelDailyReminder()`; luego persistir flag.
- Riesgos: si `scheduleDailyReminder` lanza, el flag no se persiste (la excepción saldría sin `try/catch`).

### updateReminderHour (líneas 136–142)

- Firma: `const updateReminderHour = async (hour: number) => Promise<void>`
- Propósito: cambiar la hora y reprogramar si el recordatorio está activo.

## Clases / interfaces / tipos

- Sin clases ni interfaces con nombre; tipos derivados de `useSettingsStore` y de props de componentes del tema.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Línea 47: `useSettingsStore()` sin selector suscribe al store completo; cualquier cambio en ajustes re-renderiza la pantalla. [NIVEL DE CERTEZA: Confirmado por código]. Impacto: rendimiento menor en pantallas de baja frecuencia; en esta pantalla es aceptable.
- [OBSERVACIÓN TÉCNICA] `removeKeyword`, `addKeyword` y `saveMessageTemplate` no manejan errores de persistencia (Zustand persist puede fallar en disco). [NIVEL DE CERTEZA: Inferido].
- [OBSERVACIÓN TÉCNICA] La nomenclatura `sensitivityButtons`/`sensitivityBtn` se reutiliza para horas de recordatorio y segundos de cancelación (líneas 205-224, 344-367): estilo genérico con nombre específico.
- [OBSERVACIÓN TÉCNICA] La plantilla del mensaje se guarda sin validar que contenga `{location}` y/o `{time}` (líneas 112-115 y 231-233); una plantilla sin placeholders generaría mensajes sin ubicación/hora. [NIVEL DE CERTEZA: Confirmado por código].
- [OBSERVACIÓN TÉCNICA] Eliminar la cuenta (líneas 399-415) pide doble confirmación pero no muestra reautenticación ni información sobre el alcance exacto de lo que borra el servidor (solo "hasta 30 días").
- [NOTA] El subtítulo del switch de audio indica 10 segundos de grabación; la duración efectiva se define en el servicio de grabación (fuera de este archivo).

## Seguridad

- [MEDIO] Eliminación/exportación de cuenta gestionada solo con `userId` del store local (`PrivacyService.deleteAccount(settings.userId || '')`, línea 409). [NIVEL DE CERTEZA: Confirmado por código]. Si el servidor no exige reautenticación, un `userId` filtrado podría borrar datos de otro usuario; la seguridad real depende de `PrivacyService`/backend (fuera de este archivo).
- [INFORMATIVO] El manejo de datos personales incluye palabras de voz, plantilla y teléfono persistidos en el dispositivo; revisar que el cifrado en reposo del almacén de Zustand sea el adecuado.
- [INFORMATIVO] Sin tokens, secretos ni claves en el archivo; los errores no se loguean aquí (solo `Alert`).
- [INFORMATIVO] No hay entradas que se concatenen a queries, rutas o HTML.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] [RECOMENDACIÓN] Validar que la plantilla contenga los placeholders documentados (o permitir plantilla vacía con valor por defecto) para no enviar alertas sin ubicación.
- [RIESGO] [RECOMENDACIÓN] Añadir confirmación reforzada (reautenticación o código) en el flujo de eliminación de cuenta.
- [RECOMENDACIÓN] Seleccionar campos del store por separado en lugar de suscribirse al objeto completo.
- [RECOMENDACIÓN] Añadir límite razonable al número de palabras de activación y manejar errores de persistencia.
- [NOTA] Sin más riesgos de seguridad detectados en este archivo.
