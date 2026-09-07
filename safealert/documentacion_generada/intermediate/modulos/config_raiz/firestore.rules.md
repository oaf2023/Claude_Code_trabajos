# Archivo: firestore.rules

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| firestore.rules | 16 | Reglas Firebase (Firestore) | 397 | Reglas de seguridad de Firestore | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Define las reglas de acceso a Firestore del proyecto SafeAlert. Conceden a cada usuario autenticado control total (lectura/escritura) sobre su propio subárbol `users/{userId}/**` y deniegan por completo el acceso cliente a las colecciones `pendingNotifications` y `_functionEvents` (reservadas a procesos de servidor/Cloud Functions). Están desplegadas por `firebase.json` (`firestore.rules`).

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Referenciada por `firebase.json` línea 3; coherente con la arquitectura de Firebase del proyecto. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

No importa módulos. Usa variables de contexto de Firebase Rules (`request.auth`, `request.auth.uid`).

## Componentes que dependen de este archivo

- Firebase CLI / consola (despliegue).
- Clientes: app móvil (RNFirebase) y PWA web (Firebase JS).
- Cloud Functions (`functions/`) que acceden por Admin SDK (NO están sujetas a estas reglas).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `rules_version` | `'2'` | string | Versión del lenguaje de reglas | Línea 1 |
| `request.auth` | objeto/null | variable de contexto | Autenticación de la petición | Líneas 5, 9, 13 |
| `request.auth.uid` | string | variable de contexto | UID del usuario autenticado | Líneas 5, 9, 13 |

## Estructura (funciones / clases / tipos)

- `rules_version = '2'` (declaración de versión).
- `service cloud.firestore` con `match /databases/{database}/documents` y tres bloques `match` anidados.

## Análisis línea por línea

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /pendingNotifications/{notificationId} {
      allow read, write: if false;
    }

    match /_functionEvents/{eventId} {
      allow read, write: if false;
    }
  }
}
```

**Explicación de las líneas 1–16:**

- **Línea 1**: `rules_version = '2'` — usa la segunda versión del lenguaje (necesaria para ciertos operadores y semántica actual de Firestore).
- **Línea 2**: declara el servicio `cloud.firestore`.
- **Línea 3**: patrón raíz de documentos: `match /databases/{database}/documents` cubre todas las bases (útil con emuladores/multi-bases).
- **Líneas 4-6**: regla del subárbol de usuarios:
  - **Línea 4**: `match /users/{userId}/{document=**}` — comodín recursivo: cualquier documento bajo `users/{userId}/...` (subcolecciones incluidas).
  - **Línea 5**: `allow read, write: if request.auth != null && request.auth.uid == userId;` — el usuario autenticado puede leer y escribir únicamente su propio subárbol (comparación de su UID con el segmento `userId` de la ruta).
- **Líneas 8-10**: `match /pendingNotifications/{notificationId}` con `allow read, write: if false;` — deniega TODO acceso de cliente a esta colección. [NOTA] Los clientes no pueden leer ni escribir; si las notificaciones pendientes se gestionan por Cloud Functions (Admin SDK, que ignora estas reglas), el diseño es correcto.
- **Líneas 12-14**: `match /_functionEvents/{eventId}` con `allow read, write: if false;` — deniega todo acceso de cliente a la colección `_functionEvents` (eventos internos de funciones). Mismo patrón: solo Admin SDK.

## Fichas de funciones y métodos

No aplica (lenguaje declarativo de reglas).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] El modelo de datos bajo `users/{userId}` debe incluir TODA la información de cada usuario (perfil, contactos de confianza, alertas, ubicaciones) para que el cierre por UID sea suficiente; si algún dato vive en otra colección raíz, un cliente no podría acceder a él (ni siquiera leerlo), salvo a través de funciones.
- [OBSERVACIÓN TÉCNICA] `allow write` incluye `create`, `update` y `delete` sin distinciones: el usuario puede borrar o sobrescribir cualquier documento de su propio árbol. No hay reglas de validación de datos (`request.resource.data`) en este archivo.
- [NOTA] `{document=**}` cubre subcolecciones arbitrarias; cualquier colección futura creada bajo `users/{userId}` hereda automáticamente el mismo nivel de acceso.

## Seguridad

- [INFORMATIVO] La regla de `users/{userId}` (línea 5) es el patrón estándar "cada usuario solo su propio dato" y es correcta para datos privados por usuario. Sin hallazgos de severidad ALTA/CRÍTICA en este archivo.
- [BAJO] No hay validación de contenido en escritura: un cliente autenticado puede escribir estructuras arbitrarias o campos sensibles dentro de su propio subárbol (p. ej. campos de roles si el esquema los tuviera bajo `users`), o inflar el almacenamiento. El daño está acotado a su propia cuenta.
- [BAJO] Los usuarios NO pueden leer `pendingNotifications` ni `_functionEvents` desde cliente; si alguna función del cliente intentara leerlos (p. ej. para comprobar estado de envío), fallaría con `[permission-denied]`; la app debería obtener ese estado por otros medios (Cloud Functions con lógica de servidor o subcolección propia).
- [MEDIO] Sin reglas de escritura para funciones: el Admin SDK omite estas reglas por diseño; conviene que `functions/` valide en código la autorización (p. ej. que un usuario no pueda disparar envío de notificaciones a terceros) porque las reglas no la protegen. [NIVEL DE CERTEZA: Inferido]
- [INFORMATIVO] Si la app en algún momento usara el paquete JS `firebase` en web con reglas de producción, estas reglas se aplican igualmente (independientes del SDK).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Añadir validación de datos en escritura (p. ej. `request.resource.data` con tipos/tamaños máximos) dentro de `users/{userId}` para limitar escrituras arbitrarias.
- [RECOMENDACIÓN] Si la app necesita "compartir" ubicación/alertas con contactos de confianza (contactos de OTRO usuario), el patrón actual lo impide desde cliente: habrá que exponerla mediante Cloud Functions o una colección con reglas específicas (riesgo de diseño, no de configuración).
- [RECOMENDACIÓN] Asegurar que las Cloud Functions verifican autorización con `admin.auth()` y comprobaciones de UID antes de tocar `pendingNotifications`/`_functionEvents`.
