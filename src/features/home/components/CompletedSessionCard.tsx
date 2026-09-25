import { StyleSheet, Text } from "react-native";

import { Card } from "../../../components/Card";
import { color, typography } from "../../../theme";

export interface CompletedSessionCardProps {
  studentName?: string;
  sessionName: string;
  onPress?: () => void;
}

const styles = StyleSheet.create({
  studentName: {
    fontSize: typography.cardTitle.fontSize,
    lineHeight: typography.cardTitle.lineHeight,
    fontFamily: typography.cardTitle.fontFamily,
    color: color.text,
  },
  sessionName: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textSecondary,
  },
});

export function CompletedSessionCard({
  studentName,
  sessionName,
  onPress,
}: CompletedSessionCardProps) {
  return (
    <Card variant="gradient" onPress={onPress}>
      {studentName ? (
        <Text style={styles.studentName}>{studentName}</Text>
      ) : null}
      <Text style={styles.sessionName}>{sessionName}</Text>
    </Card>
  );
}
