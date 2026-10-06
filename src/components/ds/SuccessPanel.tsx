// `.success-panel` do Figma Make. Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies, shape } from "../../theme";
import { FigmaIcon } from "../FigmaIcon";

export interface SuccessPanelProps {
  title: string;
  description?: string;
}

// Fundo exato do Make (`src/index.css`); ainda não tokenizado na DS-01.
const SUCCESS_BACKGROUND = "#e8f7f1";

const styles = StyleSheet.create({
  panel: {
    alignItems: "center",
    gap: 8,
    padding: 24,
    borderRadius: shape.radius.lg,
    backgroundColor: SUCCESS_BACKGROUND,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: color.surface,
  },
  title: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    color: color.success,
    textAlign: "center",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
    textAlign: "center",
  },
});

export function SuccessPanel({
  title,
  description,
}: SuccessPanelProps): ReactElement {
  return (
    <View
      style={styles.panel}
      accessibilityRole="summary"
      accessibilityLabel={title}
    >
      <View style={styles.iconWrap}>
        <FigmaIcon name="check" size={28} color={color.success} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description ? (
        <Text style={styles.description}>{description}</Text>
      ) : null}
    </View>
  );
}
