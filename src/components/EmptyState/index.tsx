import { StyleSheet, Text, View } from "react-native";

import { Button } from "../Button";
import { FigmaIcon, type FigmaIconName } from "../FigmaIcon";
import { color, typography } from "../../theme";

export interface EmptyStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  /** Ícone em círculo `brand-50` acima do título. DS-06. */
  icon?: FigmaIconName;
}

const ICON_CIRCLE_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 8,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    backgroundColor: color.brand[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.ink[950],
    textAlign: "center",
  },
  message: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.ink[600],
    textAlign: "center",
  },
});

export function EmptyState({
  title,
  message,
  actionLabel,
  onActionPress,
  icon,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon ? (
        <View style={styles.iconCircle}>
          <FigmaIcon name={icon} size={28} color={color.brand[700]} />
        </View>
      ) : null}
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
