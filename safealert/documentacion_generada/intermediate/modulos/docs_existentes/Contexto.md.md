# Documento: Contexto.md

## Resumen
- Es la "semilla" del proyecto: un prompt/contexto conversacional en bruto que fija el rol del autor (Tecnólogo Creativo Senior e Ingeniero Frontend/Programador Senior móvil), el objetivo de negocio original, la textura visual ("seguiremos con el formato visual actual") y una colección de enlaces oficiales de aprendizaje (Apple, Android/Kotlin, Flutter, React Native, Expo).
- No describe el estado real del código ni de la infraestructura: es el punto de partida con el que se encargó construir SafeAlert ("Terminarla y dejarla funcional"), con la nota de que todas las respuestas sean en español.
- Su valor para la auditoría es contextual: permite contrastar las intenciones originales del producto con lo finalmente implementado.

## Contenido clave
- Objetivo original: "aplicación de ayuda" que crea un grupo de personas y, al mencionar determinadas palabras, activa mensajes automáticos aunque la pantalla esté bloqueada; la app debe activarse solo cuando hace falta y quedar en reposo el resto del tiempo.
- Funcionalidades pedidas en el objetivo: llamada telefónica, grupos de contactos guardados en el móvil, uso de recursos del dispositivo y de WhatsApp.
- Enlaces de referencia por plataforma (texto plano en el documento):
  - Apple: developer.apple.com/learn, tutoriales Swift/SwiftUI/Xcode y App Dev Training.
  - Android: developer.android.com (cursos Compose), kotlinlang.org/docs.
  - Multiplataforma: docs.flutter.dev y React Native/Expo (docs.expo.dev, reactnative.dev).
- Acción esperada y notas de idioma.

## Relación con el código real
- El producto real SafeAlert sigue la vía React Native + Expo + TypeScript (una de las rutas sugeridas en el contexto) y sí implementa el núcleo: detección de palabra de activación (wake word) y disparo de alertas con ubicación a contactos de confianza.
- [OBSERVACIÓN TÉCNICA] El contexto pide que la app "llame por teléfono"; el código real y DEPLOY.md (sección "Notas operativas") limitan la llamada a un botón asistido que abre el dialer tras acción explícita del usuario: no hay llamada autónoma real. Coherente con el alcance "fuera del MVP" declarado en SETUP.md.
- [OBSERVACIÓN TÉCNICA] El contexto menciona integración con WhatsApp; no se hallaron referencias a WhatsApp en el código revisado (`src/`, `functions/`, `backend/`). [NIVEL DE CERTEZA: Altamente probable]
- [OBSERVACIÓN TÉCNICA] El contexto dice que los grupos de contactos "se guardarán en el móvil"; en el código real los contactos de emergencia persisten en Firestore (`users/{userId}/contacts`, regla verificada en `firestore.rules`), con copia local de estado vía Zustand/AsyncStorage y espejo en SQLite del backend. La afirmación original describe la intención, no la implementación final.

## Estado y uso
- HISTÓRICO / documento de origen: prompt semilla del proyecto, sin versión ni fecha, sin referencias a archivos reales. Útil solo como registro de intenciones y decisiones de stack; no debe tomarse como documentación técnica vigente.
- [NIVEL DE CERTEZA: Altamente probable]

## Seguridad
- No contiene secretos ni credenciales: solo URLs públicas de documentación oficial de terceros.
