# 6. Seguridad, deuda técnica, riesgos y mejoras

## 8.1. Resumen de seguridad (perspectiva defensiva)

La siguiente tabla agrega automáticamente los hallazgos de seguridad
declarados en los anexos (extracción de las secciones `## Seguridad` de cada
análisis). La lista completa, con contexto por archivo, está en los anexos.

[[HALLAZGOS_SEGURIDAD_TABLA]]

### 8.1.1. Hallazgos más relevantes (síntesis)

1. `[CRÍTICO]` — **Webhook de Mercado Pago sin verificación de firma**
   (`functions/src/mpWebhook.ts`): no se valida `X-Signature`/`X-Request-Id`,
   por lo que un tercero podría notificar pagos y activar suscripciones sin
   pagar. `[NIVEL DE CERTEZA: Confirmado por código]`
2. `[ALTO]` — **Secretos incrustados en el binario**: las variables
   `EXPO_PUBLIC_*` (claves de API, licencia del motor de voz, secretos de
   sincronización) viajan dentro del APK/web. El propio código advierte que
   debe usarse un backend proxy. `[NIVEL DE CERTEZA: Confirmado por código]`
3. `[ALTO]` — **Incoherencia productor-consumidor en pagos**:
   `createPaymentOrder` genera `external_reference` del tipo
   `monthly:<deviceId>` / `annual:<deviceId>`, mientras `mpWebhook` la guarda
   como `subscriptions.userId`; el cliente consulta por UID de Auth y puede no
   ver su suscripción. `[NIVEL DE CERTEZA: Confirmado por código]`
4. `[ALTO]` — **Simulación de pago en producción**:
   `/api/v1/admin/pagos/simular` (backend) y el bypass `PAYMENTS_DEMO_ENABLED`
   del modal de pago pueden activar suscripciones reales sin cargo si se
   despliegan con esos flags. `[NIVEL DE CERTEZA: Confirmado por código]`
5. `[ALTO]` — **Purga masiva irreversible** con clave única compartida
   (`/api/v1/admin/purga`) y borrado sin confirmación en el backend.
6. `[ALTO]` — **Doble canal de datos personales**: contactos (nombre+teléfono
   E.164) escritos en Firestore y enviados fire-and-forget a un backend
   externo (`safealert_tel.db` en PythonAnywhere) con errores silenciosos.
7. `[MEDIO]` — **Autenticación/autorización delegada a reglas del cliente**:
   el cliente consulta Firestore con `userId` del dispositivo; la seguridad
   depende de `firestore.rules`. Fallback de identidad por teléfono sin
   verificación.
8. `[MEDIO]` — **PII en claro**: AsyncStorage guarda teléfono/selfie/ubicación
   sin cifrado; SQLite del backend almacena ubicaciones y accesos en texto
   plano; contraseñas de keystore en `release.env.ps1` en disco.
9. `[MEDIO]` — **SMS a números arbitrarios**: la Cloud Function `sendAlertSMS`
   envía a `contacts[].phone` sin validar aprobación real del contacto.
10. `[BAJO]` — Detalles variados (logs con `e.message`, sin timeouts de red,
    permisos tratados como concedidos en iOS LIMITED, polling a Google, CI con
    lint/audit neutralizados, contraseñas en consola de scripts PS1).

### 8.1.2. Revisión por vector (resumen)

| Vector | Estado detectado |
| --- | --- |
| Autenticación | Firebase Auth anónima; fallback de teléfono sin verificación |
| Autorización | Reglas Firestore por `userId`; admin por `X-Admin-Key` compartida |
| Contraseñas | No gestionadas por la app (sin login con password); keystore por variables de entorno |
| Tokens/JWT | IdToken de Firebase en cabeceras hacia el backend; sin gestión de expiración robusta en cliente |
| CORS | Backend Flask con proxy confianza configurable (ver Anexo C) |
| Validación | Zod en Cloud Functions (alertas); débil en `createPaymentOrder` (planType) |
| SQL Injection | No se detectó SQL dinámico en el backend (consultas parametrizadas — confirmar en Anexo C) |
| XSS | Panel admin: clave en localStorage y `dangerouslySetInnerHTML` solo con contenido estático en web |
| Archivos/paths | Subidas a Storage con rutas por userId; selfies sin retención visible |
| Logging | Sin secretos impresos; logs con userId/alertId; Sentry con redacción parcial |
| TLS | HTTPS en servicios en la nube; fallback URL PythonAnywhere en cliente |
| Secretos | `EXPO_PUBLIC_*` incrustados; Secret Manager usado solo en Cloud Run |

