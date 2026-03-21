/* ============================================================================
* Archivo         : M3Button.tsx
* Descripción     : Botón accesible siguiendo estándares Material Design 3.
* Autor           : oafon
* Fecha           : 2026-03-21
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <M3Button title="Activar" onPress={...} />
* ============================================================================ */

import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ViewStyle, 
  TextStyle, 
  ActivityIndicator,
  AccessibilityRole
} from 'react-native';
import { MD3_THEME } from '../config/Theme';

interface M3ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'error' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

/* ============================================================================
* Función         : M3Button
* Descripción     : Componente funcional que renderiza un botón con soporte de accesibilidad.
* Fecha            : 2026-03-21
* Versión          : 1.0.0
* Lenguaje         : TypeScript 5.9
* Ingesta          : Props definidas en M3ButtonProps
* Devolución      : JSX.Element
* Uso             : Incluye soporte para VoiceOver/TalkBack mediante accessibilityLabel.
* ============================================================================ */
export const M3Button: React.FC<M3ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  labelStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: { backgroundColor: MD3_THEME.colors.secondaryContainer },
          text: { color: MD3_THEME.colors.onSecondaryContainer },
        };
      case 'error':
        return {
          container: { backgroundColor: MD3_THEME.colors.error },
          text: { color: MD3_THEME.colors.onError },
        };
      case 'outline':
        return {
          container: { 
            backgroundColor: 'transparent', 
            borderWidth: 1, 
            borderColor: MD3_THEME.colors.outline 
          },
          text: { color: MD3_THEME.colors.primary },
        };
      default:
        return {
          container: { backgroundColor: MD3_THEME.colors.primary },
          text: { color: MD3_THEME.colors.onPrimary },
        };
    }
  };

  const variantStyles = getVariantStyles();
  const opacity = disabled || loading ? 0.5 : 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.container,
        variantStyles.container,
        { opacity },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variantStyles.text.color} 
        />
      ) : (
        <Text style={[styles.text, variantStyles.text, labelStyle]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    paddingHorizontal: MD3_THEME.spacing.lg,
    borderRadius: MD3_THEME.shape.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1, // Elevación M3
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  text: {
    ...MD3_THEME.typography.labelMedium,
    textAlign: 'center',
    textTransform: 'uppercase', // Estilo M3 para botones
  },
});
