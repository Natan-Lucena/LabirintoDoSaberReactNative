import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { color, shape } from "../../theme";

export type CardVariant = "default" | "accent" | "selected" | "gradient";

export interface CardProps extends PropsWithChildren {
  variant?: CardVariant;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: color.surface,
    borderRadius: shape.cardRadius,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    padding: 20,
  },
  accent: {
    borderLeftWidth: shape.accentBorderWidth,
    borderLeftColor: color.primary,
  },
  selected: { borderColor: color.primary, backgroundColor: color.selection },
});

export function Card({
  children,
  variant = "default",
  selected = false,
  onPress,
  accessibilityLabel,
}: CardProps) {
  const variantStyle =
    variant === "accent"
      ? styles.accent
      : variant === "selected" || selected
        ? styles.selected
        : null;

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected }}
        style={[styles.base, variantStyle]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[styles.base, variantStyle]}
    >
      {children}
    </View>
  );
}
