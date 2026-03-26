/* ============================================================================
* Archivo         : index.ts
* Descripción     : Punto de entrada instrumentado para validar el arranque JS del cliente Android.
* Autor           : oafon
* Fecha           : 2026-03-20
* Versión         : 1.0.1
* Lenguaje        : TypeScript 5.9
* Uso             : Cargado por Expo al iniciar la app para montar el router y emitir trazas de bootstrap.
* ============================================================================ */

import { LogBox } from 'react-native';

if (__DEV__) {
	LogBox.ignoreLogs([
		'[expo-av]: Expo AV has been deprecated',
		'This method is deprecated (as well as all React Native Firebase namespaced API)',
		'InteractionManager has been deprecated',
		'Uncaught (in promise, id: 0) Error: [storage/unauthorized]',
		'[storage/unauthorized]',
	]);
}

console.log('[SafeAlertBootstrap] index.ts loaded');
(globalThis as any).__SAFEALERT_BOOTSTRAP_MARK__ = Date.now();

import 'expo-router/entry';

console.log('[SafeAlertBootstrap] expo-router entry imported');
