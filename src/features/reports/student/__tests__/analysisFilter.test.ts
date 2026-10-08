import { describe, expect, it } from "vitest";

import type { StudentAnalysisReport } from "@/api/endpoints/session-analysis";
import { buildAnalysisFilter, describeSnapshotPeriod } from "../analysisFilter";

describe("buildAnalysisFilter", () => {
  it("AC-REL-05-01: no modo últimas sessões envia só o limit", () => {
    const result = buildAnalysisFilter({
      mode: "last",
      limit: "6",
      startDate: new Date("2026-10-01T15:00:00Z"),
      endDate: new Date("2026-10-31T15:00:00Z"),
    });

    expect(result).toEqual({ filter: { limit: 6 } });
    expect(result).not.toHaveProperty("filter.startDate");
  });

  it("AC-REL-05-01: no modo datas envia só o intervalo, nunca o limit", () => {
    const result = buildAnalysisFilter({
      mode: "dates",
      limit: "6",
      startDate: new Date("2026-10-01T15:00:00Z"),
      endDate: new Date("2026-10-31T15:00:00Z"),
    });

    expect(result).toEqual({
      filter: {
        startDate: "2026-10-01T00:00:00-03:00",
        endDate: "2026-10-31T23:59:00-03:00",
      },
    });
    expect(result).not.toHaveProperty("filter.limit");
  });

  it.each(["", "0", "-2", "1.5", "abc", " "])(
    "rejeita o limite %j",
    (limit) => {
      const result = buildAnalysisFilter({
        mode: "last",
        limit,
        startDate: null,
        endDate: null,
      });

      expect(result).toEqual({
        error: "Informe um número inteiro de sessões maior que zero.",
      });
    },
  );

  it("exige as duas datas no modo datas", () => {
    expect(
      buildAnalysisFilter({
        mode: "dates",
        limit: "6",
        startDate: new Date("2026-10-01T15:00:00Z"),
        endDate: null,
      }),
    ).toEqual({ error: "Escolha a data inicial e a data final." });
  });

  it("rejeita data final anterior à inicial", () => {
    expect(
      buildAnalysisFilter({
        mode: "dates",
        limit: "6",
        startDate: new Date("2026-10-10T15:00:00Z"),
        endDate: new Date("2026-10-01T15:00:00Z"),
      }),
    ).toEqual({
      error: "A data final deve ser igual ou posterior à data inicial.",
    });
  });

  it("aceita o mesmo dia como início e fim", () => {
    const result = buildAnalysisFilter({
      mode: "dates",
      limit: "6",
      startDate: new Date("2026-10-05T15:00:00Z"),
      endDate: new Date("2026-10-05T18:00:00Z"),
    });

    expect(result).toEqual({
      filter: {
        startDate: "2026-10-05T00:00:00-03:00",
        endDate: "2026-10-05T23:59:00-03:00",
      },
    });
  });
});

describe("describeSnapshotPeriod", () => {
  const base: StudentAnalysisReport = {
    studentId: "student-1",
    sessionIds: [],
    categories: [],
    totalQuestions: 0,
    totalCorrect: 0,
    accuracy: 0,
  };

  it("descreve o filtro por quantidade de sessões", () => {
    expect(describeSnapshotPeriod({ ...base, limit: 6 })).toBe(
      "Últimas 6 sessões",
    );
    expect(describeSnapshotPeriod({ ...base, limit: 1 })).toBe(
      "Última sessão",
    );
  });

  it("descreve o intervalo de datas no fuso de São Paulo", () => {
    expect(
      describeSnapshotPeriod({
        ...base,
        startDate: "2026-10-01T00:00:00-03:00",
        endDate: "2026-10-31T23:59:00-03:00",
      }),
    ).toBe("01/10/2026 a 31/10/2026");
  });

  it("sem filtro descreve todas as sessões", () => {
    expect(describeSnapshotPeriod(base)).toBe("Todas as sessões");
  });
});
