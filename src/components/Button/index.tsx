import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";

import { color, semanticColor, shape, typography } from "../../theme";

export type ButtonVariant = "primary" | "secondary" | "onPrimaryWhite" | "pill";

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  base: {
    minHeight: shape.minTouchTarget,
    borderRadius: shape.buttonRadius,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  primary: { backgroundColor: color.primary },
  secondary: {
    backgroundColor: color.surface,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
  },
  onPrimaryWhite: { backgroundColor: color.surface },
  pill: { backgroundColor: color.primary, borderRadius: 999 },
  label: {
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontFamily: typography.button.fontFamily,
  },
  labelOnPrimary: { color: semanticColor.textOnPrimary },
  labelOnSurface: { color: color.text },
});

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  accessibilityLabel,
}: ButtonProps) {
  const isBlocked = disabled || loading;

  function handlePress() {
    if (isBlocked) {
      return;
    }
    onPress();
  }

  const variantStyle =
    variant === "secondary"
      ? styles.secondary
      : variant === "onPrimaryWhite"
        ? styles.onPrimaryWhite
        : variant === "pill"
          ? styles.pill
          : styles.primary;

  const labelStyle =
    variant === "secondary" || variant === "onPrimaryWhite"
      ? styles.labelOnSurface
      : styles.labelOnPrimary;

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      style={[styles.base, variantStyle]}
    >
      {loading ? (
        <ActivityIndicator
          color={
            labelStyle === styles.labelOnPrimary
              ? semanticColor.textOnPrimary
              : color.text
          }
        />
      ) : null}
      <Text style={[styles.label, labelStyle]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}
