import { useEffect, type ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";

import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { color, typography } from "@/theme";
import {
  acknowledgeSessionExpired,
  wasSessionExpired,
} from "@/features/auth/session-expiry";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";
import { useSignIn } from "@/features/auth/useSignIn";
import { APP_DESTINATION } from "@/features/auth/routes";

const styles = StyleSheet.create({
  container: { gap: 16 },
  notice: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  formError: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.pink,
  },
  forgotPassword: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.primary,
    textAlign: "center",
  },
});

export function LoginForm(): ReactElement {
  const router = useRouter();
  const { submit, isSubmitting, formError, clearFormError } = useSignIn();
  const showSessionExpiredNotice = wasSessionExpired();

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
          <TextField
            label="E-mail"
            value={value}
            onChangeText={(text) => {
              setValue("email", text);
              onChange(text);
            }}
            error={errors.email?.message}
            accessibilityLabel="E-mail"
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextField
            label="Senha"
            value={value}
            onChangeText={onChange}
            error={errors.password?.message}
            secureTextEntry
            accessibilityLabel="Senha"
          />
        )}
      />

      {formError ? (
        <View style={{ gap: 8 }}>
          <Text
            style={styles.formError}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {formError}
          </Text>
          <Button
            label="Tentar novamente"
            onPress={handleRetry}
            variant="secondary"
            disabled={isSubmitting}
          />
        </View>
      ) : null}

      <Button
        label="Entrar"
        onPress={handleSubmit(onSubmit)}
        loading={isSubmitting}
        disabled={isSubmitting}
      />

      <Pressable
        onPress={handleForgotPassword}
        accessibilityRole="link"
        accessibilityLabel="Esqueceu a senha?"
        hitSlop={8}
      >
        <Text style={styles.forgotPassword}>Esqueceu a senha?</Text>
      </Pressable>
    </View>
  );
}
