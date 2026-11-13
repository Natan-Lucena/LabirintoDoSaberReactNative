import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  evolutionQueryKeys,
  getSessionEvolution,
  listSessionEvolutions,
} from "@/api/endpoints/evolution";
import type { ApiError } from "@/api/errors";
import type { SessionEvolution, SessionEvolutionSummary } from "@/api/types";

/** Evoluções de um paciente; o servidor já ordena da mais recente para a mais antiga. */
export function usePatientEvolutions(
  studentId: string,
): UseQueryResult<SessionEvolutionSummary[], ApiError> {
  return useQuery({
    queryKey: evolutionQueryKeys.list({ studentId }),
    queryFn: () => listSessionEvolutions({ studentId }),
    enabled: Boolean(studentId),
  });
}

export function useEvolutionDetail(
  id: string,
): UseQueryResult<SessionEvolution, ApiError> {
  return useQuery({
    queryKey: evolutionQueryKeys.detail(id),
    queryFn: () => getSessionEvolution(id),
    enabled: Boolean(id),
    retry: false,
  });
}
