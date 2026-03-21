/* ============================================================================
* Archivo         : babel.config.js
* Descripción     : Configuración de Babel para SafeAlert con soporte explícito de Expo Router y Reanimated.
* Autor           : oafon
* Fecha           : 2026-03-20
* Versión         : 1.0.1
* Lenguaje        : JavaScript
* Uso             : Consumido por Expo/Metro durante la compilación de la app.
* ============================================================================ */

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
