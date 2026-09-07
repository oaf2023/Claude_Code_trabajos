# Archivo: app/ubicacion/manual.tsx

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | app/ubicacion/manual.tsx |
| Líneas totales | 208 |
| Lenguaje | TypeScript 5.9 / TSX (React Native) |
| Tamaño (bytes) | 6102 |
| Categoría | Pantalla de registro manual de ubicación (expo-router, ruta `/ubicacion/manual`) |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla de carga manual de ubicación (funcionalidad denominada "Prompt Maestro"
en su cabecera). Permite al usuario registrar su posición actual sin usar el GPS,
ingresando latitud, longitud y una dirección/observaciones opcionales. Valida los
rangos de coordenadas, persiste la ubicación en el estado local del guardián
(`LocationService.getManualLocation` → `useGuardStore.setLastLocation` con
`source: 'MANUAL'` y `permissionStatus: 'NO_SOLICITADO'`) y, si hay `userId`
registrado, la envía además al backend de administración/telemetría mediante
`LocationApiClient.enviarUbicacionManual`.

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE` — pantalla accesible desde `app/permissions.tsx`
  (línea 223, botón "Ingresar ubicación manual").
- [NIVEL DE CERTEZA: Confirmado por código]
- La ruta `ubicacion/manual` no está declarada explícitamente en
  `app/_layout.tsx` (grep sobre `name="` en `_layout.tsx` no la incluye); expo-router
  la auto-registra por convención de archivos con las opciones por defecto del
  Stack (cabecera visible). [NIVEL DE CERTEZA: Altamente probable]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `useState, useCallback` | estándar (React) | Estado del formulario y manejador memoizado | Sí |
| `react-native` (View, Text, TextInput, TouchableOpacity, StyleSheet, Alert) | estándar | UI del formulario y alertas | Sí |
| `router` de `expo-router` | externa | Volver tras guardar o cancelar | Sí |
| `LocationService` de `../../src/services/LocationService` | interna | `getManualLocation` (persistencia local con origen MANUAL) | Sí |
| `LocationApiClient` de `../../src/services/LocationApiClient` | interna | `enviarUbicacionManual` (backend de telemetría) | Sí |
| `useSettingsStore` de `../../src/stores/useSettingsStore` | interna | Leer `userId` | Sí |
| `color, spacing, typography, borderRadius` de `../../src/theme/tokens` | interna | Tokens de estilo | Sí |

## Componentes que dependen de este archivo

- `app/permissions.tsx`: botón "Ingresar ubicación manual" → `router.push('/ubicacion/manual')` (línea 223).
- No se hallaron otras pantallas que naveguen a esta ruta mediante `router.push` (grep en `app/*.tsx`).
- En la ruta inversa, esta pantalla depende de `LocationService` y `LocationApiClient` (servicios de ubicación y API de administración).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `latitud` | estado `''` | string | Latitud ingresada (texto a parsear) | líneas 21, 30, 56 |
| `longitud` | estado `''` | string | Longitud ingresada | líneas 22, 31, 57 |
| `direccion` | estado `''` | string | Dirección opcional | líneas 23, 51, 60 |
| `observaciones` | estado `''` | string | Observaciones opcionales | líneas 24, 61 |
| `guardando` | estado `false` | boolean | Bloquea campos/botones durante el guardado | líneas 25, 48, 70–72 |
| `userId` | selector del store | string \| null | Id de usuario para el envío al backend | líneas 27, 53 |
| `origen` | `'MANUAL'` | literal | Origen de la ubicación enviada | línea 58 |
| `permiso_ubicacion` | `'NO_SOLICITADO'` | literal | Indica que no se pidió permiso de ubicación | línea 59 |
| Rangos de validación | lat `[-90, 90]`, lon `[-180, 180]` | número | Validación de coordenadas | líneas 38–46 |

## Estructura (funciones / clases / tipos)

- Componente `UbicacionManualScreen` (export default, líneas 20–145).
- Función interna: `handleConfirmar` (useCallback, líneas 29–73).
- No hay clases ni interfaces propias. `StyleSheet.create` (líneas 147–208).

## Análisis línea por línea

```tsx
/* ============================================================================
* Archivo         : manual.tsx
* Descripción     : Pantalla de carga manual de ubicación (Prompt Maestro).
*                   El usuario selecciona un punto en el mapa o escribe una
*                   dirección. Origen = MANUAL.
* Autor           : oafon
* Fecha           : 2026-07-30
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9 / Expo Router
* ============================================================================ */

import { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { LocationService } from '../../src/services/LocationService';
import { LocationApiClient } from '../../src/services/LocationApiClient';
import { useSettingsStore } from '../../src/stores/useSettingsStore';
import { color, spacing, typography, borderRadius } from '../../src/theme/tokens';

export default function UbicacionManualScreen() {
  const [latitud, setLatitud] = useState('');
  const [longitud, setLongitud] = useState('');
  const [direccion, setDireccion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardando, setGuardando] = useState(false);

  const userId = useSettingsStore((s) => s.userId);
```

