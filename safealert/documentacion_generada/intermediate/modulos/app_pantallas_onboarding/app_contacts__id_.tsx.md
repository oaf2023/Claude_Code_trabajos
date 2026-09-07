# Archivo: app/contacts/[id].tsx

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | app/contacts/[id].tsx |
| Líneas totales | 383 |
| Lenguaje | TypeScript 5.9 / TSX (React Native) |
| Tamaño (bytes) | 13125 |
| Categoría | Pantalla de alta/edición de contacto con parámetro dinámico (expo-router, ruta `/contacts/[id]`, modal) |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Formulario de alta y edición de contactos de confianza. La ruta dinámica
`[id]` permite dos modos: `id === 'new'` (alta) o el id de un contacto existente
(edición precargada). Valida nombre y teléfono (E.164 aproximado), permite marcar
el contacto como principal (`priority = 0`) y, según la configuración de pagos,
gatea la creación de más de un contacto detrás de una suscripción mostrando
`PaymentModal`. Persiste mediante el hook `useContacts` (que resuelve el usuario
autenticado y delega en `ContactsService`) y navega de vuelta al terminar.

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE` — ruta registrada en `app/_layout.tsx` (líneas
  367–370) como modal con título "Contacto".
- Accesos detectados: `app/(tabs)/contacts.tsx` — edición con
  `router.push(\`/contacts/${item.id}\`)` (línea 196) y alta con
  `router.push('/contacts/new')` (línea 219).
- [NIVEL DE CERTEZA: Confirmado por código]
- Bloque de estilos `deliveryCard`, `deliveryOptions`, `deliveryOption*` y
  `fallbackRow` (líneas 310–354) definidos pero sin referencia en el JSX →
  `CÓDIGO LEGADO` / `[POTENCIALMENTE NO UTILIZADO]`.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React, useState, useEffect` | estándar (React) | Estado del formulario y efectos | Sí |
| `react-native` (View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, ActivityIndicator) | estándar | UI del formulario | Sí (ver notas) |
| `useLocalSearchParams, router` de `expo-router` | externa | Leer `id` de la ruta y navegar | Sí |
| `useContacts` de `../../src/hooks/useContacts` | interna | `addContact`, `updateContact`, `prioritizeContact` | Sí |
| `useContactsStore` de `../../src/stores/useContactsStore` | interna | Buscar contacto existente y contar contactos | Sí |
| `useSettingsStore` de `../../src/stores/useSettingsStore` | interna | `hasSubscription`, `userName`, `userPhone` | Sí |
| `DeviceService` de `../../src/services/DeviceService` | interna | Obtener `deviceId` para el modal de pago | Sí |
| `isValidPhone` de `../../src/utils/formatPhone` | interna | Validación de teléfono | Sí |
| `color, spacing` de `../../src/theme` | interna | Tokens visuales | Sí |
| `borderRadius, shadow` de `../../src/theme` | interna | Sin uso real (estilos con literales) | No (`[POTENCIALMENTE NO UTILIZADO]`) |
| `Icon` de `../../src/theme/Icon` | interna | Sin uso visible en el JSX actual | `[POTENCIALMENTE NO UTILIZADO]` |
| `PAYMENTS_DISABLED_REASON, PAYMENTS_ENABLED` de `../../src/config/features` | interna | Gating de pagos y banner de pruebas | Sí |
| `PaymentModal` de `../../src/components/PaymentModal` | interna | Flujo de suscripción al guardar | Sí |

## Componentes que dependen de este archivo

- `app/_layout.tsx`: registro del modal `contacts/[id]` (líneas 367–370).
- `app/(tabs)/contacts.tsx`: navega a `/contacts/new` y a `/contacts/{id}` para alta/edición (líneas 196 y 219).
- A través del hook `useContacts` depende de `ContactsService` y de `ensureAuthenticated` (`src/config/firebase`).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `id` | parámetro de ruta | string | Id del contacto o literal `'new'` | líneas 51–52 |
| `isNew` | `id === 'new'` | boolean | Distingue alta de edición | líneas 52, 78–83, 121–154 |
| `name` | estado `''` | string | Nombre del contacto | líneas 59, 96–99, 141–154 |
| `phone` | estado `''` | string | Teléfono del contacto | líneas 60, 100–102, 142–154 |
| `makePrimary` | estado `false` | boolean | Marcar como contacto principal (`priority 0`) | líneas 61, 81, 145–155 |
| `saving` | estado `false` | boolean | Bloquea el guardado | líneas 62, 138, 160–162 |
| `errors` | estado `{ name: '', phone: '' }` | objeto | Errores inline de validación | líneas 63, 96–105 |
| `showPayment` | estado `false` | boolean | Abre `PaymentModal` | líneas 66, 130–132, 165–171 |
| `deviceId` | estado `''` | string | Id de dispositivo para el pago | líneas 67, 73–75 |
| `contacts` | store | Contact[] | Total de contactos (para regla "primer contacto gratis") | líneas 68, 127 |
| `hasSubscription` | store | boolean | Estado de suscripción del usuario | líneas 69, 129 |
| `userName` / `userPhone` | store | string | Datos del usuario para el modal de pago | líneas 70–71, 271–272 |

## Estructura (funciones / clases / tipos)

- Componente `AddEditContactScreen` (export default, líneas 50–280).
- Funciones internas: `validate` (96–105), `handleSave` (118–135), `performActualSave` (137–163), `handlePaymentSuccess` (165–171).
- Efectos: obtención de `deviceId` (73–75) y precarga del contacto en edición (77–83).
- No hay clases ni interfaces propias. `StyleSheet.create` (líneas 282–383).

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : [id].tsx
* Descripción     : Alta y edición de contactos con validación operativa y accesibilidad.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Formulario para crear o editar contactos.
* ============================================================================ */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useContacts } from '../../src/hooks/useContacts';
import { useContactsStore } from '../../src/stores/useContactsStore';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { DeviceService } from '../../src/services/DeviceService';
import { isValidPhone } from '../../src/utils/formatPhone';
import { color, spacing, borderRadius, shadow } from '../../src/theme';
import { Icon } from '../../src/theme/Icon';
import {
  PAYMENTS_DISABLED_REASON,
  PAYMENTS_ENABLED,
} from '../../src/config/features';
import { PaymentModal } from '../../src/components/PaymentModal';
```

**Explicación de las líneas 1–37:**

Cabecera documental e importaciones del formulario de contacto.

- **Líneas 25**: `useLocalSearchParams` lee el parámetro dinámico `id` de la ruta; `router` gestiona la vuelta.
- **Línea 26**: hook `useContacts` con las operaciones CRUD y de prioridad sobre contactos.
- **Líneas 27–28**: stores de contactos (listado/suscripción reactiva) y de ajustes (suscripción, datos del usuario).
- **Línea 29**: `DeviceService.getDeviceId` para identificar el dispositivo en el flujo de pago.
- **Líneas 33–36**: flags `PAYMENTS_ENABLED` y `PAYMENTS_DISABLED_REASON` (modo pruebas/desarrollo).
- **Línea 37**: `PaymentModal`, componente de pasarela de pago (Mercado Pago por backend/Cloud Functions).
- [NOTA] Se importan `Switch`, `ActivityIndicator` e `Icon`, pero el JSX actual no renderiza `ActivityIndicator` ni `Icon` (ver observaciones).

```tsx
/* ============================================================================
* Función         : AddEditContactScreen
* Descripción     : Alta y edición de contactos con prioridad operativa.
* Fecha           : 2026-03-26
* Versión         : 1.2.0
* Lenguaje        : TypeScript 5.9
* Conexiones      : useContacts, useContactsStore, PaymentModal
* Ingesta         : Sin argumentos
* Devolución      : JSX.Element
* Uso             : Pantalla de ruta /contacts/[id]
* ============================================================================ */
export default function AddEditContactScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';

  const { addContact, updateContact, prioritizeContact } = useContacts();
  const existingContact = useContactsStore((s) =>
    s.contacts.find((c) => c.id === id)
  );

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [makePrimary, setMakePrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ name: '', phone: '' });

  // Payment states
  const [showPayment, setShowPayment] = useState(false);
  const [deviceId, setDeviceId] = useState('');
  const { contacts } = useContactsStore();
  const hasSubscription = useSettingsStore(s => s.hasSubscription);
  const userName = useSettingsStore(s => s.userName ?? '');
  const userPhone = useSettingsStore(s => s.userPhone ?? '');

  useEffect(() => {
    DeviceService.getDeviceId().then(setDeviceId);
  }, []);

  useEffect(() => {
    if (!isNew && existingContact) {
      setName(existingContact.name);
      setPhone(existingContact.phone);
      setMakePrimary(existingContact.priority === 0);
    }
  }, [id, existingContact, isNew]);
```

**Explicación de las líneas 39–83:**

Componente, estado y efectos.

- **Línea 51**: `useLocalSearchParams<{ id: string }>()` extrae `id`.
- **Línea 52** (`isNew`): el alta se representa con el id literal `'new'`; cualquier otro valor es edición.
- **Línea 54**: operaciones del hook `useContacts` (cada una resuelve el userId autenticado y llama a `ContactsService`).
- **Líneas 55–57**: busca el contacto en el store local por `id` para precargar el formulario.
- **Líneas 59–63**: estados del formulario y errores.
- **Líneas 65–71**: estados y selectores de pago; `hasSubscription`, `userName`, `userPhone` alimentan `PaymentModal`.
- **Líneas 73–75**: efecto de montaje que resuelve el `deviceId` asíncrono.
- **Líneas 77–83**: efecto de precarga: sólo si es edición (`!isNew`) y el contacto existe, vuelca `name`, `phone` y `priority === 0` al estado. Depende de `id`, `existingContact` e `isNew`.
- [OBSERVACIÓN TÉCNICA] Si `id` no es `'new'` pero el contacto no existe (p. ej. enlace roto o borrado en otra sesión), la pantalla entra en modo edición con campos vacíos y `updateContact` intentaría actualizar un contacto inexistente.
- [NOTA] `saving` no se usa para mostrar spinner sino para deshabilitar el botón y cambiar su texto ("Guardando...").

```tsx
  /* ============================================================================
  * Función         : validate
  * Descripción     : Valida nombre y teléfono antes de guardar el contacto.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : handleSave, formatPhone
  * Ingesta         : Sin argumentos
  * Devolución      : boolean
  * Uso             : if (!validate()) return
  * ============================================================================ */
  const validate = (): boolean => {
    const newErrors = { name: '', phone: '' };
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio';
    else if (name.trim().length < 2) newErrors.name = 'Escribe al menos 2 letras';
    if (!phone.trim()) newErrors.phone = 'El teléfono es obligatorio';
    else if (!isValidPhone(phone))
      newErrors.phone = 'Número inválido (ej: +54 9 11 1234-5678)';
    setErrors(newErrors);
    return !newErrors.name && !newErrors.phone;
  };

  /* ============================================================================
  * Función         : handleSave
  * Descripción     : Guarda el contacto luego de validar y mostrar errores operativos.
  * Fecha           : 2026-03-19
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : useContacts, router
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : onPress={handleSave}
  * ============================================================================ */
  const handleSave = async () => {
    if (!validate()) return;

    if (!PAYMENTS_ENABLED) {
      await performActualSave();
      return;
    }

    // Primer contacto gratis; a partir del segundo se requiere suscripción
    const isFirstContact = contacts.length === 0 && isNew;

    if (!hasSubscription && !isFirstContact) {
      setShowPayment(true);
      return;
    }

    await performActualSave();
  };

  const performActualSave = async () => {
    setSaving(true);
    try {
      if (isNew) {
        const created = await addContact({
          name: name.trim(),
          phone,
        });
        if (makePrimary) {
          await prioritizeContact(created.id);
        }
      } else {
        await updateContact(id as string, {
          name: name.trim(),
          phone,
        });
        if (makePrimary) {
          await prioritizeContact(id as string);
        }
      }
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo guardar el contacto.');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPayment(false);
    useSettingsStore.getState().setHasSubscription(true);
    Alert.alert('¡Suscripción activa!', 'Guardando tu contacto...', [
      { text: 'OK', onPress: () => performActualSave() }
    ]);
  };
```

**Explicación de las líneas 85–171:**

Lógica de validación, guardado y pago.

- **Líneas 85–95**: cabecera documental de `validate`.
- **Líneas 96–105** (`validate`): valida nombre (obligatorio, mínimo 2 letras) y teléfono (obligatorio y `isValidPhone`); escribe los errores en estado y devuelve si todo es correcto. La validación del teléfono es la misma utilidad del onboarding.
- **Líneas 107–117**: cabecera de `handleSave`.
- **Líneas 118–135** (`handleSave`):
  - Línea 119: si la validación falla, corta.
  - Líneas 121–124: si los pagos están deshabilitados (`PAYMENTS_ENABLED === false`, modo pruebas), guarda directamente.
  - Línea 127: `isFirstContact` = no hay contactos aún y es alta (regla comercial "primer contacto gratis").
  - Líneas 129–132: sin suscripción y sin ser el primer contacto → abre `PaymentModal` y no guarda.
  - Línea 134: en caso contrario guarda.
- **Líneas 137–163** (`performActualSave`):
  - Línea 138: activa `saving`.
  - Líneas 140–147 (alta): `addContact({ name: name.trim(), phone })` y, si `makePrimary`, `prioritizeContact(created.id)`.
  - Líneas 148–156 (edición): `updateContact(id, {...})` y, si `makePrimary`, `prioritizeContact(id)`.
  - Línea 157: `router.back()` al éxito.
  - Líneas 158–159: alerta con `e.message` si falla.
  - Líneas 160–162: `finally` limpia `saving`.
- **Líneas 165–171** (`handlePaymentSuccess`): cierra el modal, marca la suscripción activa en el store (acceso directo por `getState`) y confirma con alerta; el guardado real ocurre cuando el usuario presiona OK.
- [OBSERVACIÓN TÉCNICA] El guardado tras pagar depende de que el usuario toque "OK" en la alerta; si la descarta, el contacto no se guarda aunque el pago se haya completado.
- [OBSERVACIÓN TÉCNICA] Si el pago ya estaba activo pero el contacto no se guardó (fallo de red), el usuario ve "¡Suscripción activa!" igualmente.

```tsx
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {isNew ? 'Nuevo contacto' : 'Editar contacto'}
        </Text>
        <Text style={styles.subtitle}>
          Esta persona recibirá tu ubicación y mensaje en emergencias. Evita duplicar teléfonos.
        </Text>

        {!PAYMENTS_ENABLED ? (
          <View style={styles.testingBanner}>
            <Text style={styles.testingBannerTitle}>Pruebas activas</Text>
            <Text style={styles.testingBannerText}>{PAYMENTS_DISABLED_REASON}</Text>
          </View>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            value={name}
            onChangeText={setName}
            placeholder="Ej: María García"
            autoCapitalize="words"
            returnKeyType="next"
            accessibilityLabel="Nombre completo del contacto"
            accessibilityHint="Escribe el nombre de la persona de confianza"
          />
          {errors.name ? (
            <Text style={styles.errorText}>{errors.name}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Teléfono (con código de país)</Text>
          <TextInput
            style={[styles.input, errors.phone ? styles.inputError : null]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+54 9 11 1234-5678"
            keyboardType="phone-pad"
            returnKeyType="done"
            accessibilityLabel="Teléfono del contacto"
            accessibilityHint="Incluye el código de país para SMS y llamada asistida"
          />
          {errors.phone ? (
            <Text style={styles.errorText}>{errors.phone}</Text>
          ) : null}
          <Text style={styles.hint}>
            Incluye el código de país (ej: +54 para Argentina, +1 para EE.UU.)
          </Text>
        </View>

        <View style={styles.primaryRow}>
          <View style={styles.primaryInfo}>
            <Text style={styles.label}>Usar como contacto principal</Text>
            <Text style={styles.hint}>
              Se prioriza para la llamada asistida y para encabezar la lista de alertas.
            </Text>
          </View>
          <Switch
            value={makePrimary}
            onValueChange={setMakePrimary}
            trackColor={{ false: color.border, true: color.warningLight }}
            thumbColor={makePrimary ? color.warning : color.neutral400}
            accessibilityLabel="Usar como contacto principal"
          />
        </View>
```

**Explicación de las líneas 173–244:**

Render del formulario (título, banner de pruebas, campos de nombre y teléfono,
selector de contacto principal).

- **Líneas 174–177**: `KeyboardAvoidingView` (sólo iOS; en Android sin comportamiento especial).
- **Línea 179–181**: título dinámico "Nuevo contacto" / "Editar contacto".
- **Líneas 182–184**: subtítulo que advierte del envío en emergencias y pide evitar teléfonos duplicados (validación de duplicados sólo textual).
- **Líneas 186–191**: banner "Pruebas activas" con `PAYMENTS_DISABLED_REASON` cuando los pagos están desactivados.
- **Líneas 193–208** (campo nombre): input con `autoCapitalize="words"` y `returnKeyType="next"`; error inline rojo cuando `errors.name`; accesibilidad con `accessibilityLabel`/`accessibilityHint`.
- **Líneas 210–228** (campo teléfono): `keyboardType="phone-pad"`, error inline y pista de formato con código de país (SMS y llamada asistida).
- **Líneas 230–244** (`primaryRow`): tarjeta con `Switch` para "Usar como contacto principal"; los colores del track usan `color.border`/`color.warningLight` y el pulgar `color.warning`/`color.neutral400`. Su texto indica que el principal se prioriza para la llamada asistida y encabeza la lista de alertas.

```tsx
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={isNew ? 'Agregar contacto de confianza' : 'Guardar cambios del contacto'}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Guardando...' : isNew ? 'Agregar contacto' : 'Guardar cambios'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelLink}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cancelar edición de contacto"
        >
          <Text style={styles.cancelLinkText}>Cancelar</Text>
        </TouchableOpacity>

        {PAYMENTS_ENABLED ? (
          <PaymentModal
            visible={showPayment}
            deviceId={deviceId}
            userName={userName || name.trim()}
            userPhone={userPhone || phone}
            onClose={() => setShowPayment(false)}
            onSuccess={handlePaymentSuccess}
          />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

**Explicación de las líneas 246–280:**

Botones de guardado/cancelación y modal de pago condicional.

- **Líneas 246–256** (guardar): botón rojo deshabilitado mientras `saving`; texto "Guardando...", "Agregar contacto" o "Guardar cambios".
- **Líneas 258–265** (cancelar): enlace que vuelve con `router.back()`.
- **Líneas 267–276**: `PaymentModal` sólo montado si `PAYMENTS_ENABLED`. Props: `visible`, `deviceId` (del `DeviceService`), `userName`/`userPhone` con fallback a los valores del formulario, `onClose` y `onSuccess`.
- [NOTA] No se renderizan aquí los estilos `deliveryCard`/`deliveryOptions` (bloque legacy), ni se usa `ActivityIndicator`/`Icon` pese a estar importados.
- **Línea 280**: cierre del componente.

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.background },
  content: { padding: 24, gap: 20 },
  title: { fontSize: 22, fontWeight: 'bold', color: color.textPrimary },
  subtitle: { fontSize: 14, color: color.textSecondary, lineHeight: 20 },
  testingBanner: {
    backgroundColor: color.warningLight,
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  testingBannerTitle: { fontSize: 14, fontWeight: '700', color: color.warning },
  testingBannerText: { fontSize: 12, color: color.textPrimary, lineHeight: 18 },

  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: color.textPrimary },
  input: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: color.textPrimary,
  },
  inputError: { borderColor: color.danger },
  errorText: { fontSize: 12, color: color.danger },
  hint: { fontSize: 12, color: color.textSecondary },
  deliveryCard: {
    backgroundColor: color.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.border,
    padding: 14,
    gap: 10,
  },
  deliveryOptions: {
    gap: 10,
  },
  deliveryOption: {
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 10,
    padding: 12,
    gap: 4,
    backgroundColor: color.background,
  },
  deliveryOptionSelected: {
    borderColor: color.warning,
    backgroundColor: color.warningLight,
  },
  deliveryOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: color.textPrimary,
  },
  deliveryOptionTitleSelected: {
    color: color.warning,
  },
  deliveryOptionDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: color.textSecondary,
  },
  fallbackRow: {
    borderTopWidth: 1,
    borderTopColor: color.border,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryRow: {
    backgroundColor: color.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: color.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  primaryInfo: {
    flex: 1,
    gap: 4,
  },

  saveButton: {
    backgroundColor: color.danger,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { backgroundColor: '#FCA5A5' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: color.surface },

  cancelLink: { alignItems: 'center', paddingVertical: 8 },
  cancelLinkText: { fontSize: 15, color: color.textSecondary },
});
```

**Explicación de las líneas 282–383:**

Hoja de estilos del formulario.

- **Líneas 283–287**: layout base, título y subtítulo.
- **Líneas 288–294** (`testingBanner*`): banner ámbar de modo pruebas.
- **Líneas 296–309**: estilos de campos (`field`, `label`, `input`, `inputError`, `errorText`, `hint`).
- **Líneas 310–354**: bloque `deliveryCard`, `deliveryOptions`, `deliveryOption*`, `fallbackRow` — estilos de una antigua selección de canales de entrega/opciones que el JSX actual ya no renderiza. `CÓDIGO LEGADO` / `[POTENCIALMENTE NO UTILIZADO]` (posible UI planificada de canales de alerta: WhatsApp/SMS y canal de respaldo).
- **Líneas 355–369** (`primaryRow`, `primaryInfo`): tarjeta del interruptor de contacto principal.
- **Líneas 371–379** (`saveButton*`): botón rojo de guardado y su variante deshabilitada.
- **Líneas 381–383** (`cancelLink`, `cancelLinkText`): enlace de cancelación.
- [NOTA] `borderRadius`, `elevation` y colores literales en estilos; los tokens importados `borderRadius` y `shadow` no se utilizan.

## Fichas de funciones y métodos

### validate (líneas 96–105)

- Firma: `const validate = (): boolean`.
- Propósito técnico: validar los campos del formulario y volcar errores al estado; propósito funcional: evitar guardar contactos incompletos o con teléfono inválido.
- Parámetros: ninguno. Retorno: `boolean` (true = válido). Excepciones: no lanza.
- Dependencias: `name`, `phone`, `isValidPhone`, `setErrors`.
- Flujo: 1) construye `newErrors`; 2) valida nombre (vacío o < 2 letras); 3) valida teléfono (vacío o `!isValidPhone`); 4) `setErrors`; 5) devuelve ausencia de errores.
- Llamado desde: `handleSave` (línea 119).
- Efectos secundarios: actualiza `errors` (muestra mensajes inline).

