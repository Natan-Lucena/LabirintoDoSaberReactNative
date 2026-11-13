import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { changePassword } from "@/api/endpoints/educator";
import { ApiError } from "@/api/errors";
import { OfflineError, withOfflineGuard } from "@/api/query-client";
import { useAuthStore } from "@/stores/auth";

const NETWORK_ERROR_MESSAGE =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";
const GENERIC_ERROR_MESSAGE = "Não foi possível concluir. Tente novamente.";

export interface ChangePasswordFailure {
  field: "currentPassword" | "newPassword" | null;
  message: string;
}

function describeError(error: unknown): ChangePasswordFailure {
  if (error instanceof OfflineError)
    return { field: null, message: NETWORK_ERROR_MESSAGE };
  if (error instanceof ApiError) {
    if (error.code === "INVALID_CURRENT_PASSWORD")
      return { field: "currentPassword", message: error.message };
    if (error.code === "PASSWORD_SAME_AS_OLD")
      return { field: "newPassword", message: error.message };
    if (error.isNetworkError || error.isTimeout)
      return { field: null, message: NETWORK_ERROR_MESSAGE };
    if (error.message) return { field: null, message: error.message };
  }
  return { field: null, message: GENERIC_ERROR_MESSAGE };
}

/**
 * Troca a senha logada. As senhas só passam pela mutação (sem cache nem
 * retry); o token novo (SN-08) substitui o guardado para manter a sessão.
 */
export function useChangePassword() {
  const [failure, setFailure] = useState<ChangePasswordFailure | null>(null);
  const mutation = useMutation({
    mutationFn: withOfflineGuard(changePassword),
    gcTime: 0,
    retry: false,
  });

  const submit = useCallback(
    async (input: {
      currentPassword: string;
      newPassword: string;
    }): Promise<boolean> => {
      setFailure(null);
      try {
        const { token } = await mutation.mutateAsync(input);
        const { educatorId, login } = useAuthStore.getState();
        await login(token, educatorId ?? undefined);
        return true;
      } catch (caught) {
        setFailure(describeError(caught));
        return false;
      }
    },
    [mutation],
  );

  return { submit, failure, isBusy: mutation.isPending };
}
