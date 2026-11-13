// Evolução da sessão: leitura (API-05, leva 1) e criação (EVO-01). Contrato
// PROVISÓRIO copiado de docs/entrega-4/ESPECIFICACAO-BACKEND.md §3, a conferir
// em API-04. As outras escritas (PUT da evolução e a sugestão da IA) ficam com
// as telas EVO-02 e EVO-04.
import type { AxiosResponse } from "axios";

import { apiClient } from "@/api/client";
import { ApiError } from "@/api/errors";
import type {
  CreateSessionEvolutionPayload,
  EvolutionContext,
  PendingEvolution,
  SessionEvolution,
  SessionEvolutionSummary,
} from "@/api/types";

export interface ListSessionEvolutionsFilters {
  studentId?: string;
  /** `AAAA-MM-DD`. */
  from?: string;
  /** `AAAA-MM-DD`. */
  to?: string;
  /** 1 a 100 (padrão do servidor: 50). */
  limit?: number;
}

export interface ListPendingEvolutionsFilters {
  /** 1 a 90 (padrão do servidor: 30). */
  days?: number;
}

export const evolutionQueryKeys = {
  all: ["session-evolution"] as const,
  context: (sessionId: string) =>
    [...evolutionQueryKeys.all, "context", sessionId] as const,
  list: (filters: ListSessionEvolutionsFilters = {}) =>
    [...evolutionQueryKeys.all, "list", filters] as const,
  detail: (id: string) => [...evolutionQueryKeys.all, "detail", id] as const,
  pending: (filters: ListPendingEvolutionsFilters = {}) =>
    [...evolutionQueryKeys.all, "pending", filters] as const,
};

// Query na própria URL: o adaptador de mocks lê `searchParams`, não `config.params`.
function withQuery(
  path: string,
  filters: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams(
    Object.entries(filters)
      .filter(
        (entry): entry is [string, string | number] => entry[1] !== undefined,
      )
      .map(([key, value]) => [key, String(value)]),
  ).toString();

  return query ? `${path}?${query}` : path;
}

/**
 * GET /session-evolution/context/:sessionId — sessão, plano PE escolhido pelo
 * servidor (G-57: sem PDI) e critérios sugeridos. `403 UNAUTHORIZED`,
 * `404 SESSION_NOT_FOUND`, `409 SESSION_NOT_FINISHED`.
 */
export async function getEvolutionContext(
  sessionId: string,
): Promise<EvolutionContext> {
  const response = await apiClient.get<EvolutionContext>(
    `/session-evolution/context/${sessionId}`,
  );

  return response.data;
}

/** GET /session-evolution/ — mais recente primeiro; `400` em filtro inválido, `403 UNAUTHORIZED` em paciente alheio. */
export async function listSessionEvolutions(
  filters: ListSessionEvolutionsFilters = {},
): Promise<SessionEvolutionSummary[]> {
  const response = await apiClient.get<SessionEvolutionSummary[]>(
    withQuery("/session-evolution/", { ...filters }),
  );

  return response.data;
}

/** GET /session-evolution/:id — `403 UNAUTHORIZED` ou `404 EVOLUTION_NOT_FOUND`. */
export async function getSessionEvolution(
  id: string,
): Promise<SessionEvolution> {
  const response = await apiClient.get<SessionEvolution>(
    `/session-evolution/${id}`,
  );

  return response.data;
}

/** GET /session-evolution/pending — sessões finalizadas sem evolução. */
export async function listPendingEvolutions(
  filters: ListPendingEvolutionsFilters = {},
): Promise<PendingEvolution[]> {
  const response = await apiClient.get<PendingEvolution[]>(
    withQuery("/session-evolution/pending", { ...filters }),
  );

  return response.data;
}

/**
 * Erro `409` da criação da evolução. O cliente HTTP normaliza só `message`; o
 * `409` é lido aqui para preservar o `evolutionId` do registro que já existe
 * (`EVOLUTION_ALREADY_EXISTS`, EV-02).
 */
export class EvolutionApiError extends ApiError {
  readonly evolutionId?: string;

  constructor({
    evolutionId,
    ...rest
  }: ConstructorParameters<typeof ApiError>[0] & { evolutionId?: string }) {
    super(rest);
    this.name = "EvolutionApiError";
    this.evolutionId = evolutionId;
  }
}

function throwOnConflict(response: AxiosResponse<unknown>): void {
  if (response.status !== 409) return;
  const body = (response.data ?? {}) as {
    message?: unknown;
    evolutionId?: unknown;
  };
  const code = typeof body.message === "string" ? body.message : undefined;

  throw new EvolutionApiError({
    message: code ?? "Conflict",
    status: 409,
    code,
    evolutionId:
      typeof body.evolutionId === "string" ? body.evolutionId : undefined,
  });
}

/**
 * POST /session-evolution/ — cria a evolução da sessão finalizada e aplica os
 * `goalUpdates` ao plano na mesma transação (EV-07). Nunca é repetida sozinha.
 * Erros: `400` (validação, `INVALID_PLAN`, `GOAL_NOT_IN_PLAN`,
 * `INVALID_ATTEMPTS`), `403`, `404 SESSION_NOT_FOUND`, `409`
 * (`EVOLUTION_ALREADY_EXISTS` com `evolutionId` → {@link EvolutionApiError},
 * `SESSION_NOT_FINISHED`, `PLAN_NOT_EDITABLE`).
 */
export async function createSessionEvolution(
  payload: CreateSessionEvolutionPayload,
): Promise<SessionEvolution> {
  const response = await apiClient.post<SessionEvolution>(
    "/session-evolution/",
    payload,
    {
      validateStatus: (status) =>
        (status >= 200 && status < 300) || status === 409,
    },
  );
  throwOnConflict(response);

  return response.data;
}
