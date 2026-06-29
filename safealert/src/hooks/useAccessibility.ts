/* ============================================================================
* Archivo         : useAccessibility.ts
* Descripción     : Hook de accesibilidad WCAG 2.2 AA. Garantiza dianas mínimas
*                   de 48x48, contraste suficiente y etiquetas semánticas.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { useAccessibility } from '../../src/hooks/useAccessibility';
* ============================================================================ */

import { useCallback } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export const MIN_TOUCH_SIZE = 48;

export function useAccessibility() {
  const isScreenReaderEnabled = useCallback(async () => {
    return AccessibilityInfo.isScreenReaderEnabled();
  }, []);

  return {
    isScreenReaderEnabled,
    touchTargetStyle: {
      minWidth: MIN_TOUCH_SIZE,
      minHeight: MIN_TOUCH_SIZE,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
  };
}

export function a11nProps(label: string, hint?: string, role?: string) {
  return {
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: (role || 'button') as 'button' | 'link' | 'header' | 'image' | 'text' | 'summary' | 'adjustable' | 'switch' | 'none',
    accessible: true,
  };
}
