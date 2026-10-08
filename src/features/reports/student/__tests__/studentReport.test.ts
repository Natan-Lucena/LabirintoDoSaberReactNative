import { describe, expect, it } from "vitest";

import type { StudentAnalysis } from "@/api/endpoints/session-analysis";
import { buildStudentReportHtml } from "../studentReport";

const ANALYSIS: StudentAnalysis = {
  categories: {
    reading: { category: "reading", total: 3, correct: 2, accuracy: 66.6 },
  },
  total: { total: 3, correct: 2, accuracy: 66.6 },
  sessions: [
    {
      id: "session-1",
      studentId: "student-1",
      educatorId: "educator-1",
      name: "Leitura inicial",
      startedAt: "2026-10-01T10:00:00-03:00",
      finishedAt: "2026-10-01T10:25:00-03:00",
      observation: "Observação clínica privada",
      answers: [
        {
          taskId: "task-secret",
          selectedAlternativeId: "alt-secret",
          isCorrect: true,
          timeToAnswer: 10,
          answeredAt: "2026-10-01T10:02:00-03:00",
        },
      ],
    },
  ],
};

describe("buildStudentReportHtml", () => {
  const html = buildStudentReportHtml({
    studentName: "Ana <b>Souza</b>",
    periodLabel: "Últimas 6 sessões",
    analysis: ANALYSIS,
  });

  it("traz paciente, período, acerto geral e acerto por categoria", () => {
    expect(html).toContain("Relatório do paciente");
    expect(html).toContain("Últimas 6 sessões");
    expect(html).toContain("67%");
    expect(html).toContain("2 de 3");
    expect(html).toContain("Leitura");
  });

  it("escapa o nome do paciente", () => {
    expect(html).toContain("Ana &lt;b&gt;Souza&lt;/b&gt;");
    expect(html).not.toContain("<b>Souza</b>");
  });

  it("lista as sessões do período só com nome, data e nº de questões", () => {
    expect(html).toContain("Leitura inicial");
    expect(html).toContain("1 questão");
  });

  it("exporta sínteses, não respostas brutas nem observações (privacidade)", () => {
    expect(html).not.toContain("task-secret");
    expect(html).not.toContain("alt-secret");
    expect(html).not.toContain("Observação clínica privada");
  });

  it("sem sessões no período informa que não há dados", () => {
    const empty = buildStudentReportHtml({
      studentName: "Ana",
      periodLabel: "Todas as sessões",
      analysis: {
        categories: {},
        total: { total: 0, correct: 0, accuracy: 0 },
        sessions: [],
      },
    });

    expect(empty).toContain("Nenhuma sessão no período.");
  });
});
