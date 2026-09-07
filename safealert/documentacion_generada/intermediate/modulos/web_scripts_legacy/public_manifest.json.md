# Archivo: public/manifest.json

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | public/manifest.json |
| Líneas totales | 42 |
| Lenguaje | JSON (Web App Manifest PWA) |
| Tamaño (bytes) | 1263 |
| Categoría | Salida web PWA — manifiesto de instalación |
| Estado detectado | CÓDIGO LEGADO con incoherencias de base URL |
| Nivel de certeza | Confirmado por código |

## Objetivo

Manifiesto de aplicación web (Web App Manifest) que define la identidad instalable de la PWA de SafeAlert: nombre, descripción, idioma, URLs de inicio/alcance, modo de visualización, colores, iconos, categorías y accesos directos (shortcuts). Lo consumen Chrome/Edge (instalación A2HS), Android y parcialmente iOS (junto con las meta etiquetas de `app/+html.tsx`). Es copiado a `dist/` por `expo export --platform web` desde la carpeta `public/` de Expo.

## Clasificación y estado

Etiqueta: `CÓDIGO LEGADO` (referido a su esquema de rutas) + salida activa de la PWA.

El archivo existe y se publica en el build web, pero todas sus rutas usan el prefijo fijo `/Claude_Code_trabajos/safealert/`, derivado de un repositorio GitHub Pages local llamado `Claude_Code_trabajos` bajo la cuenta `oaf2023` (ver `scripts/deploy-ghpages.ps1`). En cambio, la configuración vigente del proyecto (`app.json`, líneas 107–112: `scope: "/"`, `startUrl: "/"`, `experiments.baseUrl: "/"`) y el HTML raíz `app/+html.tsx` (línea 18: `BASE_URL = "/"`) apuntan a servir la PWA en la raíz del dominio. `[OBSERVACIÓN TÉCNICA]`: existe una doble estrategia de despliegue (subdirectorio GitHub Pages vs. raíz) sin conciliar; según dónde se sirva el build, este manifiesto deja de funcionar (start_url/scope/icons resueltos contra un path que no existe). `[NIVEL DE CERTEZA: Confirmado por código]` (comparando este archivo con `app.json` y `app/+html.tsx`).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| Ninguna (archivo declarativo JSON) | — | — | — |

Sin dependencias de código. Depende de la existencia de los iconos en `public/icons/` (confirmado: existen `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`).

## Componentes que dependen de este archivo

| Componente | Cómo lo referencia |
| --- | --- |
| app/+html.tsx (línea 43) | Inyecta `<link rel="manifest" href="/manifest.json">` (con base `/`) en el HTML exportado |
| public/sw.js (línea 17) | Precachea `${BASE_URL}/manifest.json` |
| scripts/patch-import-meta.js (líneas 144–146) | Intenta inyectar `<link rel="manifest" href="${BASE}/manifest.json">` con `BASE = '/Claude_Code_trabajos/safealert'`, pero el guard de la línea 164 (`!html.includes('rel="manifest"')`) evita la duplicación porque `+html.tsx` ya lo agregó |
| Navegadores (A2HS) | Consumen `manifest.json` para ofrecer "Instalar aplicación" |

## Variables globales y constantes

No hay variables de código. Valores declarativos relevantes:

| Nombre del campo | Valor | Tipo | Finalidad |
| --- | --- | --- | --- |
| start_url | `/Claude_Code_trabajos/safealert/` | string | Página inicial al abrir la PWA instalada |
| scope | `/Claude_Code_trabajos/safealert/` | string | Alcance de URLs que controla la PWA |
| display | standalone | string | Abre sin UI del navegador |
| background_color / theme_color | `#F9FAFB` / `#DC2626` | string | Colores de pantalla de inicio y barra |
| icons[0..2].src | `/Claude_Code_trabajos/safealert/icons/*.png` | string | Iconos 192/512/180 |
| shortcuts[0].url | `/Claude_Code_trabajos/safealert/` | string | Acceso directo "Enviar alerta" |

## Estructura (funciones / clases / tipos)

Sin funciones ni clases (JSON declarativo). Estructura de nodos: `root` → `icons[]` (3), `shortcuts[]` (1), más campos escalares.

## Análisis línea por línea

```json
{
  "name": "SafeAlert — Alerta SOS por voz",
  "short_name": "SafeAlert",
  "description": "SafeAlert — Alerta SOS por voz y ubicación para tus contactos de confianza.",
  "lang": "es",
  "start_url": "/Claude_Code_trabajos/safealert/",
  "scope": "/Claude_Code_trabajos/safealert/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#F9FAFB",
  "theme_color": "#DC2626",
  "icons": [
    {
      "src": "/Claude_Code_trabajos/safealert/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/Claude_Code_trabajos/safealert/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/Claude_Code_trabajos/safealert/icons/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "categories": ["safety", "utilities"],
  "shortcuts": [
    {
      "name": "Enviar alerta",
      "short_name": "Alerta",
      "description": "Enviar alerta SOS a tus contactos",
      "url": "/Claude_Code_trabajos/safealert/",
      "icons": [{ "src": "/Claude_Code_trabajos/safealert/icons/icon-192.png", "sizes": "192x192" }]
    }
  ]
}
```

