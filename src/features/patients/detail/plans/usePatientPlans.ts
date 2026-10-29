import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { listPlans } from "@/api/endpoints/plans";
import type { PlanSummary } from "@/api/types";

export function usePatientPlans(
  studentId: string,
): UseQueryResult<PlanSummary[]> {
  return useQuery({
    queryKey: ["plan", "student", studentId],
    queryFn: () => listPlans({ studentId }),
    enabled: Boolean(studentId),
  });
}

export function useActivePdi(studentId: string): UseQueryResult<PlanSummary[]> {
  return useQuery({
    queryKey: ["plan", "student", studentId, "PDI", "ACTIVE"],
    queryFn: () => listPlans({ studentId, type: "PDI", status: "ACTIVE" }),
    enabled: Boolean(studentId),
  });
}
