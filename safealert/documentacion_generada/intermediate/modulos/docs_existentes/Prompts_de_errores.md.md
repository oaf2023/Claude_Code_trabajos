# Documento: Prompts_de_errores.md

## Resumen
- Prompt/instrucciones que define el rol de un "Ingeniero Senior de QA y Especialista en Resolución de Errores" para diagnosticar fallos de arranque, compatibilidad, crashes en runtime y bloqueos de publicación en iOS y Android.
- Restringe la resolución a una base de conocimiento cerrada de escenarios documentados y exige un formato de respuesta fijo (Diagnóstico del Error / Explicación del Conflicto / Plan de Resolución), respondiendo con una frase estándar cuando el error no está en la base.
- Es un "playbook" conversacional de soporte/QA, no documentación del código de SafeAlert ni de su infraestructura.

## Contenido clave
- Escenarios de publicación y tiendas: rechazo iOS `ITMS-91061` (missing privacy manifest); Android invisible por no apuntar a Target API Level 36 (Android 16) en 2026; crashes por ofuscación al subir AAB sin mapeos/Proguard; iOS `App record creation failed due to invalid request` (datos de contacto del proveedor en App Store Connect).
- Escenarios de compilación/entorno: Gradle exige Java 11; Jetpack Compose Preview no muestra; saturación de RAM por emuladores (Pixel 9 Pro) sin apagar; sintaxis obsoleta de Gradle copiada de internet.
- Escenarios de startup/runtime: crash de SwiftUI/SwiftData en Canvas sin `.modelContainer`; Swift `Self used in property access before all stored properties are initialized`; errores `401 Unauthorized` por token no inyectado en header (ej. `@Header("Authorization")`).
- Escenarios de concurrencia: `async call in a function that does not support concurrency` en `onAppear` (solución: envolver en `Task`); semántica de valor rota al cambiar `struct`→`class` con `@Model`; `@Transient` que no dispara reactividad en SwiftData; errores de App Clips (`Invalid Entitlement: Unknown ID`, `App Clip Unavailable`).
- Formato de respuesta exigido y respuesta canónica para errores fuera de la base de conocimiento.

## Relación con el código real
- El documento no referencia archivos, módulos ni tecnología del proyecto: es un prompt genérico reutilizable.
- [OBSERVACIÓN TÉCNICA] Los escenarios mencionan stacks (SwiftUI/SwiftData, Jetpack Compose/Kotlin, App Clips) que NO forman parte del código real de SafeAlert (React Native + Expo/TypeScript para la app; hay variante `iphone/` con expo-router temática iOS, pero no Swift nativo en el árbol revisado). Solo son útiles de forma indirecta para la publicación en tiendas.
- [OBSERVACIÓN TÉCNICA] La directiva de responder "El error proporcionado no se encuentra documentado en la base de conocimientos..." limita el alcance del asistente de QA a los casos listados; en el proyecto real los errores propios (Functions, Twilio, Mercado Pago, PythonAnywhere) se tratan en `docs/runbooks*`, no aquí.

## Estado y uso
- HISTÓRICO / auxiliar: prompt de trabajo para un agente de QA, sin relación directa con el estado del producto. Conservable como material de proceso, pero no aporta información técnica del sistema SafeAlert.
- [NIVEL DE CERTEZA: Confirmado por contenido]

## Seguridad
- Sin secretos ni datos sensibles. Única mención técnica: inyección correcta de tokens de autorización en headers de red (buena práctica).
