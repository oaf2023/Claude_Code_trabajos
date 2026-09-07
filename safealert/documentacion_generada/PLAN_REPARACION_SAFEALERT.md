# PLAN DE REPARACIÓN — SAFEALERT

**Autor:** Equipo SafeAlert · **Fecha:** 2026-09-06 · **Versión:** 1.0
**Base:** auditoría completa del repositorio (`documentacion_generada/`, anexos A–G)
**Regla:** este plan **no modifica código**. Cada fase se ejecutará solo con tu
autorización explícita y con commits secuenciales (`0001`, `0002`, …) según la
convención del proyecto. Toda salida de documentación se mantiene en
`documentacion_generada/`.

---

## 0. Gobierno previo (hacer antes de tocar código)

1. Crear rama `fix/seguridad-pagos` desde `main` y confirmar estado limpio.
2. Rotar/crear credenciales de prueba: token Mercado Pago (TEST), claves de
   backend y webhook, Twilio de sandbox.
3. Definir entorno de staging replicable (Firebase project + Cloud Run + Secret
   Manager de staging) para no probar sobre producción.
4. Congelar `PAYMENTS_ENABLED=false` y `EXPO_PUBLIC_ENABLE_PAYMENTS_DEMO=false`
   en producción durante la remediación (mitigación inmediata, sin código).
5. Hacer snapshot/backup manual de Firestore y SQLite antes de cada fase.
6. Criterio de salida por fase: typecheck ✔ · tests ✔ · prueba manual en
   sandbox ✔ · sin secretos en bundle (escaneo) ✔ · commit con mensaje
   `000N` y nombre de archivo principal.

---

## FASE 1 — CRÍTICO: verificación de firma del webhook de Mercado Pago

**Archivo:** `functions/src/mpWebhook.ts` (webhook `onRequest`).
**Estado actual (confirmado por código):** no valida `X-Signature` ni
`X-Request-Id`; con un `POST` con `?type=payment&data.id=<id de un pago aprobado>`
cualquier tercero puede activar una suscripción. La rama
`subscription_preapproval` (líneas 22–34) solo registra en consola (inerte).
`external_reference` se escribe tal cual como `subscriptions.userId` (incoherente).

> **✅ EJECUTADA el 2026-09-06 (commit 0001)** — ver sección "Registro de
> ejecución" al final del documento. Pendiente de despliegue y validación con
> evento real de sandbox.

**Cambios propuestos**
1. Añadir helper `verificarFirmaMercadoPago(req)`:
   - Leer `x-signature` (`ts=…,v1=…`) y `x-request-id`.
   - Calcular HMAC-SHA256 de la cadena canónica
     `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` con la clave de firma de
     webhook de la integración (confirmar el algoritmo exacto en la
     documentación oficial vigente y probarlo en sandbox antes de producción).
   - Comparar en tiempo constante; rechazar con `401` si no coincide o si `ts`
     está fuera de una ventana (p. ej. ±5 min, anti-replay).
2. Tras validar firma, **re-consultar el pago** con el SDK (`payment.get`) y
   exigir `status === 'approved'` (ya se hace) **y** que `external_reference`
   tenga el formato controlado por nosotros (ver Fase 2).
3. **Idempotencia:** usar el documento `subscriptions` con
   `mercadopagoOrderId` como clave única (consulta previa antes de crear/
   actualizar) para impedir doble procesamiento por reintentos del webhook.
4. Rama `preapproval`: eliminar la "simulación" o implementarla con
   `client.preapproval.get` y activación real verificada; nunca activar por el
   mero hecho de recibir el evento.
5. Responder siempre `200 OK` tras validar firma; `401/400/500` con logs
   acotados (sin datos de pago completos).

**Pruebas**
- Unit: helper de firma (firma válida, inválida, ts viejo, falta de headers).
- Integración: webhook con payloads de sandbox (payment approved/rejected,
  preapproval) verificando que solo se activa lo aprobado y firmado.
- Regression: flujo actual de "confirmación manual" sigue existiendo pero
  nunca activa sin verificación backend.

**Commit sugerido:** `0001` · `functions/src/mpWebhook.ts` (+ tests)

---

## FASE 2 — ALTO: coherencia de pagos `createPaymentOrder` ↔ `mpWebhook`

**Archivos:** `functions/src/createPaymentOrder.ts`, `functions/src/mpWebhook.ts`,
cliente `src/services/PaymentService.ts`, `src/services/SubscriptionService.ts`,
`src/components/PaymentModal.tsx`, backend `backend/flask_app.py` (tickets/link).

