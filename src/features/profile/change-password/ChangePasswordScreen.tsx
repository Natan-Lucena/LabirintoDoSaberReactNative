import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";

import { AppHeader, DsButton, Field, Toast, useToast } from "@/components/ds";
import {
  changePasswordSchema,
  type ChangePasswordValues,
} from "@/features/profile/change-password/schema";
import { useChangePassword } from "@/features/profile/change-password/useChangePassword";
import { color, semanticColor, typography } from "@/theme";

/** Tempo para ler a confirmação antes de voltar ao perfil. */
const BACK_DELAY_MS = 1200;

export function ChangePasswordScreen(): ReactElement {
  const router = useRouter();
  const toast = useToast();
  const { submit, failure, clearFailure, isBusy } = useChangePassword();
  const [showPasswords, setShowPasswords] = useState(false);
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function onSubmit(values: ChangePasswordValues) {
    const ok = await submit({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    // O token já foi guardado; fora da tela, nada de aviso nem de voltar.
    if (!ok || !mounted.current) return;
    setDone(true);
    toast.show("Senha alterada");
    timer.current = setTimeout(() => router.back(), BACK_DELAY_MS);
  }

  const toggle = {
    rightIcon: (
      <Ionicons
        name={showPasswords ? "eye-off-outline" : "eye-outline"}
        size={20}
        color={color.ink[600]}
      />
    ),
    onRightIconPress: () => setShowPasswords((current) => !current),
    rightIconAccessibilityLabel: showPasswords
      ? "Ocultar senhas"
      : "Mostrar senhas",
  };
  const common = {
    secureTextEntry: !showPasswords,
    placeholder: "••••••••",
    autoCapitalize: "none",
    autoCorrect: false,
  } as const;

  const currentError =
    errors.currentPassword?.message ??
    (failure?.field === "currentPassword" ? failure.message : undefined);
  const newError =
    errors.newPassword?.message ??
    (failure?.field === "newPassword" ? failure.message : undefined);
  const generalError =
    failure && failure.field === null ? failure.message : null;

  return (
    <View style={styles.screen}>
      <AppHeader title="Trocar senha" onBack={router.back} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <Controller
            control={control}
            name="currentPassword"
            render={({ field: { onChange, value } }) => (
              <Field
                label="Senha atual"
                value={value}
                onChangeText={(text) => {
                  clearFailure("currentPassword");
                  onChange(text);
                }}
                error={currentError}
                accessibilityLabel="Senha atual"
                textContentType="password"
                autoComplete="current-password"
                {...common}
                {...toggle}
              />
            )}
          />
          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, value } }) => (
              <Field
                label="Nova senha"
                value={value}
                onChangeText={onChange}
                error={newError}
                hint="Mínimo de 6 caracteres"
                accessibilityLabel="Nova senha"
                textContentType="newPassword"
                autoComplete="new-password"
                {...common}
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
                accessibilityLabel="Confirmar nova senha"
                textContentType="newPassword"
                autoComplete="new-password"
                {...common}
              />
            )}
          />
          {generalError ? (
            <Text
              style={styles.error}
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
            >
              {generalError}
            </Text>
          ) : null}
          <DsButton
            label="Trocar senha"
            onPress={() => void handleSubmit(onSubmit)()}
            loading={isBusy}
            disabled={isBusy || done}
            fullWidth
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast message={toast.message} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  flex: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 36 },
  error: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: semanticColor.dangerTextOnSurface,
  },
});
