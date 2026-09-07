# Archivo: src/services/AudioRecordingService.ts

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| src/services/AudioRecordingService.ts | 190 | TypeScript 5.9 | 7159 | Servicio de audio (grabación expo-av + subida Firebase Storage) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Servicio de grabación de audio con expo-av con tres capacidades:

1. `configure()`: fija el modo de audio global de la app para permitir grabación, silencio en iOS y actividad en segundo plano.
2. `recordSnippet(durationMs)`: graba un fragmento corto (por defecto 2 s vía `AUDIO_GUARD_CHUNK_MS`) para la evaluación remota del modo guardia por voz (`AudioAlertApiService.detectAlertFromFile`).
3. `recordAndUpload(userId, alertId)`: graba el mensaje de voz de emergencia (60 s, `AUDIO_RECORDING_SECONDS`) y lo sube a **Firebase Storage** en la ruta canónica `users/{userId}/alerts/{alertId}/voice.m4a`.

Además expone `cancelSnippetRecording()` para liberar el micrófono cuando se cancela o suspende el modo guardia. Es la pieza que responde a la pregunta de dónde se sube el mensaje de voz de emergencia: a **Firebase Storage** (vía `storage().ref(...).putFile()`), no al backend Flask ni a la API de detección.

## Clasificación y estado

`FUNCIONALIDAD EXISTENTE` — Importado y usado por dos consumidores reales:

- `src/services/WakeWordService.ts` (líneas 25, 391 y 485): `cancelSnippetRecording()` al suspender la guardia remota y `recordSnippet()` en cada iteración del bucle remoto.
- `src/services/AlertService.ts` (línea 16 y 276): `recordAndUpload()` dentro de `send()` cuando `settings.audioEnabled` es verdadero.
- `src/services/__tests__/AlertService.test.ts` (líneas 15 y 34-35): mockeado en las pruebas de `AlertService`.

[NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `Audio` (de `expo-av`) | externa | `setAudioModeAsync`, `requestPermissionsAsync`, `Recording.createAsync` en todo el archivo | Sí |
| `AUDIO_RECORDING_SECONDS` (de `../config/constants`) | interna | Duración de la grabación de alerta (línea 158) | Sí |
| `buildAlertAudioStoragePath` (de `../config/features`) | interna | Ruta de Storage (línea 166) | Sí |
| `auth`, `ensureAuthenticated` (de `../config/firebase`) | interna | Verificación de sesión (líneas 136, 145) | Sí |
| `storage` (de `../config/firebase`) | interna | Subida a Firebase Storage (líneas 167-182) | Sí |

Nota técnica: `expo-av` está en modo mantenimiento/deprecado en el ecosistema Expo a favor de `expo-audio` (SDK 55); el proyecto lo excluye del chequeo `reactNativeDirectoryCheck` de `expo-doctor` en `package.json`. [OBSERVACIÓN TÉCNICA]

## Componentes que dependen de este archivo

- `src/services/WakeWordService.ts` — `cancelSnippetRecording()` (línea 391) y `recordSnippet()` (línea 485).
- `src/services/AlertService.ts` — `recordAndUpload()` (línea 276) en `send()`.
- `src/services/__tests__/AlertService.test.ts` — mocks en pruebas (líneas 34-35) y verificación de llamada (línea 239).

## Variables globales y constantes

| Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `activeSnippetRecording` | `null` inicial | `Audio.Recording \| null` | Referencia módulo-nivel a la grabación corta activa; evita grabaciones concurrentes y permite cancelarla desde fuera | Líneas 17, 32, 37, 41, 83, 98, 104 |
| `AUDIO_RECORDING_SECONDS` (importada) | `60` | number | Segundos de la grabación del mensaje de alerta | Línea 158 |

Valores mágicos: `durationMs` lo fija el llamador (2000 ms por defecto en `WakeWordService` vía `AUDIO_GUARD_CHUNK_MS`); MIME devuelto fijo `'audio/m4a'` (línea 111); el preset `HIGH_QUALITY` de expo-av (líneas 96 y 153); `interruptionModeIOS: 1` = DuckOthers e `interruptionModeAndroid: 1` = DoNotMix (líneas 61-62).

## Estructura (funciones / clases / tipos)

- Variable de módulo: `activeSnippetRecording` (línea 17).
- Objeto exportado `AudioRecordingService` (líneas 19-189) con métodos: `cancelSnippetRecording` (31-43), `configure` (56-66), `recordSnippet` (79-118), `recordAndUpload` (131-189).
- Sin clases, interfaces ni tipos propios (los tipos los aporta `expo-av`).

## Análisis línea por línea

```ts
/* ============================================================================
* Archivo         : AudioRecordingService.ts
* Descripción     : Grabación opcional y subida segura de audio de alertas.
* Autor           : oafon
* Fecha           : 2026-03-19
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : AudioRecordingService.recordAndUpload(userId, alertId)
* ============================================================================ */

import { Audio } from 'expo-av';
import { AUDIO_RECORDING_SECONDS } from '../config/constants';
import { buildAlertAudioStoragePath } from '../config/features';
import { auth, ensureAuthenticated } from '../config/firebase';
import { storage } from '../config/firebase';

let activeSnippetRecording: Audio.Recording | null = null;
```

**Explicación de las líneas 1–17:**

Cabecera documental e importaciones.

- **Línea 11**: `Audio` de `expo-av` (API de grabación/reproducción deprecada en favor de `expo-audio`).
- **Línea 12**: constante de duración de la grabación de alerta (60 s) desde `config/constants`.
- **Línea 13**: función que construye la ruta canónica de Firebase Storage.
- **Líneas 14-15**: `auth`, `ensureAuthenticated` y `storage` desde `config/firebase` (módulo Firebase). `storage` es la API modular de Firebase Storage v9+ envuelta (se usa `storage().ref()` estilo compat).
- **Línea 17**: variable de módulo que guarda la grabación corta en curso; su propósito es permitir cancelarla desde el exterior (modo guardia) y garantizar que solo exista una a la vez.

```ts
export const AudioRecordingService = {
  /* ============================================================================
  * Función         : cancelSnippetRecording
  * Descripción     : Cancela la grabación corta activa para liberar el micrófono del modo guardia.
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : WakeWordService
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : await AudioRecordingService.cancelSnippetRecording()
  * ============================================================================ */
  async cancelSnippetRecording(): Promise<void> {
    if (!activeSnippetRecording) {
      return;
    }

    try {
      await activeSnippetRecording.stopAndUnloadAsync();
    } catch {
      // No-op: liberar el recurso es best effort.
    } finally {
      activeSnippetRecording = null;
    }
  },
```

**Explicación de las líneas 19–43:**

Declaración del objeto singleton y primer método de cancelación.

- **Líneas 20-30**: cabecera documental del método.
- **Líneas 31-43**: `cancelSnippetRecording()`. Si no hay grabación activa no hace nada (líneas 32-34). En `try` detiene y descarga la grabación (`stopAndUnloadAsync`, líneas 36-37); en `catch` ignora el error con comentario explícito de best effort (líneas 38-39); en `finally` siempre limpia la referencia (línea 41). Garantiza liberar el micrófono cuando el modo guardia se suspende o se detecta una palabra.

```ts
  /* ============================================================================
  * Función         : configure
  * Descripción     : Configura el modo de audio para grabación persistente, incluyendo segundo plano.
  * Fecha           : 2026-04-09
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : recordSnippet, recordAndUpload
  * Ingesta         : Sin argumentos
  * Devolución      : Promise<void>
  * Uso             : await AudioRecordingService.configure()
  * ============================================================================ */
  async configure(): Promise<void> {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: 1, // InterruptionModeIOS.DuckOthers
      interruptionModeAndroid: 1, // InterruptionModeAndroid.DoNotMix
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  },
```

**Explicación de las líneas 45–66:**

`configure()` fija el modo de audio global de la aplicación.

- **Líneas 46-55**: cabecera documental.
- **Líneas 56-66**: `Audio.setAudioModeAsync` con configuración orientada a grabación de emergencia: `allowsRecordingIOS: true` habilita la grabación en iOS; `staysActiveInBackground: true` intenta mantener la sesión de audio activa en segundo plano (requiere capacidad `audio` de background en iOS y permiso asociado); `playsInSilentModeIOS: true` permite grabar con el interruptor de silencio activado; `interruptionModeIOS: 1` (DuckOthers) y `interruptionModeAndroid: 1` (DoNotMix) evitan que otras apps capturen el audio; `shouldDuckAndroid: true` baja el volumen de otras apps; `playThroughEarpieceAndroid: false` usa el altavoz. [NOTA] En las versiones nuevas de expo-av estos campos numéricos siguen aceptándose aunque el SDK recomiende la enumeración simbólica.

```ts
  /* ============================================================================
  * Función         : recordSnippet
  * Descripción     : Graba un fragmento corto para evaluación remota del modo guardia.
  * Fecha           : 2026-03-30
  * Versión         : 1.0.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : WakeWordService
  * Ingesta         : durationMs: number
  * Devolución      : Promise<{ uri: string; mimeType: string } | null>
  * Uso             : await AudioRecordingService.recordSnippet(2000)
  * ============================================================================ */
  async recordSnippet(
    durationMs: number
  ): Promise<{ uri: string; mimeType: string } | null> {
    try {
      if (activeSnippetRecording) {
        console.warn('[AudioRecordingService] Se omite un snippet porque ya hay una grabación en curso.');
        return null;
      }

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        return null;
      }

      await this.configure();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      activeSnippetRecording = recording;

      await new Promise((resolve) => setTimeout(resolve, durationMs));

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      activeSnippetRecording = null;
      if (!uri) {
        return null;
      }

      return {
        uri,
        mimeType: 'audio/m4a',
      };
    } catch (error) {
      console.warn('[AudioRecordingService] Error recording guard snippet:', error);
      await this.cancelSnippetRecording();
      return null;
    }
  },
```

**Explicación de las líneas 68–118:**

`recordSnippet()` graba un fragmento corto y devuelve su URI local para análisis remoto.

- **Líneas 69-78**: cabecera documental.
- **Líneas 79-81**: firma; `durationMs` indica los milisegundos de grabación.
- **Líneas 83-86**: si ya existe una grabación corta activa, aborta con `null` (mecanismo single-flight) y registra advertencia.
- **Líneas 88-91**: pide permiso de micrófono con la API de expo-av (`Audio.requestPermissionsAsync`). Si no se concede devuelve `null`. [OBSERVACIÓN TÉCNICA] `WakeWordService.start()` ya pidió el permiso con `react-native-permissions` antes; aquí se vuelve a solicitar con la API de expo-av (doble capa de permisos; en iOS la segunda llamada no vuelve a mostrar diálogo si ya está concedido).
- **Línea 93**: aplica el modo de audio de `configure()`.
- **Líneas 95-97**: crea la grabación con el preset `HIGH_QUALITY` de expo-av (AAC .m4a en Android/iOS).
- **Línea 98**: guarda la referencia activa para poder cancelarla externamente.
- **Línea 100**: espera `durationMs` con `setTimeout` envuelto en promesa (bloquea el método, no el hilo de UI).
- **Líneas 102-104**: detiene/descarga la grabación, obtiene la URI y limpia la referencia activa.
- **Líneas 105-107**: sin URI (fallo raro) devuelve `null`.
- **Líneas 109-112**: devuelve `{ uri, mimeType: 'audio/m4a' }`. [OBSERVACIÓN TÉCNICA] El MIME se fija a `audio/m4a` aunque en algunas plataformas expo-av puede generar `.caf` o `.m4a`; `AudioAlertApiService` compensa detectando la extensión real.
- **Líneas 113-117**: ante cualquier error registra `console.warn`, cancela/libera la grabación si existe y devuelve `null` (el llamador reintenta o informa en la UI). El fragmento parcial queda en el sistema de archivos temporal de la app sin limpieza explícita.

```ts
  /* ============================================================================
  * Función         : recordAndUpload
  * Descripción     : Graba el audio de una alerta y lo sube a Firebase Storage.
  * Fecha           : 2026-04-09
  * Versión         : 1.1.0
  * Lenguaje        : TypeScript 5.9
  * Conexiones      : AlertService, Firebase Storage
  * Ingesta         : userId, alertId
  * Devolución      : Promise<{ audioUrl: string; audioPath: string; localUri: string } | null>
  * Uso             : await AudioRecordingService.recordAndUpload(userId, alertId)
  * ============================================================================ */
  async recordAndUpload(
    userId: string,
    alertId: string
  ): Promise<{ audioUrl: string; audioPath: string; localUri: string } | null> {
    try {
      const authenticatedUserId = await ensureAuthenticated().catch(() => null);
      if (!authenticatedUserId || authenticatedUserId !== userId) {
        console.warn(
          '[AudioRecordingService] Se omite la subida del audio porque la sesión Firebase no coincide con la alerta activa.',
          { authenticatedUserId, alertUserId: userId }
        );
        return null;
      }

      await auth().currentUser?.getIdToken(true);

      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return null;

      await this.configure();

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      // Auto-stop after AUDIO_RECORDING_SECONDS
      await new Promise((resolve) =>
        setTimeout(resolve, AUDIO_RECORDING_SECONDS * 1000)
      );

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (!uri) return null;
```

**Explicación de las líneas 120–164:**

`recordAndUpload()` graba el mensaje de voz de la alerta y valida la sesión antes de subir.

- **Líneas 121-130**: cabecera documental. Retorno con `audioUrl`, `audioPath` y `localUri`.
- **Líneas 131-134**: firma con `userId` (duenho de la alerta) y `alertId` (documento Firestore).
- **Líneas 136-143**: verifica sesión activa con `ensureAuthenticated()` (de `config/firebase`) y la compara con el `userId` de la alerta. Si no coincide, aborta con `null` y registra advertencia que incluye **ambos ids de usuario en el log** (líneas 138-141): dato personal en logs. [OBSERVACIÓN TÉCNICA]
- **Línea 145**: refresca el token de Firebase (`getIdToken(true)`) para asegurar un token reciente en la subida a Storage (las reglas de Storage suelen validar `request.auth`).
- **Líneas 147-148**: permiso de micrófono de expo-av; sin permiso, `null`.
- **Línea 150**: aplica modo de audio.
- **Líneas 152-154**: crea la grabación HIGH_QUALITY.
- **Líneas 156-159**: espera `AUDIO_RECORDING_SECONDS` (60 s) con comentario `// Auto-stop after AUDIO_RECORDING_SECONDS`.
- **Líneas 161-162**: detiene y obtiene la URI.
- **Línea 164**: sin URI devuelve `null`.

```ts
      const audioPath = buildAlertAudioStoragePath(userId, alertId);
      const ref = storage().ref(audioPath);
      try {
        await ref.putFile(uri);
      } catch (error: any) {
        if (error?.code === 'storage/unauthorized') {
          console.warn(
            '[AudioRecordingService] Firebase Storage rechazó la subida del audio. Se continúa sin adjunto.',
            { userId, alertId }
          );
          return null;
        }

        throw error;
      }

      const audioUrl = await ref.getDownloadURL();

      return { audioUrl, audioPath, localUri: uri };
    } catch (error) {
      console.warn('[AudioRecordingService] Error recording audio:', error);
      return null;
    }
  },
};
```

**Explicación de las líneas 166–190:**

Subida a Firebase Storage y cierre del método.

- **Línea 166**: `buildAlertAudioStoragePath(userId, alertId)` genera la ruta canónica `users/{userId}/alerts/{alertId}/voice.m4a` (ver `features.ts`).
- **Línea 167**: referencia al archivo en Storage.
- **Líneas 168-180**: `ref.putFile(uri)` sube el archivo local. Si Firebase devuelve `storage/unauthorized` (reglas de Storage deniegan), se registra advertencia (con `userId` y `alertId` en el log, líneas 172-175) y se devuelve `null`: la alerta continúa **sin adjunto de audio** (decisión de diseño para no bloquear la emergencia). Cualquier otro error se relanza (línea 179).
- **Línea 182**: obtiene la URL pública descargable del archivo subido.
- **Línea 184**: retorna `{ audioUrl, audioPath, localUri }`. `localUri` se usa luego en `AlertService.send()` para la réplica a PythonAnywhere (`AudioAlertApiService.uploadSecurityRecording`).
- **Líneas 185-188**: ante errores no relacionados con autorización registra `console.warn` y devuelve `null` (el audio se omite; la alerta ya fue creada en Firestore antes de esta llamada).
- **Línea 189**: cierre del objeto exportado.

## Fichas de funciones y métodos

### cancelSnippetRecording (líneas 31–43)

- Firma (código original): `async cancelSnippetRecording(): Promise<void>`
- Propósito técnico: liberar el recurso de grabación corta activo.
- Propósito funcional: al suspender la guardia o detectar una palabra, devolver el micrófono para que el motor de wake word nativo (o la grabación de alerta) pueda usarlo.
- Parámetros: ninguno. Retorno: `Promise<void>`. Excepciones: ninguna (todas capturadas).
- Dependencias: variable de módulo `activeSnippetRecording`.
- Desde dónde se llama: `WakeWordService.suspendDetection()` (línea 391); también internamente en `recordSnippet` (línea 115).
- Efectos secundarios y riesgos: detener una grabación en curso descarta el snippet; operación idempotente y segura.

### configure (líneas 56–66)

- Firma (código original): `async configure(): Promise<void>`
- Propósito técnico: aplicar la configuración global de sesión de audio de expo-av.
- Propósito funcional: preparar el dispositivo para grabar en emergencias incluso con el teléfono en silencio.
- Parámetros: ninguno. Retorno: `Promise<void>`. Excepciones: puede lanzar si la sesión de audio falla (se propaga al llamador, que la captura).
- Dependencias: `Audio.setAudioModeAsync`.
- Desde dónde se llama: `recordSnippet` (línea 93) y `recordAndUpload` (línea 150). No se llama desde `cancelSnippetRecording`.
- Efectos secundarios y riesgos: cambia el modo de audio global de la app (afecta reproducción de otros audios). `staysActiveInBackground: true` solo surte efecto en iOS si el proyecto declara la capacidad `audio` en background (UIBackgroundModes); de lo contrario el SO suspende la app al pasar a segundo plano. [RIESGO]

### recordSnippet (líneas 79–118)

- Firma (código original): `async recordSnippet(durationMs: number): Promise<{ uri: string; mimeType: string } | null>`
- Propósito técnico: grabar un chunk corto de audio con single-flight y devolver su URI.
- Propósito funcional: alimentar el modo guardia remoto (2 s de audio por iteración) para que `AudioAlertApiService` lo analice en el servidor.
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `durationMs` | number | Milisegundos de grabación (2000 en el flujo actual) |

- Retorno: `Promise<{ uri: string; mimeType: string } | null>`. `null` si hay grabación en curso, sin permiso, sin URI o ante error. Excepciones: ninguna (capturadas).
- Dependencias: expo-av (`Audio`), `configure()`, `cancelSnippetRecording()`.
- Flujo interno: comprobar single-flight → pedir permiso → configurar audio → crear grabación → esperar `durationMs` → detener → devolver URI+MIME.
- Desde dónde se llama: `WakeWordService.runRemoteAudioGuardLoop()` (línea 485), en cada iteración del bucle.
- Efectos secundarios y riesgos: graba audio ambiente sin indicador visual persistente en cada iteración (el estado lo refleja `useGuardStore.guardStatusMessage`); los archivos temporales generados no se limpian explícitamente (el SO los gestiona); entre iteraciones hay pausas de 250 ms y la grabación y el análisis remoto se solapan con el uso normal del teléfono (audio del usuario).

### recordAndUpload (líneas 131–189)

- Firma (código original): `async recordAndUpload(userId: string, alertId: string): Promise<{ audioUrl: string; audioPath: string; localUri: string } | null>`
- Propósito técnico: grabar el mensaje de voz de la alerta (60 s) y subirlo a Firebase Storage autenticado, devolviendo URL, ruta y URI local.
- Propósito funcional: adjuntar el mensaje de voz de emergencia al documento de la alerta en Firestore (`audioUrl`/`audioPath` se escriben después en `AlertService`).
- Parámetros:

| Parámetro | Tipo | Descripción |
| --- | --- | --- |
| `userId` | string | Id Firebase del usuario al que pertenece la alerta |
| `alertId` | string | Id del documento de alerta en Firestore |

- Retorno: `Promise<{ audioUrl, audioPath, localUri } | null>`. `null` si sesión no coincide, sin permiso, sin URI, Storage rechaza, o error. Excepciones: ninguna (capturadas; salvo el `throw error` interno de la línea 179 que sí es capturado por el `catch` externo de la línea 185).
- Dependencias: `ensureAuthenticated`, `auth`, `storage` (Firebase), `buildAlertAudioStoragePath`, expo-av, `AUDIO_RECORDING_SECONDS`.
- Flujo interno: verificar sesión vs `userId` → refrescar token → permiso → configurar → grabar 60 s → detener → construir ruta → `putFile` → manejar `storage/unauthorized` → `getDownloadURL` → retorno triple.
- Desde dónde se llama: `AlertService.send()` (línea 276) en modo fire-and-forget (`.then`), solo si `settings.audioEnabled`; la grabación (60 s) ocurre en paralelo al envío de la alerta.
- Efectos secundarios y riesgos: mantiene el micrófono 60 s; si `WakeWordService` rearma la detección nativa mientras esta grabación sigue activa (véase flujo de `dispatchDetectedAlert` en `WakeWordService`), pueden competir por el micrófono. [RIESGO] No borra la grabación local tras subir. Registra `userId`/`alertId` en logs (líneas 138-141, 172-175). [BAJO]

## Clases / interfaces / tipos

No declara clases, interfaces ni tipos propios; depende de los tipos de `expo-av` (`Audio.Recording`, `Audio.RecordingOptionsPresets`, resultado de `createAsync` con `{ recording }` desestructurado).

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Líneas 88-91 y 147-148: doble petición de permiso de micrófono: primero con `react-native-permissions` en `WakeWordService.start()` (o el flujo de permisos de la app) y de nuevo con `Audio.requestPermissionsAsync` de expo-av en cada grabación. No causa doble diálogo en la práctica (iOS recuerda la concesión), pero es lógica redundante que conviene centralizar.
- [OBSERVACIÓN TÉCNICA] Líneas 138-141 y 172-175: los mensajes `console.warn` incluyen `userId` y `alertId` (identificadores personales). Riesgo de fuga de datos en logs de terceros (Sentry puede capturarlos si está configurado para registrar console).
- [OBSERVACIÓN TÉCNICA] Línea 111: MIME fijo `'audio/m4a'` en `recordSnippet` aunque expo-av en iOS puede generar otras extensiones; mitigado aguas abajo por `AudioAlertApiService` (detección de extensión real con lista blanca).
- [OBSERVACIÓN TÉCNICA] Línea 100 y 157-159: la espera con `setTimeout` no es cancelable; si el usuario cancela la alerta durante la grabación de 60 s, no hay API para abortar la espera (aunque `cancelSnippetRecording` solo aplica a snippets). La grabación de alerta termina a los 60 s completos aunque la alerta ya se haya cancelado.
- [OBSERVACIÓN TÉCNICA] Líneas 113-117 y 185-188: los errores se tragan devolviendo `null` con `console.warn`; la causa exacta (permiso, micrófono ocupado, disco lleno, red) no se distingue ni se informa al usuario.
- [OBSERVACIÓN TÉCNICA] `expo-av` deprecado: en Expo SDK 55 el módulo `expo-av` está en desuso en favor de `expo-audio`/`expo-video`; el proyecto lo excluye del chequeo de `expo-doctor` (`package.json`, `expo.doctor.reactNativeDirectoryCheck.exclude`). Migración futura pendiente.
- [NIVEL DE CERTEZA: Confirmado por código] La subida principal del mensaje de voz es a Firebase Storage en `users/{userId}/alerts/{alertId}/voice.m4a`.

## Seguridad

- [ALTO] Ruta de Storage construida con datos del usuario: `buildAlertAudioStoragePath` interpola `userId` y `alertId` en la ruta; la seguridad depende enteramente de las reglas de Firebase Storage (no analizadas aquí, pero referenciadas en `features.ts` como `storage.rules`). Si las reglas permiten escritura/lectura amplia, cualquier usuario autenticado podría leer o sobrescribir audios ajenos. [RECOMENDACIÓN] Verificar reglas: escritura solo a `users/{uid}/...` con `request.auth.uid == uid` y lectura restringida a contactos de emergencia o backend autorizado.
- [MEDIO] Manejo de `storage/unauthorized`: se captura y continúa sin audio (decisión correcta para no bloquear la emergencia), pero no distingue entre "reglas mal configuradas" y "usuario legítimo sin permiso"; la alerta queda sin evidencia de audio silenciosamente.
- [MEDIO] Logs con identificadores: `userId` y `alertId` en `console.warn` (líneas 138-141, 172-175). Clasificación: BAJO-MEDIO según política; si los logs fluyen a un agregador (Sentry), pueden constituir fuga de metadatos personales.
- [INFORMATIVO] Autenticación previa a la subida: `ensureAuthenticated()` + comparación con `userId` + refresco de token (`getIdToken(true)`) antes de `putFile` es una buena práctica de autorización en cliente; el control real de autorización queda en las reglas de Storage.
- [INFORMATIVO] El audio de 60 s es dato biométrico (voz) clasificable como dato sensible bajo marcos DAMMA/DAMA-DMBOK y normativas de privacidad; el consentimiento y la retención deben estar documentados (el audio se guarda indefinidamente en Storage salvo limpieza externa — existe `cleanupOldAlerts` referenciado en `features.ts`).
- [INFORMATIVO] No se sube ningún secreto ni token en este archivo; el token Firebase se usa internamente por el SDK (cabeceras automáticas), no se loguea.

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Conflicto de micrófono: `AlertService.send()` dispara `recordAndUpload` (60 s) sin `await` y, en paralelo, `WakeWordService.dispatchDetectedAlert` rearma la escucha nativa si la app sigue armada y en primer plano. En Android, dos capturas simultáneas de audio pueden fallar o degradarse. [RECOMENDACIÓN] Serializar el acceso al micrófono: no rearmar la detección hasta que la grabación de alerta haya terminado (estado compartido en `useGuardStore`).
- [RIESGO] Grabación en segundo plano: `staysActiveInBackground: true` solo funciona si el proyecto declara `UIBackgroundModes: audio` en iOS; sin esa declaración, la grabación de 60 s se interrumpe si el usuario bloquea la pantalla. Verificar el config plugin de `app.json`. [NIVEL DE CERTEZA: No determinado]
- [RIESGO] Ausencia de gestión de archivos temporales: los `.m4a` locales (snippets y grabaciones) se acumulan en el sandbox de la app. [RECOMENDACIÓN] Borrar la grabación local tras subir (con `FileSystem.deleteAsync` de expo-file-system) cuando no se necesite `localUri`.
- [RECOMENDACIÓN] Migrar de `expo-av` a `expo-audio` y unificar la gestión de permisos de micrófono en un único punto (`PermissionsService` ya existe).
- [RECOMENDACIÓN] Distinguir causas de error y exponerlas (p. ej. "no se pudo grabar el audio, la alerta se envió sin voz") en lugar de un silencioso `null`.
