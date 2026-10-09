import type {
  StudentAnalysisFilter,
  StudentAnalysisReport,
} from "@/api/endpoints/session-analysis";
import { TIME_ZONE, dayKey, toBrasiliaISOString } from "@/utils/date";

export type PeriodMode = "last" | "dates";

export interface PeriodInput {
  mode: PeriodMode;
  /** Texto digitado no campo "Últimas sessões". */
  limit: string;
  startDate: Date | null;
  endDate: Date | null;
}

export type AnalysisFilterResult =
  { filter: StudentAnalysisFilter } | { error: string };

function dateParts(date: Date) {
  const [year, month, day] = dayKey(date).split("-").map(Number);
  return { year: year!, month: month!, day: day! };
}

/**
 * AC-REL-05-01: a API não aceita `limit` junto de datas. O modo escolhido na
 * tela decide qual dos dois é enviado, e o outro nunca entra no filtro.
 */
export function buildAnalysisFilter(input: PeriodInput): AnalysisFilterResult {
  if (input.mode === "last") {
    const text = input.limit.trim();
    const limit = Number(text);
    if (!/^\d+$/.test(text) || !Number.isInteger(limit) || limit < 1) {
      return { error: "Informe um número inteiro de sessões maior que zero." };
    }
    return { filter: { limit } };
  }

  if (!input.startDate || !input.endDate) {
    return { error: "Escolha a data inicial e a data final." };
  }
  if (dayKey(input.endDate) < dayKey(input.startDate)) {
    return { error: "A data final deve ser igual ou posterior à data inicial." };
  }
  return {
    filter: {
      startDate: toBrasiliaISOString({
        ...dateParts(input.startDate),
        hour: 0,
        minute: 0,
      }),
      endDate: toBrasiliaISOString({
        ...dateParts(input.endDate),
        hour: 23,
        minute: 59,
      }),
    },
  };
}

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Texto do período de uma análise ou de um snapshot salvo. */
export function describePeriod(period: {
  limit?: number;
  startDate?: string;
  endDate?: string;
}): string {
  if (period.limit !== undefined) {
    return period.limit === 1
      ? "Última sessão"
      : `Últimas ${period.limit} sessões`;
  }
  if (period.startDate && period.endDate) {
    return `${shortDate.format(new Date(period.startDate))} a ${shortDate.format(new Date(period.endDate))}`;
  }
  return "Todas as sessões";
}

export function describeSnapshotPeriod(
  snapshot: StudentAnalysisReport,
): string {
  return describePeriod(snapshot);
}