**Explicación de las líneas 1–42:** documento JSON completo del manifiesto.

- **Línea 2** (`name`): nombre largo mostrado en la instalación. Incluye "—" (raya), válido en JSON.
- **Línea 3** (`short_name`): nombre corto bajo el icono (limitado a 12 caracteres recomendados; "SafeAlert" cumple).
- **Línea 4** (`description`): descripción usada por la tienda/instalador en algunos navegadores.
- **Línea 5** (`lang`): idioma principal "es".
- **Línea 6** (`start_url`): ruta inicial `/Claude_Code_trabajos/safealert/`. Rutas absolutas hardcodeadas con el nombre de la carpeta de trabajo del desarrollador: cualquier despliegue en otra ruta rompe la apertura. `[OBSERVACIÓN TÉCNICA]` contradice `startUrl: "/"` de `app.json` (línea 108).
- **Línea 7** (`scope`): define el conjunto de URLs que la PWA controla una vez instalada.
- **Línea 8** (`display: standalone`): la app se abre en ventana propia sin chrome del navegador.
- **Línea 9** (`orientation: portrait`): fija orientación vertical (coherente con app móvil).
- **Línea 10** (`background_color`): color de la pantalla de splash nativa al lanzar.
- **Línea 11** (`theme_color`): color de la barra del navegador; coincide con el `theme-color` de `app/+html.tsx` y el rojo de marca `#DC2626`.
- **Líneas 12–31** (`icons`): tres iconos PNG. `purpose: "any maskable"` en 192/512 permite el recorte enmascarado del launcher Android; el de 180 es para iOS (aunque iOS moderno prioriza `apple-touch-icon`). Iconos efectivamente presentes en `public/icons/`.
- **Línea 32** (`categories`): categorías de la Play Store de Chrome ("safety", "utilities").
- **Líneas 33–41** (`shortcuts`): acceso directo contextual "Enviar alerta" que abre la misma URL base (no una ruta específica de alerta; simplificación funcional).
- **Línea 42**: cierre del objeto raíz. JSON válido (parseado sin errores de sintaxis).

## Fichas de funciones y métodos

No aplica (archivo sin lógica).

## Clases / interfaces / tipos

No aplica. El "tipo" implícito es `WebAppManifest` (estándar W3C).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 6–7, 14, 20, 26, 38–39): rutas `start_url`, `scope` e iconos con prefijo `/Claude_Code_trabajos/safealert`, mientras `app.json` declara `baseUrl: "/"` y `+html.tsx` usa `BASE_URL = "/"`. Impacto: si el build se sirve en la raíz (config vigente), el manifest apunta a `/Claude_Code_trabajos/safealert/...`, que devolverá 404; la PWA instalada abriría una URL inexistente. `[NIVEL DE CERTEZA: Confirmado por código]`.
- `[POTENCIALMENTE NO UTILIZADO]`: el campo `description`, `categories` y `shortcuts` son ignorados por iOS Safari (solo relevantes en Chrome/Android).
- `[NOTA]`: no se declara `id` en el manifest (recomendado por el estándar para identificar la PWA ante cambios de start_url); su ausencia puede provocar reinstalaciones al cambiar rutas.
- `[NOTA]`: no hay campo `display_override` ni `prefer_related_applications`; no se detecta problema, es configuración opcional.

## Seguridad

- `[INFORMATIVO]` (líneas 6, 7, 14…): el prefijo `/Claude_Code_trabajos/safealert/` expone en el artefacto público el nombre de la carpeta/repositorio local del desarrollador y su cuenta GitHub (`oaf2023`), información de entorno que no aporta valor funcional.
- `[INFORMATIVO]`: no se incluyen datos de usuario ni credenciales; archivo estático público por diseño.
- No se detectan autenticación, validación, CORS ni logging en este archivo (no aplica).

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Funcional alto: PWA instalada rota si el build se sirve bajo la base actual `/`. `[RECOMENDACIÓN]`: alinear `start_url`/`scope`/iconos con `experiments.baseUrl` (hoy `/`) o parametrizar el manifest en el build en lugar de hardcodear el subdirectorio.
- `[RIESGO]` Medio: si se migra el despliegue de subdirectorio a raíz (o viceversa), los usuarios ya instalados conservan el scope antiguo; conviene declarar `id` estable.
- `[RECOMENDACIÓN]`: no alterar el archivo en esta auditoría; documentar la decisión de despliegue (subdirectorio vs. raíz) en un único lugar y derivar el manifest desde allí.
