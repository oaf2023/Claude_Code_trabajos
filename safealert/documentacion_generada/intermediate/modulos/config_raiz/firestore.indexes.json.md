# Archivo: firestore.indexes.json

## Metadatos

| Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría | Estado detectado | Nivel de certeza |
| --- | --- | --- | --- | --- | --- | --- |
| firestore.indexes.json | 4 | JSON (Firebase Firestore) | 44 | Índices compuestos de Firestore | Configuración mínima (sin índices) | Confirmado por código |

## Objetivo

Declara los índices compuestos y las exenciones de campos (field overrides) de Firestore que Firebase despliega. En SafeAlert el archivo está vacío: no hay índices compuestos personalizados ni overrides, lo que significa que Firestore solo usa los índices automáticos de un solo campo.

## Clasificación y estado

FUNCIONALIDAD EXISTENTE (configuración vacía intencional o pendiente de definir). `firebase.json` lo referencia como `indexes`. [NIVEL DE CERTEZA: Confirmado por código]

## Dependencias e importaciones

No importa módulos. Referenciado por `firebase.json` línea 4.

## Componentes que dependen de este archivo

- Firebase CLI (`firebase deploy --only firestore:indexes`).
- Las consultas de la app: si alguna consulta requiere ordenación/filtrado por varios campos, Firestore en producción devolverá un error pidiendo crear el índice (no está predeclarado aquí).

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| `indexes` | `[]` | array | Índices compuestos (ninguno) | Línea 2 |
| `fieldOverrides` | `[]` | array | Exenciones de índices por campo (ninguna) | Línea 3 |

## Análisis línea por línea

```json
{
  "indexes": [],
  "fieldOverrides": []
}
```

**Explicación de las líneas 1–4:**

- **Línea 1**: apertura del objeto raíz.
- **Línea 2**: `indexes: []` — sin índices compuestos definidos. [OBSERVACIÓN TÉCNICA] Si la app consulta p. ej. alertas filtradas por `userId` y ordenadas por `timestamp`, Firestore necesitará un índice compuesto que no está declarado; en local con emulador puede funcionar sin él, pero en producción la consulta fallaría con el error "The query requires an index".
- **Línea 3**: `fieldOverrides: []` — sin exenciones de indexación automática por campo.
- **Línea 4**: cierre.

## Fichas de funciones y métodos

No aplica.

## Clases / interfaces / tipos

No aplica.

## Observaciones técnicas

- [OBSERVACIÓN TÉCNICA] Estado del archivo: placeholder mínimo de Firebase (`firebase init firestore` lo genera así). No implica un problema por sí mismo; requiere auditoría de las consultas reales de la app/functions para confirmar que no necesitan índices compuestos.
- [NIVEL DE CERTEZA: No determinado] No se analizaron aquí las consultas de `src/` y `functions/` (fuera del alcance del módulo); la necesidad real de índices no puede confirmarse solo con este archivo.

## Seguridad

- [INFORMATIVO] Sin hallazgos de seguridad: los índices no afectan a la autenticación ni a las reglas de acceso (ver `firestore.rules.md`).

## Riesgos y recomendaciones (sin modificar código)

- [RIESGO] Si una consulta de producción exige un índice compuesto no declarado, el cliente recibirá errores de consulta en runtime. 
- [RECOMENDACIÓN] Auditar las consultas de Firestore de la app y de `functions/` y, si procede, declarar aquí los índices compuestos (o crearlos desde la consola y volcarlos al archivo).
