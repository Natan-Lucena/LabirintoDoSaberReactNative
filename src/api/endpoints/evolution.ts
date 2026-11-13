// Evolução da sessão: leitura (API-05, leva 1) e criação (EVO-01). Contrato
// PROVISÓRIO copiado de docs/entrega-4/ESPECIFICACAO-BACKEND.md §3, a conferir
// em API-04. A edição (PUT) é da EVO-02; a sugestão da IA, da EVO-04.
import { AxiosError, type AxiosResponse } from "axios";

import { apiClient } from "@/api/client";
import { AI_TIMEOUT_MS } from "@/api/endpoints/ai-timeout";
import { ApiError, normalizeApiError } from "@/api/errors";
import type {
  CreateSessionEvolutionPayload,
  EvolutionContext,
  NextSessionSuggestion,
  NextSessionSuggestionPayload,
  PendingEvolution,
  SessionEvolution,
  SessionEvolutionSummary,
  UpdateSessionEvolutionPayload,
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

/**
 * O `409` chega como resposta (ver `validateStatus`). Ele volta ao caminho
 * normal de `normalizeApiError` (mensagem traduzida); só o
 * `EVOLUTION_ALREADY_EXISTS` vira {@link EvolutionApiError} com o `evolutionId`.
 */
function throwOnConflict(response: AxiosResponse<unknown>): void {
  if (response.status !== 409) return;
  const normalized = normalizeApiError(
    new AxiosError(
      `Request failed with status code ${response.status}`,
      AxiosError.ERR_BAD_REQUEST,
      response.config,
      response.request,
      response,
    ),
  );
  if (normalized.code !== "EVOLUTION_ALREADY_EXISTS") throw normalized;

  const body = (response.data ?? {}) as { evolutionId?: unknown };
  throw new EvolutionApiError({
    message: normalized.message,
    status: normalized.status,
    code: normalized.code,
    errors: normalized.errors,
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

/**
 * PUT /session-evolution/:id — edita a evolução (EV-09: editável, nunca
 * excluída). `criteria`, quando enviado, é a lista COMPLETA (substitui a
 * anterior). Nunca é repetida sozinha. Erros: `400` (validação,
 * `GOAL_NOT_IN_PLAN`, `INVALID_ATTEMPTS`), `403 UNAUTHORIZED`,
 * `404 EVOLUTION_NOT_FOUND`, `409 PLAN_NOT_EDITABLE`.
 */
export async function updateSessionEvolution(
  id: string,
  payload: UpdateSessionEvolutionPayload,
): Promise<SessionEvolution> {
  const response = await apiClient.put<SessionEvolution>(
    `/session-evolution/${id}`,
    payload,
  );

  return response.data;
}

/**
 * POST /session-evolution/next-session-suggestion — IA (EVO-04), não persiste:
 * o texto editado vai em `nextSessionSuggestion` ao salvar a evolução. Leva
 * cerca de 30 s (timeout de 90 s) e nunca é repetida sozinha (G-46). Erros:
 * `400`, `403`, `404 SESSION_NOT_FOUND`, `500 AI_GENERATION_FAILED` e
 * `AI_INVALID_OUTPUT`.
 */
export async function generateNextSessionSuggestion(
  payload: NextSessionSuggestionPayload,
): Promise<NextSessionSuggestion> {
  const response = await apiClient.post<NextSessionSuggestion>(
    "/session-evolution/next-session-suggestion",
    payload,
    { timeout: AI_TIMEOUT_MS },
  );

  return response.data;
}
