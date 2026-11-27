import { describe, expect, it } from "vitest";

import { dayKey, formatTime } from "@/utils/date";
import {
  occurrencesError,
  previewSeries,
  previewText,
  seriesDates,
} from "@/features/agenda/series/preview";

// 2026-12-01 é terça-feira; 17:00Z = 14:00 em São Paulo (UTC-3).
const TUESDAY = new Date("2026-12-01T17:00:00.000Z");

describe("previewSeries (AC-AGE-06-01)", () => {
  it("semanal: conta, última data e texto em São Paulo", () => {
    const preview = previewSeries({
      first: TUESDAY,
      frequency: "WEEKLY",
      occurrences: 8,
    });

    expect(preview.count).toBe(8);
    expect(dayKey(preview.last)).toBe("2027-01-19");
    expect(preview.weekdayLabel).toBe("terça");
    expect(preview.time).toBe("14:00");
    expect(previewText(preview, "WEEKLY")).toBe(
      "8 atendimentos, toda terça às 14:00, até 19/01",
    );
  });

  it("atravessa a virada do mês e do ano mantendo a hora local", () => {
    const dates = seriesDates(TUESDAY, "WEEKLY", 6);

    expect(dates.map((date) => dayKey(date))).toEqual([
      "2026-12-01",
      "2026-12-08",
      "2026-12-15",
      "2026-12-22",
      "2026-12-29",
      "2027-01-05",
    ]);
    expect(new Set(dates.map((date) => formatTime(date)))).toEqual(
      new Set(["14:00"]),
    );
  });

  it("quinzenal soma 14 dias", () => {
    const dates = seriesDates(TUESDAY, "BIWEEKLY", 3);

    expect(dates.map((date) => dayKey(date))).toEqual([
      "2026-12-01",
      "2026-12-15",
      "2026-12-29",
    ]);
    expect(
      previewText(
        previewSeries({
          first: TUESDAY,
          frequency: "BIWEEKLY",
          occurrences: 3,
        }),
        "BIWEEKLY",
      ),
    ).toBe("3 atendimentos, a cada 2 semanas, terça às 14:00, até 29/12");
  });

  it("não perde o dia quando a hora local de São Paulo cai noutro dia em UTC", () => {
    // 22:30 em São Paulo = 01:30Z do dia seguinte.
    const late = new Date("2026-12-02T01:30:00.000Z");
    const dates = seriesDates(late, "WEEKLY", 2);

    expect(dates.map((date) => dayKey(date))).toEqual([
      "2026-12-01",
      "2026-12-08",
    ]);
    expect(formatTime(dates[1]!)).toBe("22:30");
  });
});

describe("occurrencesError", () => {
  it("semanal aceita de 2 a 26", () => {
    expect(occurrencesError("WEEKLY", 2)).toBeUndefined();
    expect(occurrencesError("WEEKLY", 26)).toBeUndefined();
    expect(occurrencesError("WEEKLY", 1)).toBe(
      "Escolha de 2 a 26 atendimentos.",
    );
    expect(occurrencesError("WEEKLY", 27)).toBe(
      "Escolha de 2 a 26 atendimentos.",
    );
  });

  it("quinzenal aceita de 2 a 13", () => {
    expect(occurrencesError("BIWEEKLY", 13)).toBeUndefined();
    expect(occurrencesError("BIWEEKLY", 14)).toBe(
      "Escolha de 2 a 13 atendimentos.",
    );
    expect(occurrencesError("BIWEEKLY", Number.NaN)).toBe(
      "Escolha de 2 a 13 atendimentos.",
    );
  });
});
