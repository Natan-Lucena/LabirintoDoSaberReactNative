import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Screen } from "@/components/Screen";
import { LoginForm } from "@/features/auth/LoginForm";
import { color, shape, typography } from "@/theme";

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: "center", padding: 24, gap: 24 },
  title: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontFamily: typography.screenTitle.fontFamily,
    color: color.text,
    textAlign: "center",
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: shape.cardRadius,
    borderWidth: shape.hairlineWidth,
    borderColor: color.border,
    padding: 20,
  },
});

export default function LoginScreen(): ReactElement {
  return (
    <Screen scroll>
      <View style={styles.content}>
        <Text style={styles.title}>Labirinto do Saber</Text>
        <View style={styles.card}>
          <LoginForm />
        </View>
      </View>
    </Screen>
  );
}
