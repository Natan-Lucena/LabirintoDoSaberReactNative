// `SectionTitle` do Figma Make (`.section-title`). Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies } from "../../theme";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";
import { StaticPressable } from "./StaticPressable";
import { hitSlopToMinTarget } from "./touchTarget";

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
      <Text style={styles.title} accessibilityRole="header" accessible>
        {title}
      </Text>
      {actionLabel && onActionPress ? (
        <StaticPressable
          onPress={onActionPress}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          hitSlop={{ ...hitSlopToMinTarget(Infinity, 17), left: 8, right: 8 }}
          style={({ pressed }) => getPressScaleStyle(pressed, reduceMotion)}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </StaticPressable>
      ) : null}
    </View>
  );
}
