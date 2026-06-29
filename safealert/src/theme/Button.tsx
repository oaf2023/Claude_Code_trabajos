/* ============================================================================
* Archivo         : Button.tsx
* Descripción     : Botón reutilizable del design system. Cubre los patrones
*                   más comunes: danger (CTA), outline, ghost y small.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <Button title="Activar" onPress={...} variant="danger" />
* ============================================================================ */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { color, spacing, borderRadius, typography, shadow } from './tokens';
import { Icon, IconName } from './Icon';

type ButtonVariant = 'danger' | 'primary' | 'secondary' | 'outline' | 'ghost' | 'chip';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  danger: {
    container: { backgroundColor: color.danger },
    text: { color: color.textInverse },
  },
  primary: {
    container: { backgroundColor: color.safe },
    text: { color: color.textInverse },
  },
  secondary: {
    container: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
    text: { color: color.textPrimary },
  },
  outline: {
    container: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: color.danger },
    text: { color: color.danger },
  },
  ghost: {
    container: { backgroundColor: 'transparent' },
    text: { color: color.textSecondary },
  },
  chip: {
    container: { backgroundColor: color.dangerLight, borderRadius: borderRadius.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
    text: { color: color.danger, fontSize: 13, fontWeight: '500' },
  },
};

const sizeStyles: Record<string, { container: ViewStyle; text: TextStyle; iconSize: number }> = {
  sm: {
    container: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: borderRadius.sm },
    text: { fontSize: 13, fontWeight: '600' },
    iconSize: 16,
  },
  md: {
    container: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: borderRadius.md },
    text: { fontSize: 15, fontWeight: '700' },
    iconSize: 20,
  },
  lg: {
    container: { paddingVertical: spacing.lg, paddingHorizontal: spacing['2xl'], borderRadius: borderRadius.lg },
    text: { fontSize: 17, fontWeight: '700' },
    iconSize: 24,
  },
};

export function Button({
  title,
  onPress,
  variant = 'danger',
  icon: iconName,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  size = 'md',
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];
  const opacity = disabled || loading ? 0.5 : 1;

  const content = loading ? (
    <ActivityIndicator size="small" color={v.text.color} />
  ) : (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      {iconName && iconPosition === 'left' && (
        <Icon name={iconName} size={s.iconSize} color={v.text.color as string} />
      )}
      <Text style={[s.text, v.text, textStyle]}>{title}</Text>
      {iconName && iconPosition === 'right' && (
        <Icon name={iconName} size={s.iconSize} color={v.text.color as string} />
      )}
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, s.container, v.container, { opacity }, ...(Array.isArray(style) ? style : style ? [style] : [])]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {content}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
