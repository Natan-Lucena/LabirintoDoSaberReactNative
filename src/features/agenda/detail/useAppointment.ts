import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { getAppointment } from "@/api/endpoints/appointment";
import type { ApiError } from "@/api/errors";
import type { Appointment } from "@/api/types";
import { isAppointmentNotFound } from "@/features/agenda/errors";
import { appointmentQueryKeys } from "@/features/appointments/useAppointments";

/** Sob `["appointment"]`: as mutações de atendimento invalidam o detalhe também. */
export function useAppointment(
  id: string,
): UseQueryResult<Appointment, ApiError> {
  return useQuery({
    queryKey: [...appointmentQueryKeys.all, "detail", id],
    queryFn: () => getAppointment(id),
    enabled: id.length > 0,
    retry: (count, error) => !isAppointmentNotFound(error) && count < 2,
  });
}
