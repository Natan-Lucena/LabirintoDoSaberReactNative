import { useEffect, useState, type ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";

import { DsButton, Field } from "@/components/ds";
import { color, semanticColor, typography } from "@/theme";
import {
  acknowledgeSessionExpired,
  wasSessionExpired,
} from "@/features/auth/session-expiry";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useSignIn } from "@/features/auth/useSignIn";
import { APP_DESTINATION } from "@/features/auth/routes";

const styles = StyleSheet.create({
  container: { gap: 20, backgroundColor: "transparent" },
  notice: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.ink[950],
  },
  formError: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.danger,
  },
  forgotPassword: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: semanticColor.textAccentOnSurface,
    textAlign: "right",
  },
  forgotPasswordButton: {
    minHeight: 48,
    justifyContent: "center",
    alignItems: "flex-end",
  },
});

export function LoginForm(): ReactElement {
  const router = useRouter();
  const { submit, isSubmitting, formError, clearFormError } = useSignIn();
  const showSessionExpiredNotice = wasSessionExpired();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (showSessionExpiredNotice) {
      acknowledgeSessionExpired();
    }
  }, [showSessionExpiredNotice]);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    clearFormError();
    const succeeded = await submit(values);

    if (succeeded) {
      router.replace(APP_DESTINATION);
      return;
    }

    setValue("password", "");
  }

  function handleForgotPassword() {
    router.push("/(auth)/forgot-password");
  }

  function handleRetry() {
    handleSubmit(onSubmit)();
  }

  return (
    <View style={styles.container}>
      {showSessionExpiredNotice ? (
        <Text style={styles.notice} accessibilityRole="alert">
          Sua sessão expirou. Entre novamente.
        </Text>
      ) : null}

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Field
            label="Email"
            value={value}
            onChangeText={(text) => {
              const email = text.trim();
              setValue("email", email);
              onChange(email);
            }}
            error={errors.email?.message}
            accessibilityLabel="Email"
            placeholder="seu@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <Field
            label="Senha"
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
            secureTextEntry={!showPassword}
            accessibilityLabel="Senha"
            placeholder="••••••••"
            autoCapitalize="none"
            autoCorrect={false}
            rightIcon={
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={color.ink[600]}
              />
            }
            onRightIconPress={() => setShowPassword((current) => !current)}
            rightIconAccessibilityLabel={
              showPassword ? "Ocultar senha" : "Mostrar senha"
            }
          />
        )}
      />

      <Pressable
        style={styles.forgotPasswordButton}
        onPress={handleForgotPassword}
        accessibilityRole="link"
        accessibilityLabel="Esqueci minha senha"
        hitSlop={8}
      >
        <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
      </Pressable>

      {formError ? (
        <View style={{ gap: 8 }}>
          <Text
            style={styles.formError}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {formError}
          </Text>
          <DsButton
            label="Tentar novamente"
            onPress={handleRetry}
            variant="secondary"
            disabled={isSubmitting}
          />
        </View>
      ) : null}

      <DsButton
        label="Entrar agora"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={isSubmitting}
        fullWidth
      />
    </View>
  );
}
