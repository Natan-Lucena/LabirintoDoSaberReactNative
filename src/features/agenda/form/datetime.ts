import { dayKey, formatTime, toBrasiliaISOString } from "@/utils/date";

/** Meia-noite (America/Sao_Paulo, G-13) do dia AAAA-MM-DD; null se inválido. */
export function dateFromKey(key: string | undefined): Date | null {
  const match = key?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  return new Date(
    toBrasiliaISOString({
      year: Number(match[1]),
      month: Number(match[2]),
      day: Number(match[3]),
      hour: 0,
      minute: 0,
    }),
  );
}

/** Instante com o horário de `time` no dia de `date`, sempre em São Paulo. */
export function combineDateAndTime(date: Date, time: Date): Date {
  const [year, month, day] = dayKey(date).split("-").map(Number);
  const [hour, minute] = formatTime(time).split(":").map(Number);

  return new Date(
    toBrasiliaISOString({
      year: year!,
      month: month!,
      day: day!,
      hour: hour!,
      minute: minute!,
    }),
  );
}
