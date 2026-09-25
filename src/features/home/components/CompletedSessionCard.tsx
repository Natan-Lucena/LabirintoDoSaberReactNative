import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { color, typography } from "../../../theme";

export interface CompletedSessionCardProps {
  studentName?: string;
  sessionName: string;
  accent?: "primary" | "info" | "success";
  onPress?: () => void;
}

// UX2 (Figma "Home sem agenda"): carrossel horizontal de sessões concluídas,
// cor de destaque alternando por índice (borda esquerda). `info` não tem
// token no tema (T-201) — usamos o valor exato do Figma rgb(74,144,226).
const ACCENT_COLOR: Record<
  NonNullable<CompletedSessionCardProps["accent"]>,
  string
> = {
  primary: color.primary,
  info: "rgb(74, 144, 226)",
  success: color.success,
};

const styles = StyleSheet.create({
  container: {
    width: 249,
    backgroundColor: color.background,
    borderRadius: 13,
    borderLeftWidth: 3,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: { width: 33, height: 33, borderRadius: 33 / 2 },
  texts: { flex: 1, gap: 2 },
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
  accent = "primary",
  onPress,
}: CompletedSessionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        studentName ? `${studentName}, ${sessionName}` : sessionName
      }
      style={[styles.container, { borderLeftColor: ACCENT_COLOR[accent] }]}
    >
      <Image
        source={require("../../../../assets/images/avatar-crianca.png")}
        style={styles.avatar}
        accessibilityIgnoresInvertColors
      />
      <View style={styles.texts}>
        {studentName ? (
          <Text style={styles.studentName}>{studentName}</Text>
        ) : null}
        <Text style={styles.sessionName}>{sessionName}</Text>
      </View>
    </Pressable>
  );
}
