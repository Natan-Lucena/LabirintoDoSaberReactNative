// Recorrência da agenda: leitura (API-07, leva 3). Contrato PROPOSTO em
// docs/entrega-5/CONTRATOS-BACKEND.md §2.5 e §5.7 (mock-first). Criar, alterar e
// cancelar série entram com as telas AGE-06 e FEC-06.
import { apiClient } from "@/api/client";
import { normalizeApiError } from "@/api/errors";
import type { AppointmentSeriesDetail } from "@/api/types";

export const appointmentSeriesQueryKeys = {
  detail: (seriesId: string) => ["appointment", "series", seriesId] as const,
};

/** GET /appointment/series/:id — todas as ocorrências (RC-10); `403 UNAUTHORIZED`, `404 SERIES_NOT_FOUND`. */
export async function getAppointmentSeries(
  seriesId: string,
): Promise<AppointmentSeriesDetail> {
  try {
    const response = await apiClient.get<AppointmentSeriesDetail>(
      `/appointment/series/${encodeURIComponent(seriesId)}`,
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
