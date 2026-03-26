/* ============================================================================
 * Archivo         : metro.config.js
 * Descripción     : Configuración de Metro Bundler para SafeAlert.
 *                   Obligatorio en Expo SDK 55 + React Native 0.83 para
 *                   resolución correcta de assets, source maps y módulos nativos.
 * Autor           : oafon
 * Fecha           : 2026-03-24
 * Versión         : 1.0.0
 * Lenguaje        : JavaScript
 * Uso             : Consumido automáticamente por Metro al ejecutar `expo start`.
 * ============================================================================ */

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Soporte para archivos de modelos de wakeword (.onnx) y recursos de audio
config.resolver.assetExts.push('onnx', 'ppn', 'tflite');

// Deshabilitar bundle multipart para compatibilidad con RN 0.83 BundleDownloader.
// Sin esto, Metro envía el bundle en formato multipart/mixed que el nuevo APK
// no puede parsear correctamente (ProtocolException: Expected [0-9a-fA-F]).
config.server = config.server || {};
const originalEnhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = originalEnhance ? originalEnhance(middleware, server) : middleware;
  return (req, res, next) => {
    // Forzar que Metro responda con bundle simple (no multipart)
    if (req.url && req.url.includes('.bundle')) {
      req.headers['accept'] = 'application/javascript';
    }
    return enhanced(req, res, next);
  };
};

module.exports = config;
