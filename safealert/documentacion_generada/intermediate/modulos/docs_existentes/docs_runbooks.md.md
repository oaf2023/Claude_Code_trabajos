# Documento: docs/runbooks.md

## Resumen
- Runbook operativo compacto de SafeAlert con procedimientos de respuesta ante caídas de servicios: Twilio (SMS), Firebase, Mercado Pago (pagos) y el backend PythonAnywhere.
- Para cada incidente define síntomas, acciones de verificación/mitigación y notas de dependencia. Es la versión resumida que convive con el runbook detallado de `docs/runbooks/README.md`.
- Su tesis operativa clave: las funcionalidades críticas (alerta SOS) NO dependen de PythonAnywhere; solo la sincronización de perfil y servicios auxiliares.

## Contenido clave
- Caída de Twilio: alertas con estado `failed` y logs 5xx; verificar status.twilio.com; si es error de configuración revisar credenciales en `functions/.env`; reintentos automáticos vía `AlertQueue` (exponential backoff); notificar usuarios por push.
- Caída de Firebase: errores de red en AlertService, la app funciona offline parcialmente; alertas encoladas localmente en `AlertQueue` con reintentos; si supera 1 hora considerar fallback SMS directo; monitorear `AlertStateMachine` para detectar acumulación de pendientes.
- Caída de Mercado Pago: webhooks no recibidos, usuarios no pueden activar suscripción; verificar estado; "los pagos están desactivados (PAYMENTS_ENABLED=false) hasta fase de producción"; confirmaciones manuales vía `/api/payments/confirm`.
- Caída del backend PythonAnywhere: `sync-profile` falla, endpoints `/api/*` devuelven 502/503; consola de PythonAnywhere (usuario `oafan`), logs en `~/.pm2/logs/`, recursos CPU/RAM/disco; rollback si es error de código; recordatorio de que la alerta SOS no depende de este backend.

## Relación con el código real
- Coincidencias verificadas:
  - `AlertQueue` y `AlertStateMachine` existen como servicios reales del cliente (`src/services/AlertQueue.ts`, `src/services/AlertStateMachine.ts`, con tests).
  - `PAYMENTS_ENABLED` existe como flag (cliente: `features.ts` con `EXPO_PUBLIC_ENABLE_PAYMENTS`; Functions: `functions/.env.example` con `PAYMENTS_ENABLED=true` de ejemplo) y por defecto los pagos están desactivados (`false`). [NIVEL DE CERTEZA: Altamente probable]
  - `/api/payments/confirm` existe en `backend/flask_app.py` y es invocado por `src/services/PaymentService.ts`.
  - Twilio en `functions/.env`: confirmado (`functions/.env.example` con las tres variables; el código usa las mismas y soporta API keys).
  - "Las alertas se re-intentarán automáticamente vía AlertQueue": coherente con la existencia de `AlertQueue.ts` y de la cola `pendingNotifications` + `_functionEvents` en Functions/Firestore. [NIVEL DE CERTEZA: Altamente probable]
- Discrepancias y observaciones:
  - [OBSERVACIÓN TÉCNICA] La URL de consola cita al usuario `oafan` (`https://www.pythonanywhere.com/user/oafan/consoles/`), mientras que `docs/runbooks/README.md` usa `oaf` y `backend/wsgi.py` fija rutas bajo `/home/oaf/`. Inconsistencia interna entre runbooks y con el wsgi real (probablemente un usuario es el real y el otro un error tipográfico). [NIVEL DE CERTEZA: Inferido]
  - [OBSERVACIÓN TÉCNICA] `~/.pm2/logs/` (PM2) no cuadra con el despliegue estándar de PythonAnywhere (proceso web gestionado por PA con logs en `/var/log/*.error.log`, como indica el otro runbook). Probablemente heredado de un despliegue anterior en VPS/PM2.
  - [OBSERVACIÓN TÉCNICA] El "fallback SMS directo" ante caída larga de Firebase no se pudo localizar como mecanismo concreto en el código revisado; el diseño documentado apunta a colas + reintentos, no a un canal SMS alternativo fuera de Twilio/Functions. [NIVEL DE CERTEZA: No determinado]
  - El backend PythonAnywhere real (`flask_app.py`) expone mucha más superficie (`/api/v1/ubicaciones`, `consentimientos`, `accesos`, `admin/*`) que la citada "sync de perfil": el runbook subestima su rol (telemetría y ubicaciones), aunque la afirmación de que la alerta SOS no depende de él sí es correcta (SMS por Cloud Functions).

## Estado y uso
- VIGENTE EN PARTE: útil como guía rápida de primer nivel; coincide en los mecanismos centrales (colas, flags, endpoints) pero contiene imprecisiones de entorno (usuario de PythonAnywhere, logs PM2) y no refleja la superficie real completa del backend. Complementado por el runbook detallado `docs/runbooks/README.md`.
- [NIVEL DE CERTEZA: Altamente probable]

## Seguridad
- [INFORMATIVO] No contiene secretos; indica dónde revisar credenciales sin reproducirlas.
- [INFORMATIVO] Recomienda no exponer credenciales en `functions/.env` versionado; coherente con el uso de Firebase Secret Manager indicado en `functions/.env.example` para `PA_INTERNAL_KEY`.
