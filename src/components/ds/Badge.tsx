// `.badge` / `.badge--warning` do Figma Make. Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies, semanticColor } from "../../theme";

export type BadgeVariant = "default" | "warning";

export interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

const variantStyles: Record<
  BadgeVariant,
  { backgroundColor: string; color: string }
> = {
  default: { backgroundColor: color.brand[100], color: color.brand[700] },
  // G-17: amarelo claro com texto escuro suficiente para 4,5:1 (semanticColor.warningTextOnYellow).
  warning: {
    backgroundColor: color.yellow,
    color: semanticColor.warningTextOnYellow,
  },
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  // 9/800 no Figma fica abaixo do mínimo legível do tema; sobe para 11/800 (G-17).
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
  },
});

export function Badge({
  label,
  variant = "default",
}: BadgeProps): ReactElement {
  const tone = variantStyles[variant];

  return (
    <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
      <Text style={[styles.label, { color: tone.color }]}>{label}</Text>
    </View>
  );
}
