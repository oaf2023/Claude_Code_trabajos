# Documento: Prompt_pasarela.md

## Resumen
- Prompt de especificación dirigido a un "Desarrollador Senior Full-Stack" para implementar la pasarela de pago de Mercado Pago usando la solución "Checkout API" basada en la **Orders API** (`/v1/orders`), con soporte obligatorio de autenticación **3DS 2.0** y prevención de fraude.
- Detalla credenciales, script de seguridad del frontend, creación de orden con `X-Idempotency-Key` y `processing_mode: automatic`, el nodo `config.online.transaction_security` (validation `on_fraud_risk`, liability_shift `required`), el flujo del challenge 3DS en iframe, la confirmación vía `GET /v1/orders/{id}`, webhooks (tópico `delivery_cancellation`) y requisitos de pase a producción.
- No describe el estado real del sistema: es una instrucción/objetivo de implementación (prompt de agente), sin referencias a archivos del proyecto.

## Contenido clave
- Configuración con SDK oficial de Mercado Pago y Access Token de prueba.
- Frontend: `<script src="https://www.mercadopago.com/v2/security.js" view="home">` y tokenización segura de tarjeta con SDK JS.
- Backend: `POST /v1/orders`; `X-Idempotency-Key` único; `processing_mode: automatic`; `config.online.transaction_security` con `validation: "on_fraud_risk"` y `liability_shift: "required"`.
- Challenge 3DS: si `status=action_required` y `status_detail=pending_challenge`, extraer URL de `transactions.payments[i].payment_method.transaction_security.url`, incrustar en iframe, escuchar `window.addEventListener("message", ...)` con `e.data.status === "COMPLETE"`, y confirmar por `GET /v1/orders/{id}` desde el backend (estados `processed`/`failed`).
- Webhooks: tópico de alerta de fraude `delivery_cancellation` para cancelar y devolver dinero automáticamente.
- Producción: HTTPS/SSL, manejo amigable de errores de API, intercambio por credenciales de producción y envío de datos del pagador/detalle del ítem.

## Relación con el código real
- [OBSERVACIÓN TÉCNICA] La implementación real de pagos vive en Cloud Functions y NO usa la Orders API:
  - `functions/src/createPaymentOrder.ts`: importa `MercadoPagoConfig, PreApproval, Preference` del paquete `mercadopago` y crea `Preference` (Checkout Pro) y preaprobaciones (`PreApproval`, suscripciones). No se hallaron `/v1/orders`, `transaction_security` ni lógica 3DS en el repositorio.
  - `functions/src/mpWebhook.ts`: usa `MercadoPagoConfig` y `Payment` (consulta de pago por id) y registra `mercadopagoOrderId`.
- [OBSERVACIÓN TÉCNICA] El backend Flask (`backend/flask_app.py`) NO cobra por Mercado Pago: el endpoint `/api/v1/admin/pagos/simular` declara explícitamente "No hay cobro real (no toca MercadoPago)" y su webhook `/api/payments/webhook` gestiona preaprobaciones (`mp_preapproval_id`) verificando firma con `verify_mp_signature`. [NIVEL DE CERTEZA: Confirmado por código]
- [OBSERVACIÓN TÉCNICA] No se encontraron en el repositorio: `security.js`, iframes de challenge, listeners de mensajes 3DS, cabeceras `X-Idempotency-Key` ni gestión del tópico `delivery_cancellation`. El prompt describe una arquitectura objetivo (Orders API/3DS 2.0) que la implementación actual no cumple.
- Variables de entorno relacionadas en `functions/.env.example`: `MP_ACCESS_TOKEN`, `PAYMENTS_ENABLED` (con fallback en `features.ts` del cliente `EXPO_PUBLIC_ENABLE_PAYMENTS=false`). El flag `EXPO_PUBLIC_ENABLE_PAYMENTS_DEMO` activa un pago de muestra sin pasarela real.
- Conclusión: el documento es una especificación solicitada, mientras que el sistema real integra Mercado Pago mediante el SDK estándar con `Preference`/`PreApproval` (suscripciones) y un modo demo/off por defecto.

## Estado y uso
- BORRADOR de especificación (prompt de implementación), no documentación vigente del sistema. Útil para entender la intención de pago con tarjeta 3DS/Orders API, aún no materializada; conviene contrastarla con `createPaymentOrder.ts`/`mpWebhook.ts` antes de decidir cambios.
- [NIVEL DE CERTEZA: Altamente probable]

## Seguridad
- [INFORMATIVO] El prompt exige buenas prácticas (idempotencia, 3DS, webhooks de fraude, HTTPS) que la implementación actual debería evaluar adoptar.
- [MEDIO] Riesgo de divergencia: si la app llegara a publicitar pagos con tarjeta sin el flujo 3DS documentado aquí, la exposición a fraude/contracargos sería mayor que la prevista en la especificación. [NIVEL DE CERTEZA: Inferido]
- No contiene secretos (solo referencias a `TEST_ACCESS_TOKEN` como concepto).