## 8.2. Observaciones técnicas agregadas

[[OBSERVACIONES_TABLA]]

## 8.3. Logging y gestión de errores

- **Cliente**: `console.*` distribuido; Sentry (con `beforeSend` de redacción
  parcial). Errores mostrados al usuario con `e.message` en varios puntos.
- **Backend Flask**: logging estándar de Flask/gunicorn hacia Cloud Logging;
  capturas de excepción en endpoints (`[NIVEL DE CERTEZA: Confirmado por
  código]`, detalle en Anexo C).
- **Cloud Functions**: logs de error (p. ej. Twilio) con objetos completos;
  `_functionEvents` para trazabilidad.
- Excepciones silenciosas detectadas: envíos fire-and-forget al backend
  externo, `catch {}` vacíos en firebase web shim y en persistencia.

## 8.4. Deuda técnica detectada

| Ámbito | Deuda |
| --- | --- |
| Arquitectura | Doble canal de datos Firestore ↔ backend externo; doble esquema SQL (archivo + arranque); `users/{phoneE164}` vs `users/{uid}`; superposición PythonAnywhere (legado) ↔ Cloud Run |
| Duplicación | Esquemas SQL duplicados; precios/importes 7500/75000 en varias capas; tokens de diseño duplicados (Theme.ts vs theme/tokens.ts); componentes `theme/Button`→`M3Button` sin consumidores; funciones de estados `sent` optimistas vs watcher |
| Complejidad | Máquina de estados de alerta con ramas inalcanzables; triple vía de guardia (nativa/remota/simulada); `flask_app.py` monolítico (1.457 líneas) |
| Mantenimiento | `App.tsx` plantilla sin uso; `app/_layout.tsx.bak`; `porcupine.ts` y `assets/keywords/*.ppn` legados; 17 `diag*.mjs`; snapshots XML; docs desactualizados (ARQUITECTURA.md, runbooks) |
| Seguridad | Webhook sin firma; secretos en bundle; claves compartidas; PII en claro |
| Rendimiento | Historial sin paginación; polling fijos (30 s/60 s); búsquedas sin debounce; consultas LIKE sin índice dedicado |
| Testing | Cobertura parcial: tests sin verificación real de 429/stats; ramas de cola sin probar; sin E2E detectado |
| Documentación | API.md incompleta; .env.example de Functions incompleto; ARQUITECTURA.md desactualizado |

## 8.5. Código aparentemente no utilizado (no eliminar sin verificación)

Resumen de lo detectado en los anexos (detalle y verificación por archivo):

- `App.tsx` (plantilla Expo), `app/_layout.tsx.bak`
- `src/config/porcupine.ts`, `assets/keywords/*.ppn`, `Theme.ts`, `Card.tsx`,
  `useAccessibility.ts`, `M3Button.tsx` (sin consumidores)
- `buildMapsLinkFromCoords`, `useModel` (d.ts), `enviarUbicacion`,
  `obtenerUltimaUbicacion`, `startCountdown` (WakeWordService), ramas de la
  máquina de estados sin usar en producción, `sendLocationPulseUpdate`
  (sin productor), `wsgi.py` (Cloud Run no lo usa), `REMATAS_DB_PATH`
- `diag*.mjs`, `safealert_ui*.xml`, `informe_tecnico.html`, `server.log`

## 8.6. Matriz de riesgos

