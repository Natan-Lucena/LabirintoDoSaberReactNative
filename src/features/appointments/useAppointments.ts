import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { listAppointments } from "@/api/endpoints/appointment";
import type { Appointment } from "@/api/types";

export const appointmentQueryKeys = {
  all: ["appointment"] as const,
};

export async function loadAppointments(
  studentId?: string,
): Promise<Appointment[]> {
  return listAppointments(studentId ? { studentId } : {});
}

/** Sem `studentId`, a agenda toda; com ele, só os atendimentos do paciente (§8.2). */
export function useAppointments(
  studentId?: string,
): UseQueryResult<Appointment[]> {
  return useQuery({
    queryKey: studentId
      ? [...appointmentQueryKeys.all, { studentId }]
      : appointmentQueryKeys.all,
    queryFn: () => loadAppointments(studentId),
  });
}
