/* ============================================================================
* Archivo         : index.ts
* Descripción     : Re-export del design system.
* Autor           : oafon
* Fecha           : 2026-06-29
* Versión         : 1.0.0
* Lenguaje        : TypeScript 5.9
* Uso             : import { color, spacing, Icon } from '../theme'
* ============================================================================ */

export { color, spacing, borderRadius, typography, shadow } from './tokens';
export type { ColorKey, SpacingKey } from './tokens';
export { Icon } from './Icon';
export { Button } from './Button';
export { Card } from './Card';
