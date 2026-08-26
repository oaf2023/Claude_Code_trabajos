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
