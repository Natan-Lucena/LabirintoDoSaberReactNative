// Recorrência da agenda: leitura (API-07, leva 3) e escritas (AGE-06). Contrato publicado em
// 2026-11-26 (BACKEND-ENTREGUE-E5 §3.5; CONTRATOS-BACKEND §2.5 e §5.7). Criar, alterar e
// cancelar série "este e os seguintes".
import { apiClient } from "@/api/client";
import { acceptConflict, throwOnConflict } from "@/api/endpoints/appointment";
import { normalizeApiError } from "@/api/errors";
import type {
  AppointmentSeriesDetail,
  RecurrenceFrequency,
  SeriesResult,
} from "@/api/types";

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

/** POST /appointment/series (§5.7). `409 APPOINTMENT_CONFLICT` = todas em conflito. */
export interface CreateAppointmentSeriesInput {
  studentId: string;
  /** ISO da primeira ocorrência. */
  scheduledAt: string;
  frequency: RecurrenceFrequency;
  /** Inteiro de 2 a 26 (quinzenal, no máximo 13). */
  occurrences: number;
  type?: string;
  durationMinutes?: number;
  observation?: string;
}

export async function createAppointmentSeries(
  input: CreateAppointmentSeriesInput,
): Promise<SeriesResult> {
  try {
    const response = await apiClient.post<SeriesResult>(
      "/appointment/series",
      { ...input, scheduledAt: new Date(input.scheduledAt).toISOString() },
      acceptConflict,
    );
    throwOnConflict(response);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** PUT /appointment/series/:id — "este e os seguintes"; só a hora de `scheduledAt` vale (RC-05). */
export interface UpdateAppointmentSeriesInput {
  fromAppointmentId: string;
  scheduledAt?: string;
  durationMinutes?: number;
  type?: string;
  observation?: string;
}

export async function updateAppointmentSeries(
  seriesId: string,
  input: UpdateAppointmentSeriesInput,
): Promise<SeriesResult> {
  try {
    const response = await apiClient.put<SeriesResult>(
      `/appointment/series/${encodeURIComponent(seriesId)}`,
      {
        ...input,
        ...(input.scheduledAt === undefined
          ? {}
          : { scheduledAt: new Date(input.scheduledAt).toISOString() }),
      },
      acceptConflict,
    );
    throwOnConflict(response);
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** POST /appointment/series/:id/cancel — "cancelar este e os seguintes" (RC-06, repetir é seguro). */
export async function cancelAppointmentSeries(
  seriesId: string,
  fromAppointmentId: string,
): Promise<SeriesResult> {
  try {
    const response = await apiClient.post<SeriesResult>(
      `/appointment/series/${encodeURIComponent(seriesId)}/cancel`,
      { fromAppointmentId },
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
