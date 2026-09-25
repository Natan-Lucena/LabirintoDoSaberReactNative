import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../../components/Button";
import { Card } from "../../../components/Card";
import { Tag } from "../../../components/Tag";
import { color, shape, typography } from "../../../theme";

export type AppointmentCardStatus = "PENDING" | "COMPLETED" | "CANCELLED";

export interface AppointmentCardProps {
  time: string;
  status: AppointmentCardStatus;
  studentName: string;
  observation?: string;
  onEdit: () => void;
  onReschedule: () => void;
  onDelete: () => void;
  onPlan: () => void;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  time: {
    fontSize: typography.time.fontSize,
    lineHeight: typography.time.lineHeight,
    fontFamily: typography.time.fontFamily,
    color: color.text,
    marginRight: 12,
  },
  statusRow: { flexDirection: "row", alignItems: "center" },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
  },
  studentName: {
    fontSize: typography.cardTitle.fontSize,
    lineHeight: typography.cardTitle.lineHeight,
    fontFamily: typography.cardTitle.fontFamily,
    color: color.text,
    marginBottom: 4,
  },
  observation: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textSecondary,
    marginBottom: 12,
  },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  planLink: {
    minHeight: shape.minTouchTarget,
    justifyContent: "center",
  },
  planLinkLabel: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.accent,
  },
});

// Decorativo (G-12/DESIGN §4): color.success só como indicador visual, nunca
// como cor de texto (contraste 2,13:1, não passa AA).
const STATUS_CONFIG: Record<
  "PENDING" | "COMPLETED",
  { label: string; dotColor: string; textColor: string }
> = {
  PENDING: {
    label: "Agendada",
    dotColor: color.primary,
    textColor: color.accent,
  },
  COMPLETED: {
    label: "Realizada",
    dotColor: color.success,
    textColor: color.text,
  },
};

export function AppointmentCard({
  time,
  status,
  studentName,
  observation,
  onEdit,
  onReschedule,
  onDelete,
  onPlan,
}: AppointmentCardProps) {
  return (
    <Card variant="default">
      <View style={styles.header}>
        <Text style={styles.time}>{time}</Text>
        {status === "CANCELLED" ? (
          <Tag label="Cancelada" variant="neutral" />
        ) : (
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: STATUS_CONFIG[status].dotColor },
              ]}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
            />
            <Text
              style={[
                styles.statusLabel,
                { color: STATUS_CONFIG[status].textColor },
              ]}
            >
              {STATUS_CONFIG[status].label}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.studentName}>{studentName}</Text>
      {observation ? (
        <Text style={styles.observation}>{observation}</Text>
      ) : null}
      <View style={styles.actions}>
        <Button label="Editar" onPress={onEdit} variant="secondary" />
        <Button label="Remarcar" onPress={onReschedule} variant="secondary" />
        <Button label="Excluir" onPress={onDelete} variant="secondary" />
      </View>
      <Pressable
        onPress={onPlan}
        accessibilityRole="button"
        accessibilityLabel="Montar Plano da Sessão"
        style={styles.planLink}
      >
        <Text style={styles.planLinkLabel}>Montar Plano da Sessão</Text>
      </Pressable>
    </Card>
  );
}
