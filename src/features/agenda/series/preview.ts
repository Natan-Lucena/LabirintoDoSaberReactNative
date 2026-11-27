// Prévia da série (AGE-06, AC-AGE-06-01): soma 7 ou 14 dias de calendário de
// São Paulo e mantém a hora local (RC-02). Não prevê conflitos: o servidor decide.
import type { RecurrenceFrequency } from "@/api/types";
import {
  TIME_ZONE,
  dayKey,
  formatTime,
  toBrasiliaISOString,
} from "@/utils/date";

export const MIN_OCCURRENCES = 2;
export const MAX_WEEKLY_OCCURRENCES = 26;
export const MAX_BIWEEKLY_OCCURRENCES = 13;

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "long",
});

const SHORT_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
});

export interface SeriesPreview {
  count: number;
  /** Uma data por ocorrência, em ordem. */
  dates: Date[];
  last: Date;
  /** "terça", "sábado"... */
  weekdayLabel: string;
  /** "14:00" */
  time: string;
}

export const FREQUENCY_LABEL: Record<RecurrenceFrequency, string> = {
  WEEKLY: "Semanal",
  BIWEEKLY: "Quinzenal",
};

export function maxOccurrences(frequency: RecurrenceFrequency): number {
  return frequency === "BIWEEKLY"
    ? MAX_BIWEEKLY_OCCURRENCES
    : MAX_WEEKLY_OCCURRENCES;
}

export function occurrencesError(
  frequency: RecurrenceFrequency,
  occurrences: number,
): string | undefined {
  const max = maxOccurrences(frequency);
  return Number.isInteger(occurrences) &&
    occurrences >= MIN_OCCURRENCES &&
    occurrences <= max
    ? undefined
    : `Escolha de ${MIN_OCCURRENCES} a ${max} atendimentos.`;
}

/** Datas da série, com a hora local de São Paulo preservada. */
export function seriesDates(
  first: Date,
  frequency: RecurrenceFrequency,
  occurrences: number,
): Date[] {
  const [year, month, day] = dayKey(first).split("-").map(Number);
  const [hour, minute] = formatTime(first).split(":").map(Number);
  const step = frequency === "BIWEEKLY" ? 14 : 7;

  return Array.from({ length: occurrences }, (_, index) => {
    // Date.UTC normaliza a virada de mês e de ano.
    const calendar = new Date(Date.UTC(year!, month! - 1, day! + index * step));
    return new Date(
      toBrasiliaISOString({
        year: calendar.getUTCFullYear(),
        month: calendar.getUTCMonth() + 1,
        day: calendar.getUTCDate(),
        hour: hour!,
        minute: minute!,
      }),
    );
  });
}

/** "terça", "sábado" (sem "-feira"). */
export function weekdayName(date: Date): string {
  return WEEKDAY_FORMATTER.format(date).replace("-feira", "");
}

/** "12/02" */
export function formatShortDate(date: Date): string {
  return SHORT_DATE_FORMATTER.format(date);
}

export function previewSeries({
  first,
  frequency,
  occurrences,
}: {
  first: Date;
  frequency: RecurrenceFrequency;
  occurrences: number;
}): SeriesPreview {
  const dates = seriesDates(first, frequency, occurrences);

  return {
    count: dates.length,
    dates,
    last: dates[dates.length - 1] ?? first,
    weekdayLabel: weekdayName(first),
    time: formatTime(first),
  };
}

/** "8 atendimentos, toda terça às 14:00, até 12/02" */
export function previewText(
  preview: SeriesPreview,
  frequency: RecurrenceFrequency,
): string {
  const weekday = preview.weekdayLabel;
  const every =
    frequency === "BIWEEKLY"
      ? `a cada 2 semanas, ${weekday}`
      : `${weekday === "sábado" || weekday === "domingo" ? "todo" : "toda"} ${weekday}`;

  return `${preview.count} atendimentos, ${every} às ${preview.time}, até ${formatShortDate(preview.last)}`;
}
