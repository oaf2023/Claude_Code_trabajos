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

// Cargar variables de entorno del .env de Expo en process.env
// Necesario para builds de Gradle (assembleDebug) donde Metro no carga el .env automáticamente
const path = require('path');
const fs = require('fs');
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        const val = trimmed.substring(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

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
