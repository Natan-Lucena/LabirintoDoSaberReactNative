import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import { clinicQueryKeys } from "@/api/endpoints/clinic";
import {
  listStudentShares,
  shareStudent,
  unshareStudent,
} from "@/api/endpoints/student-shares";
import { ApiError } from "@/api/errors";
import { OfflineError, withOfflineGuard } from "@/api/query-client";
import type { StudentShare } from "@/api/types";

export interface StudentShareInput {
  studentId: string;
  educatorId: string;
}

/**
 * Quem tem acesso (sem o dono). `403` não é erro da tela: a colega pode não ler
 * a lista (CONTRATOS-BACKEND Q15) e então só o dono aparece.
 */
export function useStudentShares(
  studentId: string,
): UseQueryResult<StudentShare[] | null> {
  return useQuery({
    queryKey: clinicQueryKeys.studentShares(studentId),
    queryFn: async () => {
      try {
        return await listStudentShares(studentId);
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) return null;
        throw error;
      }
    },
    enabled: Boolean(studentId),
  });
}

/** Mensagem de uma escrita de compartilhamento (EQP-04 §4). */
export function shareErrorMessage(error: unknown): string {
  if (error instanceof OfflineError) {
    return "Sem conexão com a internet. Verifique a rede e tente novamente.";
  }
  if (error instanceof ApiError) {
    if (error.code === "NOT_IN_SAME_CLINIC") {
      return "Esta pessoa não está mais na sua equipe.";
    }
    if (error.status === 403) {
      return "Só quem cadastrou o paciente pode mudar quem acompanha.";
    }
    return error.message;
  }
  return "Não foi possível concluir. Tente novamente.";
}

async function refreshAfterError(
  client: QueryClient,
  studentId: string,
  error: unknown,
): Promise<void> {
  if (!(error instanceof ApiError)) return;
  if (error.code === "NOT_IN_SAME_CLINIC") {
    await client.invalidateQueries({ queryKey: clinicQueryKeys.view });
  } else if (error.status === 403) {
    await client.invalidateQueries({ queryKey: ["student"] });
  } else if (error.code === "SHARE_NOT_FOUND") {
    await client.invalidateQueries({
      queryKey: clinicQueryKeys.studentShares(studentId),
    });
  }
}

export function useShareStudent(): UseMutationResult<
  StudentShare[],
  Error,
  StudentShareInput
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: withOfflineGuard(shareStudent),
    onSuccess: (shares, { studentId }) => {
      client.setQueryData(clinicQueryKeys.studentShares(studentId), shares);
    },
    onError: (error, { studentId }) =>
      refreshAfterError(client, studentId, error),
  });
}

export function useUnshareStudent(): UseMutationResult<
  StudentShare[],
  Error,
  StudentShareInput
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: withOfflineGuard(unshareStudent),
    onSuccess: (shares, { studentId }) => {
      client.setQueryData(clinicQueryKeys.studentShares(studentId), shares);
    },
    onError: (error, { studentId }) =>
      refreshAfterError(client, studentId, error),
  });
}

/** `404 SHARE_NOT_FOUND` ao remover: o acesso já não existe (conta como sucesso). */
export function isShareAlreadyGone(error: unknown): boolean {
  return error instanceof ApiError && error.code === "SHARE_NOT_FOUND";
}
