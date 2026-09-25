import { describe, expect, it, afterEach } from "vitest";
import {
  dayKey,
  formatLongDate,
  formatTime,
  getTodayKey,
  getVisibleMonthRange,
  groupByDayKey,
  isToday,
  toBrasiliaISOString,
} from "../date";

// 2026-04-03T02:30:00Z = 02/04/2026 23:30 em America/Sao_Paulo (Apêndice A, COMPATIBILIDADE.md)
const MIDNIGHT_EDGE = new Date("2026-04-03T02:30:00Z");

describe("formatLongDate (AC-306-01)", () => {
  it("formata por extenso em pt-BR no fuso fixo", () => {
    expect(formatLongDate(new Date("2026-04-02T15:00:00Z"))).toBe(
      "quinta-feira, 02 de abril de 2026",
    );
  });

  it("usa o dia correto perto da meia-noite (instante cruza o dia em SP)", () => {
    expect(formatLongDate(MIDNIGHT_EDGE)).toBe(
      "quinta-feira, 02 de abril de 2026",
    );
  });
});

describe("formatTime (AC-306-01)", () => {
  it("formata hh:mm em pt-BR no fuso fixo", () => {
    expect(formatTime(MIDNIGHT_EDGE)).toBe("23:30");
  });
});

describe("dayKey (AC-306-02/03)", () => {
  it("retorna AAAA-MM-DD no fuso fixo", () => {
    expect(dayKey(new Date("2026-04-02T15:00:00Z"))).toBe("2026-04-02");
  });

  it("usa o dia local de SP perto da meia-noite UTC", () => {
    expect(dayKey(MIDNIGHT_EDGE)).toBe("2026-04-02");
  });

  it("resolve o mesmo dia para offsets de entrada diferentes", () => {
    const viaOffset = new Date("2026-04-02T23:00:00-03:00");
    const viaUtc = new Date("2026-04-03T02:00:00Z");
    expect(dayKey(viaOffset)).toBe(dayKey(viaUtc));
  });
});

describe("groupByDayKey (AC-306-02)", () => {
  it("agrupa itens genéricos por dia no fuso fixo", () => {
    const items = [
      { id: "a", scheduledAt: "2026-04-02T15:00:00Z" },
      { id: "b", scheduledAt: "2026-04-03T02:30:00Z" }, // cai em 02/04 em SP
      { id: "c", scheduledAt: "2026-04-03T15:00:00Z" },
    ];
    const grouped = groupByDayKey(items, (item) => item.scheduledAt);
    expect(grouped.get("2026-04-02")?.map((i) => i.id)).toEqual(["a", "b"]);
    expect(grouped.get("2026-04-03")?.map((i) => i.id)).toEqual(["c"]);
  });
});

describe("getVisibleMonthRange (AC-306-03)", () => {
  it("retorna início e fim (exclusivo) do mês visível no fuso fixo", () => {
    const { start, end } = getVisibleMonthRange(2026, 3); // abril, 0-indexado
    expect(dayKey(start)).toBe("2026-04-01");
    expect(dayKey(end)).toBe("2026-05-01");
  });
});

describe("toBrasiliaISOString (AC-306-04)", () => {
  it("serializa partes de data/hora de Brasília para ISO com offset", () => {
    const iso = toBrasiliaISOString({
      year: 2026,
      month: 4,
      day: 2,
      hour: 23,
      minute: 30,
    });
    expect(iso).toMatch(/^2026-04-02T23:30:00[+-]\d{2}:\d{2}$/);
    expect(new Date(iso).toISOString()).toBe("2026-04-03T02:30:00.000Z");
  });
});

describe("isToday / getTodayKey (AC-306-05)", () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTz;
  });

  it("calcula 'hoje' em America/Sao_Paulo mesmo com aparelho em outro fuso", () => {
    process.env.TZ = "America/Los_Angeles";

    const nowUtc = new Date();
    const spOffsetHours = 3; // SP está atrás de UTC
    const nowInSp = new Date(nowUtc.getTime() - spOffsetHours * 60 * 60 * 1000);
    expect(getTodayKey()).toBe(dayKey(nowUtc));
    expect(isToday(nowUtc)).toBe(true);
    void nowInSp;
  });

  it("retorna false para um dia diferente de hoje", () => {
    process.env.TZ = "UTC";
    const farPast = new Date("2020-01-01T12:00:00Z");
    expect(isToday(farPast)).toBe(false);
  });
});
