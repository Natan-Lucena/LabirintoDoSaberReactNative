import { describe, expect, it } from "vitest";

import type { SessionReport } from "@/api/endpoints/session-report";
import {
  buildSessionReportHtml,
  formatSessionDuration,
} from "@/features/reports/session/sessionReport";

const report: SessionReport = {
  sessionName: "Leitura inicial",
  totalTimeSession: 125,
  totalQuestions: 4,
  averageTimePerQuestion: 31,
  averageCorrectTime: 20,
  averageIncorrectTime: null,
  percentageByCategory: { reading: 75, writing: null },
  percentageByType: { multipleChoice: 75 },
  observation: "<texto & observação>",
};

describe("formatSessionDuration", () => {
  it("trata o valor provisoriamente como segundos conforme G-07", () => {
    expect(formatSessionDuration(125)).toBe("2 min 5 s");
    expect(formatSessionDuration(null)).toBe("—");
  });
});

describe("buildSessionReportHtml", () => {
  it("inclui métricas e escapa a observação no HTML", () => {
    const html = buildSessionReportHtml(report, "Lia & Luisa");

    expect(html).toContain("Leitura inicial");
    expect(html).toContain("Lia &amp; Luisa");
    expect(html).toContain("&lt;texto &amp; observação&gt;");
    expect(html).toContain("—");
  });
});
