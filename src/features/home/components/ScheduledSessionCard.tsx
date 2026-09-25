import { StyleSheet, Text, View } from "react-native";

import { Card } from "../../../components/Card";
import { Tag } from "../../../components/Tag";
import { color, shape, typography } from "../../../theme";
import { formatTime } from "../../../utils/date";

export interface ScheduledSessionCardProps {
  studentName: string;
  scheduledAt: Date;
  statusLabel: string;
  accent?: "primary" | "pink";
  onPress?: () => void;
}

const styles = StyleSheet.create({
  wrapper: {
    borderLeftWidth: shape.accentBorderWidth,
    borderLeftColor: color.primary,
    borderRadius: shape.cardRadius,
  },
  wrapperPink: { borderLeftColor: color.pink },
  content: { gap: 4 },
  studentName: {
    fontSize: typography.cardTitle.fontSize,
    lineHeight: typography.cardTitle.lineHeight,
    fontFamily: typography.cardTitle.fontFamily,
    color: color.text,
  },
  time: {
    fontSize: typography.time.fontSize,
    lineHeight: typography.time.lineHeight,
    fontFamily: typography.time.fontFamily,
    color: color.textSecondary,
  },
});

export function ScheduledSessionCard({
  studentName,
  scheduledAt,
  statusLabel,
  accent = "primary",
  onPress,
}: ScheduledSessionCardProps) {
  return (
    <View style={[styles.wrapper, accent === "pink" && styles.wrapperPink]}>
      <Card onPress={onPress}>
        <View style={styles.content}>
          <Text style={styles.studentName}>{studentName}</Text>
          <Text style={styles.time}>{formatTime(scheduledAt)}</Text>
          <Tag label={statusLabel} variant="primary" />
        </View>
      </Card>
    </View>
  );
}
