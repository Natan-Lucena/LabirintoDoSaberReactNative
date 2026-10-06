// `.floating-action` do Figma Make. Ver ficha DS-05.
// G-42: ícone sobre fundo de marca usa `semanticColor.primaryFill`
// (brand-700) com `semanticColor.textOnPrimary` (branco).
import type { ReactElement } from "react";
import { Pressable, StyleSheet } from "react-native";

import { semanticColor, shape } from "../../theme";
import { FigmaIcon, type FigmaIconName } from "../FigmaIcon";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";

export interface FabProps {
  onPress: () => void;
  accessibilityLabel: string;
  icon?: FigmaIconName;
}

const styles = StyleSheet.create({
  fab: {
    width: 54,
    height: 54,
    borderRadius: shape.radius.lg - 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: semanticColor.primaryFill,
    ...shape.shadow.md,
  },
});

export function Fab({
  onPress,
  accessibilityLabel,
  icon = "plus",
}: FabProps): ReactElement {
  const reduceMotion = useReduceMotion();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.fab,
        getPressScaleStyle(pressed, reduceMotion),
      ]}
    >
      <FigmaIcon name={icon} size={22} color={semanticColor.textOnPrimary} />
    </Pressable>
  );
}
