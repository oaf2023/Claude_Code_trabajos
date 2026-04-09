/* ============================================================================
 * Archivo         : useGuardMode.ts
 * Descripción     : Hook para controlar el Modo Guardia detectado por voz (Vosk) 
 *                   desde la capa de React Native.
 * Autor           : GitHub Copilot
 * Fecha           : 2026-04-09
 * Versión          : 1.0.0
 * Lenguaje       : TypeScript 5.0
 * ============================================================================ */

import { useState, useEffect } from 'react';
import { NativeModules, NativeEventEmitter, Platform, Alert } from 'react-native';

const { GuardModule } = NativeModules;
const guardManagerEmitter = new NativeEventEmitter(GuardModule);

export const useGuardMode = (onDetected?: () => void) => {
    const [isGuardActive, setIsGuardActive] = useState(false);

    useEffect(() => {
        // Suscribirse al evento nativo de detección
        const subscription = guardManagerEmitter.addListener('onVoiceAlertDetected', () => {
            console.log('[useGuardMode] ¡Palabra clave detectada!');
            if (onDetected) onDetected();
        });

        return () => {
            subscription.remove();
        };
    }, [onDetected]);

    const activateGuard = async () => {
        if (Platform.OS !== 'android') {
            Alert.alert('No compatible', 'El Modo Guardia por voz solo está disponible en Android (Offline).');
            return false;
        }

        try {
            const success = await GuardModule.startGuardMode();
            if (success) {
                setIsGuardActive(true);
                return true;
            }
        } catch (error) {
            console.error('Error al activar Modo Guardia:', error);
            Alert.alert('Error', 'No se pudo iniciar la escucha continua.');
        }
        return false;
    };

    const deactivateGuard = async () => {
        if (Platform.OS !== 'android') return;
        
        try {
            await GuardModule.stopGuardMode();
            setIsGuardActive(false);
        } catch (error) {
            console.error('Error al desactivar Modo Guardia:', error);
        }
    };

    return {
        isGuardActive,
        activateGuard,
        deactivateGuard
    };
};
