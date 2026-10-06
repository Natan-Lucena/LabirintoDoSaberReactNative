// `.ai-insight` do Figma Make. Ver ficha DS-05.
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { color, fontFamilies } from "../../theme";

export interface AIInsightProps {
  text: string;
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.lavenderStrong,
  },
  text: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fontFamilies.nunito.regular,
    color: color.lavenderStrong,
  },
});

export function AIInsight({ text }: AIInsightProps): ReactElement {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}