**Explicación de las líneas 1–27:**

Cabecera documental, importaciones y estado del componente.

- **Líneas 1–10**: cabecera que describe la pantalla como carga manual ("Prompt Maestro"); nota que el usuario selecciona un punto en el mapa o escribe dirección — el código actual sólo implementa la entrada por campos de texto (sin mapa).
- **Línea 15**: `LocationService.getManualLocation(lat, lon, address?)` persiste la ubicación localmente con `source: 'MANUAL'` y `permissionStatus: 'NO_SOLICITADO'`.
- **Línea 16**: `LocationApiClient.enviarUbicacionManual(payload)` envía la ubicación al backend de administración/telemetría.
- **Línea 18**: tokens de tema importados de `theme/tokens`.
- **Líneas 21–25**: estado de los cuatro campos y la bandera de guardado.
- **Línea 27**: `userId` (opcional) decide si además se notifica al backend.

```tsx
  const handleConfirmar = useCallback(async () => {
    const lat = parseFloat(latitud);
    const lon = parseFloat(longitud);

    if (isNaN(lat) || isNaN(lon)) {
      Alert.alert('Error', 'Ingresa latitud y longitud válidas.');
      return;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert('Error', 'Latitud debe estar entre -90 y 90.');
      return;
    }

    if (lon < -180 || lon > 180) {
      Alert.alert('Error', 'Longitud debe estar entre -180 y 180.');
      return;
    }

    setGuardando(true);

    try {
      await LocationService.getManualLocation(lat, lon, direccion || undefined);

      if (userId) {
        await LocationApiClient.enviarUbicacionManual({
          usuario_id: userId,
          latitud: lat,
          longitud: lon,
          origen: 'MANUAL',
          permiso_ubicacion: 'NO_SOLICITADO',
          direccion_confirmada: direccion || undefined,
          observaciones: observaciones || undefined,
        });
      }

      Alert.alert('Ubicación guardada', 'Tu ubicación manual ha sido registrada.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'No se pudo guardar la ubicación.');
    } finally {
      setGuardando(false);
    }
  }, [latitud, longitud, direccion, observaciones, userId]);
```

**Explicación de las líneas 29–73:**

Lógica de validación y guardado de la ubicación manual.

- **Línea 29**: `handleConfirmar` memoizado con `useCallback`; sus dependencias son los cinco valores del formulario/store (se recrea cuando cambian).
- **Líneas 30–31**: convierte los textos a número con `parseFloat`.
- **Líneas 33–36**: si algún valor no es numérico, alerta genérica y corta.
- **Líneas 38–41**: rango de latitud `[-90, 90]`.
- **Líneas 43–46**: rango de longitud `[-180, 180]`.
- **Línea 48**: `setGuardando(true)` (bloquea campos y botones).
- **Línea 51**: `LocationService.getManualLocation(lat, lon, direccion || undefined)` — guarda en el store de guardia una `AlertLocation` con `accuracy: 0`, `timestamp` actual, `isStale: false`, `source: 'MANUAL'`, `permissionStatus: 'NO_SOLICITADO'` y `address`.
- **Líneas 53–63**: sólo si existe `userId`, envía al backend el payload con `usuario_id`, `latitud`, `longitud`, `origen: 'MANUAL'`, `permiso_ubicacion: 'NO_SOLICITADO'`, `direccion_confirmada` y `observaciones` (campos opcionales como `undefined` cuando vienen vacíos).
- **Líneas 65–67**: alerta de éxito cuyo OK navega `router.back()`.
- **Líneas 68–69**: error genérico (el error real se descarta; no hay log).
- **Líneas 70–72**: `finally` restablece `guardando`.
- [OBSERVACIÓN TÉCNICA] Si no hay `userId`, la ubicación sólo queda en el estado local del dispositivo (no se sincroniza con el backend), y aun así se muestra el mismo mensaje de éxito.
- [OBSERVACIÓN TÉCNICA] La cabecera del archivo menciona "selecciona un punto en el mapa", pero el código sólo ofrece campos numéricos; no hay componente de mapa ni geocodificación inversa para autocompletar dirección.
- [OBSERVACIÓN TÉCNICA] `parseFloat` no acepta separador decimal de coma (p. ej. "-34,603"); según el locale y el teclado `decimal-pad` del dispositivo, el usuario podría recibir "latitud/longitud inválidas" aunque escriba coordenadas correctas.

