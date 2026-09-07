# 8. Guía de usuario y casos de uso

Esta sección explica **cómo se usa SafeAlert** en lenguaje sencillo, sin
suponer conocimientos de programación. Los nombres de botones y pantallas
corresponden a los textos reales detectados en el código.

## 3.1. Empezar (primer uso)

1. Instala la aplicación (Android/iOS) o abre la versión web.
2. En la pantalla de **bienvenida** escribe tu nombre y teléfono (formato
   argentino: código de área + número) y, si quieres, toma una **foto de
   perfil**.
3. Lee las pantallas **"Cómo funciona"** y concede los **permisos** que pide la
   app: micrófono (para la alerta por voz), ubicación (para enviar tu posición),
   contactos y notificaciones. Los permisos son obligatorios para el
   funcionamiento de la alerta.

## 3.2. Añadir contactos de confianza

1. Ve a la pestaña **Contactos**.
2. Pulsa **añadir** y elige un contacto de tu agenda o escríbelo a mano.
3. Indica la **prioridad**: el contacto principal (prioridad 0) es quien recibe
   la alerta cuando hay un pago vencido.
4. Guarda. El contacto se sincroniza con la nube.

## 3.3. Enviar una alerta SOS

### Manualmente
- Pulsa el botón grande **"ENVIAR ALERTA AHORA"**. La app captura tu ubicación,
  crea la alerta y avisa a tus contactos por SMS con un enlace a tu posición.

### Con el modo guardia (voz)
- Activa el **modo guardia** en la pantalla de inicio.
- Cuando pronuncies la palabra de activación configurada (por ejemplo "ayuda"),
  la app inicia una **cuenta atrás** y, si no la cancelas, envía la alerta.
- El modo guardia requiere que la aplicación esté **en primer plano** en la
  versión analizada; con la pantalla bloqueada no se detecta la palabra.

## 3.4. Después de la alerta

- En la pestaña **Historial** verás las últimas alertas (hasta 20) y su estado.
- Si grabaste un mensaje de voz, se sube como adjunto y puede enviarse un
  mensaje de seguimiento con el enlace.

## 3.5. Suscripción y pagos

- La aplicación ofrece un **período de prueba**; al expirar aparecen pantallas
  de pago.
- El pago se realiza con **Mercado Pago**. Tras pagar, confirma en la app (el
  estado queda "en verificación" hasta que el sistema lo confirma).
- Sin suscripción activa, ciertas funciones (botón SOS, modo guardia, contactos
  adicionales) quedan limitadas o bloqueadas.

## 3.6. Configuración

- **Perfil**: tu nombre y teléfono.
- **Palabras de activación**: qué palabras disparan la alerta.
- **Plantilla del mensaje**: texto del SMS con tu nombre, ubicación y hora.
- **Audio**: si se graba el mensaje de voz durante la alerta.
- **Suscripción/estado de pago**: consulta y pagos.

## 3.7. Modo incógnito

La pantalla de inicio incluye un modo de **pantalla negra** (para no llamar la
atención); se sale con una pulsación larga.

## 3.8. Cierre de sesión y borrado de cuenta

- En configuración puedes **cerrar sesión** o **eliminar/exportar tu cuenta**.
  El borrado depende de los servicios del backend y de las reglas de Firestore.

---

## 8.9. Casos de uso principales

### CU-001 — Registro inicial (onboarding)

- **Actor**: Usuario nuevo.
- **Precondición**: app instalada y abierta.
- **Proceso**: (1) escribe nombre y teléfono; (2) toma foto opcional; (3)
  revisa "cómo funciona"; (4) concede permisos; (5) se crea el perfil en
  Firestore.
- **Resultado**: el usuario llega a la pantalla principal.

### CU-002 — Alerta SOS manual

- **Actor**: Usuario.
- **Precondición**: sesión iniciada y al menos un contacto activo.
- **Proceso**: (1) pulsa "ENVIAR ALERTA AHORA"; (2) la app captura ubicación;
  (3) crea la alerta en Firestore; (4) la Cloud Function envía SMS a los
  contactos.
- **Resultado**: alerta enviada y visible en Historial.

### CU-003 — Alerta por voz con modo guardia

- **Actor**: Usuario con micrófono y modo guardia activo.
- **Precondición**: suscripción/estado válido; app en primer plano.
- **Proceso**: (1) pronuncia la palabra de activación; (2) cuenta atrás; (3) si
  no cancela, envía alerta con ubicación y audio.
- **Resultado**: alerta SOS enviada.

### CU-004 — Gestión de contactos

- **Actor**: Usuario.
- **Proceso**: alta/edición/prioridad/desactivación/borrado de contactos de
  confianza.
- **Resultado**: contactos sincronizados (Firestore + canal externo).

### CU-005 — Compra de suscripción

- **Actor**: Usuario con prueba expirada.
- **Proceso**: (1) el modal de pago solicita una orden; (2) paga con Mercado
  Pago; (3) confirma; (4) el webhook actualiza el estado.
- **Resultado**: suscripción activa; funciones desbloqueadas.

### CU-006 — Administración (panel web)

- **Actor**: Administrador.
- **Proceso**: login; consulta de usuarios/alertas/ubicaciones/pagos;
  simulación de pagos; purga de datos por retención.
- **Resultado**: visión y control del servicio.

