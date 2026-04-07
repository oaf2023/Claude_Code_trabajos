# Base para Data Safety

Este archivo no reemplaza el formulario legal de Google Play. Es una base de trabajo para completar la declaracion.

## Datos potencialmente recolectados por la app

- Ubicacion aproximada o precisa: si el usuario activa una alerta.
- Contactos: para configurar contactos de confianza.
- Audio: si el usuario concede microfono y la app adjunta audio a una alerta.
- Identificadores de cuenta o sesion tecnica: por integracion con Firebase.

## Finalidad funcional

- Seguridad personal y respuesta ante emergencias.
- Configuracion de contactos de confianza.
- Envio de alertas con ubicacion.
- Soporte tecnico minimo y operacion del backend Firebase.

## Puntos a revisar antes de declarar

- Si los datos se procesan solo a pedido del usuario.
- Si existen terceros que reciben datos, por ejemplo Firebase o Twilio.
- Si el usuario puede solicitar eliminacion de datos.
- Si la app cifra datos en transito y en almacenamiento backend.

## Terceros involucrados

- Firebase.
- Twilio, cuando el flujo SMS este activo.

## Nota importante

La declaracion final debe revisarse contra el comportamiento real de la build que se va a publicar. Si cambia el flujo de permisos o de backend, este archivo tambien debe actualizarse.
