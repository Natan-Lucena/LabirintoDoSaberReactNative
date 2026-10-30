import type { Appointment } from "@/api/types";
import { selectAppointmentsForDay } from "@/features/appointments/selectors";
import { dayKey } from "@/utils/date";

/**
 * O destaque só existe no dia de hoje, para o primeiro PENDING em ordem
 * cronológica que ainda não terminou (`scheduledAt + durationMinutes > now`).
 * Atendimentos que passaram sem conclusão continuam na lista, sem destaque (D14).
 */
export function selectCurrentAppointment(
  appointments: Appointment[],
  selectedDay: string,
  now: Date = new Date(),
): Appointment | undefined {
  if (selectedDay !== dayKey(now)) return undefined;
  return selectAppointmentsForDay(appointments, selectedDay).find(
    ({ status, scheduledAt, durationMinutes }) =>
      status === "PENDING" &&
      new Date(scheduledAt).getTime() + durationMinutes * 60 * 1000 >
        now.getTime(),
  );
}
