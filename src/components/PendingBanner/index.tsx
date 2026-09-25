import { useEffect } from "react";
import { AccessibilityInfo, StyleSheet, Text } from "react-native";

import { Card } from "../Card";
import { color, typography } from "../../theme";

export interface PendingBannerProps {
  message: string;
}

const styles = StyleSheet.create({
  message: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
});

export function PendingBanner({ message }: PendingBannerProps) {
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    <Card variant="accent" accessibilityLabel={message}>
      <Text style={styles.message} accessible accessibilityRole="alert">
        {message}
      </Text>
    </Card>
  );
}
