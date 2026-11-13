import type { Report } from "@/api/types";
import {
  accuracyToPercent,
  escapeHtml,
  formatMetric,
  getCategoryLabel,
} from "@/features/reports/session/sessionReport";
import { EMPTY_TEXTS, formatReportDate, goalStatusLabel } from "./reportLabels";

const e = escapeHtml;

function date(value: string): string {
  return e(formatReportDate(value));
}

function section(title: string, body: string): string {
  return `<section><h2>${e(title)}</h2>${body}</section>`;
}

/**
 * HTML do relatório (REL-02): só as seções presentes em `content`, tudo escapado.
 * Não inclui contato nem documento do paciente: o `content` não os traz e o
 * documento só usa os campos listados aqui.
 */
export function buildReportHtml(report: Report): string {
  const { content } = report;
  const parts: string[] = [];

  if (content.patient) {
    const { displayName, ageYears, schoolGrade } = content.patient;
    parts.push(
      section(
        "Dados do paciente",
        `<p>${e(displayName)} · ${ageYears} anos${schoolGrade ? ` · ${e(schoolGrade)}` : ""}</p>`,
      ),
    );
  }

  if (content.sessionMetrics) {
    const m = content.sessionMetrics;
    const rows = m.byCategory
      .map(
        (item) =>
          `<tr><td>${e(getCategoryLabel(item.category))}</td><td>${formatMetric(accuracyToPercent(item.accuracy))}</td></tr>`,
      )
      .join("");
    parts.push(
      section(
        "Desempenho nas sessões",
        `<p>${m.sessions} sessões · ${m.answered} respostas · acerto geral ${formatMetric(accuracyToPercent(m.accuracy))}</p><table>${rows}</table>`,
      ),
    );
  }

  if (content.evolutions) {
    const items = content.evolutions
      .map(
        (item) =>
          `<li><strong>${date(item.sessionDate)}</strong>${item.planTitle ? ` · ${e(item.planTitle)}` : ""} · ${item.achieved} de ${item.total} metas<br/>${e(item.record)}</li>`,
      )
      .join("");
    parts.push(
      section(
        "Evolução das sessões",
        items ? `<ul>${items}</ul>` : `<p>${EMPTY_TEXTS.evolutions}</p>`,
      ),
    );
  }

  if (content.planProgress) {
    const items = content.planProgress
      .map(
        (plan) =>
          `<li><strong>${e(plan.title)}</strong> (${plan.type}) · ${plan.percent}%<ul>${plan.goals
            .map(
              (g) =>
                `<li>${e(g.description)} · ${e(goalStatusLabel(g.status))}</li>`,
            )
            .join("")}</ul></li>`,
      )
      .join("");
    parts.push(
      section(
        "Progresso dos planos",
        items ? `<ul>${items}</ul>` : `<p>${EMPTY_TEXTS.planProgress}</p>`,
      ),
    );
  }

  if (content.assessments) {
    const rows = content.assessments
      .map(
        (item) =>
          `<tr><td>${e(item.templateName)}</td><td>${date(item.completedAt)}</td><td>${item.value} de ${item.max}${item.band ? ` · ${e(item.band)}` : ""}</td></tr>`,
      )
      .join("");
    parts.push(
      section(
        "Avaliações",
        rows ? `<table>${rows}</table>` : `<p>${EMPTY_TEXTS.assessments}</p>`,
      ),
    );
  }

  if (content.anamnesisSummary) {
    parts.push(
      section("Resumo da anamnese", `<p>${e(content.anamnesisSummary)}</p>`),
    );
  }

  if (content.synthesis) {
    const paragraphs = content.synthesis
      .split(/\n+/)
      .filter((line) => line.trim())
      .map((line) => `<p>${e(line)}</p>`)
      .join("");
    parts.push(section("Síntese", paragraphs));
  }

  const profession = content.professional.profession
    ? ` · ${e(content.professional.profession)}`
    : "";

  return `<!doctype html><html><head><meta charset="utf-8"/><style>
body{font-family:Arial,sans-serif;color:#1d2433;padding:24px;line-height:1.5}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:20px 0 6px}
table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #ddd;padding:6px 4px;font-size:13px}
.meta{color:#555;font-size:12px}
</style></head><body>
<h1>${e(content.title)}</h1>
<p class="meta">${e(report.studentName)} · ${date(report.period.from)} a ${date(report.period.to)}<br/>${e(content.professional.name)}${profession}</p>
${parts.join("\n")}
</body></html>`;
}
