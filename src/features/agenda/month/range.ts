// Intervalo de dias visíveis na grade do MiniCalendar (semana começa na segunda).
export interface DayRange {
  from: string; // "AAAA-MM-DD", inclusive
  to: string; // "AAAA-MM-DD", inclusive
}

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Da segunda-feira da semana do dia 1 ao domingo da semana do último dia. */
export function visibleGridRange(year: number, month: number): DayRange {
  const first = new Date(Date.UTC(year, month, 1, 12));
  const last = new Date(Date.UTC(year, month + 1, 0, 12));
  first.setUTCDate(first.getUTCDate() - ((first.getUTCDay() + 6) % 7));
  last.setUTCDate(last.getUTCDate() + ((7 - last.getUTCDay()) % 7));
  return { from: toKey(first), to: toKey(last) };
}
