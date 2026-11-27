import type { ReactElement } from "react";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { AuthCard } from "@/features/auth/invite/AuthCard";
import { isValidInviteCode } from "@/features/auth/invite/code";
import {
  setInviteScreenError,
  setLoginInviteNotice,
} from "@/features/auth/invite/notice";
import { RegisterForm } from "@/features/auth/invite/RegisterForm";
import { useRegisterWithInvite } from "@/features/auth/invite/useRegisterWithInvite";
import { APP_DESTINATION, AUTH_DESTINATION } from "@/features/auth/routes";

export default function RegisterScreen(): ReactElement {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { submit, isSubmitting } = useRegisterWithInvite();

  // O cadastro só vale depois da prévia: sem o código, volta à etapa dele.
  if (typeof code !== "string" || !isValidInviteCode(code)) {
    return <Redirect href="/(auth)/invite" />;
  }

  return (
    <AuthCard title="Criar minha conta">
      <RegisterForm
        isSubmitting={isSubmitting}
        onSubmit={(values) => submit(values, code)}
        onGoToLogin={() => router.dismissTo(AUTH_DESTINATION)}
        onOutcome={(outcome) => {
          if (outcome.status === "signed-in") {
            router.replace(APP_DESTINATION);
          } else if (outcome.status === "login-failed") {
            setLoginInviteNotice({ kind: "registered" });
            router.dismissTo(AUTH_DESTINATION);
          } else if (outcome.status === "invite-invalid") {
            setInviteScreenError(outcome.message);
            router.dismissTo("/(auth)/invite");
          }
        }}
      />
    </AuthCard>
  );
}
