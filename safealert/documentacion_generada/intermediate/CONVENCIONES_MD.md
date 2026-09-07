# CONVENCIONES PARA ANÁLISIS PROFUNDO — Auditoría SafeAlert

**LEER ESTE ARCHIVO COMPLETO ANTES DE EMPEZAR A TRABAJAR.**

Este documento define las reglas obligatorias para generar los archivos de análisis
intermedio de la auditoría técnica del proyecto **SafeAlert**
(`C:\Claude_Code_trabajos\safealert`). Todo el contenido debe escribirse en
**español técnico**.

---

## 1. MISIÓN GENERAL

Tu tarea asignada indica un módulo y una lista concreta de archivos del proyecto.
Para **cada archivo de tu lista** debes:

1. Leer el archivo **completo** con la herramienta `read`.
2. Producir un documento Markdown de análisis siguiendo la plantilla de la sección 4,
   que explique **qué hace cada parte del código real** (objetivo, dependencias,
   importaciones, funciones, clases, constantes, variables, flujo, análisis línea por
   línea, observaciones, seguridad y riesgos).
3. Guardarlo en la ruta exacta indicada en tu tarea (siempre dentro de
   `C:\Claude_Code_trabajos\safealert\documentacion_generada\intermediate\modulos\...`).

**NO modifiques, reformatees, refactorices, corrijas, muevas ni elimines NINGÚN
archivo original del proyecto.** Solo lectura sobre `C:\Claude_Code_trabajos\safealert`
(excluyendo la carpeta `documentacion_generada`) y solo escritura de los `.md` de salida.

---

## 2. ESTADO REAL Y HONESTIDAD TÉCNICA

- Documenta SOLO lo que existe en el código. No inventes funcionalidades.
- Diferencia estados con estas etiquetas (usa la que corresponda):
  - `FUNCIONALIDAD EXISTENTE` — implementada y aparentemente conectada.
  - `PARCIALMENTE IMPLEMENTADA` — hay código pero incompleto o con errores.
  - `DESHABILITADA` — código comentado, apagado por flags o inalcanzable.
  - `CÓDIGO LEGADO` — de versiones anteriores, sin uso actual aparente.
  - `APARENTEMENTE NO UTILIZADO` — no se encontraron referencias (usa el marcador
    `[POTENCIALMENTE NO UTILIZADO]`). Nunca afirmes que puede eliminarse sin comprobar.
  - `PENDIENTE` — TODO/XXX/FIXME o declarado pero no implementado.
- Cuando una conclusión sea inferida, indica el nivel de certeza:
  - `[NIVEL DE CERTEZA: Confirmado por código]`
  - `[NIVEL DE CERTEZA: Altamente probable]`
  - `[NIVEL DE CERTEZA: Inferido]`
  - `[NIVEL DE CERTEZA: No determinado]`
- Los hallazgos dudosos se marcan `[OBSERVACIÓN TÉCNICA]` indicando archivo, líneas,
  explicación e impacto potencial.

---

## 3. SEGURIDAD Y SECRETOS (OBLIGATORIO)

- **NUNCA** incluyas valores reales de: contraseñas, tokens, API keys, claves
  privadas, secretos, `DATABASE_URL` con credenciales, ids de proyecto sensibles.
- Sustitúyelos por `[SECRETO OCULTO]`.
- En `.env` / `.env.example` / `google-services.json` documenta los NOMBRES de las
  variables y su propósito, marcando el valor como `[SECRETO OCULTO]`.
- Revisa también que el código no imprima secretos a logs (repórtalo si ocurre).
- Sección `## Seguridad` en cada archivo: autenticación, autorización, validación,
  inyección SQL/XSS, CORS, tokens, paths, logging, permisos. Clasifica cada hallazgo:
  `CRÍTICO`, `ALTO`, `MEDIO`, `BAJO`, `INFORMATIVO`. No modifiques nada.

---

## 4. PLANTILLA POR ARCHIVO (respetar EXACTAMENTE el orden)

Cada análisis de archivo comienza con una línea exacta:

`# Archivo: <ruta relativa al proyecto con />`   (ej.: `# Archivo: src/services/AlertService.ts`)

Después, en este orden:

