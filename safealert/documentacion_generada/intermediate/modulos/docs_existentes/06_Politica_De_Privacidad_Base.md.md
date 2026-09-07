# Documento: 06_Politica_De_Privacidad_Base.md

## Resumen
- Política de privacidad "base" pensada para cumplir los requisitos de transparencia de Google Play: describe qué datos sensibles trata SafeAlert (ubicación, micrófono/audio, contactos, notificaciones), con qué finalidad, qué servicios de terceros intervienen (Firebase/Google Cloud), retención, control del usuario y contacto.
- La propia nota legal (sección 8) aclara que es una versión simplificada y que el usuario debe hospedarla en una URL pública verificable por Google Play Console.
- Es un borrador legal/administrativo, sin referencias al código; su contenido de permisos sí es contrastable con `app.json`.

## Contenido clave
- Permisos tratados y finalidad:
  - `android.permission.ACCESS_FINE_LOCATION`: ubicación precisa en primer y segundo plano, enviada a contactos solo al activar una alerta.
  - `android.permission.RECORD_AUDIO`: captura de evidencia sonora durante alerta activa; audio procesado localmente para detectar palabras clave (si se activa) y subido a almacenamiento privado en la nube.
  - `android.permission.READ_CONTACTS`: selección manual de "Contactos de Confianza".
  - `android.permission.POST_NOTIFICATIONS`: estado de alertas y confirmaciones del sistema.
- Finalidad: envío de alertas críticas, ubicación en tiempo real durante emergencias, evidencia de audio, gestión de la red de confianza. Declaración explícita de que no se venden/comparten datos con fines publicitarios.
- Terceros: Firebase (Google) para autenticación y almacenamiento (base de datos y audio), bajo infraestructura de Google Cloud.
- Retención: datos de ubicación/audio asociados a una alerta conservados mientras la alerta esté activa o sea relevante; eliminables por el usuario desde la app.
- Control del usuario: revocación de permisos desde ajustes del sistema; indicadores visuales de uso de micrófono/ubicación.
- Nota legal: texto simplificado, hospedaje en URL pública requerido.

## Relación con el código real
- Coincidencias verificadas en `app.json` (`android.permissions`): `ACCESS_FINE_LOCATION`, `RECORD_AUDIO`, `POST_NOTIFICATIONS`, `READ_CONTACTS` declarados (además de `VIBRATE`, `ACCESS_COARSE_LOCATION`, `MODIFY_AUDIO_SETTINGS`). Las descripciones de uso iOS en `infoPlist` son coherentes (NSMicrophoneUsageDescription, NSLocation*, NSContactsUsageDescription).
- Almacenamiento de audio: coincide con `buildAlertAudioStoragePath` (`users/{userId}/alerts/{alertId}/voice.m4a`) y con la subida a Firebase Storage desde `AudioRecordingService.ts`.
- Procesamiento local de palabras clave: coherente con la wake word local (Porcupine/react-native-wakeword), desactivada por defecto (`EXPO_PUBLIC_ENABLE_WAKE_WORD=false`).
- Discrepancias y observaciones:
  - [OBSERVACIÓN TÉCNICA] La política afirma ubicación en "primer y segundo plano". En la configuración actual el seguimiento en segundo plano está fuera del MVP y desactivado por flag (`EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION=false`; SETUP.md lo declara fuera del alcance publicable). La afirmación describe la intención/posibilidad, no el comportamiento por defecto vigente. [NIVEL DE CERTEZA: Altamente probable]
  - [OBSERVACIÓN TÉCNICA] La política menciona que el usuario puede eliminar los datos "desde la aplicación"; no se verificó una función de borrado de alertas/audio en el cliente en este módulo (existe `cleanupOldAlerts` en Cloud Functions para limpieza automática).
  - [OBSERVACIÓN TÉCNICA] No menciona Firebase Auth anónima ni el tratamiento de `userId`/identificadores de dispositivo (`device_id`/MAC en el backend), pese a que el backend registra usuarios por `device_id` y `mac_address`. Si la política se publicara tal cual, convendría ampliarla (sección de datos técnicos) para alinearse con DAMMA/DAMA-DMBOK.
  - [OBSERVACIÓN TÉCNICA] El texto menciona un canal de soporte genérico ("canales de soporte oficiales del proyecto") sin URL concreta; Google Play exige un medio verificable.

## Estado y uso
- BORRADOR base de política de privacidad, apta como punto de partida para publicación pero pendiente de: hospedaje en URL pública, revisión legal y ajuste a los flags reales (background location desactivado) y a los identificadores que trata el backend.
- [NIVEL DE CERTEZA: Altamente probable]

## Seguridad
- [INFORMATIVO] La política no contiene secretos.
- [MEDIO] Declaración sobre ubicación en segundo plano podría no reflejar el comportamiento real vigente (flag desactivado): riesgo reputacional/regulatorio si se publica sin ajustar. [NIVEL DE CERTEZA: Inferido]
- [INFORMATIVO] Afirma ausencia de venta de datos a terceros con fines publicitarios y uso exclusivo de Firebase/Google Cloud: coherente con la arquitectura revisada.
