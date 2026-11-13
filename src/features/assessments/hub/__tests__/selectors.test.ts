import { describe, expect, it } from "vitest";

import type { BandSeverity, ScaleApplicationSummary } from "@/api/types";
import { getContrastRatio } from "@/theme/contrast";
import {
  applicationDate,
  selectActiveTemplates,
  selectBandBadge,
  severityTone,
} from "../selectors";

function application(
  overrides: Partial<ScaleApplicationSummary["score"]> = {},
): ScaleApplicationSummary {
  return {
    id: "a1",
    templateId: "t1",
    templateCode: "T1",
    templateVersion: 1,
    templateName: "Escala T1",
    studentId: "s1",
    studentName: "Lia Monteiro",
    educatorId: "e1",
    status: "COMPLETED",
    score: {
      partial: false,
      answered: 6,
      total: 6,
      value: 10,
      max: 18,
      band: { label: "Indicativo moderado", severity: "MODERATE" },
      subscales: [],
      ...overrides,
    },
    disclaimer: "Triagem, não diagnóstico.",
    startedAt: "2026-11-01T12:00:00.000Z",
    updatedAt: "2026-11-02T12:00:00.000Z",
    completedAt: "2026-11-03T12:00:00.000Z",
  };
}

describe("selectBandBadge (AC-AVA-01-02)", () => {
  it.each<BandSeverity>(["LOW", "MODERATE", "HIGH"])(
    "usa a severity %s e o label do servidor",
    (severity) => {
      const badge = selectBandBadge(
        application({ band: { label: "Texto do servidor", severity } }),
      );

      expect(badge).toEqual({ label: "Texto do servidor", severity });
    },
  );

  it("marca a faixa de rascunho como parcial (G-60)", () => {
    const badge = selectBandBadge(application({ partial: true }));

    expect(badge?.label).toBe("Indicativo moderado (parcial)");
  });

  it("sem faixa não há badge", () => {
    expect(selectBandBadge(application({ band: undefined }))).toBeUndefined();
  });

  it("cada severity tem cor própria e texto com contraste >= 4,5:1", () => {
    const backgrounds = Object.values(severityTone).map(
      (tone) => tone.backgroundColor,
    );

    expect(new Set(backgrounds).size).toBe(3);
    for (const tone of Object.values(severityTone)) {
      expect(
        getContrastRatio(tone.color, tone.backgroundColor),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("applicationDate", () => {
  it("usa a conclusão e, sem ela, a última edição, no fuso de São Paulo", () => {
    const done = application();
    const draft = { ...done, completedAt: undefined };

    expect(applicationDate(done)).toBe("03/11/2026");
    expect(applicationDate(draft)).toBe("02/11/2026");
  });
});

describe("selectActiveTemplates", () => {
  it("descarta escalas inativas", () => {
    const base = {
      code: "c",
      version: 1,
      description: "",
      respondent: "PROFESSIONAL" as const,
      estimatedMinutes: 5,
      itemCount: 3,
    };

    expect(
      selectActiveTemplates([
        { ...base, id: "a", name: "A", active: true },
        { ...base, id: "b", name: "B", active: false },
      ]).map((template) => template.id),
    ).toEqual(["a"]);
  });
});
