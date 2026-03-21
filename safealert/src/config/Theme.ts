/* ============================================================================
* Archivo         : Theme.ts
* Descripción     : Sistema de diseño basado en Material Design 3 (M3) y colores dinámicos.
* Autor           : oafon
* Fecha           : 2026-03-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : Importar MD3_THEME para estilos de componentes.
* ============================================================================ */

export const MD3_THEME = {
  colors: {
    // Primary - Refleja la intención principal (Seguridad/Alerta)
    primary: '#DC2626', // Red 600
    onPrimary: '#FFFFFF',
    primaryContainer: '#FEE2E2',
    onPrimaryContainer: '#450A0A',

    // Secondary - Para elementos de soporte
    secondary: '#4B5563', // Gray 600
    onSecondary: '#FFFFFF',
    secondaryContainer: '#F3F4F6',
    onSecondaryContainer: '#111827',

    // Tertiary - Acentos o estados especiales (IA/Análisis)
    tertiary: '#7C3AED', // Violet 600
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#EDE9FE',
    onTertiaryContainer: '#2E1065',

    // Error - Crítico
    error: '#B91C1C',
    onError: '#FFFFFF',
    errorContainer: '#FFF1F2',
    onErrorContainer: '#4C0505',

    // Background & Surface
    background: '#F9FAFB',
    onBackground: '#111827',
    surface: '#FFFFFF',
    onSurface: '#111827',
    surfaceVariant: '#F3F4F6',
    onSurfaceVariant: '#4B5563',

    // Outline
    outline: '#D1D5DB',
  },
  typography: {
    displayLarge: { fontSize: 57, fontWeight: '400', letterSpacing: -0.25 },
    headlineMedium: { fontSize: 28, fontWeight: '400' },
    titleMedium: { fontSize: 16, fontWeight: '500', letterSpacing: 0.15 },
    bodyLarge: { fontSize: 16, fontWeight: '400', letterSpacing: 0.5 },
    labelMedium: { fontSize: 12, fontWeight: '500', letterSpacing: 0.5 },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  shape: {
    none: 0,
    extraSmall: 4,
    small: 8,
    medium: 12,
    large: 16,
    full: 9999,
  }
};
