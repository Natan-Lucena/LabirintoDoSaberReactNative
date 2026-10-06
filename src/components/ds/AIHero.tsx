// `.ai-hero` do Figma Make: gradiente `brand`; sem lib nova, usa fundo
// sólido. G-42: fundo `semanticColor.primaryFill` (brand-700) com texto
// `semanticColor.textOnPrimary` (branco).
import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { color, fontFamilies, semanticColor, shape } from "../../theme";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";

export interface AIHeroAction {
  label: string;
  onPress: () => void;
}

export interface AIHeroProps {
  title: string;
  description: string;
  action?: AIHeroAction;
}

const styles = StyleSheet.create({
  hero: {
    gap: 8,
    padding: 20,
    borderRadius: shape.radius.lg,
    backgroundColor: semanticColor.primaryFill,
  },
  title: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: semanticColor.textOnPrimary,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: semanticColor.textOnPrimary,
  },
  action: {
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: shape.radius.button,
    backgroundColor: color.surface,
  },
  actionLabel: {
    fontSize: 13,
    lineHeight: 17,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.brand[700],
  },
});

export function AIHero({
  title,
  description,
  action,
}: AIHeroProps): ReactElement {
  const reduceMotion = useReduceMotion();

  return (
    <View style={styles.hero}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {action ? (
        <Pressable
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          style={({ pressed }) => [
            styles.action,
            getPressScaleStyle(pressed, reduceMotion),
          ]}
        >
          <Text style={styles.actionLabel}>{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
