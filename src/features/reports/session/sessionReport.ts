import type { SessionReport } from "@/api/endpoints/session-report";

const categoryLabels: Record<string, string> = {
  reading: "Leitura",
  writing: "Escrita",
  vocabulary: "Vocabulário",
  comprehension: "Compreensão",
};

const typeLabels: Record<string, string> = {
  multipleChoice: "Múltipla escolha",
  multipleChoiceWithMedia: "Múltipla escolha com mídia",
};

/** Provisório G-07: a API ainda não documenta a unidade; assume segundos. */
export function formatSessionDuration(value: number | null): string {
  if (value === null) {
    return "—";
  }

  const seconds = Math.max(0, Math.round(value));
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0
    ? `${minutes} min ${remainingSeconds} s`
    : `${remainingSeconds} s`;
}

export function formatMetric(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export function getCategoryLabel(category: string): string {
  return categoryLabels[category] ?? category;
}

export function getTypeLabel(type: string): string {
  return typeLabels[type] ?? type;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function metricRows(
  values: Record<string, number | null>,
  label: (key: string) => string,
): string {
  return Object.entries(values)
    .map(
      ([key, value]) =>
        `<tr><td>${escapeHtml(label(key))}</td><td>${formatMetric(value)}</td></tr>`,
    )
    .join("");
}

export function buildSessionReportHtml(
  report: SessionReport,
  patientName?: string,
): string {
  const observation = report.observation ?? "Sem registro";
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><style>body{font-family:Arial,sans-serif;color:#173331;padding:28px}h1{color:#116f69}h2{font-size:16px;margin-top:24px}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #dfeae8;padding:8px 0}td:last-child{text-align:right;font-weight:bold}.metric{background:#f6faf9;border-radius:10px;padding:12px;margin:8px 0}.note{white-space:pre-wrap}</style></head><body><h1>Relatório da sessão</h1><p><strong>Sessão:</strong> ${escapeHtml(report.sessionName)}</p>${patientName ? `<p><strong>Paciente:</strong> ${escapeHtml(patientName)}</p>` : ""}<div class="metric"><strong>Total de questões:</strong> ${report.totalQuestions}</div><div class="metric"><strong>Tempo total:</strong> ${formatSessionDuration(report.totalTimeSession)}</div><div class="metric"><strong>Tempo médio por questão:</strong> ${formatSessionDuration(report.averageTimePerQuestion)}</div><div class="metric"><strong>Média de acerto:</strong> ${formatSessionDuration(report.averageCorrectTime)}</div><div class="metric"><strong>Média de erro:</strong> ${formatSessionDuration(report.averageIncorrectTime)}</div><h2>Percentual por categoria</h2><table>${metricRows(report.percentageByCategory, getCategoryLabel)}</table><h2>Percentual por tipo</h2><table>${metricRows(report.percentageByType, getTypeLabel)}</table><h2>Observação</h2><p class="note">${escapeHtml(observation)}</p></body></html>`;
}
