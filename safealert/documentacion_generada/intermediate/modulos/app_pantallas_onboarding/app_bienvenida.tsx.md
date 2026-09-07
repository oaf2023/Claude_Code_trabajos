# Archivo: app/bienvenida.tsx

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | app/bienvenida.tsx |
| Líneas totales | 432 |
| Lenguaje | TypeScript 5.9 / TSX (React Native) |
| Tamaño (bytes) | 15150 |
| Categoría | Pantalla de onboarding (expo-router, ruta `/bienvenida`) |
| Estado detectado | FUNCIONALIDAD EXISTENTE |
| Nivel de certeza | [NIVEL DE CERTEZA: Confirmado por código] |

## Objetivo

Pantalla de alta inicial del usuario (onboarding en 3 pasos) dentro del flujo
expo-router. Su responsabilidad es capturar el nombre, el teléfono (validado y
normalizado a E.164) y una selfie obligatoria, subir la selfie a Firebase
Storage, crear un documento del usuario en Firestore y persistir esos datos en el
store local (`useSettingsStore`) para marcar el onboarding como completado y
redirigir a la zona autenticada `(tabs)`. Es la ruta inicial cuando el usuario
todavía no completó el onboarding, según `initialRouteName` de `app/_layout.tsx`.

## Clasificación y estado

- Estado: `FUNCIONALIDAD EXISTENTE` — pantalla registrada como `Stack.Screen
  name="bienvenida"` en `app/_layout.tsx` (líneas 358 y 366) y usada como ruta
  inicial cuando `isOnboarded` es falso.
- [NIVEL DE CERTEZA: Confirmado por código]
- Importaciones `borderRadius` y `shadow` del tema declaradas en la línea 29 que
  no se utilizan en el cuerpo ni en los estilos (los estilos usan valores
  literales) → `[POTENCIALMENTE NO UTILIZADO]`.

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `React, useState, useRef` | estándar (React) | Estado local y ref de cámara | Sí |
| `react-native` (View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, Image, ActivityIndicator) | estándar | UI de la pantalla | Sí |
| `router` de `expo-router` | externa | Navegación a `(tabs)` | Sí |
| `CameraView, useCameraPermissions` de `expo-camera` | externa | Vista previa y captura de selfie, permiso de cámara | Sí |
| `firestore, firestoreFieldValue, storage` de `../src/config/firebase` | interna | Persistencia Firestore y Storage | Sí |
| `useSettingsStore` de `../src/stores/useSettingsStore` | interna | Persistir nombre, teléfono, selfie y flag onboarded | Sí |
| `color, spacing` de `../src/theme` | interna | Tokens visuales | Sí |
| `borderRadius, shadow` de `../src/theme` | interna | Sin uso en el archivo | No (`[POTENCIALMENTE NO UTILIZADO]`) |
| `Icon` de `../src/theme/Icon` | interna | Íconos de la UI | Sí |
| `COLLECTION_USERS` de `../src/config/constants` | interna | Nombre de la colección `users` | Sí |
| `isValidPhone, toE164` de `../src/utils/formatPhone` | interna | Validación y normalización del teléfono | Sí |

## Componentes que dependen de este archivo

- `app/_layout.tsx`: declara `<Stack.Screen name="bienvenida" options={{
  headerShown: false }} />` (línea 366) y lo establece como
  `initialRouteName` cuando el usuario no está onboarded (línea 358).
- No se encontraron otras pantallas que naveguen a `/bienvenida` mediante
  `router.push`; el acceso se produce únicamente como ruta inicial del Stack.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `telefono` | estado inicial `''` | string | Teléfono del usuario (paso 2) | líneas 35, 85-94, 150 |
