import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { listPlans } from "@/api/endpoints/plans";
import type { PlanSummary } from "@/api/types";

export const planQueryKeys = {
  all: ["plan"] as const,
  list: () => [...planQueryKeys.all, "list"] as const,
};

/** Lista todos os planos do educador; o filtro por tipo é feito na tela. */
export function usePlans(): UseQueryResult<PlanSummary[]> {
  return useQuery({
    queryKey: planQueryKeys.list(),
    queryFn: () => listPlans(),
  });
}
