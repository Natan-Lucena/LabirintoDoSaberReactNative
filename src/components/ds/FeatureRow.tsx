// `.feature-row` do Figma Make. Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies } from "../../theme";
import { FigmaIcon, type FigmaIconName } from "../FigmaIcon";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";
import { StaticPressable } from "./StaticPressable";

export interface FeatureRowProps {
  icon: FigmaIconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  // Grade 42 | 1fr | auto do Make.
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: color.border,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: color.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  title: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  subtitle: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});

export function FeatureRow({
  icon,
  title,
  subtitle,
  onPress,
  accessibilityLabel,
}: FeatureRowProps): ReactElement {
  const reduceMotion = useReduceMotion();

  return (
    <StaticPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.row,
        getPressScaleStyle(pressed, reduceMotion),
      ]}
    >
      <View style={styles.iconWrap}>
        <FigmaIcon name={icon} size={18} color={color.brand[600]} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <FigmaIcon name="chevron" size={16} color={color.ink[500]} />
    </StaticPressable>
  );
}
