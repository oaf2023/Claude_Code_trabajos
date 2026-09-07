# Archivo: firebase.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| firebase.json | 37 | JSON (Firebase CLI) | 661 | Configuración de Firebase (rules, functions, emuladores) | FUNCIONALIDAD EXISTENTE | Confirmado por código |

## Objetivo

Archivo de configuración del proyecto Firebase SafeAlert para Firebase CLI. Declara qué archivos de reglas usar (Firestore y Storage), configura el despliegue de Cloud Functions (carpeta `functions/`, codebase `default`, predeploy de build) y define los emuladores locales de Firebase (auth, functions, firestore, storage y UI) para desarrollo.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE. Referencia archivos existentes (`firestore.rules`, `firestore.indexes.json`, `storage.rules` y la carpeta `functions/`). [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

No importa módulos. Referencia archivos del proyecto:

| Ruta referenciada | Finalidad |
| --- | --- |
| `firestore.rules` | Reglas de Firestore |
| `firestore.indexes.json` | Índices compuestos de Firestore |
| `functions/` | Código de Cloud Functions (codebase default) |
| `storage.rules` | Reglas de Storage |

## Componentes que dependen de este archivo

- Firebase CLI (`firebase deploy`, `firebase emulators:start`).
- `firestore.rules`, `firestore.indexes.json`, `storage.rules` (archivos fuente de reglas).
- Carpeta `functions/` (Cloud Functions).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `firestore.rules` | `firestore.rules` | string | Ruta de reglas Firestore | Línea 3 |
| `firestore.indexes` | `firestore.indexes.json` | string | Ruta de índices | Línea 4 |
| `functions[0].source` | `functions` | string | Carpeta de funciones | Línea 8 |
| `functions[0].codebase` | `default` | string | Codebase por defecto | Línea 9 |
| `storage.rules` | `storage.rules` | string | Ruta de reglas Storage | Línea 17 |
| Emuladores | auth 9099, functions 5001, firestore 8080, storage 9199, ui 4000 | number | Puertos locales | Líneas 20-35 |

## Estructura (funciones / clases / tipos)

No aplica. Estructura JSON: `firestore`, `functions`, `storage`, `emulators`.

## Análisis línea por línea

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "ignore": ["node_modules", ".git", "firebase-debug.log", "firebase-debug.*.log"],
      "predeploy": [
        "npm --prefix \"$RESOURCE_DIR\" run build"
      ]
    }
  ],
  "storage": {
    "rules": "storage.rules"
  },
```

**Explicación de las líneas 1–18:**

- **Líneas 2-5**: `firestore` mapea las reglas (`firestore.rules`) y los índices compuestos (`firestore.indexes.json`) que se despliegan con `firebase deploy --only firestore`.
- **Líneas 6-15**: `functions` (array) con un único bloque:
  - **Línea 8**: `source: functions` — carpeta del código de Cloud Functions.
  - **Línea 9**: `codebase: default` — nombre del codebase (permite múltiples grupos de funciones).
  - **Línea 10**: `ignore` — archivos/carpetas que no se suben al desplegar funciones.
  - **Líneas 11-13**: `predeploy` — antes de desplegar ejecuta `npm --prefix functions run build` (compila el TypeScript de las funciones). El `$RESOURCE_DIR` lo sustituye Firebase CLI por la ruta de la carpeta de funciones.
- **Líneas 16-18**: `storage.rules` apunta a `storage.rules` para el despliegue de reglas de Storage.

```json
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "storage": {
      "port": 9199
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

**Explicación de las líneas 19–37:**

- **Línea 19**: apertura de `emulators`.
- **Líneas 20-22**: emulador de Auth en el puerto 9099.
- **Líneas 23-25**: emulador de Functions en el 5001.
- **Líneas 26-28**: emulador de Firestore en el 8080.
- **Líneas 29-31**: emulador de Storage en el 9199.
- **Líneas 32-35**: UI de emuladores habilitada en el puerto 4000 (panel web para inspeccionar Auth/Firestore/etc. en local).
- **Línea 37**: cierre del objeto.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] `firestore.indexes.json` actualmente está vacío (`indexes: []`), por lo que Firebase no desplegará índices compuestos; si las consultas lo requieren, Firebase Cloud pedirá crearlos manualmente.
- [NOTA] El uso de emuladores implica que la app en desarrollo debe apuntar a los puertos locales (configuración típica con `EXPO_PUBLIC_*` o `useEmulator`), coherente con el entorno de desarrollo del proyecto.
- [NOTA] No hay regla de hosting (no se sirve la PWA desde Firebase Hosting en este archivo; el build web se sirve por otros medios, p. ej. `web:serve`).

## Seguridad

- [INFORMATIVO] Los emuladores solo se usan en local; si se expusieran a la red (por configuración de host), permitirían acceso sin credenciales a datos de prueba. Mantenerlos en localhost.
- [INFORMATIVO] El archivo no contiene credenciales. La seguridad real depende de `firestore.rules` y `storage.rules` (ver sus .md).

## Riesgos y recomendaciones (sin modificar código)

- [RECOMENDACIÓN] Verificar que `firestore.indexes.json` refleje los índices compuestos necesarios para las consultas de alertas/usuarios antes de producción.
- [RECOMENDACIÓN] Documentar el arranque de emuladores con datos de prueba (seed) para desarrollo reproducible.
- [RECOMENDACIÓN] No exponer los puertos de emuladores fuera de localhost en CI o entornos compartidos.
