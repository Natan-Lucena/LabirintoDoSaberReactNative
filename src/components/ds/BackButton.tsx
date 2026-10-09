// `.back-button` do Figma Make: 40×40, círculo, ícone `arrow` girado 180°.
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { color } from "../../theme";
import { FigmaIcon } from "../FigmaIcon";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";
import { StaticPressable } from "./StaticPressable";

export interface BackButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

const styles = StyleSheet.create({
  base: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { transform: [{ rotate: "180deg" }] },
});

export function BackButton({
  onPress,
  accessibilityLabel = "Voltar",
}: BackButtonProps): ReactElement {
  const reduceMotion = useReduceMotion();

  return (
    <StaticPressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.base,
        getPressScaleStyle(pressed, reduceMotion),
      ]}
    >
      <View style={styles.icon}>
        <FigmaIcon name="arrow" size={18} color={color.brand[700]} />
      </View>
    </StaticPressable>
  );
}
