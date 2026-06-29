/* ============================================================================
* Archivo         : Icon.tsx
* Descripción     : Componente de icono basado en MaterialIcons de @expo/vector-icons.
*                   Reemplaza progresivamente el uso de emojis como iconografía.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : <Icon name="shield-check" size={24} color={color.safe} />
* ============================================================================ */

import React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { color } from './tokens';

export type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}

export function Icon({ name, size = 24, color: iconColor = color.textPrimary, style }: IconProps) {
  return (
    <MaterialIcons
      name={name}
      size={size}
      color={iconColor}
      style={style}
    />
  );
}
