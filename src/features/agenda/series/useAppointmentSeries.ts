import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  appointmentSeriesQueryKeys,
  getAppointmentSeries,
} from "@/api/endpoints/appointment-series";
import { ApiError } from "@/api/errors";
import type { AppointmentSeriesDetail } from "@/api/types";

export function isSeriesNotFound(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 404 &&
    error.code === "SERIES_NOT_FOUND"
  );
}

/** Sob `["appointment"]`: as mutações de atendimento invalidam a série também. */
export function useAppointmentSeries(
  seriesId: string | undefined,
): UseQueryResult<AppointmentSeriesDetail, ApiError> {
  return useQuery({
    queryKey: appointmentSeriesQueryKeys.detail(seriesId ?? ""),
    queryFn: () => getAppointmentSeries(seriesId ?? ""),
    enabled: Boolean(seriesId),
    retry: (count, error) => !isSeriesNotFound(error) && count < 2,
  });
}
