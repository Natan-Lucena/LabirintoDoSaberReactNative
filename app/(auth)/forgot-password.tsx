// Placeholder mínimo (T-401): a T-403 substitui este conteúdo pelo fluxo
// real de recuperação de senha (Email → Código → Senha). Existe só para o
// link "Esqueceu a senha?" do Login ter uma rota válida.
import type { ReactElement } from "react";
import { useRouter } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";

export default function ForgotPasswordScreen(): ReactElement {
  const router = useRouter();

  return (
    <Screen>
      <EmptyState
        title="Em breve"
        message="A recuperação de senha ainda não está disponível."
        actionLabel="Voltar ao login"
        onActionPress={() => router.back()}
      />
    </Screen>
  );
}
