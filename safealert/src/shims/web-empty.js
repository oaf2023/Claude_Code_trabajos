/* ============================================================================
* Archivo         : web-empty.js
* Descripción     : Módulo shim Proxy para módulos nativos sin soporte web.
*                   Metro Bundler resuelve estos módulos cuando el target es web,
*                   evitando crashes por imports nativos (react-native-permissions,
*                   react-native-device-info, react-native-wakeword).
* Autor           : oafon
* Fecha           : 2026-08-26
* Versión         : 1.0.0
* Lenguaje        : JavaScript
* Uso             : Resuelto automáticamente por metro.config.js en modo web.
* ============================================================================ */

const handler = {
  get(target, prop) {
    if (prop === '__esModule') return false;
    if (prop === 'default') return target;
    if (typeof prop === 'symbol') return undefined;

    return new Proxy(() => {}, {
      get(_, innerProp) {
        if (innerProp === 'then') return undefined;
        if (innerProp === '__esModule') return false;
        if (innerProp === 'default') return undefined;
        return () => {};
      },
      apply() {
        return {};
      },
      construct() {
        return {};
      },
    });
  },
};

module.exports = new Proxy({}, handler);
