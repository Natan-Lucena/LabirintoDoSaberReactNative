import type { Appointment } from "@/api/types";
import { dayKey, getVisibleMonthRange } from "@/utils/date";

export interface DaySummary {
  total: number;
  first: Appointment | null;
  last: Appointment | null;
}

export function selectAppointmentDayKeys(
  appointments: Appointment[],
  year: number,
  month: number,
): string[] {
  const { start, end } = getVisibleMonthRange(year, month);

  return [
    ...new Set(
      appointments
        .filter(({ scheduledAt }) => {
          const scheduled = new Date(scheduledAt);
          return scheduled >= start && scheduled < end;
        })
        .map(({ scheduledAt }) => dayKey(new Date(scheduledAt))),
    ),
  ].sort();
}

/**
 * Conta atendimentos PENDING e COMPLETED por dia de São Paulo, de `from` a `to`
 * (chaves "AAAA-MM-DD", inclusivas). Cancelados não contam.
 */
export function selectAppointmentCountsByDay(
  appointments: Appointment[],
  from: string,
  to: string,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const { scheduledAt, status } of appointments) {
    if (status === "CANCELLED") continue;
    const key = dayKey(new Date(scheduledAt));
    if (key < from || key > to) continue;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export function selectAppointmentsForDay(
  appointments: Appointment[],
  key: string,
): Appointment[] {
  return appointments
    .filter(({ scheduledAt }) => dayKey(new Date(scheduledAt)) === key)
    .sort(
      (first, second) =>
        new Date(first.scheduledAt).getTime() -
        new Date(second.scheduledAt).getTime(),
    );
}

export function selectDaySummary(appointments: Appointment[]): DaySummary {
  const active = appointments.filter(({ status }) => status !== "CANCELLED");

  return {
    total: active.length,
    first: active[0] ?? null,
    last: active.at(-1) ?? null,
  };
}