**Problemas (confirmados)**
- `createPaymentOrder` genera `external_reference: monthly:<deviceId>` /
  `annual:<deviceId>` (líneas 125 y 170), sin vincular el `uid` autenticado al
  `deviceId` recibido (un usuario puede operar el deviceId de otro: validación
  débil + vector IDOR del lado Functions).
- `mpWebhook` escribe ese valor crudo en `subscriptions.userId`, mientras el
  cliente (`SubscriptionService`) consulta por `userId = uid` → la suscripción
  "no existe" para el usuario. `billingType: 'Mensual'` fijo aunque sea anual.
- Monto/plan no se guardan desde la orden (fallback `5000` en el webhook).

**Cambios propuestos**
1. **Contrato único de orden:** al crear la orden, generar
   `external_reference = "<uid>:<orderId>"` (o un id opaco persistido), y crear
   un documento de orden bajo `users/{uid}/orders/{orderId}` con
   `{deviceId, planType, amount, currency, status:'pending', createdAt}`.
2. En `createPaymentOrder`: validar que `request.auth.uid` corresponde al
   `deviceId` declarado (verificar contra `users/{uid}` o el registro del
   dispositivo) y que `planType ∈ {'monthly','annual'}` con validación estricta
   (hoy cualquier valor ≠ monthly crea anual).
3. En `mpWebhook`: parsear `external_reference` → `uid` + `orderId`;
   actualizar la orden a `approved` y crear/actualizar la suscripción bajo
   `subscriptions/{uid}` (o `users/{uid}/subscription`) con
   `{status:'Activa'|'Vencida', planType, billingType, amount, expiresAt}`.
   Calcular `expiresAt` (mensual +1 mes, anual +12 meses) en servidor.
4. Unificar consultas del cliente (`SubscriptionService` y pantallas) sobre el
   nuevo path y estados; `PaymentService` pasa a consultar el estado de la
   orden/suscripción vía Cloud Function callable (no claves en el cliente).
5. Ajustar `PaymentModal` y textos: estados `pending_verification`, `approved`,
   `expired`; eliminar la "confirmación manual" como vía de activación (la
   activación la hace solo el webhook/backend).

**Pruebas**
- Unit de parseo/validación de `external_reference`.
- Integración: crear orden mensual/anual en sandbox; simular webhook firmado
  aprobado y verificar `subscriptions/{uid}` y `expiresAt`.
- Test E2E mínimo en app (pago sandbox → suscripción visible).

**Commits sugeridos:** `0002` createPaymentOrder · `0003` mpWebhook (parte 2) ·
`0004` cliente (Payment/Subscription/Modal)

---

## FASE 3 — ALTO: secretos `EXPO_PUBLIC_*` en el binario

**Archivos clave:** `src/config/features.ts` (exporta
`AUDIO_ALERT_API_KEY`, `WAKE_WORD_LICENSE_KEY`, `PA_INTERNAL_KEY`…),
`metro.config.js` (parser de `.env`), `.env.example` (raíz/functions),
`src/services/*` que usan `X-Internal-Key`, `X-API-Key`, `X-Sync-Secret`,
`functions/src/*` (token MP con `|| 'TEST-…'` de fallback, líneas 15 y 22–23),
`Publicar/config/release.env.example.ps1`.

**Principio:** nada secreto con prefijo `EXPO_PUBLIC_` (se incrusta en el
bundle). Los secretos viven solo en servidor (Secret Manager / env de
Functions/Cloud Run) y se consumen a través de **proxies**:

**Cambios propuestos**
1. Auditoría de usos: listar cada `EXPO_PUBLIC_*` usado como clave/secret y su
   consumidor (AudioAlertApiService, PaymentService, TrialService,
   PythonAnywhereSync, LocationApiClient, WakeWordService/licencia).
2. Migrar por consumidor a una Cloud Function callable (o endpoint del backend
   en Cloud Run) que:
   - recibe solo datos del cliente (audio, ids, flags) **sin claves**;
   - usa el secreto en servidor y devuelve resultado acotado.
   Ejemplos: `proxyAudioAlert` (sustituye a llamar directo con
   `AUDIO_ALERT_API_KEY`), `proxyLinkPreapproval` (sustituye a
   `X-Internal-Key`), `checkSubscription` server-side.
