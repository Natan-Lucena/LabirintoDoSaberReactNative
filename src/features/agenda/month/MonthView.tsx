import { useMemo, type ReactElement } from "react";

import type { Appointment } from "@/api/types";
import { MiniCalendar } from "@/features/appointments/components/MiniCalendar";
import { selectAppointmentCountsByDay } from "@/features/appointments/selectors";
import { visibleGridRange } from "@/features/agenda/month/range";

export interface MonthViewProps {
  selectedDay: string; // "AAAA-MM-DD"
  appointments: Appointment[];
  todayKey: string;
  onSelectDay: (dayKey: string) => void;
}

/** Ao trocar de mês: hoje se for o mês atual, senão o dia 1. */
export function dayAfterMonthChange(
  year: number,
  month: number,
  todayKey: string,
): string {
  const key = `${year}-${String(month + 1).padStart(2, "0")}`;
  return todayKey.startsWith(key) ? todayKey : `${key}-01`;
}

export function MonthView({
  selectedDay,
  appointments,
  todayKey,
  onSelectDay,
}: MonthViewProps): ReactElement {
  const year = Number(selectedDay.slice(0, 4));
  const month = Number(selectedDay.slice(5, 7)) - 1;
  const counts = useMemo(() => {
    const { from, to } = visibleGridRange(year, month);
    return selectAppointmentCountsByDay(appointments, from, to);
  }, [appointments, year, month]);

  return (
    <MiniCalendar
      year={year}
      month={month}
      selectedDayKey={selectedDay}
      appointmentCounts={counts}
      onSelectDate={onSelectDay}
      onChangeMonth={(nextYear, nextMonth) =>
        onSelectDay(dayAfterMonthChange(nextYear, nextMonth, todayKey))
      }
    />
  );
}