```
## Metadatos
(tabla: Ruta | Líneas totales | Lenguaje | Tamaño (bytes) | Categoría |
 Estado detectado | Nivel de certeza)
(usa read para saber las líneas; categoría según el tipo real)

## Objetivo
Texto técnico y funcional: por qué existe, qué responsabilidad tiene.

## Clasificación y estado
Etiqueta de estado + breve justificación basada en referencias reales.

## Dependencias e importaciones
Tabla: | Importación/Librería | Tipo (estándar/externa/interna) | Dónde se usa | ¿Realmente usada? |
Explica para qué se usa cada importación. Marca importaciones aparentemente innecesarias.

## Componentes que dependen de este archivo
Dónde se importa/utiliza (búsqueda grep real si es posible). Si no se hallan
referencias, indícalo con el marcador correspondiente.

## Variables globales y constantes
Tabla: | Nombre | Valor (o [SECRETO OCULTO]) | Tipo | Finalidad | Referencias |
Incluye valores mágicos y su significado (si no se puede determinar:
"Significado inferido a partir del contexto").

## Estructura (funciones / clases / tipos)
Índice breve de funciones, clases, interfaces/tipos y hooks exportados.

## Análisis línea por línea
Ver sección 5 (LA PARTE MÁS IMPORTANTE).

## Fichas de funciones y métodos
Solo si el archivo tiene lógica relevante. Por función:
### <nombre> (líneas NN–MM)
- Firma (código original).
- Propósito técnico y propósito funcional.
- Parámetros (tabla), retorno, excepciones.
- Dependencias, flujo interno paso a paso, funciones que llama y desde dónde se llama.
- Efectos secundarios y riesgos.

## Clases / interfaces / tipos
Por cada clase/interfaz/tipo: responsabilidad, campos (tabla), relaciones, ciclo de vida.

## Observaciones técnicas
Lista de [OBSERVACIÓN TÉCNICA], [POTENCIALMENTE NO UTILIZADO], [NIVEL DE CERTEZA ...].

## Seguridad
Hallazgos clasificados (ver sección 3). Si no hay, indícalo.

## Riesgos y recomendaciones (sin modificar código)
Posibles problemas y recomendaciones. No alteres código.
```

---

## 5. ANÁLISIS LÍNEA POR LÍNEA (reglas exactas)

- Divide el archivo en **bloques lógicos consecutivos** de código original (máximo
  ~40 líneas por bloque; los archivos muy largos pueden usar bloques de hasta 60).
- Cada bloque se muestra en una **cerca de código Markdown** con el lenguaje correcto
  (```ts, ```tsx, ```py, ```js, ```sql, ```json, ```css, ```ps1, ```xml, ```text)
  reproduciendo **el código original SIN añadir números de línea ni modificar nada**.
- Inmediatamente después del bloque, una cabecera en negrita:

  `**Explicación de las líneas NN–MM:**`

  seguida de explicación general del bloque (qué hace y por qué), y después, para las
  líneas relevantes, un elemento por línea con su número exacto y su explicación:

  `- **Línea 45** (\`código de la línea\`): explicación...`
  `- **Línea 46**: explicación...`  (si el código de la línea ya es visible en el bloque)

- Reglas de cobertura:
  - Explica TODA línea no vacía y con significado técnico (imports, lógica, estado,
    efectos secundarios, estilos no triviales).
  - Las líneas vacías se omiten.
  - Los comentarios se analizan solo si aportan información técnica (docstrings,
    avisos de seguridad, TODO, FIXME).
  - Para archivos UI de React/React Native (pantallas y componentes): explica las
    líneas de lógica/estado/eventos/validaciones/llamadas a servicios en detalle;
    en JSX repetitivo explica el propósito de cada componente/etiqueta significativa
    sin explicar cada atributo trivial (pero no elimines información importante:
    permisos, datos sensibles, navegación, accesibilidad, acciones de pago).
  - Para archivos con más de 400 líneas: mantén explicación de bloque + notas por
    línea solo donde aporte; evita el ruido pero conserva la información esencial.
- Verifica números de línea con la herramienta `read` (que muestra números) antes de
  citarlos.

---

## 6. SINTAXIS MARKDOWN PERMITIDA EN LOS .md DE SALIDA (respetar estrictamente)

El generador DOCX procesará estos archivos automáticamente. **Usa SOLO**:

