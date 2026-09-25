import { StyleSheet, Text, View } from "react-native";

import { color, semanticColor, shape, typography } from "../../theme";

export type TagVariant = "primary" | "neutral" | "pink";

export interface TagProps {
  label: string;
  variant?: TagVariant;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    paddingVertical: shape.tagPaddingVertical,
    paddingHorizontal: shape.tagPaddingHorizontal,
    alignSelf: "flex-start",
  },
  primary: { backgroundColor: color.selection },
  neutral: { backgroundColor: color.tagNeutral },
  pink: {
    backgroundColor: color.surface,
    borderWidth: shape.hairlineWidth,
    borderColor: color.pink,
  },
  label: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
  },
  labelPrimary: { color: semanticColor.textOnSelection },
  labelNeutral: { color: semanticColor.textOnTagNeutral },
  labelPink: { color: color.text },
});

export function Tag({ label, variant = "neutral" }: TagProps) {
  const containerStyle =
    variant === "primary"
      ? styles.primary
      : variant === "pink"
        ? styles.pink
        : styles.neutral;
  const labelStyle =
    variant === "primary"
      ? styles.labelPrimary
      : variant === "pink"
        ? styles.labelPink
        : styles.labelNeutral;

  return (
    <View style={[styles.base, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>{label}</Text>
    </View>
  );
}
