// Relatórios: leitura (API-05, leva 3). Contrato PROVISÓRIO copiado de
// docs/entrega-4/ESPECIFICACAO-BACKEND.md §6, a conferir em API-04. As escritas
// (gerar, registrar envio, excluir) ficam com as telas REL-01 a REL-03; a geração
// usa IA e deve levar AI_TIMEOUT_MS, sem reenvio. Mocks em src/mocks/handlers/reports.ts.
import { apiClient } from "@/api/client";
import { AI_TIMEOUT_MS } from "@/api/endpoints/ai-timeout";
import type {
  CreateReportPayload,
  ListReportsFilters,
  Report,
  ReportOptions,
  ReportSummary,
  ShareReportPayload,
} from "@/api/types";

export const reportQueryKeys = {
  all: ["reports"] as const,
  options: () => [...reportQueryKeys.all, "options"] as const,
  list: (filters: ListReportsFilters = {}) =>
    [...reportQueryKeys.all, "list", filters] as const,
  detail: (id: string) => [...reportQueryKeys.all, "detail", id] as const,
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

/** GET /report/options — tipos, seções, audiências e períodos (REL-01). */
export async function getReportOptions(): Promise<ReportOptions> {
  const response = await apiClient.get<ReportOptions>("/report/options");

  return response.data;
}

/** GET /report/ — mais recente primeiro, sem `content`. `400` em filtro inválido. */
export async function listReports(
  filters: ListReportsFilters = {},
): Promise<ReportSummary[]> {
  const response = await apiClient.get<ReportSummary[]>(
    withQuery("/report/", { ...filters }),
  );

  return response.data;
}

/** GET /report/:id — `403 UNAUTHORIZED` ou `404 REPORT_NOT_FOUND`. */
export async function getReport(id: string): Promise<Report> {
  const response = await apiClient.get<Report>(`/report/${id}`);

  return response.data;
}

/**
 * POST /report/ — gera o relatório; a síntese por IA leva até ~30 s (`AI_TIMEOUT_MS`).
 * Sem reenvio automático: quem chama não deve repetir a requisição sozinho.
 */
export async function createReport(
  payload: CreateReportPayload,
): Promise<Report> {
  const response = await apiClient.post<Report>("/report/", payload, {
    timeout: AI_TIMEOUT_MS,
  });

  return response.data;
}

/** POST /report/:id/share — registra uma impressão (PRINT) ou envio (SHARE). */
export async function shareReport(
  id: string,
  payload: ShareReportPayload,
): Promise<Report> {
  const response = await apiClient.post<Report>(`/report/${id}/share`, payload);

  return response.data;
}

/** DELETE /report/:id — `204`; `403 UNAUTHORIZED` ou `404 REPORT_NOT_FOUND`. */
export async function deleteReport(id: string): Promise<void> {
  await apiClient.delete(`/report/${id}`);
}
