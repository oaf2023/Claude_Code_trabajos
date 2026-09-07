# Archivo: scripts/patch-import-meta.js

## Metadatos

| Campo | Valor |
| --- | --- |
| Ruta | scripts/patch-import-meta.js |
| Líneas totales | 176 |
| Lenguaje | JavaScript (Node.js, CommonJS) |
| Tamaño (bytes) | 8766 |
| Categoría | Script de build web (post-process del export estático de Expo) |
| Estado detectado | FUNCIONALIDAD EXISTENTE — integrado en el pipeline `web:build` |
| Nivel de certeza | Confirmado por código |

## Objetivo

Post-build de la salida web/PWA: parchea los bundles JS generados por `expo export` en `dist/_expo/static/js/web` para que la app React Native Web arranque en navegador. Sustituye usos de `import.meta` (que solo existen en módulos ES), inyecta polyfills (`__fbBatchedBridgeConfig`), reemplaza dependencias de módulos nativos RN (TurboModuleRegistry, `requireNativeModule`) por stubs, añade trazas de depuración de arranque y parchea `dist/index.html` con etiquetas PWA y registro del Service Worker (operación hoy redundante con `app/+html.tsx`).

Es el único patcher referenciado por `package.json` (línea 12: `web:build`: `expo export --platform web && node scripts/patch-import-meta.js`), por lo que se ejecuta en cada build web.

## Clasificación y estado

Etiqueta: `FUNCIONALIDAD EXISTENTE` (pipeline activo), con fragmentos de depuración `[PENDIENTE]`/ruido de trazas que deberían retirarse.

`[OBSERVACIÓN TÉCNICA]`: el archivo contiene parches muy específicos a la forma minificada de un bundle Metro concreto (módulos `782`, `484`, `486`, patrones `_e.requireNativeModule=...`, `function p(e,t,f,p)`, etc.). Cualquier cambio de dependencias o de versión de Metro/Expo puede invalidar las regex y dejar de parchear sin error (los `content.includes(...)` fallan silenciosamente). Cabecera `v7.0.0` (fecha 2026-08-26) evidencia iteraciones intensas de prueba y error durante el desarrollo de la PWA (ver `server.log`, `diag*.mjs`).

## Dependencias e importaciones

| Importación/Librería | Tipo | Dónde se usa | ¿Realmente usada? |
| --- | --- | --- | --- |
| `fs` (node:fs) | estándar | Lectura/escritura de bundles e HTML | Sí |
| `path` (node:path) | estándar | Resolución de rutas `dist` | Sí |

No usa dependencias externas (npm). Opera sobre el output de `expo export`.

## Componentes que dependen de este archivo

| Componente | Cómo lo referencia |
| --- | --- |
| package.json (línea 12) | `"web:build": "expo export --platform web && node scripts/patch-import-meta.js"` |
| scripts/deploy-ghpages.ps1 (línea 25) | Ejecuta `npm run web:build` antes de publicar (hereda el patcher) |
| dist/_expo/static/js/web/*.js | Archivos que modifica in-place |
| dist/index.html | HTML que modifica in-place |

`[NOTA]`: existen dos patchers hermanos no referenciados por npm: `scripts/patch-web-html.js` y `fix-pwa-build.js` (raíz), aparentemente intentos previos superados por este script. `[NIVEL DE CERTEZA: Confirmado por código]`.

## Variables globales y constantes

| Nombre | Valor | Tipo | Finalidad | Referencias |
| --- | --- | --- | --- | --- |
| JS_DIR | `path.resolve(__dirname, '..', 'dist', '_expo', 'static', 'js', 'web')` | string | Carpeta de bundles web | 15, 18–19, 23 |
| HTML_PATH | `path.resolve(__dirname, '..', 'dist', 'index.html')` | string | HTML exportado | 16, 135–136, 172 |
| jsFiles | `fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'))` | string[] | Lista de bundles | 23 |
| patchedJs | contador de bundles modificados | number | Estadística de salida | 24, 129 |
| BASE | `'/Claude_Code_trabajos/safealert'` | string | Base pública para tags PWA (HTML) | 141 |

Marcadores mágicos de guard en contenido (evitan re-parchear): `__SA_POLYFILL__` (línea 40), `__SA_TRACE__` (67), `__SA_TRACE_AR__` (85), `__SA_TRACE_RA__` (103), `__SA_TRACE_CR__` (117). Números de módulo Metro: `782`, `484`, `486`.

## Estructura (funciones / clases / tipos)

Sin funciones nombradas: es un script de nivel superior (main). Organización por bloques numerados en comentarios: 1 (import.meta), 2 (polyfill `__fbBatchedBridgeConfig`), 3 (módulo 782), 4 (`requireNativeModule` stub), 5 (traza `renderRootComponent`), 6 (traza `AppRegistry`), 8 (traza `renderApplication`), 9 (traza módulo 486 `createRoot`), y bloque final de parcheo HTML (PWA + SW).

## Análisis línea por línea

```js
/* ============================================================================

* Archivo         : scripts/patch-import-meta.js
* Descripción     : Post-build: parchea el bundle web para funcionar en browser.
* Autor           : oafon
* Fecha           : 2026-08-26
* Versión         : 7.0.0
* Lenguaje        : Node.js
* Uso             : node scripts/patch-import-meta.js
* ============================================================================ */

