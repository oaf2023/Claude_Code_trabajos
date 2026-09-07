# 4. Informe funcional

## 2.1. Qué es SafeAlert

**SafeAlert** es una aplicación de **seguridad personal tipo "alerta SOS"** para
dispositivos móviles Android e iOS (con versión web/PWA). Su propósito es que un
usuario pueda, en una situación de peligro, avisar de forma rápida y automática
a sus **contactos de confianza**, enviándoles un mensaje con su **ubicación** y,
opcionalmente, un **mensaje de voz** grabado.

La idea central documentada en `Contexto.md` es: "crear un grupo de personas y,
al mencionar determinadas palabras, se activan los mensajes de forma automática
aunque la pantalla del móvil esté bloqueada; la aplicación debe activarse para
funcionar y si no, quedar en reposo; también llamará por teléfono; los grupos de
contactos se guardarán en el móvil y usarán los recursos del mismo (WhatsApp,
etc.)".

### Estado real de esa idea en el código analizado

| Capacidad | Estado en el código |
| --- | --- |
| Alerta SOS manual con botón | FUNCIONALIDAD EXISTENTE |
| Alerta por voz (palabra de activación) | EXISTENTE con motor react-native-wakeword (modelo español `wakeword_es.onnx`), **solo en primer plano** (`[NIVEL DE CERTEZA: Confirmado por código]`) |
| Funcionamiento con pantalla bloqueada/fondo | NO implementado (detección pausada en segundo plano; flag `WAKE_WORD_FOREGROUND_ONLY`) |
| Llamada telefónica autónoma | NO implementada; hay "llamada asistida" (abre el marcador) en ciertos flujos |
| Envío de alerta a contactos | EXISTENTE vía Firestore + Cloud Functions (SMS con proveedor Twilio) |
| Mensaje de voz como adjunto | EXISTENTE (grabación + subida a Firebase Storage) |
| Guardado de contactos en el móvil | PARCIAL: contactos en Firestore (nube) y espejo en backend externo; persistencia local en AsyncStorage (colas/estado, no contactos como fuente de verdad) |
| Suscripción de pago (Mercado Pago) | EXISTENTE (pedido de pago + webhook + estados) con períodos de prueba |
| Envío por WhatsApp | NO implementado en el código analizado (los textos de "cómo funciona" lo mencionan como capacidad esperada) |

## 2.2. Usuarios y propósitos

- **Usuario final (ciudadano)**: configura su perfil (nombre, teléfono), elige
  contactos de confianza, arma el mensaje de alerta, activa el "modo guardia"
  (detección por voz) o pulsa SOS manual, y gestiona su suscripción.
- **Administrador (equipo)**: panel web para consultar usuarios, alertas,
  ubicaciones, accesos y consentimientos; simular pagos en entornos de prueba y
  ejecutar purgas de retención de datos.

## 2.3. Flujo principal: alerta SOS

1. El usuario configura su nombre/teléfono y sus contactos de confianza
   (primer contacto gratuito; los siguientes pueden requerir suscripción).
2. Durante el uso, puede:
   - pulsar el botón **SOS** ("ENVIAR ALERTA AHORA"), o
   - activar el **modo guardia** y pronunciar la palabra de activación.
3. La app captura la **ubicación** (con tiempo de espera y último valor
   conocido como respaldo) y, si está habilitado, **graba un mensaje de voz**
   (hasta 60 s) que se sube a Firebase Storage.
4. Se crea un documento de **alerta** en Firestore y, vía Cloud Functions, se
   envían los **SMS** a los contactos con la ubicación y un enlace a Google
   Maps.
5. La interfaz muestra el estado del envío (cola → enviando → enviado/error) y
   el historial queda guardado para el usuario.

> Detalles técnicos por archivo en el Anexo A (servicios de alerta) y Anexo D
> (Cloud Functions de SMS).

## 2.4. Flujo de pago y suscripción

1. La app verifica el estado de suscripción/periodo de prueba del dispositivo.
2. Si el usuario necesita pagar, el modal de pago solicita a la Cloud Function
   `createPaymentOrder` la creación de una orden (Mercado Pago).
3. El usuario completa el pago en el flujo externo; la app permite confirmar
   manualmente y el **webhook** (`mpWebhook`) actualiza el estado en el backend;
   el estado pasa por `pending_verification`.
4. Con suscripción activa se desbloquean el botón SOS completo, el modo guardia
   y los contactos adicionales.

> Detalles en Anexo A (PaymentModal, PaymentService) y Anexos C/D.

## 2.5. Panel de administración

El panel web (React + Vite) permite iniciar sesión como administrador y
consultar: resumen (dashboard), usuarios con su detalle (alertas, contactos,
ubicaciones, pagos), simulación de pagos y estadísticas. Se conecta con el
backend Flask.

## 2.6. Pantallas principales de la app móvil

```
BIENVENIDA (onboarding: nombre/teléfono/foto de perfil)
   ↓
COMO FUNCIONA / PERMISOS (micrófono, ubicación, contactos, notificaciones)
   ↓
MODAL (pago / prueba expirada / pago vencido)
   ↓
(TABS)
 ├── INICIO      → Modo guardia + botón SOS + diagnóstico de protección
 ├── HISTORIAL   → Últimas alertas (hasta 20)
 ├── CONTACTOS   → Contactos de confianza (alta/edición/borrado/prioridad)
 └── CONFIGURACIÓN → Perfil, palabras, plantilla SMS, audio, suscripción
```

## 2.7. Privacidad y consentimiento

El proyecto registra consentimientos, accesos técnicos y ubicaciones en el
backend (`/api/v1/consentimientos`, `/api/v1/accesos`, `/api/v1/ubicaciones`) e
incluye una política de privacidad versionada (`POLITICA_PRIVACIDAD_VERSION`) y
una política base para Play Store. La gestión real de retención y purga está
implementada parcialmente (ver capítulo de seguridad y Anexo C).

