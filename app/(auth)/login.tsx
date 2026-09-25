import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";

import { Screen } from "@/components/Screen";
import { LoginForm } from "@/features/auth/LoginForm";
import { color, shape, typography } from "@/theme";

const styles = StyleSheet.create({
  screen: {
    experimental_backgroundImage:
      "linear-gradient(160.9deg, rgb(174, 226, 224) 32.5%, rgb(246, 248, 248) 85.5%)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 32,
  },
  logo: { width: 146, height: 89 },
  title: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontFamily: typography.screenTitle.fontFamily,
    color: color.text,
    textAlign: "center",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    marginHorizontal: 20,
    borderRadius: 25,
    borderWidth: shape.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.5)",
    backgroundColor: "rgba(226, 255, 254, 0.9)",
    padding: 31,
    gap: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 8,
  },
  subtitle: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textTertiary,
  },
});

export default function LoginScreen(): ReactElement {
  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <Image
          source={require("../../assets/images/logo-labirinto.png")}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="Labirinto do Saber"
        />
        <View style={styles.card}>
          <Text style={styles.title}>Entrar</Text>
          <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>
          <LoginForm />
        </View>
      </View>
    </Screen>
  );
}