const fs = require('fs');
const path = require('path');

const JS_DIR = path.resolve(__dirname, '..', 'dist', '_expo', 'static', 'js', 'web');
const HTML_PATH = path.resolve(__dirname, '..', 'dist', 'index.html');

if (!fs.existsSync(JS_DIR)) {
  console.warn('[patch] Directorio JS no encontrado, saltando.');
  process.exit(0);
}

const jsFiles = fs.readdirSync(JS_DIR).filter(f => f.endsWith('.js'));
let patchedJs = 0;

for (const file of jsFiles) {
  const filePath = path.join(JS_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // 1. Reemplazar import.meta
  if (content.includes('import.meta')) {
    content = content.replace(/import\.meta\.env\?\.MODE/g, '"production"');
    content = content.replace(/import\.meta\.env\.MODE/g, '"production"');
    content = content.replace(/import\.meta/g, '({env:{MODE:"production"}})');
    changed = true;
  }

  // 2. Inyectar polyfill __fbBatchedBridgeConfig
  if ((file.startsWith('entry') || file.startsWith('index')) && !content.includes('__SA_POLYFILL__')) {
    content = 'var __SA_POLYFILL__=1;\n' + content;
    changed = true;
  }
```

**Explicación de las líneas 1–43:**

- **Líneas 1–10**: cabecera del proyecto. La versión 7.0.0 y la fecha 2026-08-26 indican numerosas iteraciones previas.
- **Líneas 12–13**: imports `fs` y `path`.
- **Línea 15**: `JS_DIR` = `dist/_expo/static/js/web` (ubicación de bundles del export web de Expo/Metro).
- **Línea 16**: `HTML_PATH` = `dist/index.html`.
- **Líneas 18–21**: si no existe la carpeta de bundles, avisa y sale con código 0 (no rompe el pipeline aunque el export haya cambiado de estructura). `[NOTA]`: al salir con 0 no se puede saber si el export produjo otra ruta.
- **Línea 23**: enumera archivos `.js` del directorio.
- **Línea 24**: contador de bundles parcheados.
- **Línea 26**: itera cada bundle.
- **Líneas 28–29**: lee el contenido completo en memoria y prepara flag `changed`.
- **Líneas 32–37** (bloque 1): si el bundle contiene `import.meta`, sustituye:
  - `import.meta.env?.MODE` y `import.meta.env.MODE` por el literal `"production"` (reglas 33–34), y
  - cualquier `import.meta` restante por el objeto `({env:{MODE:"production"}})` (regla 35).
  Reemplaza a ciegas sobre texto minificado: si un bundle usara `import.meta.url` u otras propiedades, el objeto sustituido no las provee (se rompería en runtime). `[OBSERVACIÓN TÉCNICA]`.
- **Líneas 40–43** (bloque 2): en los bundles llamados `entry*` o `index*` (y si no contiene `__SA_POLYFILL__`), antepone `var __SA_POLYFILL__=1;` al contenido. El nombre sugiere que el polyfill real se inyecta en `app/+html.tsx` (`window.__fbBatchedBridgeConfig={remoteModuleConfig:[]}`), y esta marca evita dobles inyecciones.

```js
  // 3. Patchear módulo 782 para no depender de TurboModuleRegistry en module 484
  if (file.startsWith('index') && content.includes('},782,[484])')) {
    content = content.replace(
      'var t=r(d[0]).TurboModuleRegistry.get(\'RNSModule\')',
      'var t=(function(){try{return r(d[0]).TurboModuleRegistry.get(\'RNSModule\')}catch(e){return{getConstants:function(){return{}},addListener:function(){return{remove:function(){}}},removeListeners:function(){}}}})()'
    );
    changed = true;
    console.log('[patch] Module 782 patched');
  }

  // 4. Patchear requireNativeModule: reemplazar throw con stub
  if (file.startsWith('index')) {
    const origThrow = /_e\.requireNativeModule=function\(e\)\{const o=s\(e\);if\(!o\)throw new Error\(`Cannot find native module '\$\{e\}'`\);return o\}/;
    if (origThrow.test(content)) {
      content = content.replace(origThrow,
        '_e.requireNativeModule=function(e){var o=s(e);if(!o){var stub={getConstants:function(){return{Dimensions:{window:{width:typeof window!=="undefined"?window.innerWidth:375,height:typeof window!=="undefined"?window.innerHeight:667,scale:typeof window!=="undefined"?window.devicePixelRatio||1:1,fontScale:1},screen:{width:typeof screen!=="undefined"?screen.width:375,height:typeof screen!=="undefined"?screen.height:667,scale:typeof window!=="undefined"?window.devicePixelRatio||1:1,fontScale:1}}}},addListener:function(){return{remove:function(){}}},removeListeners:function(){},getName:function(){return e},getViewManagerConfig:function(n){return{Commands:{},Constants:{},NativeProps:{},directEventTypes:{},uiViewClassName:n}},getConstantsForViewManager:function(){return{}}};stub.__esModule=false;stub.default=stub;return stub;}return o}'
      );
      changed = true;
      console.log('[patch] requireNativeModule stub patched');
    }
```

**Explicación de las líneas 45–64:**

- **Líneas 45–53** (bloque 3): en bundles `index*`, si aparece la firma de registro `},782,[484])` (módulo 782 del bundle requiriendo el 484), reemplaza la llamada `var t=r(d[0]).TurboModuleRegistry.get('RNSModule')` por una IIFE con try/catch que, si el módulo nativo no existe, devuelve un stub con `getConstants`, `addListener` y `removeListeners` vacíos. Evita el crash por `TurboModuleRegistry` ausente en web. `[OBSERVACIÓN TÉCNICA]`: el string de reemplazo codifica la forma minificada exacta; frágil ante cambios de minificación (espaciado, renombrado de `r`/`d`).
- **Líneas 55–64** (bloque 4): reemplaza la función `_e.requireNativeModule` minificada de React Native Web para que, cuando un módulo nativo no esté registrado, en lugar de lanzar `throw new Error("Cannot find native module ...")`, devuelva un stub bastante completo: `getConstants` con `Dimensions` de ventana reales (usa `window.innerWidth/innerHeight/devicePixelRatio` o valores por defecto 375x667), `addListener`, `removeListeners`, `getName`, `getViewManagerConfig` y `getConstantsForViewManager`. Además `stub.__esModule=false; stub.default=stub;` normaliza la interoperabilidad de módulos. Es el parche más invasivo: enmascara la ausencia de módulos nativos y puede ocultar errores reales de configuración web. `[OBSERVACIÓN TÉCNICA]`.

```js
    // 5. Trace renderRootComponent
    if (!content.includes('__SA_TRACE__') && content.includes('_e.renderRootComponent=function')) {
      content = content.replace(
        'Object.defineProperty(_e,"__esModule",{value:!0}),_e.renderRootComponent=function(e){',
        'Object.defineProperty(_e,"__esModule",{value:!0});var __SA_TRACE__=1;_e.renderRootComponent=function(e){console.log("[TRACE] renderRootComponent called");'
      );
      content = content.replace(
        'u.startTransition(()=>{(0,c.registerRootComponent)(e)})',
        '(0,c.registerRootComponent)(e)'
      );
      content = content.replace(
        'f.hideAsync();',
        'console.log("[TRACE] renderRootComponent CATCH block");f.hideAsync();'
      );
      changed = true;
      console.log('[patch] renderRootComponent trace added');
    }

    // 6. Trace AppRegistry
    if (!content.includes('__SA_TRACE_AR__') && content.includes('static registerComponent(t,n)')) {
      content = content.replace(
        'static registerComponent(t,n){',
        'static registerComponent(t,n){console.log("[TRACE] AppRegistry.registerComponent:",t);'
      );
      content = content.replace(
        'static runApplication(t,e){',
        'static runApplication(t,e){console.log("[TRACE] AppRegistry.runApplication:",t,"rootTag:",e&&e.rootTag);try{'
      );
      content = content.replace(
        'l[t].run(e)}static',
        'l[t].run(e)}catch(runErr){console.error("[TRACE] runApplication FAILED:",runErr&&runErr.message,runErr&&runErr.stack&&runErr.stack.substring(0,500))}console.log("[TRACE] runApplication DONE")}static'
      );
      changed = true;
      console.log('[patch] AppRegistry trace added');
    }
```

**Explicación de las líneas 66–100 (bloques de traza 5 y 6):**

- **Líneas 66–82** (bloque 5): si existe la asignación minificada `_e.renderRootComponent=function`, la reemplaza añadiendo `console.log("[TRACE] renderRootComponent called")` y un guard `__SA_TRACE__`. Además elimina el `startTransition` alrededor de `registerRootComponent` (líneas 72–75), que probablemente causaba arranque asíncrono problemático, y agrega una traza en el bloque catch (`f.hideAsync()` línea 76–79). Son instrumentaciones de depuración del arranque (época de los `diag*.mjs`).
- **Líneas 84–100** (bloque 6): inyecta `console.log` en `AppRegistry.registerComponent` y `runApplication`, envuelve la ejecución en try/catch con `console.error` del error y stack (primeros 500 caracteres) y traza de fin. Guard `__SA_TRACE_AR__`.
- `[RIESGO]` Bajomedio: estas trazas quedan **activadas en el bundle de producción**; aunque no exponen datos personales, añaden ruido y superficies de log. Deberían eliminarse en una versión limpia del patcher (guard tras diagnóstico). `[NIVEL DE CERTEZA: Confirmado por código]`.

```js
    // 8. Trace renderApplication
    if (!content.includes('__SA_TRACE_RA__') && content.includes('function p(e,t,f,p){') && content.includes('Expect to have a valid rootTag')) {
      content = content.replace(
        'function p(e,t,f,p){var s=p.hydrate,_=p.initialProps,y=p.rootTag',
        'var __SA_TRACE_RA__=1;function p(e,t,f,p){console.log("[TRACE] renderApplication called, rootTag:",p.rootTag&&p.rootTag.id,"hydrate:",p.hydrate);var s=p.hydrate,_=p.initialProps,y=p.rootTag'
      );
      content = content.replace(
        'return(0,l.default)(y,\'Expect to have a valid rootTag, instead got \',y),E(',
        'console.log("[TRACE] renderApplication before render, rootTag:",y,"valid:",!!y);return(0,l.default)(y,\'Expect to have a valid rootTag, instead got \',y),E('
      );
      changed = true;
      console.log('[patch] renderApplication trace added');
    }

    // 9. Trace module 486 (createRoot render)
    if (!content.includes('__SA_TRACE_CR__') && content.includes('function u(u,o){(0,n.createSheet)(o);var c=(0,t.createRoot)(o);return c.render(u),c}')) {
      content = content.replace(
        'function u(u,o){(0,n.createSheet)(o);var c=(0,t.createRoot)(o);return c.render(u),c}',
        'var __SA_TRACE_CR__=1;function u(u,o){console.log("[TRACE] createRoot render called, tag:",o&&o.id);(0,n.createSheet)(o);var c=(0,t.createRoot)(o,{onCaughtError:function(err,errInfo){console.error("[TRACE] React CAUGHT:",err&&err.message,errInfo&&errInfo.componentStack&&errInfo.componentStack.substring(0,300))},onUncaughtError:function(err,errInfo){console.error("[TRACE] React UNCAUGHT:",err&&err.message,errInfo&&errInfo.componentStack&&errInfo.componentStack.substring(0,300))},onRecoverableError:function(err){console.error("[TRACE] React RECOVERABLE:",err&&err.message)}});console.log("[TRACE] createRoot OK, calling render...");c.render(u);console.log("[TRACE] c.render returned");return c}'
      );
      changed = true;
      console.log('[patch] module 486 (createRoot) trace added');
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    patchedJs++;
    console.log('[patch] JS parcheado: ' + file);
  }
}
```

**Explicación de las líneas 102–132:**

- **Líneas 102–114** (bloque 8): localiza la función minificada `function p(e,t,f,p)` de `renderApplication` (detectada por el texto `Expect to have a valid rootTag`) e inyecta trazas antes y durante la validación del rootTag. Guard `__SA_TRACE_RA__`.
- **Líneas 116–124** (bloque 9): parchea el "módulo 486" (función `u(u,o)` que hace `createSheet` + `createRoot` + `render`), añadiendo trazas y, notablemente, pasando a `ReactDOM.createRoot` los callbacks `onCaughtError`, `onUncaughtError`, `onRecoverableError` (nuevos en React 19) para capturar errores de render. Guard `__SA_TRACE_CR__`. Es una mejora real de observabilidad además de la traza.
- **Líneas 126–132**: si `changed`, escribe el bundle de vuelta (`writeFileSync` utf8), incrementa el contador y loguea el archivo parcheado. Escritura in-place sobre `dist`.

```js
// 5. Patchear index.html: PWA tags + SW registration
if (fs.existsSync(HTML_PATH)) {
  let html = fs.readFileSync(HTML_PATH, 'utf8');

  // Quitar defer de script tags
  html = html.replace(/ defer>/g, '>');

  const BASE = '/Claude_Code_trabajos/safealert';

  // PWA meta tags para iOS
  const pwaTags = [
    `<link rel="manifest" href="${BASE}/manifest.json">`,
    `<link rel="apple-touch-icon" href="${BASE}/icons/apple-touch-icon.png">`,
    `<meta name="apple-mobile-web-app-capable" content="yes">`,
    `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">`,
    `<meta name="apple-mobile-web-app-title" content="SafeAlert">`,
  ].join('\n');

  // Service Worker registration
  const swScript = `<script>
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('${BASE}/sw.js')
      .then(function(r){console.log('[SW] Registered:',r.scope)})
      .catch(function(e){console.warn('[SW] Failed:',e)});
  });
}
</script>`;

  // Inyectar antes de </head>
  if (!html.includes('rel="manifest"')) {
    html = html.replace('</head>', pwaTags + '\n</head>');
  }
  // Inyectar antes de </body>
  if (!html.includes('serviceWorker')) {
    html = html.replace('</body>', swScript + '\n</body>');
  }

  fs.writeFileSync(HTML_PATH, html, 'utf8');
  console.log('[patch] index.html parcheado (PWA + SW)');
}