- Encabezados: `#`, `##`, `###`, `####` (con espacio tras `#`).
- Cercas de código: bloques con ``` y lenguaje. No anides cercas ni uses tilde `~~~`.
- Tablas: `| a | b |` con fila separadora `| --- | --- |`. Sin códigos ni saltos de
  línea dentro de las celdas. Una tabla por bloque seguido.
- Listas: `- ` (viñeta) y `1. ` (numerada). Subniveles con 2 o 4 espacios.
- Texto en negrita `**negrita**`, cursiva `*cursiva*`, código en línea con \`código\`.
- Citas: `> texto`.
- Regla horizontal: `---` en línea propia.
- Marcadores de párrafo al INICIO de una línea (se resaltan en color en el DOCX):
  `[ADVERTENCIA]`, `[RIESGO]`, `[CRÍTICO]`, `[ALTO]`, `[MEDIO]`, `[BAJO]`,
  `[INFORMATIVO]`, `[OBSERVACIÓN TÉCNICA]`, `[POTENCIALMENTE NO UTILIZADO]`,
  `[NOTA]`, `[NIVEL DE CERTEZA: ...]`, `[SECRETO OCULTO]`, `[RECOMENDACIÓN]`.
- **NO** uses HTML, imágenes, enlaces externos, tablas con celdas multilínea,
  ni emojis. Evita caracteres de control.

---

## 7. NOMENCLATURA DE ARCHIVOS DE SALIDA

- Un archivo `.md` por archivo analizado.
- Nombre: reemplaza `/`, `\`, espacios, `(`, `)`, `[`, `]`, `#` por `_` en la ruta
  relativa y antepón el módulo. Ejemplo para `app/(tabs)/settings.tsx`:
  `app_tabs_settings.tsx.md`.
- Guárdalos bajo la carpeta exacta que indique tu tarea, p. ej.:
  `C:\Claude_Code_trabajos\safealert\documentacion_generada\intermediate\modulos\<modulo>\`
- Usa la herramienta `write` (UTF-8) para crear cada `.md` completo.

---

## 8. INFORMACIÓN DE CONTEXTO DEL PROYECTO

- **SafeAlert**: aplicación móvil de alerta SOS por voz y ubicación. Stack:
  - App principal: Expo SDK 55 / React Native 0.83 / React 19 / TypeScript, con
    expo-router (carpetas `app/` y `src/`), Zustand, Firebase (Auth, Firestore,
    Functions, Storage), react-native-wakeword (activación por palabra), pago
    Mercado Pago (backend y Cloud Functions), Sentry, PWA web (`public/`).
  - `iphone/`: variante/app de rutas expo-router con temática iOS.
  - `backend/`: API Flask (Python) para administración/telemetría/ubicaciones +
    MySQL (SQL en `backend/sql/`), desplegada en Cloud Run (`cloud-run/`).
  - `functions/`: Cloud Functions de Firebase (TypeScript).
  - `admin/`: panel de administración web React + Vite + TypeScript.
  - `Publicar/`, `scripts/`: publicación a Play Store y utilidades (PowerShell).
- No analices `node_modules`, `android/`, `dist*`, `coverage`, `.git*`,
  `temp_voice_resources/` ni la carpeta `documentacion_generada/` (solo lectura de
  tus archivos fuente asignados).

---

## 9. FORMATO DEL RESUMEN FINAL (lo que debes devolver al terminar)

Termina tu trabajo devolviendo (mensaje final, texto plano) un resumen en este formato:

```
MODULO: <nombre>
ARCHIVOS_ANALIZADOS: <n>
ARCHIVOS_MD: <lista de rutas md escritas>
LINEAS_TOTALES: <suma de líneas de código leídas>
FUNCIONES_DOCUMENTADAS: <n>
CLASES_DOCUMENTADAS: <n>
ENDPOINTS_ENCONTRADOS: <lista o "ninguno">
VARIABLES_ENTORNO: <lista de nombres>
COLECCIONES_O_TABLAS: <lista o "ninguna">
HALLAZGOS_SEGURIDAD: <lista corta: severidad + descripción>
OBSERVACIONES_TECNICAS: <lista corta>
ESTADO: COMPLETADO o PARCIAL (explica qué falta)
```

No dupliques en el mensaje final el contenido de los `.md` (ya están en disco);
solo entrega el resumen estructurado anterior.