| `nombre` | estado inicial `''` | string | Nombre del usuario (paso 1) | líneas 36, 60-72, 160-168 |
| `selfie` | estado inicial `null` | string \| null | URI local de la selfie capturada | líneas 37, 116-123, 143 |
| `paso` | estado inicial `1` | 1 \| 2 \| 3 | Paso actual del onboarding | líneas 38, 71, 93, 262, 326 |
| `isUploading` | estado inicial `false` | boolean | Bloquea la UI durante la subida | líneas 39, 148, 176-178 |
| `cameraRef` | `useRef<CameraView>(null)` | Ref | Referencia a la cámara | líneas 41, 116-118, 297 |
| `permission, requestPermission` | `useCameraPermissions()` | Permiso | Estado y solicitud del permiso de cámara | líneas 42, 108-114 |
| `COLLECTION_USERS` | `'users'` | string | Colección Firestore destino | línea 31 (import) y 159 |
| Prefijo de ruta de selfies | `selfies/` | string (literal) | Carpeta de Storage | línea 151 |
| Calidad de captura | `0.7` | número mágico | `quality` de la foto | línea 119 |

## Estructura (funciones / clases / tipos)

- `BienvenidaScreen` — componente principal `export default`.
- Funciones internas: `continuarPaso1`, `continuarPaso2`, `tomarFoto`, `finalizar`.
- Hooks de terceros: `useState`, `useRef`, `useCameraPermissions`,
  selectores de `useSettingsStore`.
- No hay clases ni interfaces propias; `StyleSheet.create` al final.

## Análisis línea por línea

```tsx
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
import { firestore, firestoreFieldValue, storage } from '../src/config/firebase';
import { useSettingsStore } from '../src/stores/useSettingsStore';
import { color, spacing, borderRadius, shadow } from '../src/theme';
import { Icon } from '../src/theme/Icon';
import { COLLECTION_USERS } from '../src/config/constants';
import { isValidPhone, toE164 } from '../src/utils/formatPhone';
```

**Explicación de las líneas 1–32:**

Bloque de cabecera documental (convención del proyecto) e importaciones de la
pantalla. Define las dependencias de React, componentes nativos de UI, el router
de expo-router, la cámara de Expo, la capa Firebase y el tema.

- **Línea 2** (`Archivo : bienvenida.tsx`): identificación del archivo en la cabecera documental del proyecto.
- **Línea 3**: declara el propósito: onboarding inicial con validación real y selfie obligatoria.
- **Líneas 11**: importa `useState` y `useRef` para el estado local y la referencia de cámara.
- **Líneas 12–24**: componentes de `react-native` usados en los tres pasos (formularios, alertas, teclado, scroll, imagen, indicador de actividad).
- **Línea 25** (`router`): objeto de navegación de expo-router; se usa en `finalizar` con `router.replace('/(tabs)')`.
- **Línea 26**: `CameraView` (vista de cámara) y `useCameraPermissions` (permiso y solicitud) de `expo-camera`.
- **Línea 27**: acceso a Firestore, `FieldValue` y Storage a través de la capa unificada `../src/config/firebase`.
- **Línea 28**: store Zustand donde se persiste el perfil del usuario y el flag `onboarded`.
- **Línea 29**: tokens de tema; `borderRadius` y `shadow` no se referencian más adelante → `[POTENCIALMENTE NO UTILIZADO]`.
- **Línea 31**: constante `COLLECTION_USERS` (colección `users`).
- **Línea 32**: utilidades de validación y normalización de teléfonos.

```tsx
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
```

**Explicación de las líneas 34–47:**

Declaración del componente y de todo el estado local del onboarding.

- **Línea 34**: componente raíz exportado por defecto (convención de expo-router para rutas de archivo).
- **Línea 35** (`telefono`): teléfono ingresado en el paso 2.
- **Línea 36** (`nombre`): nombre ingresado en el paso 1.
- **Línea 37** (`selfie`): URI local de la foto; `null` mientras no se capturó.
- **Línea 38** (`paso`): union type `1 | 2 | 3` que controla qué vista se renderiza.
- **Línea 39** (`isUploading`): bandera para mostrar `ActivityIndicator` y evitar doble envío durante la subida.
- **Línea 41** (`cameraRef`): ref tipada a `CameraView` para invocar `takePictureAsync`.
- **Línea 42**: hook de expo-camera que expone el estado del permiso y la función para pedirlo.
- **Líneas 44–47**: selectores de `useSettingsStore` que devuelven los setters que persistirán el resultado del alta.

