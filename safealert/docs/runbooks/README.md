# Runbooks Operativos — SafeAlert

## Índice

1. [Caída de Twilio (SMS)](#1-caída-de-twilio)
2. [Caída de Firebase](#2-caída-de-firebase)
3. [Caída de Mercado Pago](#3-caída-de-mercado-pago)
4. [Caída del Backend PythonAnywhere](#4-caída-del-backend)
5. [Alerta no enviada / Queja de usuario](#5-alerta-no-enviada)

---

## 1. Caída de Twilio

**Síntoma**: Las alertas se registran como `pending` o `failed` en Firestore. El campo `contacts[].provider` no se actualiza.

**Impacto**: Los contactos no reciben SMS.

**Acción**:
1. Verificar estado en https://status.twilio.com
2. Si es interrupción confirmada:
   - Las alertas quedan encoladas en `AlertQueue` con backoff exponencial (máx. 5 intentos).
   - No requiere acción inmediata. Intentará reenviar automáticamente.
3. Si es error de configuración:
   - Verificar `functions/.env`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
   - Verificar saldo de la cuenta Twilio.
4. Si es problema de formato telefónico:
   - Verificar que los números estén en formato E.164 en Firestore `contacts.phone`.
   - La función `formatPhone` en `src/utils/formatPhone.ts` debe aplicarse antes de enviar.

**Recuperación**: Las alertas fallidas se reintentan automáticamente. Si el problema persiste > 1 hora, considerar migrar a un proveedor alternativo (Amazon SNS, Vonage).

---

## 2. Caída de Firebase

**Síntoma**: La app muestra errores de autenticación o no puede leer/escribir en Firestore.

**Impacto**: Las alertas no se registran. La app entra en modo offline.

**Acción**:
1. Verificar https://status.firebase.google.com
2. Verificar consola Firebase → Proyecto → Dashboard de errores.
3. Si es error de autenticación:
   - Verificar `google-services.json` esté presente y vigente.
   - Regenerar desde Firebase Console → Configuración del proyecto → Archivo de configuración.
4. Si es error de reglas de seguridad:
   - Revisar `firestore.rules` y `storage.rules`.
   - Los logs de Firebase muestran qué regla está bloqueando.

**Recuperación**:
- Las alertas se encolan localmente en `AlertQueue` (AsyncStorage).
- Cuando Firebase vuelve, `recoverIncompleteAlerts()` procesa la cola.
- Si la caída supera 24 horas, las alertas encoladas se pierden (máx. 5 reintentos).

---

## 3. Caída de Mercado Pago

**Síntoma**: Los pagos fallan o el webhook no se recibe.

**Impacto**: Usuarios no pueden suscribirse. Suscripciones activas pueden expirar sin renovación.

**Acción**:
1. Verificar https://www.mercadopago-status.com/
2. Verificar webhooks en Mercado Pago → Configuración → Webhooks.
   - La URL debe ser: `https://oaf.pythonanywhere.com/api/payments/webhook`
3. Si faltan eventos:
   - Verificar que `MP_WEBHOOK_SECRET` en PythonAnywhere coincida con el configurado en MP.
   - Verificar la firma en `verify_mp_signature` en `python/flask_app.py`.
4. Si es error de vencimiento:
   - La tabla `subscription_status` usa fechas UTC. Verificar `subscription_expires_at`.

**Recuperación**:
- Los webhooks fallidos se pueden reenviar manualmente desde el panel de MP.
- Si un pago se procesó pero no se reflejó, ejecutar `confirm_payment` manual desde la API.

---

## 4. Caída del Backend (PythonAnywhere)

**Síntoma**: La app no puede sincronizar contactos, no puede subir audios, o los webhooks fallan.

**Impacto**: Funcionalidad parcial. Las alertas SMS aún funcionan (van directo por Twilio/Firebase Functions).

**Acción**:
1. Acceder a https://www.pythonanywhere.com/user/oaf/consoles/
2. Verificar logs: `$ tail -f /var/log/oaf.pythonanywhere.com.error.log`
3. Verificar uso de recursos: Panel → Traffic & Resource Usage.
4. Si es error de base de datos SQLite:
   - Verificar `SAFEALERT_DB_PATH` apunte al archivo correcto.
   - Hacer backup: `cp /home/oaf/agrupacion_api/usuarios/safealert.db /home/oaf/backups/`
5. Si es error de dependencias:
   - Verificar `pip list | grep flask` en la consola de PythonAnywhere.

**Recuperación**:
- Hacer deploy: `git pull` en la consola de PA, luego tocar "Reload" en la web app.
- Si la DB está corrupta, restaurar desde backup.

---

## 5. Alerta no enviada / Queja de usuario

**Síntoma**: Usuario reporta que su alerta no llegó a los contactos.

**Diagnóstico**:
1. Buscar `userId` en Firestore → `users/{uid}/alerts/` - verificar `status` y `contacts`.
2. Si `status === 'failed'`:
   - Verificar `contacts[].lastError` para el mensaje de error específico.
   - El error suele venir de Twilio (SMS inválido, número bloqueado, saldo).
3. Si `status === 'pending'`:
   - La alerta está en la cola de reintentos. Verificar `AlertQueue` en AsyncStorage del dispositivo.
4. Si `status === 'sent'` o `'partial'`:
   - El SMS se envió. Verificar con el contacto si lo recibió.
   - Los SMS pueden tardar hasta 30 segundos en llegar.

**Resolución**:
- Error de Twilio → Revisar Runbook #1.
- Error de contacto → Verificar que el número esté en formato internacional (+54 11 1234 5678).
- Error de app → Pedir al usuario que reinstale o actualice.
