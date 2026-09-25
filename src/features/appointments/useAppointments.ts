import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { listAppointments } from "@/api/endpoints/appointment";
import type { Appointment } from "@/api/types";

export const appointmentQueryKeys = {
  all: ["appointment"] as const,
};

export async function loadAppointments(): Promise<Appointment[]> {
  return listAppointments();
}

export function useAppointments(): UseQueryResult<Appointment[]> {
  return useQuery({
    queryKey: appointmentQueryKeys.all,
    queryFn: loadAppointments,
  });
}