```tsx
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
```

**Explicación de las líneas 49–72:**

Función de validación del paso 1 (nombre) con cabecera documental propia del
proyecto.

- **Líneas 49–59**: cabecera de documentación de la función (convención interna).
- **Línea 61** (`if (!nombre.trim())`): rechaza nombre vacío con `Alert.alert` y corta el flujo.
- **Línea 66** (`length < 2`): exige mínimo 2 caracteres (validación operativa básica).
- **Línea 71** (`setPaso(2)`): avanza al paso 2 sólo si el nombre es válido.
- [NOTA] La validación no restringe longitud máxima ni caracteres especiales.

```tsx
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
```

**Explicación de las líneas 74–94:**

Validación del teléfono usando la utilidad compartida `isValidPhone`.

- **Líneas 74–84**: cabecera documental de la función.
- **Línea 86** (`if (!isValidPhone(telefono))`): valida formato E.164 aproximado con código de país; si falla muestra alerta y no avanza.
- **Línea 93** (`setPaso(3)`): avanza al paso de selfie.

```tsx
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
```

**Explicación de las líneas 96–129:**

Captura de la selfie con la cámara frontal, solicitando permiso si hace falta.

- **Líneas 96–106**: cabecera documental.
- **Línea 108** (`if (!permission?.granted)`): si el permiso no está concedido, solicita con `requestPermission()`.
- **Líneas 110–113**: si el usuario deniega, informa y aborta (flujo bloqueado en paso 3).
- **Línea 116** (`if (cameraRef.current)`): sólo captura si la ref está montada.
- **Líneas 118–122**: `takePictureAsync` con `quality: 0.7`, sin `base64` ni `exif` (reduce peso y metadatos); al tener resultado, guarda la URI en `selfie`.
- **Líneas 124–127**: captura errores con `console.error` y alerta genérica.
- [OBSERVACIÓN TÉCNICA] La URI se conserva sólo en memoria de estado; si la app se cierra entre pasos se pierde y hay que repetir la captura.

```tsx
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
        createdAt: firestoreFieldValue.serverTimestamp(),
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
```

**Explicación de las líneas 131–179:**

Persistencia del alta: sube la selfie, crea el documento de usuario y navega a la
zona principal.

- **Líneas 131–141**: cabecera documental de la función.
- **Línea 143** (`if (!selfie)`): guarda de seguridad: sin selfie no se puede finalizar.
- **Línea 148**: activa `isUploading` (bloquea botones y muestra spinner).
- **Línea 150**: `toE164(telefono)` normaliza el teléfono (default de país `+54`).
- **Línea 151**: construye la ruta de Storage `selfies/<E164>_<epoch>.jpg`; el nombre incluye el teléfono en claro → dato personal en el path.
- **Líneas 152–156**: sube el archivo local con `putFile` y obtiene la URL pública de descarga.
- **Línea 159–164**: escribe `users/{phoneE164}` con `userName`, `userPhone`, `selfieUrl` y `createdAt` (serverTimestamp). El comentario indica que el documento activa un trigger externo en PythonAnywhere.
- [OBSERVACIÓN TÉCNICA] El documento se identifica por teléfono E.164 (PII) en lugar del UID de autenticación; otras partes del proyecto usan `users/{uid}` (p. ej. `userDoc` en `src/config/firebase.ts`). Parece un alta previa al login pensada para el trigger externo; conviene confirmar la regla de Firestore que protege esa colección.
- **Líneas 167–170**: persiste en el store local nombre, teléfono, URL de selfie y marca `setOnboarded(true)`.
- **Línea 172**: `router.replace('/(tabs)')` sustituye la ruta (no permite volver al onboarding con el gesto atrás).
- **Líneas 173–175**: error genérico con `console.error` (no imprime el teléfono, bien).
- **Líneas 176–178**: `finally` siempre restablece `isUploading`.

