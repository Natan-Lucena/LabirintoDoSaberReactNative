// Evolução da sessão: leitura (API-05, leva 1). Contrato PROVISÓRIO copiado de
// docs/entrega-4/ESPECIFICACAO-BACKEND.md §3, a conferir em API-04. As
// escritas (POST/PUT da evolução e a sugestão da IA) ficam com as telas
// EVO-01, EVO-02 e EVO-04.
import { apiClient } from "@/api/client";
import type {
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
