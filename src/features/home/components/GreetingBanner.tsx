import { StyleSheet, Text, View } from "react-native";

import { Button } from "../../../components/Button";
import { color, semanticColor, typography } from "../../../theme";

export interface GreetingBannerProps {
  educatorName: string;
  appointmentsTodayCount: number;
  onStartSession: () => void;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: color.primary,
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  greetingRow: { flexDirection: "row", alignItems: "center" },
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
    marginBottom: 12,
  },
  buttonRow: { alignItems: "flex-start" },
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
      <View style={styles.greetingRow}>
        <Text
          style={styles.greeting}
          accessibilityLabel={`Olá, ${educatorName}!`}
        >
          {`Olá, ${educatorName}! 👋`}
        </Text>
      </View>
      <Text style={styles.subtitle}>{subtitleFor(appointmentsTodayCount)}</Text>
      <View style={styles.buttonRow}>
        <Button
          label="Iniciar Sessão"
          onPress={onStartSession}
          variant="onPrimaryWhite"
        />
      </View>
    </View>
  );
}