```tsx
  if (paso === 1) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Icon name="shield" size={80} color={color.textInverse} />
          <Text style={styles.titulo}>SafeAlert</Text>
          <Text style={styles.subtitulo}>Tu seguridad, siempre a mano</Text>

          <View style={styles.tarjeta}>
            <Text style={styles.pregunta}>¿Cuál es tu nombre?</Text>
            <Text style={styles.ayuda}>Para personalizar tu alerta de emergencia</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: María García"
              placeholderTextColor={color.textSecondary}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={styles.botonTexto}>CONTINUAR</Text>
              <Icon name="arrow-forward" size={20} color={color.danger} />
            </View>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
```

**Explicación de las líneas 181–220:**

Render del paso 1: captura del nombre.

- **Línea 181** (`if (paso === 1)`): render condicional del primer paso.
- **Líneas 183–186**: `KeyboardAvoidingView` ajusta el teclado según plataforma (`padding` en iOS, `height` en Android).
- **Línea 187**: `ScrollView` con `keyboardShouldPersistTaps="handled"` para que el botón responda con teclado abierto.
- **Línea 188**: ícono de escudo con tamaño 80.
- **Líneas 189–190**: título y subtítulo de marca.
- **Línea 195–205**: `TextInput` del nombre con `autoFocus`, `autoCapitalize="words"`, tecla "next" y envío por teclado a `continuarPaso1`.
- **Líneas 208–216**: botón principal CONTINUAR que dispara la validación.

```tsx
  if (paso === 2) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Icon name="smartphone" size={80} color={color.textInverse} />
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
              placeholderTextColor={color.textSecondary}
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Text style={styles.botonTexto}>CONTINUAR</Text>
              <Icon name="arrow-forward" size={20} color={color.danger} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setPaso(1)}
          >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Icon name="arrow-back" size={16} color={color.textInverse} />
            <Text style={styles.botonSecundarioTexto}>Volver</Text>
          </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <Icon name="lock" size={14} color="#FEE2E2" />
            <Text style={styles.nota}>
              Tu número solo se usa para identificarte en emergencias.
              No se comparte con terceros.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }
```

**Explicación de las líneas 222–280:**

Render del paso 2: captura del teléfono.

- **Línea 222** (`if (paso === 2)`): render condicional del segundo paso.
- **Línea 230**: personaliza el título con el nombre ya capturado (`Hola, {nombre}!`).
- **Líneas 234–237**: texto que explica que el número será visible por los contactos de confianza (transparencia de uso).
- **Líneas 238–248**: `TextInput` de teléfono con `keyboardType="phone-pad"`, `autoFocus` y envío por teclado `done`.
- **Líneas 251–259**: botón CONTINUAR → `continuarPaso2`.
- **Líneas 261–268**: enlace Volver que regresa a `paso 1` mediante `setPaso(1)` (navegación interna por estado, no por router).
- **Líneas 270–276**: nota de privacidad con ícono de candado indicando que el número sólo se usa para emergencias (cumplimiento declarativo de privacidad).
- [NOTA] No hay política de privacidad enlazada ni consentimiento explícito verificable; es sólo texto informativo.

```tsx
  // Paso 3: Selfie
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Icon name="camera-alt" size={80} color={color.textInverse} />
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
          <ActivityIndicator size="large" color={color.textInverse} />
        ) : (
          <>
            {selfie ? (
              <View style={{ width: '100%', gap: 10 }}>
                <TouchableOpacity style={styles.botonPrincipal} onPress={finalizar}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Icon name="check-circle" size={20} color={color.danger} />
                    <Text style={styles.botonTexto}>TODO LISTO</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setSelfie(null)}>
                  <Text style={styles.botonSecundarioTexto}>Tomar otra foto</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.botonPrincipal} onPress={tomarFoto}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Icon name="camera-alt" size={20} color={color.danger} />
                  <Text style={styles.botonTexto}>TOMAR FOTO</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setPaso(2)}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Icon name="arrow-back" size={16} color={color.textInverse} />
              <Text style={styles.botonSecundarioTexto}>Volver al teléfono</Text>
            </View>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}
```

