import type { StudentAnalysis } from "@/api/endpoints/session-analysis";
import {
  escapeHtml,
  formatMetric,
  getCategoryLabel,
} from "@/features/reports/session/sessionReport";
import { formatLongDate } from "@/utils/date";

import { markdownToHtml } from "./markdownToHtml";

function questionsLabel(total: number): string {
  return total === 1 ? "1 questão" : `${total} questões`;
}

export interface StudentReportInput {
  studentName: string;
  periodLabel: string;
  analysis: StudentAnalysis;
  /** Markdown da análise com IA (REL-06), incluído só quando informado. */
  aiAnalysis?: string;
}

/**
 * O documento exporta sínteses (acerto geral, por categoria e a lista de
 * sessões do período), nunca as respostas brutas nem as observações.
 */
export function buildStudentReportHtml({
  studentName,
  periodLabel,
  analysis,
  aiAnalysis,
}: StudentReportInput): string {
  const categories = Object.values(analysis.categories)
    .map(
      (item) =>
        `<tr><td>${escapeHtml(getCategoryLabel(item.category))}</td><td>${formatMetric(item.accuracy)} (${item.correct} de ${item.total})</td></tr>`,
    )
    .join("");
  const sessions = analysis.sessions.length
    ? `<table>${analysis.sessions
        .map(
          (session) =>
            `<tr><td>${escapeHtml(session.name)}<br /><small>${escapeHtml(formatLongDate(new Date(session.startedAt)))}</small></td><td>${questionsLabel(session.answers.length)}</td></tr>`,
        )
        .join("")}</table>`
    : "<p>Nenhuma sessão no período.</p>";

  const aiSection = aiAnalysis
    ? `<h2>Análise psicopedagógica (IA)</h2>${markdownToHtml(aiAnalysis)}`
    : "";

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><style>body{font-family:Arial,sans-serif;color:#173331;padding:28px}h1{color:#116f69}h2{font-size:16px;margin-top:24px}table{width:100%;border-collapse:collapse}td{border-bottom:1px solid #dfeae8;padding:8px 0}td:last-child{text-align:right;font-weight:bold}.metric{background:#f6faf9;border-radius:10px;padding:12px;margin:8px 0}small{color:#5a7471;font-weight:normal}</style></head><body><h1>Relatório do paciente</h1><p><strong>Paciente:</strong> ${escapeHtml(studentName)}</p><p><strong>Período:</strong> ${escapeHtml(periodLabel)}</p><div class="metric"><strong>Acerto geral:</strong> ${formatMetric(analysis.total.accuracy)} (${analysis.total.correct} de ${analysis.total.total})</div><h2>Acerto por categoria</h2><table>${categories}</table><h2>Sessões do período</h2>${sessions}${aiSection}</body></html>`;
}
