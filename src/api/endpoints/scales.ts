// Escalas: leitura (API-05, leva 2). Contrato PROVISÓRIO copiado de
// docs/entrega-4/ESPECIFICACAO-BACKEND.md §4, a conferir em API-04. As escritas
// (iniciar, responder, concluir, insight, excluir) ficam com as telas AVA-*; os
// mocks delas já existem em src/mocks/handlers/scales.ts.
import { apiClient } from "@/api/client";
import type {
  ListScaleApplicationsFilters,
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
