# 1. Sobre este documento

## 1.1. Propósito

Este documento constituye la **documentación técnica, funcional y operativa
integral** del proyecto **SafeAlert**, generada a partir del análisis del código
fuente real del repositorio. Permite a una persona técnica comprender, mantener,
auditar, modificar, desplegar y utilizar la aplicación sin haberla visto antes.

El documento se estructura como un **documento maestro** (el presente archivo)
más **anexos por módulo** en archivos `.docx` independientes:

| Anexo | Contenido | Archivo |
| --- | --- | --- |
| Anexo A | App móvil principal SafeAlert (Expo/React Native): configuración, tipos, servicios, componentes, pantallas, stores y utilidades | `anexos/ANEXO_A_APP_MOVIL_SAFEALERT.docx` |
| Anexo B | Aplicación `iphone/` (variante expo-router) | `anexos/ANEXO_B_APP_IPHONE.docx` |
| Anexo C | Backend Flask y despliegue Cloud Run (incluye diccionario de datos SQL) | `anexos/ANEXO_C_BACKEND_FLASK_CLOUD_RUN.docx` |
| Anexo D | Cloud Functions de Firebase (TypeScript) | `anexos/ANEXO_D_CLOUD_FUNCTIONS_FIREBASE.docx` |
| Anexo E | Panel de administración web (React + Vite) | `anexos/ANEXO_E_PANEL_ADMIN_WEB.docx` |
| Anexo F | Configuración raíz, scripts, web PWA y publicación a Play Store | `anexos/ANEXO_F_CONFIG_SCRIPTS_WEB_PUBLICACION.docx` |
| Anexo G | Documentación existente del proyecto (evaluación y coherencia) | `anexos/ANEXO_G_DOCUMENTACION_EXISTENTE.docx` |

> El anexo más extenso y detallado es el Anexo A, que contiene el análisis
> línea por línea del núcleo de la aplicación móvil.

## 1.2. Metodología de la auditoría

La auditoría se ejecutó en fases, siguiendo el procedimiento maestro definido
para este tipo de trabajos:

1. **Inventario**: recorrido recursivo del repositorio y clasificación de
   archivos (código, configuración, documentación, recursos, generados,
   dependencias, sensibles). Los directorios de dependencias o generados
   (`node_modules`, `android/`, `dist*`, `coverage`, `.git*`, `lib`,
   `temp_voice_resources/`, artefactos binarios, volcados de diagnóstico) se
   inventariaron con su número de archivos pero se **excluyeron del análisis
   línea por línea** (sección 1.3).
2. **Reconocimiento**: lectura de manifiestos y documentación existente para
   determinar arquitectura, tecnologías y flujos.
3. **Análisis profundo**: análisis archivo por archivo del código fuente
   relevante (objetivo, dependencias, importaciones, funciones, clases,
   constantes, variables y explicación línea por línea), por módulos.
4. **Referencias cruzadas**: verificación de usos reales mediante búsquedas en
   el código para distinguir funcionalidad existente, parcial, legada o
   aparentemente no utilizada.
5. **Síntesis**: matrices (archivos, dependencias, endpoints, base de datos,
   variables de entorno), seguridad, deuda técnica, riesgos y mejoras.
6. **Generación de documentos** `.docx` (maestro + anexos) y verificación final.

### Niveles de certeza utilizados

- **Confirmado por código**: verificado directamente en el código fuente.
- **Altamente probable**: inferencia fuerte a partir del contexto.
- **Inferido**: conclusión razonada sin verificación completa.
- **No determinado**: no se pudo establecer.

### Marcadores utilizados

- `[OBSERVACIÓN TÉCNICA]`: hallazgo dudoso o inconsistencia.
- `[POTENCIALMENTE NO UTILIZADO]`: sin referencias encontradas (no debe
  eliminarse sin verificación adicional).
- `[CRÍTICO]` / `[ALTO]` / `[MEDIO]` / `[BAJO]` / `[INFORMATIVO]`: severidad de
  hallazgos de seguridad.
- `[SECRETO OCULTO]`: valor sensible no reproducido por seguridad.

## 1.3. Archivos excluidos del análisis línea por línea

| Directorio / elemento | Archivos | Motivo de exclusión |
| --- | ---: | --- |
| `node_modules/` (raíz, admin, functions) | ~108.777 | Dependencias npm de terceros |
| `android/` (proyecto nativo) | 3.919 | Proyecto nativo generado por `expo prebuild` + artefactos CMake/Gradle (`[NIVEL DE CERTEZA: Altamente probable]`; regenerable) |
| `temp_voice_resources/` | 667 | Ejemplos de terceros de la librería react-native-wakeword |
| `dist/`, `dist-android-check/`, `coverage/` | 84 | Salidas de compilación/cobertura |
| `.git/`, `.git_bak/`, `.expo/` | ~45 | Metadatos y caché |
| `bugreport-Pixel_8-…/` | 3 | Volcado de diagnóstico de un dispositivo |
| `Publicar/artefactos/` | — | Binarios de publicación (.aab/.apk) |
| `documentacion_generada/` | — | Salida de esta misma auditoría |

Los archivos dentro de `android/app/src/main/java` son en su mayoría plantillas
estándar de React Native; las personalizaciones reales del proyecto nativo se
realizan mediante los **config plugins** de Expo (`plugins/withDaVoiceMaven.js`
y `plugins/withManifestConflictFix.js`), analizados en el Anexo F.

## 1.4. Convenciones de lectura

- Cada anexo reproduce **bloques del código original** seguidos de su
  explicación, con referencias a números de línea verificados.
- El código aparece en fuente monoespaciada (Consolas) sobre fondo claro.
- Los textos con marcadores de color señalan advertencias, riesgos,
  observaciones técnicas y niveles de certeza.
- La cobertura de archivos relevantes es del 100 % (todo archivo relevante
  tiene su capítulo en el anexo correspondiente y su fila en el inventario del
  Anexo del documento maestro, capítulo 8).
