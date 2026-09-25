import { StyleSheet, Text, View } from "react-native";

import { Button } from "../Button";
import { color, typography } from "../../theme";

export interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
    textAlign: "center",
  },
  message: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
    textAlign: "center",
  },
});

export function EmptyState({
  title,
  message,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessible accessibilityRole="header">
        {title}
      </Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onActionPress ? (
        <Button
          label={actionLabel}
          onPress={onActionPress}
          variant="secondary"
        />
      ) : null}
    </View>
  );
}
