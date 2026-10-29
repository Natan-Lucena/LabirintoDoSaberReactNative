import { apiClient } from "@/api/client";
import type { Plan, PlanStatus, PlanSummary, PlanType } from "@/api/types";

export interface ListPlansFilters {
  studentId?: string;
  status?: PlanStatus;
  type?: PlanType;
}

/**
 * GET /plan/ — `ACTIVE` primeiro, depois `updatedAt` decrescente; sem paginação.
 * Paciente de outro educador responde `403 UNAUTHORIZED`.
 */
export async function listPlans(
  filters: ListPlansFilters = {},
): Promise<PlanSummary[]> {
  // Query na própria URL: o adaptador de mocks lê `searchParams`, não `config.params`.
  const query = new URLSearchParams(
    Object.entries(filters).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  ).toString();
  const response = await apiClient.get<PlanSummary[]>(
    query ? `/plan/?${query}` : "/plan/",
  );

  return response.data;
}

/** GET /plan/:id — `403 UNAUTHORIZED` (outro educador) ou `404 PLAN_NOT_FOUND`. */
export async function getPlan(id: string): Promise<Plan> {
  const response = await apiClient.get<Plan>(`/plan/${id}`);

  return response.data;
}
