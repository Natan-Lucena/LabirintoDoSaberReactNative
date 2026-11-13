import { useState, type ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { StepIndicator } from "@/components/StepIndicator";
import { Badge, DsButton, Field } from "@/components/ds";
import {
  forgotPasswordEmailSchema,
  newPasswordSchema,
  resetCodeSchema,
  type ForgotPasswordEmailValues,
  type NewPasswordValues,
  type ResetCodeValues,
} from "@/features/auth/schemas";
import { usePasswordReset } from "@/features/auth/password-reset/usePasswordReset";
import { color, semanticColor, typography } from "@/theme";

const bodyText = {
  fontSize: typography.body.fontSize,
  lineHeight: typography.body.lineHeight,
  fontFamily: typography.body.fontFamily,
};

const styles = StyleSheet.create({
  container: { gap: 20, backgroundColor: "transparent" },
  title: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontFamily: typography.screenTitle.fontFamily,
    color: color.text,
  },
  info: { ...bodyText, color: color.ink[950] },
  error: { ...bodyText, color: semanticColor.dangerTextOnSurface },
  hint: { ...bodyText, color: color.textTertiary },
});

export interface PasswordResetFlowProps {
  /** Chamado depois da senha trocada com sucesso. */
  onDone: () => void;
  /** "Voltar ao login". */
  onCancel: () => void;
}

const STEP_NUMBER = { email: 1, code: 2, password: 3 } as const;
const STEP_TITLE = {
  email: "Recuperar senha",
  code: "Digite o código",
  password: "Nova senha",
} as const;

export function PasswordResetFlow({
  onDone,
  onCancel,
}: PasswordResetFlowProps): ReactElement {
  const reset = usePasswordReset();

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {STEP_TITLE[reset.step]}
      </Text>
      <StepIndicator
        totalSteps={3}
        currentStep={STEP_NUMBER[reset.step]}
        labels={["Email", "Código", "Senha"]}
      />

      {reset.step === "email" ? (
        <EmailStep
          isBusy={reset.isBusy}
          onSubmit={(values) => reset.sendCode(values.email)}
        />
      ) : null}
      {reset.step === "code" ? (
        <CodeStep
          email={reset.email}
          isBusy={reset.isBusy}
          secondsLeft={reset.secondsLeft}
          canResend={reset.canResend}
          onSubmit={(values) => reset.verifyCode(values.code)}
          onResend={reset.resend}
          onChangeEmail={reset.backToEmail}
        />
      ) : null}
      {reset.step === "password" && reset.verified ? (
        <PasswordStep
          isBusy={reset.isBusy}
          onSubmit={async (values) => {
            if (await reset.resetPassword(values.newPassword)) onDone();
          }}
        />
      ) : null}

      {reset.error ? (
        <Text
          style={styles.error}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {reset.error}
        </Text>
      ) : null}

      <DsButton label="Voltar ao login" onPress={onCancel} variant="ghost" />
    </View>
  );
}

function EmailStep({
  isBusy,
  onSubmit,
}: {
  isBusy: boolean;
  onSubmit: (values: ForgotPasswordEmailValues) => Promise<void>;
}): ReactElement {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordEmailValues>({
    resolver: zodResolver(forgotPasswordEmailSchema),
    defaultValues: { email: "" },
  });

  return (
    <>
      <Text style={styles.info}>Digite seu email para receber o código</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <Field
            label="Email"
            value={value}
            onChangeText={(text) => onChange(text.trim())}
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
      <DsButton
        label="Enviar código"
        onPress={handleSubmit(onSubmit)}
        loading={isBusy}
        disabled={isBusy}
        fullWidth
      />
    </>
  );
}

function CodeStep({
  email,
  isBusy,
  secondsLeft,
  canResend,
  onSubmit,
  onResend,
  onChangeEmail,
}: {
  email: string;
  isBusy: boolean;
  secondsLeft: number;
  canResend: boolean;
  onSubmit: (values: ResetCodeValues) => Promise<void>;
  onResend: () => Promise<void>;
  onChangeEmail: () => void;
}): ReactElement {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetCodeValues>({
    resolver: zodResolver(resetCodeSchema),
    defaultValues: { code: "" },
  });

  return (
    <>
      {/* SN-02: o texto é o mesmo exista ou não a conta. */}
      <Text style={styles.info}>
        {`Se o e-mail tiver cadastro, enviamos um código de 6 dígitos para ${email}.`}
      </Text>
      <Controller
        control={control}
        name="code"
        render={({ field: { onChange, value } }) => (
          <Field
            label="Código"
            value={value}
            onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
            error={errors.code?.message}
            accessibilityLabel="Código de 6 dígitos"
            placeholder="000000"
            maxLength={6}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      />
      <DsButton
        label="Verificar código"
        onPress={handleSubmit(onSubmit)}
        loading={isBusy}
        disabled={isBusy}
        fullWidth
      />
      <DsButton
        label={
          canResend ? "Reenviar código" : `Reenviar código em ${secondsLeft} s`
        }
        onPress={() => void onResend()}
        variant="secondary"
        disabled={!canResend || isBusy}
      />
      <DsButton
        label="Alterar e-mail"
        onPress={onChangeEmail}
        variant="ghost"
        disabled={isBusy}
      />
    </>
  );
}

function PasswordStep({
  isBusy,
  onSubmit,
}: {
  isBusy: boolean;
  onSubmit: (values: NewPasswordValues) => Promise<void>;
}): ReactElement {
  const [showPassword, setShowPassword] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordValues>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const toggle = {
    rightIcon: (
      <Ionicons
        name={showPassword ? "eye-off-outline" : "eye-outline"}
        size={20}
        color={color.ink[600]}
      />
    ),
    onRightIconPress: () => setShowPassword((current) => !current),
    rightIconAccessibilityLabel: showPassword
      ? "Ocultar senha"
      : "Mostrar senha",
  };

  return (
    <>
      <Badge label="Código verificado" />
      <Text style={styles.info}>
        Código verificado! Agora crie uma nova senha segura
      </Text>
      <Controller
        control={control}
        name="newPassword"
        render={({ field: { onChange, value } }) => (
          <Field
            label="Nova senha"
            value={value}
            onChangeText={onChange}
            error={errors.newPassword?.message}
            hint="Mínimo de 6 caracteres"
            secureTextEntry={!showPassword}
            accessibilityLabel="Nova senha"
            textContentType="newPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            autoCapitalize="none"
            autoCorrect={false}
            {...toggle}
          />
        )}
      />
      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, value } }) => (
          <Field
            label="Confirmar nova senha"
            value={value}
            onChangeText={onChange}
            error={errors.confirmPassword?.message}
            secureTextEntry={!showPassword}
            accessibilityLabel="Confirmar nova senha"
            textContentType="newPassword"
            autoComplete="new-password"
            placeholder="••••••••"
            autoCapitalize="none"
            autoCorrect={false}
          />
        )}
      />
      <DsButton
        label="Redefinir senha"
        onPress={handleSubmit(onSubmit)}
        loading={isBusy}
        disabled={isBusy}
        fullWidth
      />
    </>
  );
}
