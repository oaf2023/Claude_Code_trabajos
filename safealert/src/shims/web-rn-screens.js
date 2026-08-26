/* ============================================================================
 * Archivo         : src/shims/web-rn-screens.js
 * Descripción     : Web shim para react-native-screens.
 *                   Proporciona componentes básicos usando View de react-native.
 * Autor           : oafon
 * Fecha           : 2026-08-26
 * Versión         : 1.0.0
 * Lenguaje        : JavaScript
 * ============================================================================ */

const React = require('react');
const { View, ScrollView } = require('react-native');

function ScreenComponent(props) {
  return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });
}

function ScreenContainer(props) {
  return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });
}

function NativeScreen(props) {
  return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });
}

function NativeScreenNavigationContainer(props) {
  return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });
}

function ScreenStack(props) {
  return React.createElement(View, { ...props, style: [{ flex: 1 }, props.style] });
}

function ScreenStackHeaderConfig(props) {
  return null;
}

module.exports = {
  default: ScreenComponent,
  Screen: ScreenComponent,
  ScreenContainer: ScreenContainer,
  NativeScreen: NativeScreen,
  NativeScreenNavigationContainer: NativeScreenNavigationContainer,
  ScreenStack: ScreenStack,
  ScreenStackHeaderConfig: ScreenStackHeaderConfig,
  enableFreeze: function() {},
  unstable_createFreeScreenComponent: function() { return ScreenComponent; },
  featureFlags: {
    experiment: {
      synchronousScreenUpdatesEnabled: false,
      synchronousHeaderConfigUpdatesEnabled: false,
      synchronousHeaderSubviewUpdatesEnabled: false,
      controlledBottomTabs: false,
      iosPreventReattachmentOfDismissedScreens: false,
    },
  },
};
