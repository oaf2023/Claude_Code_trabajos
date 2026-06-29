/* ============================================================================
* Archivo         : Card.tsx
* Descripción     : Tarjeta reutilizable del design system con variantes.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <Card><Text>contenido</Text></Card>
* ============================================================================ */

import React, { ReactNode } from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { color, spacing, borderRadius, shadow } from './tokens';

type CardVariant = 'default' | 'elevated' | 'highlighted' | 'warning' | 'success';

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const variantCardStyles: Record<CardVariant, ViewStyle> = {
  default: {
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    ...shadow.sm,
  },
  elevated: {
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    ...shadow.md,
  },
  highlighted: {
    backgroundColor: color.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: color.danger,
    ...shadow.sm,
  },
  warning: {
    backgroundColor: color.warningLight,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: color.warning,
  },
  success: {
    backgroundColor: color.safeLight,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: color.safe,
  },
};

export function Card({
  children,
  variant = 'default',
  onPress,
  style,
  accessibilityLabel,
  accessibilityHint,
}: CardProps) {
  const cardStyle = [styles.base, variantCardStyles[variant]].concat(style ? (Array.isArray(style) ? style.filter(Boolean) : [style]) : []);

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={cardStyle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
