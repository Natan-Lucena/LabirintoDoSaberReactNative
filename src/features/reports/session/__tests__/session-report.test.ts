import { describe, expect, it } from "vitest";

import type { SessionReport } from "@/api/endpoints/session-report";
import {
  buildSessionReportHtml,
  formatActivitySummary,
  formatAnswerDuration,
  formatSessionDuration,
} from "@/features/reports/session/sessionReport";

const report: SessionReport = {
  sessionName: "Leitura inicial",
  totalTimeSession: 125,
  totalQuestions: 4,
  averageTimePerQuestion: 31000,
  averageCorrectTime: 20000,
  averageIncorrectTime: null,
  percentageByCategory: { reading: 75, writing: null },
  percentageByType: { multipleChoice: 75 },
  observation: "<texto & observação>",
};

describe("formatSessionDuration", () => {
  it("G-07: totalTimeSession vem em segundos", () => {
    expect(formatSessionDuration(125)).toBe("2 min 5 s");
    expect(formatSessionDuration(159.852)).toBe("2 min 40 s");
    expect(formatSessionDuration(null)).toBe("—");
  });
});

describe("formatAnswerDuration", () => {
  it("G-07: as médias por resposta vêm em milissegundos", () => {
    expect(formatAnswerDuration(6816.2)).toBe("6,8 s");
    expect(formatAnswerDuration(10025.5)).toBe("10,0 s");
    expect(formatAnswerDuration(125000)).toBe("2 min 5 s");
    expect(formatAnswerDuration(null)).toBe("—");
  });
});

describe("buildSessionReportHtml", () => {
  it("inclui métricas e escapa a observação no HTML", () => {
    const html = buildSessionReportHtml(report, "Lia & Luisa");

    expect(html).toContain("Leitura inicial");
    expect(html).toContain("Lia &amp; Luisa");
    expect(html).toContain("&lt;texto &amp; observação&gt;");
    expect(html).toContain("31,0 s");
    expect(html).toContain("20,0 s");
    expect(html).toContain("—");
  });
});

describe("formatActivitySummary (EVO-03)", () => {
  it("monta '{total} jogos · {completed} concluídos · {correct} sem erro'", () => {
    expect(formatActivitySummary({ total: 3, completed: 2, correct: 1 })).toBe(
      "3 jogos · 2 concluídos · 1 sem erro",
    );
  });

  it("usa o singular com um jogo e um concluído", () => {
    expect(formatActivitySummary({ total: 1, completed: 1, correct: 0 })).toBe(
      "1 jogo · 1 concluído · 0 sem erro",
    );
  });
});

describe("buildSessionReportHtml: atividades jogadas (EVO-03)", () => {
  it("inclui o bloco 'Atividades jogadas' quando há jogos", () => {
    const html = buildSessionReportHtml({
      ...report,
      activitySummary: { total: 2, completed: 2, correct: 1 },
    });

    expect(html).toContain("Atividades jogadas");
    expect(html).toContain("2 jogos · 2 concluídos · 1 sem erro");
  });

  it.each([
    ["sem o campo (backend antigo)", undefined],
    ["com total zero", { total: 0, completed: 0, correct: 0 }],
  ])("omite o bloco %s", (_name, activitySummary) => {
    const html = buildSessionReportHtml({ ...report, activitySummary });

    expect(html).not.toContain("Atividades jogadas");
  });

  it("G-65: o bloco não altera os percentuais já calculados", () => {
    const without = buildSessionReportHtml(report);
    const withGames = buildSessionReportHtml({
      ...report,
      activitySummary: { total: 2, completed: 2, correct: 2 },
    });

    expect(withGames).toContain("<td>Leitura</td><td>75%</td>");
    expect(without).toContain("<td>Leitura</td><td>75%</td>");
    expect(withGames).toContain("Total de questões:</strong> 4");
  });
});
