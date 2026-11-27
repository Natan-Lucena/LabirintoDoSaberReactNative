import { useCallback, useState } from "react";

import { register } from "@/api/endpoints/educator";
import { normalizeApiError } from "@/api/errors";
import { onlineManager } from "@tanstack/react-query";
import type { RegisterFormValues } from "@/features/auth/schemas";
import {
  NETWORK_MESSAGE,
  inviteErrorMessage,
} from "@/features/auth/invite/messages";
import { signInAndLoadEducator } from "@/features/auth/useSignIn";

export type RegisterOutcome =
  /** Conta criada e sessão aberta. */
  | { status: "signed-in" }
  /** Conta criada, mas o login automático falhou: ir ao login (sem repetir). */
  | { status: "login-failed" }
  /** O convite foi recusado: voltar para a etapa do código. */
  | { status: "invite-invalid"; message: string }
  | { status: "error"; message: string };

export interface UseRegisterWithInviteResult {
  submit: (
    values: RegisterFormValues,
    inviteCode: string,
  ) => Promise<RegisterOutcome>;
  isSubmitting: boolean;
}

/**
 * Cadastro pelo convite (EQP-03): `POST /educator/register` com `inviteCode` e,
 * se der certo, o mesmo login do `useSignIn`. Nada de senha em log, cache ou URL.
 */
export function useRegisterWithInvite(): UseRegisterWithInviteResult {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = useCallback(
    async (
      values: RegisterFormValues,
      inviteCode: string,
    ): Promise<RegisterOutcome> => {
      if (!onlineManager.isOnline()) {
        return { status: "error", message: NETWORK_MESSAGE };
      }
      setIsSubmitting(true);
      try {
        try {
          await register({
            name: values.name.trim(),
            email: values.email.trim(),
            password: values.password,
            inviteCode,
          });
        } catch (error) {
          const message = inviteErrorMessage(error);
          if (normalizeApiError(error).code === "INVITE_INVALID") {
            return { status: "invite-invalid", message };
          }
          return { status: "error", message };
        }

        try {
          await signInAndLoadEducator({
            email: values.email.trim(),
            password: values.password,
          });
          return { status: "signed-in" };
        } catch {
          return { status: "login-failed" };
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return { submit, isSubmitting };
}
