// `IconButton` do Figma Make (`.icon-button`, 42×42). Ver ficha DS-03.
import type { ReactElement } from "react";
import { Pressable, StyleSheet } from "react-native";

import { color } from "../../theme";
import { FigmaIcon, type FigmaIconName } from "../FigmaIcon";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";

export interface IconButtonProps {
  icon: FigmaIconName;
  onPress: () => void;
  /** Obrigatório: o ícone é decorativo, o rótulo acessível vem do botão. */
  accessibilityLabel: string;
  disabled?: boolean;
  size?: number;
}

const styles = StyleSheet.create({
  base: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: color.border,
    backgroundColor: color.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
});

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  disabled = false,
  size = 42,
}: IconButtonProps): ReactElement {
  const reduceMotion = useReduceMotion();

  function handlePress() {
    if (disabled) {
      return;
    }
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.base,
        size !== 42
          ? { width: size, height: size, borderRadius: size / 2 }
          : null,
        disabled ? styles.disabled : null,
        getPressScaleStyle(pressed, reduceMotion),
      ]}
    >
      <FigmaIcon name={icon} size={18} color={color.ink[800]} />
    </Pressable>
  );
}
