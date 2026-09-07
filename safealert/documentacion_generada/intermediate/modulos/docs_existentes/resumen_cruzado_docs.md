# Resumen cruzado — Módulo docs_existentes

## Tabla de documentos

| Documento | Tipo | Estado aparente | Coherencia con código |
| --- | --- | --- | --- |
| Contexto.md | Prompt semilla de proyecto | Histórico | Parcial (intenciones vs. alcance real: llamada asistida, sin WhatsApp) |
| ARQUITECTURA.md | Arquitectura y modelo de datos | Vigente en parte / desactualizado | Alta en capa cliente; contradice flujo SMS (dice Flask, hoy Cloud Functions); omite AlertQueue/AlertStateMachine/pagos/history |
| SETUP.md | Setup del MVP | Vigente | Alta (flags, fallback pendingNotifications, voice.m4a, scripts y perfiles EAS confirmados) |
| DEPLOY.md | Deploy Firebase + distribución | Vigente en parte | Alta en lo que cubre; omite backend y Functions de pago; sin carpeta ios local |
| Apiparausar.md | Contrato de API externa de audio (borrador) | Borrador / histórico | Baja (endpoint detectar-alerta no existe en backend del repo; app no lo consume) |
| Prompt_pasarela.md | Prompt de especificación MP Orders API/3DS | Borrador de especificación | Baja (implementación real usa SDK con Preference/PreApproval, sin Orders API/3DS) |
| Prompts_de_errores.md | Playbook de QA (prompt genérico) | Histórico / auxiliar | Nula (no referencia el proyecto; stacks Swift/Compose ajenos a la app RN) |
| TUTORIAL-DISTRIBUCION-AYUDAME.md | Tutorial de rebranding y publicación | Vigente como guía de trabajo | Media-alta (identificadores reales; slug incorrecto: dice safealert, real alertas; versión superada) |
| 06_Politica_De_Privacidad_Base.md | Política de privacidad base | Borrador legal | Media (permisos coinciden; declara background location desactivado hoy; sin mención de device_id/MAC) |
| docs/runbooks.md | Runbook resumido | Vigente en parte | Media (AlertQueue/AlertStateMachine/PAYMENTS_ENABLED/confirm confirmados; usuario PA y logs PM2 imprecisos) |
| docs/runbooks/README.md | Runbook detallado | Vigente | Alta (formatPhone, recoverIncompleteAlerts, pendingNotifications, webhook, SAFEALERT_DB_PATH confirmados; ruta python/ y esquema subscription_status imprecisos) |

## Afirmaciones arquitectónicas clave de ARQUITECTURA.md / SETUP.md / DEPLOY.md que otros anexos deberían contrastar

1. "El envío de SMS lo hace el backend Flask (POST /api/alert)" (ARQUITECTURA.md sección 5). Contraste recomendado: funciones/ y sendAlertSMS.ts muestran envío por Cloud Function con trigger Firestore y fallback interno; verificar si existe algún endpoint Flask `/api/alert` o si la afirmación es obsoleta.
2. "Path de audio en Storage: users/{userId}/alerts/{alertId}/audio.m4a" (ARQUITECTURA.md) vs. "voice.m4a" (SETUP.md). Verificado en features.ts: `buildAlertAudioStoragePath` genera `voice.m4a`. Otros anexos de audio deben usar voice.m4a.
3. "Tablas SQLite PythonAnywhere: usuarios_emerg y periodo_prueba" (ARQUITECTURA.md). Verificado en flask_app.py; contrastar además tabla `users` (subscription_status, plan_type, mac_address) y los scripts MySQL de backend/sql/ (variante Cloud Run) que la doc raíz no menciona.
4. "Variables de entorno en src/config/features.ts: PA_API_URL, AUDIO_ALERT_API_KEY, AUTHENTICATION_TIMEOUT_MS" (ARQUITECTURA.md). Contraste: en código son `EXPO_PUBLIC_PA_API_URL`, `EXPO_PUBLIC_AUDIO_ALERT_API_KEY`, `AUTHENTICATION_TIMEOUT_MS`; features.ts lee además flags EXPO_PUBLIC_ENABLE_* y claves AUDIO_ALERT/WAKE_WORD_LICENSE no citadas en SETUP.md.
5. "Flags por defecto: EXPO_PUBLIC_ENABLE_WAKE_WORD=false, EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION=false" (SETUP.md). Verificado en .env.example y features.ts (fallback false); contrastar impacto real de PA background location en la política de privacidad (06_...) que declara ubicación en segundo plano.
6. "Cloud Functions envían SMS o fallback interno con trazabilidad por contacto (pendingNotifications)" (SETUP.md/DEPLOY.md). Verificado (sendAlertSMS.ts, colección pendingNotifications bloqueada por firestore.rules). Contrastar campos de trazabilidad (provider, providerMessageId, attempts, lastError) y política de reintentos (AlertQueue/recoverIncompleteAlerts, máx. 5).
7. "Función pública sendAlertSMS y validación con firebase functions:log" (DEPLOY.md). Verificado: se exporta desde functions/src/index.ts. Contrastar el resto de exportaciones (sendAudioFollowUp, sendLocationPulseUpdate, cleanupOldAlerts, createPaymentOrder, mpWebhook, syncUserToPythonAnywhere) no documentadas.
8. "Reglas Firestore: cada usuario solo lee/escribe su propio /users/{userId}/" (ARQUITECTURA.md sección 8). Verificado en firestore.rules; contrastar reglas de Storage (storage.rules) y colecciones de sistema (pendingNotifications, _functionEvents) denegadas al cliente.
9. "Pagos: pasarela Mercado Pago con Orders API y 3DS 2.0" (Prompt_pasarela.md, como especificación) y "pagos desactivados hasta producción" (runbooks). Contraste: implementación real = functions con Preference/PreApproval del SDK mercadopago + webhook Flask con verify_mp_signature + modo demo; sin Orders API/3DS hallados.
10. "Build Android: abiFilters arm64-v8a + x86_64 y pérdida del fix con expo prebuild" (ARQUITECTURA.md sección 9). No contrastable en este módulo (carpeta android/ excluida); dejarlo para el módulo de build/nativo.
11. "Distribución: perfiles EAS preview (APK) y production (AAB)" (SETUP.md/DEPLOY.md/TUTORIAL). Verificado en eas.json; contrastar versionCode/versión reales (hoy 1.2.0 / versionCode 4) y slug real `alertas`.
12. "La alerta SOS no depende del backend PythonAnywhere (solo sync de perfil)" (runbooks). Contrastar con la superficie real de flask_app.py (/api/v1/ubicaciones, consentimientos, accesos, admin, tickets) que sí consumen servicios del cliente, para dimensionar la dependencia real.
13. "Twilio: variables TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER" (SETUP/DEPLOY). Contraste: el código soporta además TWILIO_API_KEY_SID/TWILIO_API_SECRET y un TWILIO_DEFAULT_SENDER_ID hardcodeado ([SECRETO OCULTO] si se reporta su valor); documentar la autenticación realmente usada.

## Notas de higiene de secretos
- Ningún documento original analizado contiene valores reales de credenciales (solo placeholders tipo ACxxxx / TU_CLAVE_PRIVADA / TEST-xxxx), salvo identificadores de despliegue citados en runbooks (usuario PythonAnywhere, paths de backup) y un sender ID Twilio por defecto en el código (`sendAlertSMS.ts`), que debe tratarse como [SECRETO OCULTO] en cualquier reporte.
- No se reproducen aquí valores de `.env` ni de `google-services.json`; solo nombres de variables y su propósito.
