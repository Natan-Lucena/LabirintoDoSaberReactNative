import type { Insets } from "react-native";

import { shape } from "../../theme";

/**
 * hitSlop que leva um alvo de toque de `width` × `height` ao mínimo do tema
 * (`shape.minTouchTarget`, G-17) sem mudar o visual do Figma Make (QA-03).
 */
export function hitSlopToMinTarget(width: number, height: number): Insets {
  const vertical = Math.max(0, Math.ceil((shape.minTouchTarget - height) / 2));
  const horizontal = Math.max(0, Math.ceil((shape.minTouchTarget - width) / 2));
  return {
    top: vertical,
    bottom: vertical,
    left: horizontal,
    right: horizontal,
  };
}