**Explicación de las líneas 282–337:**

Render del paso 3 (selfie), que es el render por defecto cuando `paso === 3`.

- **Línea 282**: comentario que identifica el paso 3.
- **Líneas 287–288**: encabezado que declara la selfie obligatoria para identificación visual por los contactos.
- **Líneas 290–300**: contenedor circular de 280×280; si hay `selfie` muestra la vista previa `Image`, si no monta `CameraView` con `facing="front"` (cámara frontal) y la ref.
- **Líneas 302–303**: durante la subida (`isUploading`) muestra `ActivityIndicator` en lugar de acciones.
- **Líneas 305–317**: con selfie capturada muestra el botón TODO LISTO (`finalizar`) y la opción de repetir la foto (`setSelfie(null)` vuelve a mostrar la cámara).
- **Líneas 318–325**: sin selfie muestra el botón TOMAR FOTO (`tomarFoto`).
- **Líneas 326–331**: enlace Volver al teléfono que regresa a `paso 2`.
- **Línea 337**: cierre del componente.
- [NOTA] El paso 3 se muestra también para cualquier valor distinto de 1 y 2 (else implícito); el estado restringido `1 | 2 | 3` hace que esto sea correcto por tipado.

```tsx
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.danger },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 20,
  },
  titulo: {
    fontSize: 32,
    fontWeight: 'bold',
    color: color.textInverse,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 18,
    color: '#FEE2E2',
    textAlign: 'center',
    marginBottom: 10,
  },
  tarjeta: {
    backgroundColor: color.textInverse,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  pregunta: {
    fontSize: 20,
    fontWeight: 'bold',
    color: color.textPrimary,
    textAlign: 'center',
  },
  ayuda: {
    fontSize: 14,
    color: color.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    borderWidth: 2,
    borderColor: color.danger,
    borderRadius: 14,
    padding: 16,
    color: color.textPrimary,
    textAlign: 'center',
    fontWeight: 'bold',
    backgroundColor: '#F9FAFB',
  },
  inputPhone: { fontSize: 24 },
  botonPrincipal: {
    backgroundColor: color.textInverse,
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
    color: color.danger,
    letterSpacing: 1,
  },
  botonSecundarioTexto: {
    color: color.textInverse,
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
    borderColor: color.textInverse,
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
```

**Explicación de las líneas 339–431:**

Hoja de estilos de la pantalla. Todo el fondo de la pantalla usa el color de
peligro (`color.danger`, rojo), con textos en blanco (`textInverse`) sobre él.

- **Línea 340** (`container`): fondo rojo de pantalla completa.
- **Líneas 341–347** (`content`): centrado vertical/horizontal del contenido con separación `gap: 20` y padding 28.
- **Líneas 348–353** (`titulo`): tipografía grande en blanco.
- **Líneas 354–359** (`subtitulo`): texto secundario en rojo claro `#FEE2E2`.
- **Líneas 360–366** (`tarjeta`): tarjeta blanca con borde redondeado de 20 que contiene los formularios.
- **Líneas 367–372** (`pregunta`) y 373–378 (`ayuda`): textos de pregunta y ayuda dentro de la tarjeta.
- **Líneas 379–388** (`input`): campo de texto con borde rojo de 2px y fondo gris claro.
- **Línea 389** (`inputPhone`): agranda la tipografía del teléfono.
- **Líneas 390–402** (`botonPrincipal`): botón blanco de borde redondeado 50 con sombra/elevación.
- **Líneas 403–408** (`botonTexto`): texto del botón en rojo y `fontWeight: '900'`.
- **Líneas 409–414** (`botonSecundarioTexto`): texto de enlaces secundarios (Volver, tomar otra foto).
- **Líneas 415–423** (`cameraContainer`): recuadro circular de la cámara (borde 5px blanco, fondo oscuro).
- **Líneas 424–425** (`camera`, `preview`): estilos flexibles del visor y la vista previa.
- **Líneas 426–431** (`nota`): nota pequeña translúcida de privacidad.

