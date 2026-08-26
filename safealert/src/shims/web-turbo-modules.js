/* ============================================================================
 * Archivo         : src/shims/web-turbo-modules.js
 * Descripción     : Shim completo para TurboModuleRegistry en web.
 *                   Devuelve stubs con métodos comunes para todos los módulos,
 *                   incluyendo getConstants con Dimensions, addListener, etc.
 * Autor           : oafon
 * Fecha           : 2026-08-26
 * Versión         : 6.0.0
 * Lenguaje        : JavaScript
 * Uso             : Resuelto por metro.config.js en plataforma web.
 * ============================================================================ */

function createStub(name) {
  var stub = {
    getConstants: function() {
      return {
        Dimensions: {
          window: {
            width: typeof window !== 'undefined' ? window.innerWidth : 375,
            height: typeof window !== 'undefined' ? window.innerHeight : 667,
            scale: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
            fontScale: 1,
          },
          screen: {
            width: typeof screen !== 'undefined' ? screen.width : 375,
            height: typeof screen !== 'undefined' ? screen.height : 667,
            scale: typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
            fontScale: 1,
          },
        },
        isTesting: false,
        isPlaying: false,
        reactNativeVersion: { major: 0, minor: 83, patch: 0 },
        ViewManagerNames: [],
        NativeModulesConstants: {},
      };
    },
    addListener: function() { return { remove: function() {} }; },
    removeListeners: function() {},
    getName: function() { return name; },
    getViewManagerConfig: function(viewName) {
      return {
        Commands: {},
        Constants: {},
        NativeProps: {},
        directEventTypes: {},
        uiViewClassName: viewName,
      };
    },
    getConstantsForViewManager: function(viewName) {
      return {};
    },
  };

  return new Proxy(stub, {
    get: function(target, prop) {
      if (prop === 'then') return undefined;
      if (prop === '__esModule') return false;
      if (prop === 'default') return undefined;
      if (prop in target) return target[prop];
      if (typeof prop === 'symbol') return undefined;
      return function() { return {}; };
    },
    apply: function() { return {}; },
    construct: function() { return {}; },
  });
}

var TurboModuleRegistry = {
  get: function(name) { return createStub(name); },
  getEnforcing: function(name) { return createStub(name); },
  register: function(config) {},
};

module.exports = TurboModuleRegistry;
module.exports.default = TurboModuleRegistry;
module.exports.__esModule = true;
