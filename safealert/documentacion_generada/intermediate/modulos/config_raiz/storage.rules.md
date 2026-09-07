# Archivo: storage.rules

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| storage.rules | 13 | Reglas Firebase (Storage) | 385 | Reglas de seguridad de Firebase Storage | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Define las reglas de acceso a Firebase Storage (Cloud Storage for Firebase) de SafeAlert. Permite a cada usuario autenticado leer y escribir cualquier archivo bajo su propia carpeta `users/{userId}/alerts/{alertId}/` (audio, logs, etc. de alertas SOS) y deniega todo lo demás.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Referenciada por `firebase.json` línea 17 (`storage.rules`). [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

No importa módulos. Usa variables de contexto de reglas (`request.auth`, `request.auth.uid`).

## Componentes que dependen de este archivo

- Firebase CLI / consola (despliegue de reglas de Storage).
- Clientes (app móvil RNFirebase Storage y PWA web con Firebase JS) que suben/leen audio y logs de alertas.
- Cloud Functions (Admin SDK, no sujetas a reglas).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `rules_version` | `'2'` | string | Versión del lenguaje | Línea 1 |
| `request.auth.uid` | string | variable de contexto | UID autenticado | Línea 6 |
| Comodines de ruta | `{userId}`, `{alertId}`, `{fileName}` | string | Segmentos de la ruta del objeto | Línea 5 |
| `{allPaths=**}` | comodín recursivo | string | Cualquier otra ruta | Línea 9 |

## Estructura (funciones / clases / tipos)

- `service firebase.storage` con dos `match`: el concreto de alertas y el de denegación global.

## Análisis línea por línea

```text
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Permite cualquier archivo dentro de la carpeta de alertas del usuario (audio, logs, etc)
    match /users/{userId}/alerts/{alertId}/{fileName} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

**Explicación de las líneas 1–13:**

- **Línea 1**: `rules_version = '2'`.
- **Línea 2**: declara el servicio `firebase.storage`.
- **Línea 3**: `match /b/{bucket}/o` — patrón raíz de objetos en cualquier bucket.
- **Línea 4**: comentario: permite cualquier archivo dentro de la carpeta de alertas del usuario (audio, logs, etc.).
- **Línea 5**: `match /users/{userId}/alerts/{alertId}/{fileName}` — coincide con un archivo concreto: una alerta (`alertId`) de un usuario (`userId`).
- **Línea 6**: `allow read, write: if request.auth != null && request.auth.uid == userId;` — solo el usuario autenticado dueño del `userId` puede leer/escribir los archivos de sus alertas.
- **Líneas 9-11**: `match /{allPaths=**} { allow read, write: if false; }` — regla de denegación por defecto para CUALQUIER otra ruta del bucket (patrón "deny-all" con excepción explícita). Importante: en Firebase Rules el orden no es relevante (se evalúa la regla más específica que coincida), por lo que la excepción de la línea 5 prevalece sobre el comodín global.

## Fichas de funciones y métodos

No aplica (lenguaje declarativo).

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] La regla permite al usuario listar/escribir cualquier archivo bajo `alerts/{alertId}` de su propiedad, incluidos los de OTROS usuarios SI el segmento `userId` coincidiera con el suyo: la partición correcta es responsabilidad del código de subida (usar siempre `users/{miUid}/alerts/...`).
- [OBSERVACIÓN TÉCNICA] No hay límites de tamaño, tipo MIME ni validación de contenido: un cliente autenticado puede subir archivos arbitrariamente grandes a su propia carpeta (costo de almacenamiento por cuenta).
- [NOTA] La denegación global (líneas 9-11) es una buena práctica; sin ella, Storage permitiría acceso público por defecto si no existiera otra regla.

## Seguridad

- [INFORMATIVO] La regla principal (línea 6) restringe el acceso por UID; correcta para audio/logs privados de alertas. Sin hallazgos de severidad ALTA/CRÍTICA.
- [BAJO] Falta validación de contenido en escritura (tamaño máximo, tipo MIME permitido). Un usuario podría subir archivos de gran tamaño o formatos no previstos a su propio espacio.
- [BAJO] Los archivos de alertas podrían contener audio con datos personales (voz) y ubicación (en logs); el acceso está acotado al dueño, pero conviene revisar retención/borrado (si el usuario borra su cuenta, ¿se eliminan los objetos?).
- [INFORMATIVO] Las Cloud Functions (Admin SDK) no están sujetas a estas reglas: si generan URLs firmadas o copian objetos a otras rutas, deben validar autorización en código.

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Añadir condiciones de escritura que limiten tamaño y tipo MIME (p. ej. `request.resource.size < N` y `request.resource.contentType.matches('audio/.*')`) para mitigar abuso de almacenamiento.
- [RECOMENDACIÓN] Verificar que el código de subida construye siempre la ruta con el UID autenticado del usuario (nunca con datos de entrada sin validar).
- [RECOMENDACIÓN] Definir política de retención/eliminación de audio de alertas (privacidad de datos de voz) alineada con DAMMA/DAMA y la política de privacidad publicada.
