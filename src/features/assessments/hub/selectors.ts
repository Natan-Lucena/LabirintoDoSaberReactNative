import type {
  BandSeverity,
  ScaleApplicationSummary,
  ScaleTemplateSummary,
} from "@/api/types";
import { color, semanticColor } from "@/theme";
import { TIME_ZONE } from "@/utils/date";

export interface SeverityTone {
  backgroundColor: string;
  color: string;
}

/** Cor do badge pela `severity` da faixa (AC-AVA-01-02). */
export const severityTone: Record<BandSeverity, SeverityTone> = {
  LOW: { backgroundColor: color.brand[100], color: color.brand[700] },
  MODERATE: {
    backgroundColor: color.yellow,
    color: semanticColor.warningTextOnYellow,
  },
  HIGH: {
    backgroundColor: "#fdecec",
    color: semanticColor.dangerTextOnSurface,
  },
};

export interface BandBadge {
  /** Texto do servidor; faixa de rascunho leva o sufixo "parcial" (G-60). */
  label: string;
  severity: BandSeverity;
}

/** Faixa da aplicação, ou `undefined` se o servidor não enviou. */
export function selectBandBadge(
  application: ScaleApplicationSummary,
): BandBadge | undefined {
  const { band, partial } = application.score;

  if (!band) return undefined;

  return {
    label: partial ? `${band.label} (parcial)` : band.label,
    severity: band.severity,
  };
}

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function formatApplicationDate(iso: string): string {
  return DATE_FORMATTER.format(new Date(iso));
}

/** Conclusão para aplicações concluídas, última edição para rascunhos. */
export function applicationDate(application: ScaleApplicationSummary): string {
  return formatApplicationDate(
    application.completedAt ?? application.updatedAt,
  );
}

export function templateDescription(template: ScaleTemplateSummary): string {
  return `${template.itemCount} itens · ${template.estimatedMinutes} min`;
}

/** O catálogo mostra só escalas ativas, na ordem do servidor. */
export function selectActiveTemplates(
  templates: ScaleTemplateSummary[],
): ScaleTemplateSummary[] {
  return templates.filter((template) => template.active);
}
