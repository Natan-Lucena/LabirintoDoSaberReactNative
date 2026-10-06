// `.ai-context` do Figma Make. Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies, shape } from "../../theme";
import { FigmaIcon, type FigmaIconName } from "../FigmaIcon";

export interface AIContextProps {
  text: string;
  icon?: Extract<FigmaIconName, "sparkles" | "brain">;
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: shape.radius.md,
    backgroundColor: color.lavender,
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    color: color.lavenderStrong,
  },
});

export function AIContext({
  text,
  icon = "sparkles",
}: AIContextProps): ReactElement {
  return (
    <View style={styles.wrap}>
      <FigmaIcon name={icon} size={18} color={color.lavenderStrong} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}
