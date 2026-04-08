# Politica de Privacidad Base

## 1. Introduccion

SafeAlert es una aplicacion orientada a asistencia en situaciones de emergencia. Esta politica describe que datos puede tratar la aplicacion y con que finalidad.

## 2. Datos y Permisos Sensibles que se Tratan

SafeAlert accede y trata los siguientes datos sensibles para cumplir su función de emergencia:

- **Ubicación (android.permission.ACCESS_FINE_LOCATION):** Se accede a la ubicación precisa en primer y segundo plano para enviarla a tus contactos de confianza únicamente cuando activas una alerta de emergencia.
- **Micrófono / Grabación de Audio (android.permission.RECORD_AUDIO):** Si el usuario lo configura, la app utiliza el micrófono para capturar evidencia sonora durante una alerta activa. El audio se procesa localmente para detectar palabras clave (si se activa) y se sube a tu almacenamiento privado de emergencia en la nube para que tus contactos puedan escucharlo.
- **Contactos (android.permission.READ_CONTACTS):** Se accede a la lista de contactos para que el usuario pueda seleccionar manualmente a quiénes desea definir como "Contactos de Confianza".
- **Notificaciones (android.permission.POST_NOTIFICATIONS):** Se utiliza para informar sobre el estado de las alertas y confirmaciones del sistema.

## 3. Finalidad del tratamiento y Uso de Datos

Los datos mencionados se utilizan exclusivamente para:
- Permitir el envío de alertas críticas a contactos definidos por el usuario.
- Compartir información de ubicación en tiempo real necesaria durante una emergencia.
- Capturar y guardar evidencia de audio asociada a una alerta cuando el usuario habilita dicha función.
- Facilitar la gestión de la red de confianza del usuario.

**No vendemos, alquilamos ni compartimos estos datos con terceros para fines publicitarios o de marketing.**

## 4. Servicios de terceros

SafeAlert utiliza **Firebase (Google)** para la autenticación y el almacenamiento seguro de los datos de emergencia (base de datos y archivos de audio). Los datos están protegidos bajo la infraestructura de seguridad de Google Cloud.

## 5. Retención de Datos

Los datos de ubicación y audio asociados a una alerta se conservan únicamente mientras la alerta esté activa o sea relevante para la seguridad del usuario, y pueden ser eliminados por el usuario desde la aplicación en cualquier momento.

## 6. Control del Usuario y Transparencia

El usuario tiene control total sobre los permisos:
- Puede revocar el acceso al micrófono o ubicación en cualquier momento desde los ajustes del sistema.
- La aplicación muestra claramente cuándo se está utilizando el micrófono o la ubicación mediante indicadores visuales.

## 7. Contacto

Si tiene dudas sobre esta política, puede contactarnos a través de los canales de soporte oficial del proyecto SafeAlert.

## 8. Nota Legal

Esta es una política de privacidad simplificada para cumplir con los requisitos de transparencia de Google Play. El usuario es responsable de hospedar este texto en una URL pública accesible para que Google Play Console pueda verificarla.
