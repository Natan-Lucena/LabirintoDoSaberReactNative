import type { ReactElement, ReactNode } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Screen } from "@/components/Screen";
import { color, shape, typography } from "@/theme";

const styles = StyleSheet.create({
  screen: {
    experimental_backgroundImage:
      "linear-gradient(160.9deg, rgb(174, 226, 224) 32.5%, rgb(246, 248, 248) 85.5%)",
  },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    borderRadius: 25,
    borderWidth: shape.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(226, 255, 254, 0.9)",
    padding: 31,
    gap: 20,
  },
  title: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontFamily: typography.screenTitle.fontFamily,
    color: color.text,
  },
});

export interface AuthCardProps {
  title: string;
  children: ReactNode;
}

/** Fundo e cartão das telas do convite, no visual do login. */
export function AuthCard({ title, children }: AuthCardProps): ReactElement {
  return (
    <Screen style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <Text style={styles.title} accessibilityRole="header">
              {title}
            </Text>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
