import { useState, type ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { DsButton, Field } from "@/components/ds";
import { EDUCATOR_EXISTS_MESSAGE } from "@/features/auth/invite/messages";
import type { RegisterOutcome } from "@/features/auth/invite/useRegisterWithInvite";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas";
import { color, semanticColor, typography } from "@/theme";

const styles = StyleSheet.create({
  container: { gap: 16 },
  error: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: semanticColor.dangerTextOnSurface,
  },
});

export interface RegisterFormProps {
  isSubmitting: boolean;
  /** Envia o cadastro e devolve o resultado (o erro de campo fica no formulário). */
  onSubmit: (values: RegisterFormValues) => Promise<RegisterOutcome>;
  /** "Ir para o login" quando o e-mail já tem conta. */
  onGoToLogin: () => void;
  /** Resultado que a tela pai trata (navegação). */
  onOutcome: (outcome: RegisterOutcome) => void;
}

export function RegisterForm({
  isSubmitting,
  onSubmit,
  onGoToLogin,
  onOutcome,
}: RegisterFormProps): ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function submit(values: RegisterFormValues) {
    setFormError(null);
    const outcome = await onSubmit(values);
    if (outcome.status === "error") {
      setFormError(outcome.message);
      setValue("password", "");
      setValue("confirmPassword", "");
      return;
    }
    onOutcome(outcome);
  }

  return (
    <View style={styles.container}>
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <Field
            label="Nome"
            value={value}
            onChangeText={onChange}
            error={errors.name?.message}
            accessibilityLabel="Nome"
            autoComplete="name"
            textContentType="name"
          />
        )}
      />
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Field
            label="E-mail"
            value={value}
            onChangeText={(text) => onChange(text.trim())}
            error={errors.email?.message}
            accessibilityLabel="E-mail"
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
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <Field
            label="Confirmar senha"
            value={value}
            onChangeText={onChange}
            error={errors.confirmPassword?.message}
            secureTextEntry={!showPassword}
            accessibilityLabel="Confirmar senha"
            placeholder="••••••••"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      />

      {formError ? (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {formError}
        </Text>
      ) : null}
      {formError === EDUCATOR_EXISTS_MESSAGE ? (
        <DsButton
          label="Ir para o login"
          variant="secondary"
          onPress={onGoToLogin}
          fullWidth
        />
      ) : null}

      <DsButton
        label="Criar conta"
        onPress={handleSubmit(submit)}
        loading={isSubmitting}
        disabled={isSubmitting}
        fullWidth
      />
    </View>
  );
}
