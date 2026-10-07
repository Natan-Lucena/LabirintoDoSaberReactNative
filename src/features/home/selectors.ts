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

export function selectNextAppointment(
  appointments: Appointment[],
): Appointment | undefined {
  return appointments.find(
    ({ status }) => status !== "COMPLETED" && status !== "CANCELLED",
  );
}
