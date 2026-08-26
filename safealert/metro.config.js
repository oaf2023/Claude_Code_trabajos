/* ============================================================================
 * Archivo         : metro.config.js
 * Descripción     : Configuración de Metro Bundler para SafeAlert.
 *                   Obligatorio en Expo SDK 55 + React Native 0.83 para
 *                   resolución correcta de assets, source maps y módulos nativos.
 *                   En modo web, redirige módulos nativos sin soporte a shims.
 * Autor           : oafon
 * Fecha           : 2026-08-26
 * Versión         : 2.0.0
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

// Módulos nativos que no tienen implementación web.
// Cuando el target es web, Metro los resuelve a un shim vacío en vez de crashear.
const NATIVE_WEB_EMPTY = [
  'react-native-wakeword',
  'react-native-permissions',
  'react-native-device-info',
];
const WEB_RN_SCREENS_PATH = path.resolve(__dirname, 'src', 'shims', 'web-rn-screens.js');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Soporte para archivos de modelos de wakeword (.onnx) y recursos de audio
config.resolver.assetExts.push('onnx', 'ppn', 'tflite');

// En web, reemplazar import.meta por un objeto seguro para que zustand/redux
// no crashee en bundles que no son ES modules.
if (!config.serializer) config.serializer = {};
const originalProcessModule = config.serializer.processModuleFilter;
config.serializer.processModuleFilter = (module, ...rest) => {
  if (module?.source?.text && module.source.text.includes('import.meta')) {
    module.source.text = module.source.text.replace(
      /import\.meta\.env\?\.MODE/g,
      '"production"'
    );
    module.source.text = module.source.text.replace(
      /import\.meta\.env\.MODE/g,
      '"production"'
    );
    module.source.text = module.source.text.replace(
      /import\.meta/g,
      '({env:{MODE:"production"}})'
    );
  }
  if (originalProcessModule) {
    return originalProcessModule(module, ...rest);
  }
  return true;
};

// Resolver para web: redirigir módulos nativos a shim vacío
const WEB_TURBO_SHIM_PATH = path.resolve(__dirname, 'src', 'shims', 'web-turbo-modules.js');
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (NATIVE_WEB_EMPTY.includes(moduleName)) {
      return { type: 'sourceFile', filePath: path.resolve(__dirname, 'src', 'shims', 'web-empty.js') };
    }
    if (moduleName === 'react-native-screens') {
      return { type: 'sourceFile', filePath: WEB_RN_SCREENS_PATH };
    }
    if (moduleName.includes('TurboModuleRegistry')) {
      return { type: 'sourceFile', filePath: WEB_TURBO_SHIM_PATH, unstable_enablePackageExports: false };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName);
};

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