### handleSave (líneas 118–135)

- Firma: `const handleSave = async () => Promise<void>`.
- Propósito técnico: orquestar validación + gating de pagos + guardado.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Dependencias: `validate`, `PAYMENTS_ENABLED`, `contacts`, `hasSubscription`, `isNew`, `performActualSave`, `setShowPayment`.
- Flujo: 1) validar (corta si falla); 2) si pagos desactivados → guardar; 3) calcular `isFirstContact`; 4) si no hay suscripción y no es el primer contacto → abrir modal de pago; 5) guardar.
- Llamado desde: `onPress` del botón de guardado.
- Efectos secundarios: abre `PaymentModal` o persiste el contacto.
- Riesgos: la regla de pago es client-side (puede eludirse o fallar sin sincronización con el backend de suscripciones).

### performActualSave (líneas 137–163)

- Firma: `const performActualSave = async () => Promise<void>`.
- Propósito: ejecutar la persistencia real del contacto (alta o edición) y prioridad.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Excepciones: catch con `Alert('Error', e.message...)`; `finally` con `setSaving(false)`.
- Dependencias: `addContact`, `updateContact`, `prioritizeContact`, `makePrimary`, `isNew`, `router`.
- Flujo: 1) `setSaving(true)`; 2) alta: `addContact` y si `makePrimary` → `prioritizeContact(created.id)`; edición: `updateContact(id, ...)` y si `makePrimary` → `prioritizeContact(id)`; 3) `router.back()`; 4) error → alerta; 5) `finally` limpia `saving`.
- Llamado desde: `handleSave`, y desde el OK de la alerta de `handlePaymentSuccess`.
- Efectos secundarios: escritura en Firestore (vía `ContactsService`) y navegación.

