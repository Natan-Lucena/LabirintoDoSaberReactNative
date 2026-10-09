import { describe, expect, it } from "vitest";

import type { SessionReport } from "@/api/endpoints/session-report";
import {
  buildSessionReportHtml,
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
