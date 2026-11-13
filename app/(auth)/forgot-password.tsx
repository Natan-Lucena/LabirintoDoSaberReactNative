import type { ReactElement } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/components/Screen";
import { AUTH_DESTINATION } from "@/features/auth/routes";
import { PasswordResetFlow } from "@/features/auth/password-reset/PasswordResetFlow";
import { markPasswordChanged } from "@/features/auth/password-reset/notice";
import { shape } from "@/theme";

const styles = StyleSheet.create({
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
  },
});

export default function ForgotPasswordScreen(): ReactElement {
  const router = useRouter();

  // O login empurrou esta tela: voltar evita empilhar outro login. Sem
  // histórico (link direto), cai no replace.
  function goToLogin() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(AUTH_DESTINATION);
  }

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <PasswordResetFlow
              onDone={() => {
                markPasswordChanged();
                goToLogin();
              }}
              onCancel={goToLogin}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