### handlePaymentSuccess (líneas 165–171)

- Firma: `const handlePaymentSuccess = async () => Promise<void>`.
- Propósito: reaccionar al pago exitoso: cerrar modal, marcar suscripción y guardar el contacto pendiente.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Dependencias: `setShowPayment`, `useSettingsStore.getState().setHasSubscription`, `Alert`, `performActualSave`.
- Flujo: 1) ocultar modal; 2) `setHasSubscription(true)`; 3) alerta "¡Suscripción activa!" cuyo OK dispara `performActualSave()`.
- Efectos secundarios: muta el store global de suscripción y persiste el contacto (dependiente de la interacción con la alerta).
- Riesgos: si el usuario no confirma la alerta, el contacto queda sin guardar tras un pago exitoso (ver observaciones).

## Clases / interfaces / tipos

- Sin tipos propios en el archivo. Tipos externos: `Contact` / `ContactFormData` (`src/types/Contact.ts`): `{ id, name, phone, active, priority }` con `priority: 0` = principal.
- `useLocalSearchParams<{ id: string }>` tipa el parámetro de ruta.
- `PaymentModalProps` (del componente `PaymentModal`): `visible`, `deviceId`, `userName`, `userPhone`, `onClose`, `onSuccess`.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Estilos `deliveryCard`, `deliveryOptions`, `deliveryOption*` y `fallbackRow` (líneas 310–354) sin uso en el JSX → `CÓDIGO LEGADO`, posible resto de un selector de canales de entrega planificado. `[POTENCIALMENTE NO UTILIZADO]`.
- [OBSERVACIÓN TÉCNICA] Importaciones sin uso aparente en el render actual: `ActivityIndicator` (línea 23) e `Icon` (línea 32) → `[POTENCIALMENTE NO UTILIZADO]`; los tokens `borderRadius` y `shadow` (línea 31) tampoco se usan.
- [OBSERVACIÓN TÉCNICA] Guardado post-pago dependiente de la alerta "OK" (líneas 168–170): el contacto puede no guardarse si el usuario ignora la alerta, aun con pago confirmado.
- [OBSERVACIÓN TÉCNICA] Edición de un `id` inexistente: el formulario aparece vacío y `updateContact(id)` fallará; no hay redirección ni mensaje de "contacto no encontrado".
- [OBSERVACIÓN TÉCNICA] El gating de "primer contacto gratis" y la suscripción se evalúan en cliente; el backend de suscripciones debe validar de forma autoritativa (no se ve aquí).
- [OBSERVACIÓN TÉCNICA] `hasSubscription` se actualiza con `getState().setHasSubscription(true)` tras el pago (línea 167), lo que evita reabrir el modal en el mismo flujo.
- [NIVEL DE CERTEZA: Confirmado por código] No existe validación de duplicados de teléfono más allá del texto del subtítulo.