3. Eliminar del cliente:
   - `EXPO_PUBLIC_PA_INTERNAL_KEY`, `EXPO_PUBLIC_PA_API_KEY`,
     `EXPO_PUBLIC_PA_SYNC_SECRET`, `EXPO_PUBLIC_AUDIO_ALERT_API_KEY`,
     `EXPO_PUBLIC_WAKE_WORD_LICENSE` (o mover la licencia a un flujo servido
     por backend proxy de voz).
   - Fallbacks de tokens MP `'TEST-…'` en `createPaymentOrder.ts` y
     `mpWebhook.ts`: si no hay token configurado, la función debe fallar (no
     usar token sintético).
4. Limpiar `metro.config.js` (no leer secretos del `.env`) y `.env.example` de
   ambas zonas (dejar solo variables no secretas o documentar que las secretas
   van a Secret Manager).
5. Rotar todas las claves que alguna vez estuvieron en un bundle.
6. Añadir escaneo en CI (regex de `EXPO_PUBLIC_` + patrones de secretos) y
   forzar `EXPO_PUBLIC_ENVIRONMENT=production` sin flags demo en builds de
   producción (`eas.json`).

**Pruebas**
- Escaneo del bundle exportado (`expo export`) sin patrones de clave.
- Pruebas funcionales de cada proxy callable (audio, pago, sincronización,
  suscripción) desde la app sin claves en el cliente.

**Commits sugeridos:** `0005` funciones proxy · `0006` cliente (features +
servicios) · `0007` CI/eas + limpieza `.env*`

---

## FASE 4 — ALTO: simulación/bypass de pagos activable en producción

**Archivos:** `src/config/features.ts` (`PAYMENTS_DEMO_ENABLED`),
`src/components/PaymentModal.tsx` (`handleDevBypass`/`onSuccess`),
`backend/flask_app.py` (`POST /api/v1/admin/pagos/simular`),
`admin/src/pages/PagoSimulado.tsx`.

**Cambios propuestos**
1. Eliminar la ruta de desarrollo que activa la suscripción local en
   `PaymentModal` (o blindarla con doble condición: build de desarrollo **y**
   `EXPO_PUBLIC_ENVIRONMENT !== 'production'` **y** flag de feature server-side).
2. Endpoint `/api/v1/admin/pagos/simular`:
   - Solo disponible si `SIMULATE_PAYMENTS=true` en el entorno (por defecto
     ausente) y, además, con una clave admin distinta (p. ej. `SAFEALERT_ADMIN_SIM_KEY`).
   - Registrar evento de auditoría (`event_type:'admin_simulated'`, admin id,
     timestamp, motivo) y **marcar** el ticket como simulado (ya existe el
     flag `simulado:true` en backend).
   - Nunca escribir una suscripción "real" en producción desde simulación: en
     entorno de producción el endpoint debe responder `403`.
3. En el cliente: eliminar gating de funcionalidades basado solo en
   `hasSubscription` local; consultar estado real vía callable (Fase 2/3).
4. Backend admin: revalidar en cada request de admin la procedencia (lista
   blanca de IP si aplica), `hmac.compare_digest` (ya usado) y expiración de
   claves.

**Pruebas**
- Build release: comprobar que el bypass no existe y el flag demo queda `false`.
- Backend: `SIMULATE_PAYMENTS` ausente → 403/404; presente en staging →
  funciona y audita.
- E2E: pago sandbox real sin uso de simulación.

**Commit sugerido:** `0008` (cliente + backend + admin)

---

## FASE 5 — ALTO: purga masiva con clave compartida

**Archivos:** `backend/flask_app.py` (`POST /api/v1/admin/purga`),
`admin/src/pages/Admin.tsx` (ejecutarPurga).

**Cambios propuestos**
1. Separación de capacidades en las claves admin (o tokens por rol):
   `SAFEALERT_ADMIN_API_KEY` (lectura) vs clave/modo `PURGE_ENABLED` +
   confirmación explícita en backend.
2. Purga por lotes con límite (`LIMIT ...` por iteración), **soft-delete**
   previo (tabla `purga_log` con backup en Storage de los registros afectados
   codificados) y borrado físico posterior; parada ante error.
3. Requerir `X-Confirm-Purge: <frase/hash>` generado por una llamada previa con
   TTL corto (doble paso real en backend, no solo UI).
4. Auditoría completa: quién, cuándo, filtros, nº de registros, resultado.
5. Aplicar también a la purga de consentimientos respetando la evidencia legal
   (conservar prueba de consentimiento aunque se purguen los datos
   operativos) — deuda detectada en Anexo C.

**Pruebas**
- Unit/integración: sin confirmación → 400; con confirmación vencida → 400;
  límite de lotes respetado; backup creado.