console.log('[patch] ' + patchedJs + ' archivo(s) JS parcheado(s).');
```

**Explicación de las líneas 134–176:**

- **Línea 135**: solo parchea HTML si existe.
- **Línea 139**: elimina el atributo `defer` de todas las etiquetas de script (`/ defer>/g` → `>`), para que los bundles se ejecuten de inmediato (el export de Expo los emite con `defer`). `[NOTA]` esta transformación global puede afectar scripts inline o de terceros.
- **Línea 141**: `BASE = '/Claude_Code_trabajos/safealert'`, mismo esquema legado de subdirectorio que `public/manifest.json` y `public/sw.js`.
- **Líneas 144–150**: `pwaTags` duplican lo que ya emite `app/+html.tsx` (manifest + apple-touch-icon + metas iOS).
- **Líneas 153–161**: `swScript` registra el SW con la base legada (en vez de la raíz usada por `+html.tsx`).
- **Líneas 164–166**: guard `!html.includes('rel="manifest"')`: como `+html.tsx` ya insertó el manifest, este bloque no se ejecuta en la práctica (no duplica tags).
- **Líneas 168–170**: guard `!html.includes('serviceWorker')`: como `+html.tsx` ya inserta el registro, tampoco se ejecuta.
- **Línea 172**: escribe el HTML de vuelta.
- **Línea 176**: resumen final de archivos JS parcheados.

`[OBSERVACIÓN TÉCNICA]`: el bloque HTML (líneas 134–174) quedó funcionalmente muerto por los guards, dado que `+html.tsx` asume esas responsabilidades con la base correcta `/`. Su única acción efectiva hoy es la línea 139 (quitar `defer`), que sí modifica el HTML. `[NIVEL DE CERTEZA: Confirmado por código]`.

## Fichas de funciones y métodos

Sin funciones nombradas (script de nivel superior). La lógica se descompone en los bloques numerados descritos arriba. Se documenta como unidad el bucle principal de parcheo de bundles (líneas 26–132) y el bloque de parcheo HTML (líneas 134–174), ambos ya analizados línea por línea.

## Clases / interfaces / tipos

No aplica (JavaScript plano CommonJS sin tipado).

## Observaciones técnicas

- `[OBSERVACIÓN TÉCNICA]` (líneas 32–37, 46–64): reemplazos sobre texto minificado con regex/strings exactas; frágil ante cambios de Metro/Expo y renombrado de variables. Si un parche deja de matchear no hay error (continúa con el siguiente bloque).
- `[OBSERVACIÓN TÉCNICA]` (líneas 66–124): trazas `[TRACE]` y `[SA]` quedan habilitadas en producción; fueron útiles durante el diagnóstico PWA (ver `diag*.mjs`/`server.log`) pero deberían retirarse o condicionarse.
- `[OBSERVACIÓN TÉCNICA]` (línea 141 y bloque HTML): `BASE` legada `/Claude_Code_trabajos/safealert`, hoy redundante por los guards (el HTML real proviene de `+html.tsx` con base `/`).
- `[POTENCIALMENTE NO UTILIZADO]`: el stub de `requireNativeModule` (bloque 4) aplica a cualquier módulo no encontrado; puede estar enmascarando carencias reales del export web (p. ej. módulos nativos usados por la app que no tienen implementación web). `[NIVEL DE CERTEZA: Inferido]`.

## Seguridad

- `[INFORMATIVO]` (línea 141): revela nombre de carpeta/repositorio local del desarrollador en el artefacto de build (string en el script, aunque no llegue al HTML final por los guards).
- `[BAJO]`: el patcher modifica bundles minificados in-place en `dist`; si el proceso se ejecutara sobre un `dist` de producción ya firmado/verificado, altera la integridad del artefacto (riesgo operacional, no de confidencialidad).
- `[INFORMATIVO]`: no procesa secretos ni variables de entorno; los valores inyectados son literales (`"production"`), no datos sensibles.
- No se detectan autenticación, entrada de usuario ni logging de datos personales.

## Riesgos y recomendaciones (sin modificar código)

- `[RIESGO]` Medio: fragilidad de parches por regex contra bundles minificados; un upgrade de Expo/Metro puede "romper la web" silenciosamente (sin fallo de build) y requerir reajustes manuales de este script.
- `[RIESGO]` Medio: trazas de depuración en producción (ruido y posible fuga de nombres de módulos internos).
- `[RECOMENDACIÓN]`: tras confirmar que la PWA arranca sin los parches 5/6/8/9 (traza), retirarlos del script; conservar los parches funcionales (1–4) con tests de humo post-build (p. ej. verificar que el HTML final no contiene `import.meta` ni lanza error de registro).
- `[RECOMENDACIÓN]`: centralizar la base URL en una sola constante derivada de `app.json`/entorno y eliminarla del HTML patcher (bloque ya muerto).
- `[RECOMENDACIÓN]`: documentar en el script qué versión de Expo/Metro valida cada patrón minificado (hoy solo consta la versión del propio script, v7.0.0).
