# Runbooks de operación — SafeAlert

## Caída de Twilio (SMS)

**Síntomas**: Alertas con estado `failed` en todos los contactos. Logs de Functions muestran error 5xx de Twilio.

**Acción**:
1. Verificar estado en https://status.twilio.com
2. Si es outage regional: no hacer nada, Twilio resuelve automáticamente
3. Si es error de configuración: revisar credenciales en `functions/.env`
4. Las alertas se re-intentarán automáticamente vía `AlertQueue` (exponential backoff)
5. Notificar a usuarios vía push notification

## Caída de Firebase

**Síntomas**: AlertService lanza errores de red. La app funciona offline parcialmente.

**Acción**:
1. Verificar https://status.firebase.google.com
2. Las alertas se encolan localmente en `AlertQueue` con reintentos automáticos
3. Si el outage supera 1 hora, considerar activar fallback SMS directo
4. Monitorear `AlertStateMachine` para detectar acumulación de alertas pendientes

## Caída de Mercado Pago (pagos)

**Síntomas**: Webhooks no recibidos. Usuarios no pueden activar suscripción.

**Acción**:
1. Verificar https://www.mercadopago.com.ar/developer/status
2. Los pagos están desactivados (PAYMENTS_ENABLED=false) hasta fase de producción
3. Si es crítico: procesar confirmaciones manuales vía `/api/payments/confirm`

## Caída del backend PythonAnywhere

**Síntomas**: sync-profile falla. Endpoints `/api/*` devuelven 502/503.

**Acción**:
1. Acceder a https://www.pythonanywhere.com/user/oafan/consoles/
2. Revisar logs del servidor en `~/.pm2/logs/`
3. Verificar consumo de recursos (CPU, RAM, disco)
4. Si es reinicio planificado: esperar; si es error de código: hacer rollback del último cambio
5. Las funcionalidades críticas (alerta SOS) NO dependen de PythonAnywhere, solo sincronización de perfil
