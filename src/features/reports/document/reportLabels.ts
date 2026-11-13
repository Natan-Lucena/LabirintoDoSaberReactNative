import type { ReportAudience, ReportType } from "@/api/types";
import { dayKey } from "@/utils/date";

/** `AAAA-MM-DD` ou data/hora ISO → `DD/MM/AAAA` (dia no fuso do app). */
export function formatReportDate(value: string): string {
  let day: string | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    day = value;
  } else {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) day = dayKey(parsed);
  }
  if (!day) return value;
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year}`;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  PROGRESS: "Progresso",
  ASSESSMENT: "Avaliação",
  PDI_PROGRESS: "Evolução do PDI",
};

export const REPORT_AUDIENCE_LABELS: Record<ReportAudience, string> = {
  FAMILY: "Família",
  SCHOOL: "Escola",
  PROFESSIONAL: "Profissional",
};

const GOAL_STATUS_LABELS: Record<string, string> = {
  NOT_STARTED: "Não iniciada",
  IN_PROGRESS: "Em andamento",
  ACHIEVED: "Atingida",
  DISCONTINUED: "Descontinuada",
};

export function goalStatusLabel(status: string): string {
  return GOAL_STATUS_LABELS[status] ?? status;
}

export const EMPTY_TEXTS = {
  evolutions: "Sem evoluções no período.",
  planProgress: "Sem planos no período.",
  assessments: "Sem avaliações no período.",
} as const;
