# Documento: Apiparausar.md

## Resumen
- Transcripción de una conversación (aparentemente con un asistente de IA) sobre cómo incorporar a la app una API propia de transcripción de audio a texto para activar "la guardia de voz". Describe el endpoint remoto, el contrato de petición/respuesta y ejemplos de consumo desde Android nativo (Kotlin + OkHttp) e iOS nativo (Swift + URLSession).
- Es material de diseño/integración en bruto, no documentación del estado actual del proyecto: los ejemplos de código usan una base nativa (Kotlin/Swift) distinta del stack real de la app (React Native/Expo + TypeScript).
- Su valor es contractual: fija el contrato de una API externa de detección de alerta por voz alojada en PythonAnywhere (fuera de este repositorio).

## Contenido clave
- Circuito propuesto: grabar/seleccionar audio → petición HTTP → enviar a oaf.pythonanywhere.com → recibir JSON → comparar → decidir disparo de alerta.
- Endpoint operativo: `https://oaf.pythonanywhere.com/api/audio/detectar-alerta` (alias `/api/audio/transcribir`, no recomendado para el caso de negocio).
- Contrato: `POST` + `multipart/form-data`; header `X-API-Key: TU_CLAVE_PRIVADA` (placeholder); campos `archivo` (audio), `language` (`es`), `threshold` (ej. `82`).
- Respuesta JSON documentada (ejemplo de éxito): `ok`, `archivo_original`, `idioma_detectado`, `probabilidad_idioma`, `duracion_segundos`, `texto_crudo`, `texto_normalizado`, `palabras_separadas`, `palabras_comparables`, `palabras_unicas`, `keywords_evaluadas`, `coincidencias_exactas`, `coincidencias_difusas`, `mejor_match {token, keyword, score}`, `alerta_detectada`, `threshold_usado`, `segmentos`, `modelo` (`small`), `device` (`cpu`), `compute_type` (`int8`), `modo_concurrente`, `endpoint`. Sugiere un backend Whisper (modelo small, int8, CPU) detrás del endpoint.
- Campos operativos relevantes para el móvil: `alerta_detectada`, `coincidencias_exactas`, `coincidencias_difusas`, `texto_normalizado`, `mejor_match`.
- Errores documentados: API key inválida/ausente (`detail: No autorizado...`), falta de campo `archivo`, archivo > 20 MB.
- Ejemplos de código Kotlin/OkHttp y Swift/URLSession (bloques con cabeceras de archivo tipo `AudioAlertApi.kt` / `AudioAlertService.swift`).

## Relación con el código real
- [OBSERVACIÓN TÉCNICA] El endpoint `detectar-alerta`/`transcribir` NO existe en el backend versionado (`backend/flask_app.py`): la búsqueda no encontró rutas de audio de transcripción. La API documentada vive en `oaf.pythonanywhere.com` como infraestructura externa del autor, no en este repositorio. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] El cliente real no llama a `detectar-alerta`: `AudioAlertApiService.ts` usa la variable de entorno `AUDIO_ALERT_API_URL` (vacía por defecto en `.env.example`) y además envía grabaciones a `${PA_API_URL}/api/security/upload-recording` (endpoint sí existente en `flask_app.py` línea 830). La detección local por voz usa wake word con Porcupine/react-native-wakeword (`WakeWordService.ts`, `src/config/porcupine.ts`), no transcripción remota.
- [OBSERVACIÓN TÉCNICA] Los ejemplos nativos (Kotlin/Swift) no corresponden al stack real (React Native/Expo/TypeScript); son ilustrativos para un desarrollo nativo que no es el del proyecto.
- [OBSERVACIÓN TÉCNICA] El header `X-API-Key` sí es el mecanismo usado por el backend Flask real, coherente con la documentación de ARQUITECTURA.md.
- Variables relacionadas en el código: `EXPO_PUBLIC_AUDIO_ALERT_API_URL`, `EXPO_PUBLIC_AUDIO_ALERT_API_KEY`, `EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE` (default `es`) y `EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD` (default 82) en `src/config/features.ts`, alineadas conceptualmente con el contrato del documento (language `es`, threshold 82).

## Estado y uso
- BORRADOR / HISTÓRICO de integración: refleja una conversación de diseño sobre una API de transcripción que la app aún no consume de forma verificable. Sirve como especificación de un servicio externo opcional ("audio guard" desactivado por flag `EXPO_PUBLIC_ENABLE_AUDIO_GUARD=false`).
- [NIVEL DE CERTEZA: Altamente probable]

## Seguridad
- [INFORMATIVO] El documento usa únicamente el placeholder `TU_CLAVE_PRIVADA` para la API key: no expone secretos reales.
- [ALTO] Si esa API llegara a activarse en el cliente, la API key viajaría incrustada en la app (variables `EXPO_PUBLIC_*` se incrustan en el binario, según cabecera de `features.ts`): debe gestionarse como clave de bajo privilegio o reemplazarse por un proxy autenticado. [NIVEL DE CERTEZA: Inferido]
- [NOTA] Los ejemplos de código imprimen la respuesta y errores por consola (`println`/`print`); si se portaran al proyecto real habría que evitar volcar cuerpos de respuesta a logs.
