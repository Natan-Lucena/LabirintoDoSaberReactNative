// `Button` do Figma Make (`.button`, `.button--*`, `.full-button`). Ver ficha DS-03.
import { useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { color, fontFamilies, semanticColor, shape } from "../../theme";
import { FigmaIcon, type FigmaIconName } from "../FigmaIcon";
import { getPressScaleStyle, useReduceMotion } from "./usePressScale";

export type DsButtonVariant = "primary" | "secondary" | "ghost" | "soft";

export interface DsButtonProps {
  label: string;
  onPress: () => void;
  variant?: DsButtonVariant;
  icon?: FigmaIconName;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

const variantTextColor: Record<DsButtonVariant, string> = {
  primary: semanticColor.textOnPrimary,
  secondary: color.brand[700],
  ghost: color.brand[700],
  soft: color.brand[700],
};

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: shape.radius.button,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fullWidth: { width: "100%", minHeight: 50 },
  primary: {
    backgroundColor: semanticColor.primaryFill,
    shadowColor: "rgb(22,141,132)",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 4,
  },
  secondary: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.brand[200],
  },
  ghost: { backgroundColor: "transparent" },
  soft: {
    backgroundColor: color.brand[50],
    borderWidth: 1,
    borderColor: color.brand[200],
    borderStyle: "dashed",
  },
  disabled: { opacity: 0.5 },
  spinner: {
    position: "absolute",
    left: 16,
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
  },
});

const variantStyles: Record<DsButtonVariant, object> = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  soft: styles.soft,
};

export function DsButton({
  label,
  onPress,
  variant = "primary",
  icon,
  fullWidth = false,
  loading = false,
  disabled = false,
  accessibilityLabel,
}: DsButtonProps): ReactElement {
  const reduceMotion = useReduceMotion();
  const [pressed, setPressed] = useState(false);
  const isBlocked = disabled || loading;
  const textColor = variantTextColor[variant];

  function handlePress() {
    if (isBlocked) {
      return;
    }
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      style={[
        styles.base,
        variantStyles[variant],
        fullWidth ? styles.fullWidth : null,
        isBlocked ? styles.disabled : null,
        getPressScaleStyle(pressed, reduceMotion),
      ]}
    >
      {loading ? (
        // Fora do fluxo: se o spinner ocupasse espaço na linha, o Android
        // media o rótulo mais estreito e deixava "Entrar ag…" mesmo depois.
        <View style={styles.spinner}>
          <ActivityIndicator color={textColor} />
        </View>
      ) : icon ? (
        <View>
          <FigmaIcon name={icon} size={18} color={textColor} />
        </View>
      ) : null}
      <Text
        // `key`: o Android guardava a largura medida durante o "carregando" e
        // o rótulo ficava truncado ("Entrar ag…") depois do erro.
        key={loading ? "loading" : "idle"}
        style={[styles.label, { color: textColor }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
