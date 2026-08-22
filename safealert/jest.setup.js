/* ============================================================================
* Archivo         : jest.setup.js
* Descripción     : Setup global de Jest: mock de AsyncStorage (vía localStorage)
*                   y mock mínimo de react-native para servicios que importan
*                   Platform/AppState en entorno Node.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.1.0
* Lenguaje        : JavaScript
* Uso             : Cargado automáticamente por jest (setupFiles).
* ============================================================================ */

/* Mock global para AsyncStorage en entorno Node.js */
const mockStorage = {};

global.__DEV__ = true;

global.window = {
  localStorage: {
    getItem: (key) => mockStorage[key] ?? null,
    setItem: (key, value) => { mockStorage[key] = value; },
    removeItem: (key) => { delete mockStorage[key]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  },
};

/* Mock mínimo de react-native: solo lo que usan los servicios en runtime Node.
   Evita el SyntaxError "Cannot use import statement outside a module". */
jest.mock('react-native', () => {
  const Platform = {
    OS: 'android',
    Version: 34,
    select: (obj) => (obj && typeof obj === 'object' ? obj.android ?? obj.default : obj),
    constants: { reactNativeVersion: { major: 0, minor: 83, patch: 2 } },
  };

  return {
    Platform,
    AppState: {
      currentState: 'active',
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
    },
    NativeModules: {},
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeAllListeners: jest.fn(),
    })),
    Dimensions: {
      get: jest.fn(() => ({ width: 390, height: 844 })),
    },
    Vibration: { vibrate: jest.fn() },
    LogBox: { ignoreLogs: jest.fn() },
    Alert: { alert: jest.fn() },
    Linking: {
      openURL: jest.fn().mockResolvedValue(true),
      canOpenURL: jest.fn().mockResolvedValue(true),
    },
  };
});

/* Mock de expo-constants que algunos servicios importan en runtime Node */
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: { extra: {} },
    manifest: {},
    platform: { android: { versionCode: 1 } },
  },
  manifest: {},
}));
