import { StyleSheet, Text, View } from "react-native";

import { Button } from "../Button";
import { color, typography } from "../../theme";

export interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 12,
  },
  message: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
    textAlign: "center",
  },
});

export function ErrorState({
  message,
  onRetry,
  retryLabel = "Tentar novamente",
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text
        style={styles.message}
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        {message}
      </Text>
      <Button label={retryLabel} onPress={onRetry} variant="secondary" />
    </View>
  );
}
