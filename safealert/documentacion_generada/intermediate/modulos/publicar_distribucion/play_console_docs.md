# Documentos de Play Console — Mini-fichas (SafeAlert)

Conjunto de documentos de apoyo en `Publicar/` para la publicación de SafeAlert en Google Play (Internal Testing). Mini-fichas por documento, sin análisis línea por línea (material documental, no código ejecutable).

---

# Documento: Publicar/README.md

## Resumen

Índice operativo de la carpeta `Publicar`: explica qué contiene, el flujo recomendado de publicación (inicializar config, completar secretos, build AAB, exportar artefactos, subir a Play Console en Internal testing), la configuración local release (plantilla versionada + archivo local ignorado por Git) y la limitación real de que la carga final a Play requiere cuenta humana.

## Contenido clave

- Lista de los scripts de `Publicar/scripts/` y de los documentos de `Publicar/play-console/` (8 documentos, del checklist al 07 de textos).
- Flujo recomendado en 6 pasos (líneas 20–25), todos referenciando archivos que existen (verificado).
- Mención de `Publicar/config/release.env.example.ps1` (versionado) vs `release.env.ps1` (local, ignorado por Git).
- Limitación: la subida final, formularios legales y testers requieren la cuenta de Google del operador.

## Estado/uso

- Documento índice vigente, coherente con el contenido real de la carpeta (rutas y comandos citados existen).
- [NIVEL DE CERTEZA: Confirmado por código (grep de referencias)]

---

# Documento: Publicar/play-console/01_Checklist.md

## Resumen

Checklist de verificación previa a la subida a Play, organizado en cuatro bloques: técnico, cuenta y consola, formularios de Google Play y verificación antes de enviar.

## Contenido clave

- Técnico: confirmar package `com.safealert.app`, incrementar `versionCode`, `versionName` correcto, keystore disponible por variables `MYAPP_RELEASE_*`, `npm run typecheck`, generar AAB y copiarlo a `Publicar/artefactos/`.
- Cuenta y consola: acceso a Play Console, app creada, URL pública de política de privacidad, testers definidos.
- Formularios: App access, Ads, Data safety, Content rating, Target audience, Política de privacidad e información general de la ficha.
- Verificación final: notas de release, capturas, permisos declarados vs uso real y prueba en dispositivo físico.

## Estado/uso

- Guía de uso humano previa a cada release.
- [NOTA] Los valores técnicos citados (package, variables) deben verificarse contra la configuración real al momento de publicar; la propia lista lo exige como pasos a confirmar.
- [NIVEL DE CERTEZA: Confirmado por contenido]

---

# Documento: Publicar/play-console/02_Tutorial_Paso_A_Paso.md

## Resumen

Tutorial de Google Play Internal Testing en 7 secciones: preparar la build local (Initialize-PlayReleaseConfig, editar `release.env.ps1`, Build-PlayInternalTesting, Export-PublicacionBundle), crear/abrir la app en Play Console, completar formularios, subir la release a Internal testing, agregar testers, validar la instalación y subir una nueva versión.

## Contenido clave

- Comandos PowerShell citados (líneas 9, 20 y 26) que coinciden con los scripts reales de `Publicar/scripts/` (verificado por grep).
- Package esperado: `com.safealert.app`.
- Documentos base para formularios: 03, 04, 06 y 07; notas de release desde 05.
- Ruta del AAB a subir: `Publicar/artefactos/app-release.aab` (producido por `Export-PublicacionBundle.ps1`).
- Validación posterior: apertura de la app, Firebase, permisos (ubicación, notificaciones, micrófono, contactos) y flujo SOS.
- Para nuevas versiones: incrementar `versionCode`, ajustar `versionName`, regenerar y subir a la misma pista.

## Estado/uso

- Tutorial operativo vigente y consistente con los scripts existentes.
- [NIVEL DE CERTEZA: Confirmado por contenido y por código (coincidencia de rutas)]

---

# Documento: Publicar/play-console/03_Datos_De_La_App.md

## Resumen

Ficha técnica de referencia con la identidad actual de SafeAlert (nombre, slug Expo, scheme, versión, package Android, proyecto EAS), los permisos Android declarados, el uso funcional esperado y los datos técnicos de release (applicationId, namespace, versionCode, versionName).

## Contenido clave

- Identidad: SafeAlert, versión 1.1.0, package `com.safealert.app`, slug `safealert`, scheme `safealert`, ID de proyecto EAS (no se reproduce su valor aquí: [SECRETO OCULTO] por prudencia).
- Permisos Android listados: ACCESS_FINE_LOCATION, RECORD_AUDIO, POST_NOTIFICATIONS, VIBRATE, READ_CONTACTS.
- Datos de release: applicationId y namespace `com.safealert.app`, versionCode 3, versionName 1.1.0.
- Acción requerida: incrementar `versionCode` antes de cada nueva subida a Play.

## Estado/uso

- Ficha informativa de referencia.
- [OBSERVACIÓN TÉCNICA] Los valores (versionCode 3 / versionName 1.1.0) son declaraciones del documento; no se verificaron contra `build.gradle`/`app.json` en este módulo (carpeta `android` fuera de alcance). Puede desincronizarse si cambia la configuración.
- [NIVEL DE CERTEZA: Inferido (valores declarados, no verificados en este módulo)]

