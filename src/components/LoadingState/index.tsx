import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { color, typography } from "../../theme";

export interface LoadingStateProps {
  label?: string;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  label: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
});

export function LoadingState({ label = "Carregando" }: LoadingStateProps) {
  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <ActivityIndicator color={color.primary} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}
