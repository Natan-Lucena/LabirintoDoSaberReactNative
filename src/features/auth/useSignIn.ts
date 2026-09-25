import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { getMe, signIn } from "@/api/endpoints/educator";
import { ApiError } from "@/api/errors";
import { OfflineError, withOfflineGuard } from "@/api/query-client";
import { activateEducator } from "@/storage/mmkv";
import { useAuthStore } from "@/stores/auth";
import type { LoginFormValues } from "@/features/auth/schemas";

const INVALID_CREDENTIALS_MESSAGE =
  "E-mail ou senha incorretos. Tente novamente.";
const NETWORK_ERROR_MESSAGE =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";

async function signInAndLoadEducator(values: LoginFormValues): Promise<void> {
  const { token } = await signIn(values);
  const me = await getMe();

  await activateEducator(me.id);
  await useAuthStore.getState().login(token, me.id);
}

export interface UseSignInResult {
  /** Retorna true em sucesso, false quando formError foi definido. */
  submit: (values: LoginFormValues) => Promise<boolean>;
  isSubmitting: boolean;
  formError: string | null;
  clearFormError: () => void;
}

export function useSignIn(): UseSignInResult {
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: withOfflineGuard(signInAndLoadEducator),
  });

  const submit = useCallback(
    async (values: LoginFormValues): Promise<boolean> => {
      setFormError(null);

      try {
        await mutation.mutateAsync(values);
        return true;
      } catch (error) {
        if (error instanceof OfflineError) {
          setFormError(NETWORK_ERROR_MESSAGE);
          return false;
        }

        if (error instanceof ApiError) {
          if (error.status === 401) {
            setFormError(INVALID_CREDENTIALS_MESSAGE);
            return false;
          }

          if (error.isNetworkError || error.isTimeout) {
            setFormError(NETWORK_ERROR_MESSAGE);
            return false;
          }
        }

        setFormError(NETWORK_ERROR_MESSAGE);
        return false;
      }
    },
    [mutation],
  );

  const clearFormError = useCallback(() => setFormError(null), []);

  return {
    submit,
    isSubmitting: mutation.isPending,
    formError,
    clearFormError,
  };
}
