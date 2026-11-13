import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";

import { Screen } from "@/components/Screen";
import { PasswordResetFlow } from "@/features/auth/password-reset/PasswordResetFlow";
import { AUTH_DESTINATION } from "@/features/auth/routes";
import { markPasswordChanged } from "@/features/auth/password-reset/notice";
import { shape } from "@/theme";

const styles = StyleSheet.create({
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

  function goToLogin() {
    router.replace(AUTH_DESTINATION);
  }

  return (
    <Screen scroll style={styles.content}>
      <View style={styles.card}>
        <PasswordResetFlow
          onDone={() => {
            markPasswordChanged();
            goToLogin();
          }}
          onCancel={goToLogin}
        />
      </View>
    </Screen>
  );
}