- Restauración de prueba desde el backup.

**Commit sugerido:** `0009` backend + `0010` admin

---

## FASE 6 — ALTO/MEDIO: doble canal de contactos (PII) y consolidación de identidad

**Archivos:** `src/services/ContactsService.ts` (escribe Firestore y hace
fire-and-forget a `/api/tel/contacto`), `src/services/TrialService.ts`,
`src/services/PythonAnywhereSync.ts` (legado), `functions/src/users.ts`
(`syncUserToPythonAnywhere`), `app/bienvenida.tsx` (doc `users/{phoneE164}`),
backend `/api/tel/*` y BD TEL, `firestore.rules`.

**Decisión a confirmar (recomendada):** una única fuente de verdad
**Firestore** bajo `users/{uid}`. El canal `/api/tel/*` (PythonAnywhere +
`safealert_tel.db`) se deprega y se elimina en dos pasos.

**Cambios propuestos**
1. `ContactsService`: eliminar el envío fire-and-forget al canal externo en
   `add`/`remove`; mantener CRUD Firestore como fuente de verdad.
2. Migrar cualquier consumidor real del canal TEL (trial/prueba y SMS) a las
   Cloud Functions/backend canónico:
   - estado de prueba → Cloud Function o backend Cloud Run con los mismos
     datos en SQLite/Cloud SQL gestionada;
   - sincronización de usuarios (`syncUserToPythonAnywhere`) → solo si hay
     consumidor; si no, desactivar el trigger con flag y eliminar después.
3. `app/bienvenida.tsx`: cambiar el alta a `users/{uid}` (creado por
   autenticación) en lugar de `users/{phoneE164}`; el teléfono pasa a ser un
   campo del perfil, no el id del documento (evita duplicidad y PII como id).
4. Aplicar política de retención/consentimiento al nuevo flujo y revisar
   `firestore.rules`/`storage.rules` (incluir validación de tamaño/contenido y
   paths por `uid`).
5. Evaluar cifrado en reposo de PII local (AsyncStorage con expo-secure-store
   real y sin fallbacks a texto plano; revisar `PrivacyService.storeSecure`).

**Pruebas**
- CRUD de contactos sin dependencia del canal externo.
- Onboarding crea `users/{uid}`; perfiles antiguos migrados (script).
- Reglas Firestore: deny de escritura cruzada entre usuarios.

**Commits sugeridos:** `0011` cliente contactos/bienvenida · `0012` functions
(sync flag/remoción) · `0013` backend (retiro canal TEL) · `0014` reglas y
cifrado local

---

## FASE 7 — MEDIO: documentación ↔ código

**Objetivo:** que la documentación refleje el estado real tras las fases 1–6.

1. Reescribir/actualizar `ARQUITECTURA.md` (SQLite/Cloud Run, CF envían SMS,
   path `voice.m4a`, slug `alertas`, motor react-native-wakeword, pagos vía
   Functions+webhook, sin llamadas autónomas/wake word en background).
2. Actualizar `SETUP.md`, `DEPLOY.md`, `docs/runbooks*`, `backend/docs/API.md`
   (endpoints reales incl. `/api/v1/*` y `/api/tel/*` hasta su retiro),
   `Publicar/play-console/*` (datos de release) y eliminar afirmaciones de
   PythonAnywhere como destino único.
3. Regenerar la documentación en `documentacion_generada/` con las
   herramientas existentes tras cada fase relevante.
4. Añadir al repo un `SECURITY.md` breve (reportes, claves, entorno) y una
   política de flags demo.

**Commit sugerido:** `0015` documentación

---

## FASE 8 — MEDIO/BAJO: limpieza de legado (verificada, sin borrar a ciegas)

**Grupo 1 (verificar referencias antes de tocar):**
- `App.tsx` (plantilla raíz sin uso, entrada real `index.ts`) → eliminar o
  dejar como nota si expo-router lo requiere.
- `app/_layout.tsx.bak`, `src/config/porcupine.ts`, `assets/keywords/*.ppn`,
  `Theme.ts`/`Card.tsx`/`useAccessibility.ts`/`M3Button.tsx` sin consumidores,
  funciones sin llamadores (`enviarUbicacion`, `obtenerUltimaUbicacion`,
  `startCountdown`, `sendLocationPulseUpdate` si sigue sin productor),
  `wsgi.py` cuando se retire PythonAnywhere.
**Grupo 2 (solo tras decisión):** `diag*.mjs`, `safealert_ui*.xml`,
`informe_tecnico.html`, `server.log`, `screenshot*.png` (mover a
`documentacion_generada/legado/` si se quiere conservar histórico).