```tsx
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ingresar ubicación manual</Text>
      <Text style={styles.subtitle}>
        Ingresa las coordenadas o una dirección para registrar tu ubicación.
      </Text>

      <Text style={styles.label}>Latitud (-90 a 90)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: -34.603722"
        placeholderTextColor={color.neutral400}
        value={latitud}
        onChangeText={setLatitud}
        keyboardType="decimal-pad"
        editable={!guardando}
      />

      <Text style={styles.label}>Longitud (-180 a 180)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: -58.381592"
        placeholderTextColor={color.neutral400}
        value={longitud}
        onChangeText={setLongitud}
        keyboardType="decimal-pad"
        editable={!guardando}
      />

      <Text style={styles.label}>Dirección (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Av. Corrientes 1234, CABA"
        placeholderTextColor={color.neutral400}
        value={direccion}
        onChangeText={setDireccion}
        editable={!guardando}
      />

      <Text style={styles.label}>Observaciones (opcional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Ej: Cerca de la entrada principal"
        placeholderTextColor={color.neutral400}
        value={observaciones}
        onChangeText={setObservaciones}
        multiline
        numberOfLines={3}
        editable={!guardando}
      />

      <TouchableOpacity
        style={[styles.button, guardando && styles.buttonDisabled]}
        onPress={handleConfirmar}
        disabled={guardando}
      >
        <Text style={styles.buttonText}>
          {guardando ? 'Guardando...' : 'Confirmar ubicación'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => router.back()}
        disabled={guardando}
      >
        <Text style={styles.cancelText}>Cancelar</Text>
      </TouchableOpacity>
    </View>
  );
}
```

**Explicación de las líneas 75–145:**

Render del formulario.

- **Línea 76**: contenedor raíz (sin `ScrollView` ni `KeyboardAvoidingView`).
- **Líneas 77–80**: título y subtítulo.
- **Líneas 82–91** (Latitud): etiqueta con rango, input `decimal-pad`, deshabilitado mientras `guardando`.
- **Líneas 93–102** (Longitud): idéntico patrón con su rango.
- **Líneas 104–112** (Dirección opcional): input de texto libre.
- **Líneas 114–124** (Observaciones opcionales): área multilínea de 3 líneas con `textAlignVertical: 'top'`.
- **Líneas 126–134** (Confirmar): botón rojo que llama `handleConfirmar`; texto "Guardando..." mientras esté activo.
- **Líneas 136–142** (Cancelar): enlace que vuelve con `router.back()`.
- [OBSERVACIÓN TÉCNICA] Sin `KeyboardAvoidingView`/`ScrollView`, en pantallas pequeñas el teclado puede ocultar los campos inferiores y los botones.

```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
    padding: spacing.lg,
  },
  title: {
    ...typography.h2,
    fontWeight: '700',
    color: color.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: color.textSecondary,
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    fontWeight: '600',
    color: color.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: color.textPrimary,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: color.danger,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    ...typography.body,
    fontWeight: '700',
  },
  cancelButton: {
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  cancelText: {
    color: color.textSecondary,
    ...typography.body,
  },
});
```

**Explicación de las líneas 147–208:**

Hoja de estilos construida íntegramente con tokens del tema (`color`, `spacing`,
`typography`, `borderRadius`).

- **Líneas 148–152** (`container`): fondo del tema con padding `spacing.lg`.
- **Líneas 153–163** (`title`, `subtitle`): títulos tipográficos (h2/body).
- **Líneas 164–170** (`label`): etiquetas de campo con `typography.caption`.
- **Líneas 171–179** (`input`): campo con borde `color.border` y radio `borderRadius.md`.
- **Líneas 180–183** (`textArea`): área de observaciones (altura mínima 80, texto arriba).
- **Líneas 184–198** (`button`, `buttonDisabled`, `buttonText`): botón rojo y variante atenuada.
- **Líneas 199–207** (`cancelButton`, `cancelText`): enlace de cancelación.

## Fichas de funciones y métodos

### handleConfirmar (líneas 29–73)

