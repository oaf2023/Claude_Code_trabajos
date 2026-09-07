# Documento: docs/runbooks/README.md

## Resumen
- Runbook operativo detallado de SafeAlert (120 líneas) con 5 procedimientos: caída de Twilio, caída de Firebase, caída de Mercado Pago, caída del backend PythonAnywhere y "alerta no enviada / queja de usuario" (diagnóstico).
- Es más específico y técnico que `docs/runbooks.md`: cita nombres reales de código (colecciones Firestore, funciones de cliente, rutas de archivos, variables de entorno, endpoints) y define recuperación y criterios de escalado.
- Es, de toda la documentación existente revisada, la que más fielmente refleja la implementación real (colas, reintentos, trazabilidad y dependencias).

## Contenido clave
- Caída de Twilio: alertas `pending`/`failed`; `contacts[].provider` sin actualizar; reintentos por `AlertQueue` con backoff exponencial (máx. 5); verificar `functions/.env` (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`), saldo y formato E.164 en `contacts.phone`; cita `src/utils/formatPhone.ts`. Recuperación: reintentos automáticos; si > 1 hora, migrar a proveedor alternativo (Amazon SNS, Vonage).
- Caída de Firebase: verificar `google-services.json`, reglas `firestore.rules`/`storage.rules`; alertas encoladas en `AlertQueue` (AsyncStorage) y procesadas por `recoverIncompleteAlerts()`; si la caída supera 24 horas, las encoladas se pierden (máx. 5 reintentos).
- Caída de Mercado Pago: verificar webhooks (URL `https://oaf.pythonanywhere.com/api/payments/webhook`), `MP_WEBHOOK_SECRET` en PythonAnywhere y firma en `verify_mp_signature` en `python/flask_app.py`; tabla/columna `subscription_status` con fechas UTC (`subscription_expires_at`); reenvío manual de webhooks y `confirm_payment` manual.
- Caída del backend PythonAnywhere: consola del usuario `oaf`, logs `$ tail -f /var/log/oaf.pythonanywhere.com.error.log`, recursos; SQLite: verificar `SAFEALERT_DB_PATH`, backup `cp /home/oaf/agrupacion_api/usuarios/safealert.db /home/oaf/backups/`; dependencias con `pip list | grep flask`. Recuperación: `git pull` + "Reload" en la web app; restaurar backup si DB corrupta.
- Alerta no enviada: diagnóstico por estado (`failed` → `contacts[].lastError`; `pending` → cola `AlertQueue` en AsyncStorage del dispositivo; `sent`/`partial` → verificar con el contacto; SMS puede tardar hasta 30 s) y resolución por causa (Twilio/contacto/app).

## Relación con el código real
- Coincidencias verificadas (alta precisión documental):
  - `src/utils/formatPhone.ts` existe y coincide con la ruta citada.
  - `recoverIncompleteAlerts()` existe y se exporta desde `src/services/AlertService.ts` (con test en `AlertService.test.ts`).
  - `AlertQueue` existe (`src/services/AlertQueue.ts` con test); la cola local del dispositivo es coherente con su uso en `recoverIncompleteAlerts`. [NIVEL DE CERTEZA: Altamente probable]
  - `pendingNotifications` es la colección de fallback real de Functions (`functions/src/sendAlertSMS.ts`) y está bloqueada al cliente en `firestore.rules`.
  - Webhook MP: ruta `/api/payments/webhook` confirmada en `backend/flask_app.py`; `verify_mp_signature` confirmada (línea 605).
  - `SAFEALERT_DB_PATH` y el path `/home/oaf/agrupacion_api/usuarios/safealert.db` confirmados en `backend/wsgi.py`; coincide con el comando de backup del runbook.
  - Trazabilidad por contacto (`provider`, `providerMessageId`, `attempts`, `lastError`): campos coherentes con lo que escribe `sendAlertSMS.ts`. [NIVEL DE CERTEZA: Altamente probable]
  - Twilio: variables citadas confirmadas en `functions/.env.example`.
- Discrepancias y observaciones:
  - [OBSERVACIÓN TÉCNICA] Cita la firma en `python/flask_app.py`; el archivo real está en `backend/flask_app.py` (la ruta `python/` no existe en el árbol actual). Ruta desactualizada.
  - [OBSERVACIÓN TÉCNICA] "La tabla `subscription_status` usa fechas UTC": en el esquema real `subscription_status` y `subscription_expires_at` son columnas de la tabla `users` (SQLite), no una tabla separada. Imprecisión de esquema menor.
  - [OBSERVACIÓN TÉCNICA] `MP_WEBHOOK_SECRET`: la variable no se confirmó por nombre en el backend (la firma usa parámetros `x_signature`/`x_request_id`/`data_id`); el secreto se gestiona en el entorno de despliegue. [NIVEL DE CERTEZA: No determinado]
  - [OBSERVACIÓN TÉCNICA] El runbook cita `storage.rules` y `firestore.rules`: ambos archivos existen en la raíz.
  - El límite "máx. 5 reintentos" y "24 h de pérdida de cola" no se contrastaron numéricamente en código en este módulo (pertenece a otro módulo de auditoría). [NIVEL DE CERTEZA: No determinado]
  - [NOTA] Coherente con `docs/runbooks.md` salvo usuario PythonAnywhere (`oaf` aquí vs `oafan` allí) y mecanismo de logs (`/var/log/*` aquí vs `~/.pm2/logs/` allí): este runbook es el más fiable de los dos.

## Estado y uso
- VIGENTE: runbook de referencia más preciso del proyecto; alineado con el código real en rutas, colecciones, endpoints y nombres de funciones. Recomendable como fuente primaria de operación (corrigiendo `python/` → `backend/` y la descripción de esquema).
- [NIVEL DE CERTEZA: Altamente probable]

## Seguridad
- [INFORMATIVO] No reproduce secretos (solo nombres de variables y placeholders).
- [INFORMATIVO] Buenas prácticas implícitas: backup de SQLite, verificación de firma de webhook, no exponer credenciales en el repo.
