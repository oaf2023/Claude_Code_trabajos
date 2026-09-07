# Registro de resumenes de modulos (entregados por los analistas)

Actualizado incrementalmente conforme completan los subagentes.

---

## MODULO: app_servicios_audio (COMPLETADO)

- ARCHIVOS_ANALIZADOS: 3 (AudioAlertApiService 193 ln, AudioRecordingService 190 ln, WakeWordService 622 ln)
- FUNCIONES: 34 | CLASES: 1 (WakeWordServiceClass singleton)
- ENDPOINTS: POST {AUDIO_ALERT_API_URL} deteccion remota de audio; POST {PA_API_URL}/api/security/upload-recording (PythonAnywhere replica). Subida principal de voz: Firebase Storage users/{uid}/alerts/{alertId}/voice.m4a.
- VARIABLES ENTORNO: EXPO_PUBLIC_ENABLE_WAKE_WORD, EXPO_PUBLIC_ENABLE_AUDIO_GUARD, EXPO_PUBLIC_WAKE_WORD_LICENSE, EXPO_PUBLIC_AUDIO_ALERT_API_URL, EXPO_PUBLIC_AUDIO_ALERT_API_KEY, EXPO_PUBLIC_AUDIO_ALERT_LANGUAGE, EXPO_PUBLIC_AUDIO_ALERT_THRESHOLD, EXPO_PUBLIC_AUDIO_GUARD_CHUNK_MS, EXPO_PUBLIC_PA_API_URL (todas embebidas en bundle)
- SEGURIDAD: ALTO claves embebidas en APK (X-API-Key/licencia EXPO_PUBLIC_*); ALTO seguridad Storage dependiente de storage.rules; MEDIO audio de voz (biometrico) enviado a backends externos; MEDIO modo guardia simulado sin deteccion real; MEDIO logs con userId/alertId; BAJO fetch sin timeout/reintentos sin backoff.
- OBS: WakeWordService NO usa Porcupine ni DAVoice -> react-native-wakeword + modelo assets/models/wakeword_es.onnx. CODIGO LEGADO: src/config/porcupine.ts y assets/keywords/*.ppn (4 archivos de 1 byte). startCountdown sin llamadas [POTENCIALMENTE NO UTILIZADO]. Deteccion solo foreground (WAKE_WORD_FOREGROUND_ONLY=true). Doble peticion permiso microfono. Triple via de guardia (nativa/remota/simulada).

## MODULO: app_servicios_alerta (COMPLETADO)

- ARCHIVOS_ANALIZADOS: 6 (AlertQueue 129, AlertStateMachine 234, AlertService 324, 3 tests ~689)
- FUNCIONES: 24 + 6 utilidades de test
- COLECCIONES: alerts (Firestore subcoleccion de users/{userId}); AsyncStorage claves '@safealert/alert_queue' y 'alert-machine-storage'
- SEGURIDAD: MEDIO AlertQueue persiste PII en claro (telefonos/coordenadas) en AsyncStorage (cabecera afirma "AsyncStorage cifrado" sin cifrado); INFORMATIVO partialize filtra contacts/location pero persiste messageText con mapsLink; BAJO logs alertId/error, fallback coords (0,0).
- OBS: AlertService.send encola fire-and-forget (promesa rechazada no manejada). La maquina nunca alcanza 'completed'/'failed' en produccion (se detiene en awaiting_confirmation); updateContactStatus/hasPendingDeliveries/getCompletedCount/canRetry/retryFailed [POTENCIALMENTE NO UTILIZADO]. assistedCallPhone retorno sin consumidores. AlertQueue cola pasiva. Fase UI 'sent' optimista puede revertirse a 'error'. Import sin uso AlertContact en AlertStateMachine. Pruebas no cubren backoff temporal ni JSON corrupto.

---

## MODULO: app_pantallas_onboarding (COMPLETADO)

- ARCHIVOS_ANALIZADOS: 6 (bienvenida, como-funciona, permissions, test-alert, contacts/[id], ubicacion/manual) ~1829 lineas
- HALLAZGOS CLAVE: selfie biometrica a Storage/Firestore + doc users/{phoneE164} (identidad distinta a users/{uid}); gating de pagos en cliente en contacts/[id]; estilos legacy delivery* sin renderizar; refresh de permisos sin try/finally; textos UI que pueden divergir de flags/constantes ([TEST] vs SMS_TEST_PREFIX).

## MODULO: backend_resto (COMPLETADO)

- ARCHIVOS_ANALIZADOS: 7 (wsgi.py, requirements.txt, .env.example, sql 001 y 002, test_admin_endpoints.py, docs/API.md) + nota sobre cloud-run mds (otros)
- HALLAZGOS CLAVE: backend real es SQLite (no MySQL pese a descripcion general); esquema SQL 001 duplicado en arranque de flask_app.py (riesgo deriva); purga por retencion implementada (002 + /api/v1/admin/purga) cumple parcialmente (sin derecho de supresion por usuario, sin evidencia de consentimiento conservada); test_rate_limit_endpoint_devuelve_429 y test_admin_stats_sin_datos parcialmente implementados; wsgi.py fija rutas /home/oaf hardcodeadas PythonAnywhere (Cloud Run usa gunicorn flask_app:flask_app, no wsgi.py); sin secretos reales en .env.example ni tests.

---

## MODULO: app_pantallas_core (COMPLETADO)

- ARCHIVOS_ANALIZADOS: 8 (~2356 lineas): _layout, _layout.bak, +html, (tabs)/_layout, (tabs)/index, (tabs)/settings, (tabs)/history, (tabs)/contacts
- HALLAZGOS: fallback de sesion con telefono sin verificacion Firebase en layout raiz; paywall (hasSubscription local) bloquea SOS/guardia en index; _layout.tsx.bak = CODIGO LEGADO; /contacts/new cae en contacts/[id] con id=new (sin ruta estatica); consultas Firestore con userId del cliente (mitigacion reglas); historial limitado 20 sin paginacion; +html usa dangerouslySetInnerHTML con contenido estatico.
- NAVEGACION: Stack raiz ((tabs), bienvenida + modales contacts/[id], permissions, test-alert, como-funciona) y Tabs (index=Inicio, history=Historial, contacts=Contactos, settings=Configuracion)

## MODULO: app_componentes (COMPLETADO)

- ARCHIVOS_ANALIZADOS: 6 (~1595 lineas)
- ENDPOINTS: Firebase Function createPaymentOrder (httpsCallable, PaymentModal L148)
- VARIABLES: EXPO_PUBLIC_ENABLE_PAYMENTS, EXPO_PUBLIC_ENABLE_PAYMENTS_DEMO, EXPO_PUBLIC_PA_INTERNAL_KEY (X-Internal-Key)
- SEGURIDAD: ALTO bypass de pago si PAYMENTS_ENABLED=false o PAYMENTS_DEMO_ENABLED=true (onSuccess activa suscripcion y ticket correlativo sin cargo); MEDIO confirmacion manual "Ya complete el pago" sin verificacion (backend pending_verification); BAJO fallback dev ticket 9999 email corporativo; BAJO alertas e.message; INFORMATIVO userName/userPhone/deviceId enviados por HTTPS.
- OBS: M3Button sin consumidores [POTENCIALMENTE NO UTILIZADO]; importes 7500/75000 y precios UI duplicados; PaymentTicket Modal sin onRequestClose; "Terminos y Condiciones" sin enlace; botones sin accessibilityRole; WebModeBanner import typography sin uso + cast any; iOS "Cerrar aplicacion" no cierra app.

## MODULO: app_pantallas_onboarding (COMPLETADO) - ya registrado arriba.

## MODULO: backend_resto (COMPLETADO) - ya registrado arriba (incluye API endpoints, 13 variables env, tablas SQLite: ubicaciones_usuario 53 col, consentimientos_usuario 10, accesos_tecnicos 35, rate_limit_events).

---

## MODULO: funciones_firebase (COMPLETADO)

- ARCHIVOS: 9 (~830 lineas). Cloud Functions (7): sendAlertSMS (onDocumentWritten), sendAudioFollowUp, sendLocationPulseUpdate, cleanupOldAlerts (onSchedule), createPaymentOrder (onCall), mpWebhook (onRequest), syncUserToPythonAnywhere (onDocumentCreated). Helpers: claimEvent, createTwilioClient, sendNotification, _linkPreapprovalToDevice.
- SEGURIDAD: CRITICO mpWebhook sin verificacion X-Signature MP (activacion fraudulenta de suscripciones; rama preapproval PARCIAL); ALTO incoherencia createPaymentOrder (external_reference monthly/annual:<deviceId>) vs mpWebhook (subscriptions.userId) -> cliente consulta por uid; ALTO SYNC_SECRET_KEY probablemente duplicada en bundle cliente (EXPO_PUBLIC_PA_SYNC_SECRET); MEDIO sendAlertSMS envia SMS a contacts[].phone arbitrarios sin verificar contactos aprobados; MEDIO validacion debil createPaymentOrder (planType!=monthly crea cargo anual; MP_ACCESS_TOKEN por env con fallback sintetico); BAJO logs Twilio con objeto; URLs audio con token en SMS.
- OBS: sendLocationPulseUpdate sin productor en cliente [POTENCIALMENTE NO UTILIZADO]; pendingNotifications sin consumidor; users.ts serializa serverTimestamp; doc users id=phoneE164 vs reglas uid; .env.example incompleto (faltan TWILIO_API_KEY_SID/SECRET, PYTHONANYWHERE_API_URL, SYNC_SECRET_KEY); cleanupOldAlerts sin paginacion users, retencion 30 dias inline, limite 100 alertas.
- VARIABLES: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_API_KEY_SID, TWILIO_API_SECRET, TWILIO_PHONE_NUMBER, MP_ACCESS_TOKEN, PAYMENTS_ENABLED, PA_API_URL, PA_INTERNAL_KEY, PYTHONANYWHERE_API_URL, SYNC_SECRET_KEY.
- COLECCIONES: users (+ alerts/contacts/settings), _functionEvents, pendingNotifications, subscriptions; Storage users/{uid}/alerts/{alertId}/voice.m4a.

## MODULO: docs_existentes (COMPLETADO)

- ARCHIVOS: 11 + resumen_cruzado_docs.md (12 mds).
- DISCREPANCIAS DOCS VS CODIGO: ARQUITECTURA dice Flask envia SMS pero real = Cloud Function sendAlertSMS; path audio real voice.m4a (no audio.m4a); slug real alertas (no safealert); runbooks inconsistentes; Prompt_pasarela (Orders API/3DS) NO implementado (real Preference/PreApproval + simulado); API oaf.pythonanywhere.com/api/audio/detectar-alerta documentada pero ausente en repo; ARQUITECTURA omite AlertQueue/AlertStateMachine/AccountService/history.tsx/cloud-run/backend/sql.
- SEGURIDAD docs: ALTO API key audio incrustada en binario si audio guard; MEDIO politica privacidad declara ubicacion 2o plano mientras flag desactivado; INFORMATIVO TWILIO_DEFAULT_SENDER_ID hardcodeado en sendAlertSMS.ts.

## MODULO: admin_panel paginas (COMPLETADO, 8 archivos ~1224 lineas)

- ENDPOINTS backend usados: GET /api/v1/admin/stats; GET /api/v1/admin/usuarios?busqueda|mac|plan|limite; GET /api/v1/estado (sin require_admin_key); POST /api/v1/admin/pagos/simular (rate limit); POST /api/v1/admin/purga (rate limit); GET /api/v1/ubicaciones/usuario/{id}; /consentimientos/usuario/{id}; /accesos/usuario/{id}.
- AUTENTICACION: X-Admin-Key vs SAFEALERT_ADMIN_API_KEY (hmac.compare_digest); VITE_API_URL; URL por defecto https://oaf.pythonanywhere.com.
- TABLAS: users, ubicaciones_usuario, accesos_tecnicos, consentimientos_usuario, payment_events, tickets.
- SEGURIDAD: ALTO /admin/pagos/simular activa suscripciones reales sin cobro (fraude); ALTO /admin/purga borrado masivo irreversible solo con clave compartida; MEDIO X-Admin-Key en localStorage en claro reenviada por request + input; MEDIO Login envia clave a URL arbitraria escrita por usuario; MEDIO guardian rutas solo presencia local; MEDIO /api/v1/estado publico; MEDIO pantallas exponen PII sin roles; BAJO ticket MAX+1 sin atomicidad; BAJO int(dias) sin validacion; BAJO busqueda sin debounce.
- OBS: detalle usuario reutiliza busqueda LIKE limite 1; Promise.all descarta todo si una falla; listado sin paginacion real (300); precios 7500/75000 ARS duplicados; polling 60s sin pausa; simulado confirmado backend event_type admin_simulated.

## MODULO: app_servicios_localizacion (COMPLETADO, 8 archivos ~1484 lineas)

- ENDPOINTS: POST {PA_API_URL}/api/v1/ubicaciones (sin llamadores); /ubicaciones/manual (usado manual.tsx); /accesos; /consentimientos; /consentimientos/revocar; GET /ubicaciones/ultima/{id} (sin llamadores); POST /api/tel/contacto y /contacto/borrar; HEAD clients3.google.com/generate_204.
- VARIABLES: EXPO_PUBLIC_PA_API_URL (fallback oaf.pythonanywhere.com), EXPO_PUBLIC_ENABLE_BACKGROUND_LOCATION.
- SEGURIDAD: ALTO doble canal PII contactos Firestore + PythonAnywhere fire-and-forget (errores silenciosos; update/toggle/setPriority no propagan); MEDIO identificadores dispositivo (MAC/ANDROID_ID/device_id Math.random) enviados sin gestion; MEDIO ubicacion simulada BA fija (source IP/NAVEGADOR) puede ir a SOS reales; BAJO HEAD 30s a google revela IP; BAJO sin timeout; permiso iOS LIMITED tratado granted; INFORMATIVO POLITICA_PRIVACIDAD_VERSION 1.0.0.
- OBS: getMacAddress documenta filtrar 02:00... pero no filtra; hasLowBattery nombre invertido; enableNetworkProviderAsync obsoleto; unicidad telefono/nextPriority no atomica; enviarUbicacion y obtenerUltimaUbicacion [POTENCIALMENTE NO UTILIZADO].

## MODULO: publicar_distribucion (COMPLETADO, 6 + play_console_docs)

- SEGURIDAD: ALTO passwords keystore CLI + reimpresas en consola (scripts/New-AndroidReleaseKeystore.ps1 L156-157); MEDIO release.env.ps1 secretos plano en disco (gitignored); MEDIO GOOGLE_SERVICES_JSON echo multilinea ci.yml; BAJO Assert-ReleaseEnv no rechaza COMPLETAR_PASSWORD; BAJO ci.yml sin permissions minimo ni pinning SHA; .gitignore no excluye Publicar/artefactos.
- OBS: ci.yml lint y audit neutralizados con || true (L44/50) y mensaje audit enganoso; build assembleDebug en android/ sin expo prebuild pese a .gitignore /android; scripts solo Windows.
- VARIABLES: MYAPP_RELEASE_STORE_FILE/PASSWORD/KEY_ALIAS/KEY_PASSWORD, GOOGLE_SERVICES_JSON.

## MODULO: app_base_tipos (COMPLETADO, 14 archivos ~679 lineas)

- OBS: [POTENCIALMENTE NO UTILIZADO] buildMapsLinkFromCoords y export default useModel (d.ts); MessageFormatter.replace primera ocurrencia; formatPhone especifico Argentina; triggerWords no normaliza acentos; shims web resueltos por metro.config.js; Alert.ts comment source obligatoria vs tipo opcional; fallback coords 0,0 centinela.

---

## MODULO: backend_flask (COMPLETADO, 1 archivo 1591 lineas en 3 partes md)

- 27 endpoints (lista en registro anterior), 54 funciones, 4 clases (ProveedorGeolocalizacionIP ABC, IPApiProvider, ProveedorIPRegistry, GeoIPService)
- TABLAS: users, rate_limit_events, payment_events, tickets, ubicaciones_usuario, consentimientos_usuario, accesos_tecnicos (SQLite principal) y usuarios_emerg, periodo_prueba (BD TEL); 9 indices
- VARIABLES (14): SAFEALERT_DB_PATH, SAFEALERT_TEL_DB_PATH, SAFEALERT_INTERNAL_KEY, MP_WEBHOOK_SECRET, AUDIO_ALERT_API_KEY, SAFEALERT_ADMIN_API_KEY, RETENCION_ACCESOS/UBICACIONES/CONSENTIMIENTOS/LOGS_DIAS, FIREBASE_CREDENTIALS_PATH, PROXY_CONFIANZA, IPREGISTRY_API_KEY, FLASK_DEBUG
- SEGURIDAD: ALTO escrituras /api/v1 sin auth (accesos/ubicaciones/consentimientos con usuario_id arbitrario); ALTO IDOR device_id en register/status; ALTO webhook MP sin idempotencia/replay suma +32 dias; ALTO admin/pagos/simular activa suscripciones sin pago; MEDIO confianza ciega CF-Connecting-IP/XFF; MEDIO subida audio sin limite; MEDIO claves estaticas compartidas sin rotacion; MEDIO /api/v1/estado expone IP publica; MEDIO PII en reposo sin cifrado, retencion no aplica a payment_events/tickets/users; MEDIO logs PII (mp_preapproval_id, MAC); BAJO audio/TEL sin rate limit; INFORMATIVO SQL 100% parametrizado.
- OBS: PROXY_CONFIANZA sin uso; RETENCION_LOGS_DIAS sin logica; purga solo manual; ticket MAX+1 sin transaccion; rate limit por remote_addr; _rate_limit_call_counter en memoria por worker; docstring Python 3.13 vs wsgi 3.10.

## MODULO: config_raiz (COMPLETADO, 19 archivos ~776 lineas)

- SEGURIDAD: ALTO EXPO_PUBLIC_* incrustados (PA_INTERNAL_KEY, PA_SYNC_SECRET, AUDIO_ALERT_API_KEY, WAKE_WORD_LICENSE); MEDIO PAYMENTS_DEMO flag; MEDIO API key google-services restringir por paquete; MEDIO Functions Admin SDK fuera de reglas; BAJO sin validacion contenido/tamano escrituras; BAJO index.ts suprime error storage/unauthorized de LogBox; BAJO .firebaserc proyecto produccion por defecto; INFORMATIVO withDaVoiceMaven supply chain (no registrado en app.json, POTENCIALMENTE NO UTILIZADO)
- OBS: App.tsx raiz plantilla sin uso (entrada real index.ts require expo-router/entry); doble parche import.meta; parser .env casero en metro; package.json 1.0.0 vs app.json 1.2.0; NSPrivacyAccessedAPITypes duplicado; firestore.indexes.json vacio; reglas: users/{userId}/**, pendingNotifications, _functionEvents; storage users/{userId}/alerts/{alertId}/**.

## MODULO: iphone_app (COMPLETADO, 17 archivos ~316 lineas)

- CONCLUSION: VARIANTE cliente Apple delgada que reexporta app/ y src/ (monorepo implicito metro watchFolders/nodeModulesPaths). NO app independiente ni origen.
- SEGURIDAD: MEDIO iphone/app.json sin NSPrivacyAccessedAPITypes ni ITSAppUsesNonExemptEncryption (riesgo App Store); MEDIO dependencias no declaradas en iphone/package.json (resueltas del node_modules raiz); MEDIO ruta /ubicacion/manual rota en variante; BAJO Camera en permisos iOS vs raiz sin ella; INFORMATIVO scheme safealert colision.
- OBS: tab history declarada en tabs layout compartido pero no reexportada; web.output static vs single; bundle com.safealert.apple; version 1.0.0.

## MODULO: admin_panel BASE (COMPLETADO, 15 archivos ~1489 lineas)

- api.ts: fetch con X-Admin-Key de localStorage ('safealert_admin_key'); URL base localStorage 'safealert_admin_url' > VITE_API_URL > default [SECRETO OCULTO]; sin JWT ni axios; sin proxy en vite.config.
- SEGURIDAD: MEDIO clave localStorage sin expiracion/revocacion (XSS; sin CSP); MEDIO auth por clave estatica; BAJO setBaseUrl sin whitelist; BAJO index.html sin CSP; BAJO rangos ^ sin audit.
- OBS: format.ts PERMISO_LABEL/formatearSoloFecha [POTENCIALMENTE NO UTILIZADO]; Badges variante info sin uso; README plantilla Vite; tsconfig sin strict; cabeceras fecha futura 2026-07-31.

## MODULO: app_nucleo_config (COMPLETADO, 18 archivos ~1743 lineas)

- SEGURIDAD: ALTO claves EXPO_PUBLIC_* incrustadas; MEDIO userSelfieUrl/userPhone en claro AsyncStorage; MEDIO Sentry beforeSend parcial; MEDIO google-services.json embebido; BAJO currentUser web shim siempre null + catch vacio; INFORMATIVO datos guardia no persistidos.
- OBS: [POTENCIALMENTE NO UTILIZADO] Theme.ts, porcupine.ts (legado), useAccessibility.ts, Card.tsx; PORCUPINE_SENSITIVITY/COLORS en constants; bug getter currentUser (firebase.ts L367-370); import AsyncStorage sin uso; tokens duplicados (Theme vs theme/tokens).
- VARIABLES ENV: EXPO_PUBLIC_ENABLE_WAKE_WORD/AUDIO_GUARD/PAYMENTS/PAYMENTS_DEMO/BACKGROUND_LOCATION, WAKE_WORD_LICENSE, AUDIO_ALERT_API_URL/KEY/LANGUAGE/THRESHOLD, AUDIO_GUARD_CHUNK_MS, PA_API_URL, PA_INTERNAL_KEY, PA_API_KEY, SENTRY_DSN, ENVIRONMENT.
- COLECCIONES: users; users/{uid}/contacts; users/{uid}/alerts; users/{uid}/settings/app; AsyncStorage guard-storage, safealert-settings.

## MODULO: app_servicios_pago_cuenta (COMPLETADO, 9 archivos ~1134 lineas)

- PaymentService NO habla con MP: ciclo = CF createPaymentOrder + mpWebhook + backend PA. IAProcessingService es simulacion mock (sin endpoint) que persiste iaAnalysis en Firestore. SubscriptionService/AccountService/AccesoRegistroService/PythonAnywhereSync sin importadores [POTENCIALMENTE NO UTILIZADO]/LEGADO (sync migrado a functions/src/users.ts).
- SEGURIDAD: CRITICO EXPO_PUBLIC_PA_SYNC_SECRET en bundle como X-Sync-Secret; ALTO X-Internal-Key en APK (tickets); ALTO AUDIO_ALERT_API_KEY compartida como X-API-Key; ALTO getRemoteLogs sin auth (PythonAnywhereSync, URL hardcodeada); MEDIO auth debil por device_id; MEDIO storeSecure fallback AsyncStorage; MEDIO iaAnalysis falsos en produccion si simulacion activa; MEDIO envio MAC/device_unique_id/selfieUrl; BAJO PII en console.log.
- ENDPOINTS usados: /api/users/register, /api/users/status/{deviceId}, /api/payments/confirm, /api/tickets/create, /api/tel/contacto(+borrar), /api/tel/prueba/{deviceId}, /api/v1/sync-user (legado), oaf.pythonanywhere.com/api/v1/logs (hardcodeada), /api/v1/accesos y consentimientos.
- OBS: mpWebhook external_reference deviceId como userId; billingType Mensual fijo; prueba 10 dias backend PA fail-open; deleteAccount solo borra AsyncStorage.