---

# Documento: Publicar/play-console/04_Data_Safety_Base.md

## Resumen

Base de trabajo para completar el formulario "Data safety" de Google Play. Aclara que no reemplaza el formulario legal y lista datos potencialmente recolectados, finalidad funcional, puntos a revisar antes de declarar y terceros involucrados.

## Contenido clave

- Datos potenciales: ubicación (aproximada o precisa, en alerta activa), contactos (red de confianza), audio (micrófono, si se adjunta a una alerta) e identificadores de cuenta/sesión (integración Firebase).
- Finalidad: seguridad personal/emergencias, contactos de confianza, envío de alertas con ubicación, soporte y backend Firebase.
- Puntos a revisar: procesamiento solo a pedido del usuario, terceros (Firebase, Twilio si el flujo SMS está activo), derecho de eliminación de datos y cifrado en tránsito/almacenamiento.
- Nota: la declaración debe contrastarse con el comportamiento real de la build a publicar.

## Estado/uso

- Borrador legal de apoyo; sujeto a revisión final humana.
- [NIVEL DE CERTEZA: Confirmado por contenido]

---

# Documento: Publicar/play-console/05_Notas_De_Release.md

## Resumen

Texto base de notas de release para la pista interna, con versión 1.1.0 (build 2, fecha 2026-04-01), cambios incluidos, instrucciones para testers y una variante corta.

## Contenido clave

- Cambios: prefijo de SMS actualizado (el texto original cita un prefijo con icono de aviso en lugar del anterior), mensajes de prueba con etiqueta distinta, arquitectura SMS-only confirmada (retirado el canal WhatsApp; alertas por SMS con Twilio) y estabilización del flujo de contactos y autenticación Firebase.
- Para testers: verificar el prefijo del SMS recibido, el flujo completo (activar alerta, cuenta regresiva de 3 segundos, envío SMS, confirmación en pantalla) y el botón de prueba.
- Variante corta lista para pegar.

## Estado/uso

- Texto listo para usar en Play Console.
- [NOTA] El contenido cita emojis/iconos dentro de los prefijos de SMS; en esta ficha no se reproducen (sintaxis limitada). Revisar longitud y formato antes de pegar en Play.
- [NIVEL DE CERTEZA: Confirmado por contenido]

---

# Documento: Publicar/play-console/06_Politica_De_Privacidad_Base.md

## Resumen

Plantilla base de política de privacidad en 8 secciones: introducción, datos y permisos sensibles tratados, finalidad del tratamiento, servicios de terceros, retención de datos, control del usuario y transparencia, contacto y nota legal.

## Contenido clave

- Permisos/datos: ubicación precisa (ACCESS_FINE_LOCATION, primer y segundo plano, enviada a contactos de confianza al activar alerta), micrófono/audio (RECORD_AUDIO, evidencia sonora durante alerta activa; procesamiento local de palabras clave y subida a almacenamiento privado), contactos (READ_CONTACTS, selección manual de contactos de confianza) y notificaciones (POST_NOTIFICATIONS, estado de alertas).
- Finalidad: envío de alertas críticas, compartición de ubicación en emergencia, captura/guardado de audio, gestión de la red de confianza. Declara explícitamente que no se venden ni comparten datos con fines publicitarios.
- Terceros: Firebase (Google) para autenticación y almacenamiento.
- Nota legal: política simplificada; el usuario debe hospedarla en una URL pública verificable por Play Console.

## Estado/uso

- Borrador legal; requiere revisión legal y alojamiento público antes de declararla en Play.
- [NIVEL DE CERTEZA: Confirmado por contenido]

---

# Documento: Publicar/play-console/07_Textos_Play_Store.md

## Resumen

Textos iniciales para la ficha de Play Store: nombre visible, descripción corta, descripción completa con funciones principales, categoría sugerida y público objetivo sugerido.

## Contenido clave

- Nombre visible: SafeAlert.
- Descripción corta: alertas de emergencia con ubicación y contactos de confianza.
- Descripción completa: funciones (alerta SOS, compartición de ubicación, gestión de contactos de confianza, audio opcional en alerta) y aclaración de versión orientada a pruebas internas controladas en Android.
- Categoría sugerida: Herramientas o Estilo de vida; público: adultos y usuarios que requieran asistencia ante emergencias.

## Estado/uso

- Borrador de textos listo para completar la ficha en Play Console.
- [NOTA] Ajustar el texto "orientada a pruebas internas" antes de cualquier salida pública más amplia.
- [NIVEL DE CERTEZA: Confirmado por contenido]

---

## Observaciones generales del conjunto documental

- [NOTA] Todos los documentos referencian scripts y rutas que existen en el repositorio (verificado por grep/lectura), por lo que el material operativo está sincronizado con el código.
- [OBSERVACIÓN TÉCNICA] Los documentos 03, 05 y otros citan datos técnicos (versionCode 3, versionName 1.1.0, prefijos SMS) que dependen del estado de `build.gradle`/backend al momento de publicar: deben re-verificarse en cada release.
- [INFORMATIVO] Estilo: varios textos usan español rioplatense y omiten tildes; no afecta la operación pero conviene unificar si se pegan en ficha pública.
- [NIVEL DE CERTEZA: Confirmado por contenido]