## Fichas de funciones y métodos

### continuarPaso1 (líneas 60–72)

- Firma: `const continuarPaso1 = () => void` (arrow function sin parámetros).
- Propósito técnico: validación previa al avance de paso; propósito funcional: avanzar del paso 1 (nombre) al paso 2.
- Parámetros: ninguno. Retorno: `void`. Excepciones: no lanza; usa alertas.
- Dependencias: `nombre`, `setPaso`, `Alert`.
- Flujo: 1) trim del nombre; 2) si vacío → alerta y retorno; 3) si menor a 2 caracteres → alerta y retorno; 4) `setPaso(2)`.
- Desde dónde se llama: `onPress` y `onSubmitEditing` del paso 1.
- Efectos secundarios: muestra alertas nativas y muta el estado `paso`.
- Riesgos: validación débil (sin límite de longitud ni saneamiento); no bloquea caracteres de control o markup (irrelevante para RN pero relevante al persistir en Firestore).

### continuarPaso2 (líneas 85–94)

- Firma: `const continuarPaso2 = () => void`.
- Propósito: validar el teléfono con `isValidPhone` y pasar al paso 3 (selfie).
- Parámetros: ninguno. Retorno: `void`.
- Dependencias: `telefono`, `isValidPhone`, `setPaso`.
- Flujo: si `!isValidPhone(telefono)` → alerta; si no → `setPaso(3)`.
- Llamado desde: botón CONTINUAR y teclado (`done`) del paso 2.
- Efectos secundarios: alertas y cambio de paso.

### tomarFoto (líneas 107–129)

- Firma: `const tomarFoto = async () => Promise<void>`.
- Propósito técnico: capturar la selfie con `CameraView`; propósito funcional: obtener la foto de perfil del usuario.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Excepciones: captura errores internos y los muestra como alerta genérica; el permiso denegado corta el flujo con alerta.
- Dependencias: `permission`, `requestPermission`, `cameraRef`, `setSelfie`, `Alert`.
- Flujo: 1) si no hay permiso, solicitarlo; 2) si denegado, avisar y salir; 3) `takePictureAsync({ quality: 0.7, base64: false, exif: false })`; 4) guardar `photo.uri` en estado.
- Llamado desde: botón TOMAR FOTO del paso 3.
- Efectos secundarios: abre el diálogo nativo de permiso de cámara; loguea errores.
- Riesgos: en plataformas web `CameraView`/`takePictureAsync` puede no estar disponible (no hay rama web explícita).

### finalizar (líneas 142–179)

- Firma: `const finalizar = async () => Promise<void>`.
- Propósito técnico: persistir el alta (Storage + Firestore + store local); propósito funcional: completar el registro y entrar a la app.
- Parámetros: ninguno. Retorno: `Promise<void>`.
- Excepciones: catch general que alerta "Error de conexión"; el error original sólo va a consola.
- Dependencias: `selfie`, `toE164`, `storage`, `firestore`, `COLLECTION_USERS`, `firestoreFieldValue`, setters de `useSettingsStore`, `router`.
- Flujo: 1) guarda si falta selfie; 2) `setIsUploading(true)`; 3) normaliza teléfono a E.164; 4) construye path `selfies/<E164>_<epoch>.jpg`; 5) sube con `putFile`; 6) obtiene `downloadURL`; 7) `set` en `users/{phoneE164}` con `userName`, `userPhone`, `selfieUrl`, `createdAt`; 8) persiste en store y `setOnboarded(true)`; 9) `router.replace('/(tabs)')`; 10) en error alerta; 11) `finally` limpia `isUploading`.
- Llamado desde: botón TODO LISTO del paso 3.
- Efectos secundarios: escritura en Firebase Storage y Firestore, cambio del estado global de onboarding, navegación de reemplazo.
- Riesgos: falla a mitad de camino deja Storage con archivo huérfano si Firestore falla (no hay limpieza en catch); doc id = teléfono E.164 (PII como identificador de documento).