- Firma: `const handleConfirmar = useCallback(async () => Promise<void>, [latitud, longitud, direccion, observaciones, userId])`.
- Propósito técnico: validar, persistir localmente y (si hay userId) remitir la ubicación manual; propósito funcional: registrar la posición actual sin GPS.
- Parámetros: ninguno (lee del estado). Retorno: `Promise<void>`.
- Excepciones: catch genérico sin datos (sólo alerta); no propaga errores.
- Dependencias: `LocationService.getManualLocation`, `LocationApiClient.enviarUbicacionManual`, `useSettingsStore.userId`, estado local, `Alert`, `router`.
- Flujo: 1) `parseFloat` de lat/lon; 2) validaciones de número y rango; 3) `setGuardando(true)`; 4) `getManualLocation(lat, lon, direccion?)`; 5) si `userId`, envío al backend con `origen: 'MANUAL'` y `permiso_ubicacion: 'NO_SOLICITADO'`; 6) alerta de éxito con `router.back()` al confirmar; 7) en error, alerta genérica; 8) `finally` restablece `guardando`.
- Llamado desde: `onPress` del botón Confirmar (línea 128).
- Efectos secundarios: muta `useGuardStore.lastLocation` (ubicación actual para el flujo de alertas) y realiza una petición HTTP al backend de administración cuando hay `userId`.
- Riesgos: si el backend no responde, el catch evita romper el flujo local, pero el usuario no sabe que la sincronización falló (mensaje genérico "No se pudo guardar la ubicación").

## Clases / interfaces / tipos

- Sin clases ni interfaces propias. Tipo externo implícito: `AlertLocation` (devuelto por `LocationService.getManualLocation`) y el payload de `enviarUbicacionManual` (`LocationPayload` del `LocationApiClient` con `usuario_id`, `latitud`, `longitud`, `origen`, `permiso_ubicacion`, `direccion_confirmada`, `observaciones`).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La cabecera del archivo menciona selección de punto en mapa, pero el código sólo expone campos numéricos y de texto: la promesa de UI con mapa no está implementada aquí. `[NIVEL DE CERTEZA: Confirmado por código]`
- [OBSERVACIÓN TÉCNICA] Si `userId` es `null`, la ubicación no se sincroniza con el backend y la pantalla lo oculta (mismo mensaje de éxito). Impacto: posible inconsistencia de datos entre dispositivo y backend.
- [OBSERVACIÓN TÉCNICA] `parseFloat` + `decimal-pad`: según locale (p. ej. es-AR con coma decimal) el parseo puede fallar con coordenadas válidas. Impacto: medio en UX.
- [OBSERVACIÓN TÉCNICA] Sin `ScrollView`/`KeyboardAvoidingView` ni `keyboardShouldPersistTaps`: riesgo de campos ocultos por el teclado y de pérdida del foco al tocar botones.
- [OBSERVACIÓN TÉCNICA] El error real del backend se descarta (no hay `console.error` ni detalle): dificulta el diagnóstico remoto.
- [OBSERVACIÓN TÉCNICA] No se trimean los valores de dirección/observaciones en el envío (se mandan tal cual, con `|| undefined` sólo para vacíos).

## Seguridad

| Severidad | Hallazgo |
| --- | --- |
| MEDIO | Se transmiten coordenadas (datos de ubicación, categoría sensible) al backend de administración junto con `usuario_id`; la protección depende del transporte HTTPS y de la autenticación del endpoint (no visible en esta pantalla; ver `LocationApiClient`). |
| MEDIO | `permiso_ubicacion: 'NO_SOLICITADO'` se envía como metadato declarado por el cliente: el backend debe tratarlo como no verificable (el usuario pudo ingresar coordenadas de terceros o arbitrarias). |
| BAJO | La dirección y observaciones se guardan sin saneamiento ni límite de longitud en cliente (el límite dependerá del backend); riesgo de carga de datos inesperados vía API. |
| INFORMATIVO | No hay secretos, tokens, API keys ni logging de datos en este archivo ([SECRETO OCULTO] no aplica: no se declaran secretos). Sin embargo, la URL base de la API vive en configuración (`src/config/features.ts`) y debe tratarse como dato sensible si contiene credenciales. |

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Privacidad de la ubicación: verificar que el endpoint de `enviarUbicacionManual` exija autenticación/autorización (JWT/sesión) y que los datos viajen cifrados; revisar política de retención de ubicaciones en el backend (gobernanza DAMMA/DAMA-DMBOK).
- [RIESGO] Inconsistencia dispositivo/backend cuando no hay `userId`: decidir el comportamiento esperado y avisar al usuario.
- [RECOMENDACIÓN] Aceptar tanto punto como coma decimal al parsear coordenadas, o usar un input con normalización locale-aware.
- [RECOMENDACIÓN] Envolver el formulario en `ScrollView`/`KeyboardAvoidingView` y agregar `accessibilityLabel` a campos y botones.
- [RECOMENDACIÓN] Registrar el error real en logs (sin datos personales) para diagnóstico, y evaluar la implementación futura del selector de mapa declarado en la cabecera.
- [RECOMENDACIÓN] Validar en servidor que las coordenadas estén dentro de rangos y que `usuario_id` corresponda a una sesión legítima (nunca confiar sólo en la validación de cliente).
