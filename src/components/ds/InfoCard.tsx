// `InfoCard` do Figma Make (`.info-card`). Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies, shape } from "../../theme";
import { FigmaIcon, type FigmaIconName } from "../FigmaIcon";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";
import { StaticPressable } from "./StaticPressable";

export interface InfoCardAction {
  label: string;
  onPress: () => void;
}

export interface InfoCardProps {
  icon: FigmaIconName;
  title: string;
  description: string;
  action?: InfoCardAction;
  onPress?: () => void;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
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
  description: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  actionLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.brand[700],
  },
});

export function InfoCard({
  icon,
  title,
  description,
  action,
  onPress,
  accessibilityLabel,
}: InfoCardProps): ReactElement {
  const reduceMotion = useReduceMotion();

  const content = (
    <>
      <View style={styles.iconWrap}>
        <FigmaIcon name={icon} size={20} color={color.brand[600]} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        {action ? (
          <StaticPressable
            onPress={action.onPress}
            accessibilityRole="button"
            accessibilityLabel={action.label}
            hitSlop={8}
            style={({ pressed }) => [
              styles.action,
              getPressScaleStyle(pressed, reduceMotion),
            ]}
          >
            <Text style={styles.actionLabel}>{action.label}</Text>
            <FigmaIcon name="arrow" size={14} color={color.brand[700]} />
          </StaticPressable>
        ) : null}
      </View>
    </>
  );

  if (onPress) {
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

  return <View style={styles.card}>{content}</View>;
}
