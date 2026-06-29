/* ============================================================================
* Archivo         : metro.config.js
* Descripcion     : Configuracion Metro del cliente Apple con acceso al codigo compartido del proyecto padre.
* Autor           : oafon
* Fecha           : 2026-04-21
* Version         : 1.0.0
* Lenguaje        : JavaScript
* Uso             : Consumido por Metro al iniciar safealert/iphone.
* ============================================================================ */

const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.assetExts.push('onnx', 'ppn', 'tflite');

config.server = config.server || {};
const originalEnhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhanced = originalEnhance ? originalEnhance(middleware, server) : middleware;
  return (req, res, next) => {
    if (req.url && req.url.includes('.bundle')) {
      req.headers.accept = 'application/javascript';
    }
    return enhanced(req, res, next);
  };
};

module.exports = config;