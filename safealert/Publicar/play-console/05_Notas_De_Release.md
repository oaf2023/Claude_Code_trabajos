# Notas de Release

## Version 1.1.0 — Build 2 (2026-04-01)

Actualizacion interna de SafeAlert con mejoras de presentacion en el envio de alertas.

### Cambios incluidos

- El prefijo de los mensajes SMS fue actualizado: ya no dice `[SAFEALERT]` sino `🚨 AVISO`, con icono de aviso para mayor claridad.
- Los mensajes de prueba muestran ahora `🧪 PRUEBA` en lugar de `[SAFEALERT-TEST]`.
- Arquitectura SMS-only confirmada: se retiro el canal WhatsApp; la alerta SOS opera exclusivamente por SMS con Twilio.
- Estabilizacion del flujo de contactos y autenticacion Firebase.

### Para testers internos

- Verificar que el SMS recibido comienza con `🚨 AVISO` y no con el texto anterior.
- Confirmar el flujo completo: Activar alerta → countdown 3s → envio SMS → confirmacion en pantalla.
- Probar con el boton de prueba para verificar el prefijo `🧪 PRUEBA`.

## Variante corta

Build interna v1.1.0: SMS con nuevo prefijo de aviso emoji, arquitectura SMS-only consolidada.
