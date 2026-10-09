// `.insight-card` do Figma Make. Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies, shape } from "../../theme";
import { FigmaIcon } from "../FigmaIcon";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";
import { StaticPressable } from "./StaticPressable";

export interface InsightCardProps {
  title: string;
  text: string;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: shape.radius.md,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: color.lavender,
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
  text: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});

export function InsightCard({
  title,
  text,
  onPress,
  accessibilityLabel,
}: InsightCardProps): ReactElement {
  const reduceMotion = useReduceMotion();

  const content = (
    <>
      <View style={styles.iconWrap}>
        <FigmaIcon name="sparkles" size={20} color={color.lavenderStrong} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
      {onPress ? (
        <FigmaIcon name="chevron" size={16} color={color.ink[500]} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  return (
    <StaticPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      style={({ pressed }) => [
        styles.card,
        getPressScaleStyle(pressed, reduceMotion),
      ]}
    >
      {content}
    </StaticPressable>
  );
}
