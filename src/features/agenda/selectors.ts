import type { Appointment } from "@/api/types";
import { selectAppointmentsForDay } from "@/features/appointments/selectors";
import { dayKey } from "@/utils/date";

/** O destaque só existe no dia de hoje, para o primeiro PENDING em ordem cronológica. */
export function selectCurrentAppointment(
  appointments: Appointment[],
  selectedDay: string,
  now: Date = new Date(),
): Appointment | undefined {
  if (selectedDay !== dayKey(now)) return undefined;
  return selectAppointmentsForDay(appointments, selectedDay).find(
    ({ status }) => status === "PENDING",
  );
}
