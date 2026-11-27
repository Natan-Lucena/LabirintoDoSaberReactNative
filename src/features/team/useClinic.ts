import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  clinicQueryKeys,
  createClinic,
  createClinicInvite,
  getClinic,
  listClinicInvites,
  removeClinicMember,
  renameClinic,
  revokeClinicInvite,
  updateClinicMemberRole,
  type CreateClinicInput,
  type CreateClinicInviteInput,
  type UpdateClinicMemberRoleInput,
} from "@/api/endpoints/clinic";
import { ApiError } from "@/api/errors";
import { withOfflineGuard } from "@/api/query-client";
import type { ClinicInvite, ClinicView } from "@/api/types";
import { homeQueryKeys } from "@/features/home/useHomeData";

/** `404 NOT_IN_CLINIC` vira `null` (estado "sem equipe", não erro nem retry). */
async function getClinicOrNull(): Promise<ClinicView | null> {
  try {
    return await getClinic();
  } catch (error) {
    if (error instanceof ApiError && error.code === "NOT_IN_CLINIC") {
      return null;
    }
    throw error;
  }
}

export function useClinic(): UseQueryResult<ClinicView | null> {
  return useQuery({
    queryKey: clinicQueryKeys.view,
    queryFn: getClinicOrNull,
  });
}

export function useCreateClinic(): UseMutationResult<
  ClinicView,
  Error,
  CreateClinicInput
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: withOfflineGuard(createClinic),
    onSuccess: async (view) => {
      client.setQueryData(clinicQueryKeys.view, view);
      await client.invalidateQueries({ queryKey: homeQueryKeys.educator });
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.code === "ALREADY_IN_CLINIC") {
        await client.invalidateQueries({ queryKey: clinicQueryKeys.view });
      }
    },
  });
}

/** Convites ativos: só ADMIN lê (`403 FORBIDDEN_ROLE` para os demais). */
export function useClinicInvites(
  enabled: boolean,
): UseQueryResult<ClinicInvite[]> {
  return useQuery({
    queryKey: clinicQueryKeys.invites,
    queryFn: listClinicInvites,
    enabled,
  });
}

/** Erros que dizem que o cache de papel ou de membros ficou velho (EQP-02 §4). */
async function refreshAfterError(
  client: QueryClient,
  error: unknown,
): Promise<void> {
  if (!(error instanceof ApiError)) return;
  if (error.code === "FORBIDDEN_ROLE") {
    await Promise.all([
      client.invalidateQueries({ queryKey: clinicQueryKeys.view }),
      client.invalidateQueries({ queryKey: homeQueryKeys.educator }),
    ]);
  } else if (error.code === "MEMBER_NOT_FOUND") {
    await client.invalidateQueries({ queryKey: clinicQueryKeys.view });
  } else if (error.code === "INVITE_NOT_FOUND") {
    await client.invalidateQueries({ queryKey: clinicQueryKeys.invites });
  }
}

export function useRenameClinic(): UseMutationResult<
  ClinicView,
  Error,
  { name: string }
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: withOfflineGuard(renameClinic),
    onSuccess: (view) => {
      client.setQueryData(clinicQueryKeys.view, view);
    },
    onError: (error) => refreshAfterError(client, error),
  });
}

export function useRevokeInvite(): UseMutationResult<void, Error, string> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: withOfflineGuard(revokeClinicInvite),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: clinicQueryKeys.invites });
    },
    onError: (error) => refreshAfterError(client, error),
  });
}

export function useUpdateMemberRole(): UseMutationResult<
  ClinicView,
  Error,
  UpdateClinicMemberRoleInput
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: withOfflineGuard(updateClinicMemberRole),
    onSuccess: async (view) => {
      client.setQueryData(clinicQueryKeys.view, view);
      await client.invalidateQueries({ queryKey: homeQueryKeys.educator });
    },
    onError: (error) => refreshAfterError(client, error),
  });
}

/** ADMIN remove outro membro: a lista e os pacientes compartilhados se refazem. */
export function useRemoveMember(): UseMutationResult<void, Error, string> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: withOfflineGuard(removeClinicMember),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: clinicQueryKeys.all }),
        client.invalidateQueries({ queryKey: ["student"] }),
      ]);
    },
    onError: (error) => refreshAfterError(client, error),
  });
}

/** Sair = `DELETE` com o próprio id; depois, a tela volta a "sem equipe". */
export function useLeaveTeam(): UseMutationResult<void, Error, string> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: withOfflineGuard(removeClinicMember),
    onSuccess: async () => {
      client.setQueryData(clinicQueryKeys.view, null);
      client.removeQueries({ queryKey: clinicQueryKeys.invites });
      await Promise.all([
        client.invalidateQueries({ queryKey: homeQueryKeys.educator }),
        client.invalidateQueries({ queryKey: ["student"] }),
      ]);
    },
    onError: (error) => refreshAfterError(client, error),
  });
}

/** O convite fica no estado da tela: não toca o cache de consultas. */
export function useCreateInvite(): UseMutationResult<
  ClinicInvite,
  Error,
  CreateClinicInviteInput
> {
  const client = useQueryClient();
  return useMutation({
    mutationFn: withOfflineGuard(createClinicInvite),
    onError: async (error) => {
      if (error instanceof ApiError && error.code === "FORBIDDEN_ROLE") {
        await client.invalidateQueries({ queryKey: clinicQueryKeys.view });
      }
    },
  });
}
