import { describe, expect, it } from "vitest";

import { visibleGridRange } from "@/features/agenda/month/range";
import { dayAfterMonthChange } from "@/features/agenda/month/MonthView";

describe("visibleGridRange (AC-AGE-05-01)", () => {
  it("vai da segunda da 1a semana ao domingo da última", () => {
    // Abril/2026: dia 1 é quarta, dia 30 é quinta.
    expect(visibleGridRange(2026, 3)).toEqual({
      from: "2026-03-30",
      to: "2026-05-03",
    });
  });

  it("não acrescenta dias quando o mês começa na segunda e termina no domingo", () => {
    // Fevereiro/2027: 1 (segunda) a 28 (domingo).
    expect(visibleGridRange(2027, 1)).toEqual({
      from: "2027-02-01",
      to: "2027-02-28",
    });
  });

  it("cruza a virada de ano", () => {
    expect(visibleGridRange(2026, 11)).toEqual({
      from: "2026-11-30",
      to: "2027-01-03",
    });
    expect(visibleGridRange(2027, 0)).toEqual({
      from: "2026-12-28",
      to: "2027-01-31",
    });
  });
});

describe("dayAfterMonthChange", () => {
  it("vai para hoje no mês atual e para o dia 1 nos demais", () => {
    expect(dayAfterMonthChange(2026, 3, "2026-04-15")).toBe("2026-04-15");
    expect(dayAfterMonthChange(2026, 4, "2026-04-15")).toBe("2026-05-01");
    expect(dayAfterMonthChange(2027, 0, "2026-12-31")).toBe("2027-01-01");
  });
});
