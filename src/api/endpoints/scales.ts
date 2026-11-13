// Escalas: leitura (API-05, leva 2). Contrato PROVISÓRIO copiado de
// docs/entrega-4/ESPECIFICACAO-BACKEND.md §4, a conferir em API-04. As escritas
// (concluir, insight, excluir) ficam com as telas AVA-03 e AVA-05; iniciar e
// responder entram com a AVA-02. Os mocks existem em src/mocks/handlers/scales.ts.
import { AxiosError, type AxiosResponse } from "axios";

import { apiClient } from "@/api/client";
import { ApiError, normalizeApiError } from "@/api/errors";
import type {
  CreateScaleApplicationPayload,
  ListScaleApplicationsFilters,
  ScaleAnswer,
  ScaleApplication,
  ScaleApplicationSummary,
  ScaleTemplate,
  ScaleTemplateSummary,
} from "@/api/types";

export const scaleQueryKeys = {
  all: ["scales"] as const,
  templates: () => [...scaleQueryKeys.all, "templates"] as const,
  template: (id: string) => [...scaleQueryKeys.all, "template", id] as const,
  applications: (filters: ListScaleApplicationsFilters = {}) =>
    [...scaleQueryKeys.all, "applications", filters] as const,
  application: (id: string) =>
    [...scaleQueryKeys.all, "application", id] as const,
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

/** GET /scale-template/ — catálogo, sem `items` e com `itemCount` (AVA-01). */
export async function listScaleTemplates(): Promise<ScaleTemplateSummary[]> {
  const response =
    await apiClient.get<ScaleTemplateSummary[]>("/scale-template/");

  return response.data;
}

/** GET /scale-template/:id — `404 SCALE_NOT_FOUND`. */
export async function getScaleTemplate(id: string): Promise<ScaleTemplate> {
  const response = await apiClient.get<ScaleTemplate>(`/scale-template/${id}`);

  return response.data;
}

/**
 * GET /scale-application/ — mais recente primeiro, sem `answers`. `400` em
 * filtro inválido, `403 UNAUTHORIZED` em paciente alheio.
 */
export async function listScaleApplications(
  filters: ListScaleApplicationsFilters = {},
): Promise<ScaleApplicationSummary[]> {
  const response = await apiClient.get<ScaleApplicationSummary[]>(
    withQuery("/scale-application/", { ...filters }),
  );

  return response.data;
}

/** GET /scale-application/:id — `403 UNAUTHORIZED` ou `404 APPLICATION_NOT_FOUND`. */
export async function getScaleApplication(
  id: string,
): Promise<ScaleApplication> {
  const response = await apiClient.get<ScaleApplication>(
    `/scale-application/${id}`,
  );

  return response.data;
}

/**
 * `409 DRAFT_ALREADY_EXISTS` ao iniciar (AV-03). O cliente HTTP normaliza só a
 * `message`; o `applicationId` do rascunho existente é lido aqui para o app retomá-lo.
 */
export class ScaleApiError extends ApiError {
  readonly applicationId?: string;

  constructor({
    applicationId,
    ...rest
  }: ConstructorParameters<typeof ApiError>[0] & { applicationId?: string }) {
    super(rest);
    this.name = "ScaleApiError";
    this.applicationId = applicationId;
  }
}

/**
 * O `409` chega como resposta (ver `validateStatus`; o adaptador de mocks também
 * o entrega assim). Os outros `409` voltam a `normalizeApiError` (mensagem
 * traduzida); só `DRAFT_ALREADY_EXISTS` vira {@link ScaleApiError} com o `applicationId`.
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
  if (normalized.code !== "DRAFT_ALREADY_EXISTS") throw normalized;

  const body = (response.data ?? {}) as { applicationId?: unknown };
  throw new ScaleApiError({
    message: normalized.message,
    status: normalized.status,
    code: normalized.code,
    errors: normalized.errors,
    applicationId:
      typeof body.applicationId === "string" ? body.applicationId : undefined,
  });
}

/**
 * POST /scale-application/ — inicia o rascunho. Nunca é repetida sozinha.
 * Erros: `400`, `403`, `404 STUDENT_NOT_FOUND`/`SCALE_NOT_FOUND`, `409`
 * (`DRAFT_ALREADY_EXISTS` com `applicationId` → {@link ScaleApiError};
 * `SCALE_INACTIVE`).
 */
export async function createScaleApplication(
  payload: CreateScaleApplicationPayload,
): Promise<ScaleApplication> {
  const response = await apiClient.post<ScaleApplication>(
    "/scale-application/",
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
 * PUT /scale-application/:id/answers — gravação parcial e idempotente (upsert por
 * `itemId`, AV-04); devolve a aplicação com o `score` recalculado pelo servidor.
 * Nunca é repetida sozinha. Erros: `400 ITEM_NOT_IN_SCALE`/`INVALID_ANSWER_VALUE`,
 * `403`, `404`, `409 APPLICATION_NOT_EDITABLE`.
 */
export async function saveScaleAnswers(
  applicationId: string,
  answers: ScaleAnswer[],
): Promise<ScaleApplication> {
  const response = await apiClient.put<ScaleApplication>(
    `/scale-application/${applicationId}/answers`,
    { answers },
  );

  return response.data;
}
