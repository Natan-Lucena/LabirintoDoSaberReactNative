// `SectionTitle` do Figma Make (`.section-title`). Ver ficha DS-05.
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { color, fontFamilies } from "../../theme";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";

export interface SectionTitleProps {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  action: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.brand[600],
  },
});

export function SectionTitle({
  title,
  actionLabel,
  onActionPress,
}: SectionTitleProps): ReactElement {
  const reduceMotion = useReduceMotion();

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onActionPress ? (
        <Pressable
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={8}
          style={({ pressed }) => getPressScaleStyle(pressed, reduceMotion)}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
