import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { color, semanticColor, shape, typography } from "../../../theme";

export interface GreetingBannerProps {
  educatorName: string;
  appointmentsTodayCount: number;
  onStartSession: () => void;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.primary,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 1,
    elevation: 2,
  },
  textColumn: { flex: 1, gap: 2 },
  greeting: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: semanticColor.textOnPrimary,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: semanticColor.textOnPrimary,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: color.surface,
    borderRadius: 16,
    height: 45,
    paddingHorizontal: 14,
    minHeight: shape.minTouchTarget,
  },
  startButtonLabel: {
    fontSize: typography.button.fontSize,
    lineHeight: typography.button.lineHeight,
    fontFamily: typography.button.fontFamily,
    color: semanticColor.textAccentOnSurface,
  },
});

function subtitleFor(appointmentsTodayCount: number): string {
  if (appointmentsTodayCount === 0) {
    return "Boas-vindas!";
  }
  if (appointmentsTodayCount === 1) {
    return "Você tem 1 sessão agendada para hoje";
  }
  return `Você tem ${appointmentsTodayCount} sessões agendadas para hoje`;
}

export function GreetingBanner({
  educatorName,
  appointmentsTodayCount,
  onStartSession,
}: GreetingBannerProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textColumn}>
        <Text
          style={styles.greeting}
          accessibilityLabel={`Olá, ${educatorName}!`}
        >
          {`Olá, ${educatorName}! 👋`}
        </Text>
        <Text style={styles.subtitle}>
          {subtitleFor(appointmentsTodayCount)}
        </Text>
      </View>
      <Pressable
        onPress={onStartSession}
        accessibilityRole="button"
        accessibilityLabel="Iniciar Sessão"
        style={styles.startButton}
      >
        <Ionicons
          name="play"
          size={16}
          color={semanticColor.textAccentOnSurface}
          testID="icon-play"
        />
        <Text style={styles.startButtonLabel} numberOfLines={1}>
          Iniciar Sessão
        </Text>
      </Pressable>
    </View>
  );
}
