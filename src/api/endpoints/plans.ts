import { apiClient } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { AxiosResponse } from "axios";
import { AI_TIMEOUT_MS } from "@/api/endpoints/ai-timeout";
import type {
  Plan,
  PlanDraft,
  PlanStatus,
  PlanSummary,
  PlanType,
} from "@/api/types";

export interface GeneratePlanDraftInput {
  studentId: string;
  type: PlanType;
  focus: string;
  consideredDifficulties: string[];
  durationMonths?: 3 | 6;
  sessionDate?: string;
  parentPlanId?: string;
  includeAnamnesisTemplateId?: string;
}

export interface CreatePlanInput {
  studentId: string;
  type: PlanType;
  source: "AI" | "MANUAL";
  title: string;
  generalObjective: string;
  professionalNotes?: string;
  focus?: string;
  consideredDifficulties?: string[];
  startDate?: string;
  endDate?: string;
  nextReviewDate?: string;
  parentPlanId?: string;
  sessionDate?: string;
  appointmentId?: string;
  goals: { description: string; successCriterion?: string }[];
}

export class PlanApiError extends ApiError {
  readonly activePlanId?: string;

  constructor(
    input: ConstructorParameters<typeof ApiError>[0] & {
      activePlanId?: string;
    },
  ) {
    super(input);
    this.name = "PlanApiError";
    this.activePlanId = input.activePlanId;
  }
}

function throwOnConflict(response: AxiosResponse<unknown>): void {
  if (response.status !== 409) return;
  const body = (response.data ?? {}) as {
    message?: unknown;
    activePlanId?: unknown;
  };
  const code = typeof body.message === "string" ? body.message : undefined;
  throw new PlanApiError({
    message: code ?? "Conflict",
    status: 409,
    code,
    activePlanId:
      typeof body.activePlanId === "string" ? body.activePlanId : undefined,
  });
}

/** POST /plan/ — persiste o plano editado. */
export async function createPlan(input: CreatePlanInput): Promise<Plan> {
  const response = await apiClient.post<Plan>("/plan/", input, {
    validateStatus: (status) =>
      (status >= 200 && status < 300) || status === 409,
  });
  throwOnConflict(response);
  return response.data;
}

/** POST /plan/generate — devolve rascunho sem persistir. */
export async function generatePlanDraft(
  input: GeneratePlanDraftInput,
): Promise<PlanDraft> {
  const response = await apiClient.post<PlanDraft>("/plan/generate", input, {
    timeout: AI_TIMEOUT_MS,
  });
  return response.data;
}

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
