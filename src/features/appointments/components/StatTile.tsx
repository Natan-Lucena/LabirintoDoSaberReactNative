import { StyleSheet, Text, View } from "react-native";

import { color, typography } from "../../../theme";

export interface StatTileProps {
  label: string;
  value: string;
}

const styles = StyleSheet.create({
  container: { alignItems: "flex-start" },
  label: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: color.textSecondary,
  },
  value: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
});

export function StatTile({ label, value }: StatTileProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
