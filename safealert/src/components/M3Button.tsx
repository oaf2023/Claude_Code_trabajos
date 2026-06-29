/* ============================================================================
* Archivo         : M3Button.tsx
* Descripción     : Botón accesible — ahora usa el design system Button internamente.
*                   Se mantiene como wrapper para no romper imports existentes.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 2.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <M3Button title="Activar" onPress={...} />
* ============================================================================ */

import React from 'react';
import { ViewStyle, TextStyle } from 'react-native';
import { Button } from '../theme/Button';

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

function mapVariant(v: M3ButtonProps['variant']): 'danger' | 'secondary' | 'outline' | 'primary' {
  switch (v) {
    case 'error': return 'danger';
    case 'secondary': return 'secondary';
    case 'outline': return 'outline';
    default: return 'primary';
  }
}

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
  return (
    <Button
      title={title}
      onPress={onPress}
      variant={mapVariant(variant)}
      loading={loading}
      disabled={disabled}
      size="md"
      style={style}
      textStyle={labelStyle}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    />
  );
};