## Clases / interfaces / tipos

- `paso: 1 | 2 | 3` — union type local del estado del onboarding.
- `selfie: string | null` — URI de la imagen.
- `CameraView` (clase de expo-camera usada como tipo de `cameraRef`).
- No hay interfaces ni tipos propios adicionales.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Importaciones `borderRadius` y `shadow` (línea 29) sin uso real; los estilos emplean valores literales. Impacto: bajo (sólo ruido de imports).
- [OBSERVACIÓN TÉCNICA] El documento de usuario se crea con id = teléfono E.164 en `users`, mientras que el resto del proyecto opera con `users/{uid}` (ver `userDoc` en `src/config/firebase.ts`). Impacto potencial: posible duplicidad de identidades o reglas de seguridad distintas. [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] La ruta de Storage `selfies/<E164>_<epoch>.jpg` contiene el teléfono en claro; si las reglas de Storage permiten listar, expone PII. Impacto: medio.
- [OBSERVACIÓN TÉCNICA] Sin reintento ni limpieza si falla Firestore tras subir la imagen a Storage (archivo huérfano).
- [OBSERVACIÓN TÉCNICA] El paso 3 carece de `KeyboardAvoidingView`/`ScrollView`, pero no contiene inputs, por lo que no hay conflicto de teclado.
- [NIVEL DE CERTEZA: Confirmado por código] Toda la lógica descrita corresponde al código leído líneas 1–432.

## Seguridad

| Severidad | Hallazgo |
| --- | --- |
| ALTO | La selfie es dato biométrico (categoría especial de dato personal) y se sube a Firebase Storage con URL pública de descarga almacenada en Firestore. Requiere reglas de Storage/Firestore estrictas, cifrado en tránsito (HTTPS por defecto de Firebase) y política de retención. No se observa gestión de retención/borrado en esta pantalla. |
| MEDIO | El id de documento Firestore es el teléfono E.164 del usuario (PII usada como identificador); si las reglas de Firestore no limitan lectura/escritura a usuarios autenticados propietarios, un tercero podría leer o sobrescribir documentos ajenos adivinando el número. |
| MEDIO | Nombre de archivo de selfie con teléfono en claro dentro del path de Storage. |
| MEDIO | La nota de privacidad es texto declarativo ("No se comparte con terceros") sin política enlazada ni consentimiento verificable (gobernanza de datos DAMMA/DAMA-DMBOK: falta evidencia de consentimiento). |
| BAJO | Validación de nombre limitada (longitud mínima 2, sin máximo ni saneamiento); los datos se insertan vía SDK (sin inyección SQL), pero pueden contener caracteres no deseados. |
| INFORMATIVO | `console.error` de errores sin datos personales (correcto). No se imprimen secretos ni tokens. |

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Coherencia de identidad: el alta crea `users/{phone}` mientras el resto del flujo autenticado usa `users/{uid}`. Recomendación: unificar el esquema de documentos (usuario anónimo con UID o enlazar teléfono al UID) y verificar reglas de Firestore antes de producción.
- [RIESGO] Datos biométricos (selfie): recomendar revisar retención, borrado a solicitud y reglas de acceso mínimo en Storage/Firestore; evitar que la URL sea pública si no es necesaria (por ejemplo, firmar URLs con expiración).
- [RIESGO] Sin limpieza transaccional entre Storage y Firestore: recomendar subir primero y, ante fallo de Firestore, eliminar el archivo; o usar Cloud Function que valide el alta.
- [RECOMENDACIÓN] Remover imports no usados (`borderRadius`, `shadow`) para mantener el código limpio.
- [RECOMENDACIÓN] Añadir reintento y estados de error más descriptivos para el usuario final (p. ej. error de permisos de almacenamiento).
- [RECOMENDACIÓN] Considerar accesibilidad (etiquetas `accessibilityLabel`) en los controles, hoy ausentes en esta pantalla.