**Regla:** cada eliminación requiere grep previo (cero referencias) y commit
independiente para poder revertir.

**Commits sugeridos:** `0016`+ (uno por grupo con nombre de archivo en el mensaje)

---

## Pruebas transversales y validación final

| Validación | Cómo |
| --- | --- |
| Typecheck | `npm run typecheck` (app), `npm run build` (functions), backend pytest |
| Unit/Integración | jest (app), pytest (backend), tests de firma/parseo |
| Sandbox MP | pago mensual y anual reales en TEST + webhook firmado |
| Sin secretos en bundle | escaneo sobre `expo export` y greps de `EXPO_PUBLIC_*` críticos |
| Reglas Firestore/Storage | `firebase emulators` + pruebas de permiso cruzado |
| Restauración | prueba de backup/restore de la purga |
| Docs | regenerar maestro + anexos y verificar apertura |

## Secuencia y esfuerzo estimado

| Fase | Severidad | Archivos principales | Esfuerzo |
| --- | --- | --- | --- |
| 1 Firma webhook | CRÍTICO | functions/src/mpWebhook.ts (+tests) | S |
| 2 Coherencia pagos | ALTO | createPaymentOrder, mpWebhook, PaymentService, SubscriptionService, PaymentModal | M |
| 3 Secretos en bundle | ALTO | features.ts, servicios cliente, functions proxy, eas/CI, .env* | M–L |
| 4 Bypass demo | ALTO | PaymentModal, features.ts, backend admin/simular, Admin.tsx | M |
| 5 Purga | ALTO | flask_app.py (/admin/purga), Admin.tsx | S–M |
| 6 Doble canal PII | ALTO/MEDIO | ContactsService, bienvenida, users.ts, backend /api/tel, reglas | L |
| 7 Docs | MEDIO | *.md + regeneración | S |
| 8 Legado | MEDIO/BAJO | varios (verificado) | S–M |

**Orden recomendado de ejecución:** Fase 1 → 2 → 4 (mitigación rápida) → 3 →
5 → 6 → 7 → 8. Las fases 1–2 y 4–5 son independientes entre sí y pueden
ejecutarse en paralelo con cuidado en el entorno de staging.

## Riesgos de la remediación

- Cambiar `external_reference` rompe pagos en curso: migrar con ventana de
  compatibilidad (aceptar también el formato antiguo durante 1 mes) o purgar
  órdenes pendientes.
- Verificación de firma con algoritmo incorrecto bloquearía webhooks reales:
  validar primero en sandbox con un evento real de MP.
- Retirar el canal TEL puede afectar usuarios en prueba: migrar estado de
  prueba antes de cortar.
- El cliente no debe bloquear la alerta SOS mientras se corrigen pagos
  (separar "entitlement de pago" del "botón SOS con pago vencido").

> ¿Empezamos por la **Fase 1 (firma del webhook)** o preferís primero las
> **mitigaciones inmediatas** (Fase 0, punto 4) y luego Fases 1–2 juntas?

---

## Registro de ejecución

### 0001 · 2026-09-06 — Fase 1: firma del webhook de Mercado Pago (EJECUTADA en código)

Archivos modificados:
- `functions/src/mpSignature.ts` (NUEVO): verificador puro de firma
  (parseo de cabecera, ventana anti-replay 5 min, comparación en tiempo
  constante, HMAC-SHA256 idéntico al backend Flask).
- `functions/src/mpWebhook.ts`: verificación obligatoria `X-Signature`/
  `X-Request-Id` con `defineSecret('MP_WEBHOOK_SECRET')`; respuestas 401/503
  fail-closed; `data.id` desde query con respaldo en body.
- `functions/src/__tests__/mpSignature.test.ts` (NUEVO): 10 pruebas unitarias
  (node:test).
- `functions/package.json`: script `npm test`.

Validación ejecutada:
- `npm run build` en functions/: OK (tsc sin errores).
- `node --test lib/__tests__/mpSignature.test.js`: 10/10 PASS.

Pendientes para cerrar la Fase 1 en despliegue:
- Crear secreto: `firebase functions:secrets:set MP_WEBHOOK_SECRET` (valor
  igual al usado por backend / Secret Manager `safealert-mp-secret`).
- Desplegar y validar con un webhook real de sandbox (firma correcta → 200;
  firma alterada → 401).
- Confirmar en el panel de Mercado Pago que el webhook envíe las cabeceras
  `x-signature` y `x-request-id`.
