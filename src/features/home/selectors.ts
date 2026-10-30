import type { Appointment } from "@/api/types";
import { isToday } from "@/utils/date";

export function selectTodayAppointments(
  appointments: Appointment[],
): Appointment[] {
  return appointments
    .filter((appointment) => isToday(new Date(appointment.scheduledAt)))
    .sort(
      (first, second) =>
        new Date(first.scheduledAt).getTime() -
        new Date(second.scheduledAt).getTime(),
    );
}

export function countScheduledAppointments(
  appointments: Appointment[],
): number {
  return appointments.filter(({ status }) => status !== "CANCELLED").length;
}

/**
 * Próximo atendimento = o primeiro, na ordem recebida (lista ordenada por
 * `scheduledAt`), que não foi concluído/cancelado e ainda não terminou
 * (`scheduledAt + durationMinutes > now`). Atendimentos em andamento contam.
 */
export function selectNextAppointment(
  appointments: Appointment[],
  now: Date = new Date(),
): Appointment | undefined {
  return appointments.find(
    (appointment) =>
      appointment.status !== "COMPLETED" &&
      appointment.status !== "CANCELLED" &&
      !hasAppointmentEnded(appointment, now),
  );
}

/** `scheduledAt + durationMinutes` já passou em relação a `now`. */
export function hasAppointmentEnded(
  {
    scheduledAt,
    durationMinutes,
  }: Pick<Appointment, "scheduledAt" | "durationMinutes">,
  now: Date = new Date(),
): boolean {
  const endsAt = new Date(scheduledAt).getTime() + durationMinutes * 60 * 1000;
  return endsAt <= now.getTime();
}
