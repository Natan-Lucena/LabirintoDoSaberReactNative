import type {
  ReportAudience,
  ReportOptions,
  ReportSection,
  ReportType,
} from "@/api/types";
import { dayKey } from "@/utils/date";

const DAY_MS = 86_400_000;

/** Seções do tipo, na ordem de `options.sections`. */
export function allowedSectionsFor(
  options: ReportOptions,
  type: ReportType,
): ReportSection[] {
  const allowed =
    options.types.find((item) => item.type === type)?.allowedSections ?? [];

  return options.sections
    .map((item) => item.section)
    .filter((section) => allowed.includes(section));
}

/** RP-01: o servidor devolve todas; para família e escola o app tira as sensíveis. */
export function defaultSectionsFor(
  options: ReportOptions,
  type: ReportType,
  audience: ReportAudience,
): ReportSection[] {
  const defaults =
    options.types.find((item) => item.type === type)?.defaultSections ?? [];
  const restrict = audience === "FAMILY" || audience === "SCHOOL";
  const sensitive = new Set(
    options.sections.filter((item) => item.sensitive).map((i) => i.section),
  );

  return allowedSectionsFor(options, type).filter(
    (section) =>
      defaults.includes(section) && !(restrict && sensitive.has(section)),
  );
}

export function sensitiveSelected(
  options: ReportOptions,
  selected: ReportSection[],
): string[] {
  return options.sections
    .filter((item) => item.sensitive && selected.includes(item.section))
    .map((item) => item.label);
}

/** Predefinido: termina hoje (Brasília) e começa `days` dias antes. */
export function presetPeriod(
  days: number,
  now: Date = new Date(),
): { from: string; to: string } {
  return {
    from: dayKey(new Date(now.getTime() - days * DAY_MS)),
    to: dayKey(now),
  };
}

export function validatePeriod(
  from: string,
  to: string,
  maxDays: number,
): string | null {
  if (!from || !to) return "Escolha as datas do período.";
  const span =
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS;
  if (Number.isNaN(span) || span < 0) {
    return "A data inicial deve ser anterior à final.";
  }
  if (span > maxDays) return `O período pode ter no máximo ${maxDays} dias.`;
  return null;
}
