/* ============================================================================
* Archivo         : babel.config.js
* Descripcion     : Configuracion Babel del cliente Apple reutilizando el stack Expo Router.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : JavaScript
* Uso             : Consumido por Expo/Metro al iniciar safealert/iphone.
* ============================================================================ */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};