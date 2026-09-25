export const TIME_ZONE = "America/Sao_Paulo";

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const DAY_KEY_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const OFFSET_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  timeZoneName: "longOffset",
});

export function formatLongDate(d: Date): string {
  return LONG_DATE_FORMATTER.format(d);
}

export function formatTime(d: Date): string {
  return TIME_FORMATTER.format(d);
}

export function dayKey(d: Date): string {
  return DAY_KEY_FORMATTER.format(d);
}

export function groupByDayKey<T>(
  items: T[],
  getDate: (item: T) => string,
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = dayKey(new Date(getDate(item)));
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }
  return grouped;
}

function getTimeZoneOffsetMinutes(d: Date): number {
  const parts = OFFSET_FORMATTER.formatToParts(d);
  const offsetPart = parts.find((part) => part.type === "timeZoneName")?.value;
  const match = offsetPart?.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  if (!match) {
    throw new Error(`unexpected offset format: ${offsetPart}`);
  }
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes);
}

function zonedDateFromParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
): Date {
  const utcGuess = Date.UTC(year, month, day, hour, minute, 0, 0);
  const offsetMinutes = getTimeZoneOffsetMinutes(new Date(utcGuess));
  return new Date(utcGuess - offsetMinutes * 60_000);
}

export function getVisibleMonthRange(
  year: number,
  month: number,
): { start: Date; end: Date } {
  const start = zonedDateFromParts(year, month, 1, 0, 0);
  const nextMonthDate = new Date(Date.UTC(year, month + 1, 1));
  const end = zonedDateFromParts(
    nextMonthDate.getUTCFullYear(),
    nextMonthDate.getUTCMonth(),
    1,
    0,
    0,
  );
  return { start, end };
}

export function isToday(d: Date): boolean {
  return dayKey(d) === getTodayKey();
}

export function getTodayKey(): string {
  return dayKey(new Date());
}

export function toBrasiliaISOString(parts: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}): string {
  const instant = zonedDateFromParts(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  const offsetMinutes = getTimeZoneOffsetMinutes(instant);
  const sign = offsetMinutes < 0 ? "-" : "+";
  const absMinutes = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absMinutes / 60)).padStart(2, "0");
  const offsetMins = String(absMinutes % 60).padStart(2, "0");

  const pad = (n: number) => String(n).padStart(2, "0");
  const datePart = `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
  const timePart = `${pad(parts.hour)}:${pad(parts.minute)}:00`;

  return `${datePart}T${timePart}${sign}${offsetHours}:${offsetMins}`;
}