## Seguridad

| Severidad | Hallazgo |
| --- | --- |
| MEDIO | Se gestionan datos personales de terceros (nombre y teléfono de contactos de confianza) que se persisten en Firestore. No hay cifrado adicional en cliente; la protección depende de las reglas de Firestore y del flujo `ContactsService`/autenticación. |
| MEDIO | Regla comercial evaluada en cliente (primer contacto gratis / suscripción): un usuario podría eludir el pago si el backend no valida; el `PaymentModal` sí registra el dispositivo y contacta al backend de pagos, pero la verificación autoritativa debe existir en servidor/Cloud Functions. |
| MEDIO | En caso de error se muestra `e.message` crudo (línea 159); si el servicio propaga datos internos, quedarían visibles. |
| BAJO | No se valida que el contacto sea propio del usuario autenticado en esta pantalla (lo asume `ContactsService`); un id ajeno podría intentar actualizarse si el servicio no filtra por userId. |
| INFORMATIVO | El `deviceId` (identificador de dispositivo) viaja al modal de pago; es un dato de trazabilidad sin valor de secreto. No hay tokens ni claves en este archivo ([SECRETO OCULTO] no aplica: no se declaran secretos). |

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Brecha de datos: validar en backend que el contacto pertenece al `userId` autenticado y que las reglas de Firestore limitan lectura/escritura al propietario.
- [RIESGO] Suscripción inconsistente: la regla "primer contacto gratis" debe replicarse en el backend/Cloud Functions para evitar abuso.
- [RIESGO] UX post-pago: reemplazar la alerta "OK" por un guardado automático al confirmarse el pago (o reintento silencioso).
- [RECOMENDACIÓN] Manejar el caso de edición de contacto inexistente (redirigir a `/contacts/new` o mostrar error).
- [RECOMENDACIÓN] Limpiar el bloque legacy de estilos `delivery*` y las importaciones sin uso (`ActivityIndicator`, `Icon`, `borderRadius`, `shadow`).
- [RECOMENDACIÓN] Aplicar gobernanza de datos (DAMMA/DAMA-DMBOK): registrar consentimiento del contacto de confianza antes de enviarle alertas y revisar política de retención/borrado.
