import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  evolutionQueryKeys,
  listPendingEvolutions,
  listSessionEvolutions,
} from "@/api/endpoints/evolution";
import type { ApiError } from "@/api/errors";
import type { PendingEvolution, SessionEvolutionSummary } from "@/api/types";

export const RECENT_EVOLUTIONS_LIMIT = 20;

/** "Sessões sem evolução": sessões finalizadas ainda sem registro (padrão do servidor: 30 dias). */
export function usePendingEvolutions(): UseQueryResult<
  PendingEvolution[],
  ApiError
> {
  return useQuery({
    queryKey: evolutionQueryKeys.pending(),
    queryFn: () => listPendingEvolutions(),
  });
}

/** "Evoluções recentes" de todos os pacientes. */
export function useRecentEvolutions(): UseQueryResult<
  SessionEvolutionSummary[],
  ApiError
> {
  return useQuery({
    queryKey: evolutionQueryKeys.list({ limit: RECENT_EVOLUTIONS_LIMIT }),
    queryFn: () => listSessionEvolutions({ limit: RECENT_EVOLUTIONS_LIMIT }),
  });
}
