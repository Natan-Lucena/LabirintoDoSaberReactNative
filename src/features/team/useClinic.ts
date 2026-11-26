import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";

import {
  clinicQueryKeys,
  createClinic,
  createClinicInvite,
  getClinic,
  type CreateClinicInput,
  type CreateClinicInviteInput,
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
