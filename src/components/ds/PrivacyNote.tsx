// `.privacy-note` do Figma Make. Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies, shape } from "../../theme";
import { FigmaIcon } from "../FigmaIcon";

export interface PrivacyNoteProps {
  text: string;
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: shape.radius.md,
    backgroundColor: color.brand[50],
    borderWidth: 1,
    borderColor: color.brand[100],
  },
  text: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});

export function PrivacyNote({ text }: PrivacyNoteProps): ReactElement {
  return (
    <View style={styles.wrap}>
      <FigmaIcon name="file" size={18} color={color.brand[600]} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}