| Riesgo | Impacto | Probabilidad | Archivo(s) | Recomendación |
| --- | --- | --- | --- | --- |
| Activación fraudulenta de suscripciones vía webhook MP sin firma | Crítico | Alta | functions/src/mpWebhook.ts | Verificar X-Signature con clave del vendedor |
| Suscripción invisible para el cliente por incoherencia de ids | Alto | Alta | functions/src/createPaymentOrder.ts, mpWebhook.ts | Unificar external_reference ↔ userId |
| Exposición de claves embebidas (APK) | Alto | Alta | src/config/features.ts y .env | Proxy backend + Secret Manager; rotar claves |
| Bypass/activación de suscripciones con flags demo | Alto | Media | PaymentModal.tsx, backend admin/pagos/simular | Bloquear flags demo en producción; control por entorno |
| Purga irreversible de datos | Alto | Media | backend flask_app.py (/admin/purga) | Doble confirmación, permisos por rol, backup previo |
| Fuga de PII (contactos/ubicaciones) en claro | Medio | Media | AsyncStorage, SQLite, canales externos | Cifrado en reposo, minimización, evaluación DAMMA |
| SMS no deseado a números arbitrarios | Medio | Media | functions/src/sendAlertSMS.ts | Validar contactos aprobados en backend |
| Pérdida de datos de ubicación por borrado de consentimiento sin evidencia | Medio | Media | backend (consentimientos/purga) | Conservar evidencia de consentimiento |
| Rechazo en App Store (variante iphone) | Medio | Media | iphone/app.json | Añadir NSPrivacyAccessedAPITypes y declaraciones requeridas |
| Deuda de esquema: deriva SQL | Medio | Alta | backend/sql + flask_app.py | Migraciones versionadas (Alembic) |
| Mala sensación de seguridad (guardia solo foreground) | Medio | Alta | WakeWordService/features | Documentar limitaciones; roadmap de background legal |
| Rechazo por políticas de Play (ubicación 2.º plano declarada vs real) | Medio | Baja | Política de privacidad/docs | Alinear declaraciones con flags reales |

## 8.7. Mejoras recomendadas

> Sin modificar el código; separadas del análisis real.

### Corto plazo

1. Verificar firma del webhook de Mercado Pago y el contrato de ids de pago.
2. Desactivar `PAYMENTS_DEMO_ENABLED` y el bypass de pago en builds de
   producción.
3. Sacar secretos del bundle (`EXPO_PUBLIC_*`) y rotarlos.
4. Corregir timeouts de red y reintentos con backoff en los clientes HTTP.
5. Completar `.env.example` de Functions y `docs/API.md`.
6. Eliminar (tras confirmación) plantillas y código muerto documentado.

### Mediano plazo

7. Migrar el esquema SQL a migraciones versionadas; eliminar la duplicación
   con el arranque de Flask.
8. Unificar la identidad del usuario (`users/{uid}`) y revisar el alta por
   teléfono.
9. Cifrar datos sensibles en reposo (AsyncStorage, SQLite) y endurecer
   `storage.rules`/`firestore.rules`.
10. Añadir roles/perfiles al panel admin y auditoría de accesos del operador.
11. Paginación real en historial y panel; quitar polling incondicional.

### Largo plazo

12. Rediseñar la capa de pagos con un único orquestador (Functions) y estados
    transaccionales verificables.
13. Evaluar wake word en background dentro de las políticas de plataforma, y
    separar el "modo guardia simulado" del real en la UI.
14. Estandarizar backend en un único despliegue (Cloud Run) y retirar el canal
    legado PythonAnywhere.
15. Plan de respaldo/restauración y pruebas de recuperación.

## 8.8. Glosario

- **API**: Interfaz de programación usada para la comunicación entre
  componentes.
- **AsyncStorage**: almacenamiento clave-valor local de React Native.
- **Cloud Function**: función serverless de Firebase (v2).
- **Expo Router**: enrutador basado en archivos (`app/`).
- **Firestore**: base de datos NoSQL documental de Firebase.
- **Guardia (modo guardia)**: estado de escucha por voz para disparar alertas.
- **Mercado Pago (MP)**: pasarela de pagos usada para suscripciones.
- **ORM**: capa que manipula datos mediante objetos (no aplica: SQL directo +
  Firestore SDK).
- **Paywall**: límite de funciones condicionado a la suscripción.
- **PII**: información personal identificable.
- **Wake word**: palabra de activación por voz.
- **Webhook**: llamada HTTP automática de un servicio a otro ante un evento.
- **X-API-Key / X-Admin-Key**: cabeceras de autenticación entre cliente y
  backend.
- **Zustand**: librería de estado global.

