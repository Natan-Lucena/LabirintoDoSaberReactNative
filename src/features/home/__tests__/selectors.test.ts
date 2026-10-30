import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Appointment } from "@/api/types";
import {
  countScheduledAppointments,
  selectNextAppointment,
  selectTodayAppointments,
} from "@/features/home/selectors";
import { toBrasiliaISOString } from "@/utils/date";

function appointment(
  id: string,
  hour: number,
  status: Appointment["status"],
): Appointment {
  return {
    id,
    educatorId: "educator-1",
    studentId: `student-${id}`,
    scheduledAt: toBrasiliaISOString({
      year: 2026,
      month: 4,
      day: 2,
      hour,
      minute: 0,
    }),
    status,
    durationMinutes: 50,
    createdAt: "2026-04-01T12:00:00.000Z",
  };
}

describe("seletores da Home (AC-HOME-01-01, AC-HOME-01-04)", () => {
  const originalTimeZone = process.env.TZ;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T15:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.TZ = originalTimeZone;
  });

  it("filtra hoje em Sao Paulo e ordena por horario, mantendo cancelados", () => {
    const today = [
      appointment("late", 15, "PENDING"),
      appointment("cancelled", 9, "CANCELLED"),
      appointment("early", 8, "COMPLETED"),
    ];
    const anotherDay = {
      ...appointment("tomorrow", 10, "PENDING"),
      scheduledAt: "2026-04-03T13:00:00.000Z",
    };

    expect(
      selectTodayAppointments([...today, anotherDay]).map((item) => item.id),
    ).toEqual(["early", "cancelled", "late"]);
    expect(countScheduledAppointments(today)).toBe(2);
  });

  it("usa o fuso fixo, inclusive perto da meia-noite, e preserva empates", () => {
    process.env.TZ = "America/Los_Angeles";
    const lateInSaoPaulo = {
      ...appointment("late-sp", 9, "PENDING"),
      scheduledAt: "2026-04-03T02:30:00.000Z",
    };
    const nextDayInSaoPaulo = {
      ...appointment("next-day-sp", 9, "PENDING"),
      scheduledAt: "2026-04-03T03:30:00.000Z",
    };
    const sameTimeFirst = appointment("same-time-first", 11, "PENDING");
    const sameTimeSecond = appointment("same-time-second", 11, "PENDING");

    expect(
      selectTodayAppointments([
        sameTimeFirst,
        lateInSaoPaulo,
        nextDayInSaoPaulo,
        sameTimeSecond,
      ]).map((item) => item.id),
    ).toEqual(["same-time-first", "same-time-second", "late-sp"]);
  });

  it("escolhe o primeiro atendimento pendente e ignora concluídos e cancelados", () => {
    const appointments = [
      appointment("done", 8, "COMPLETED"),
      appointment("cancelled", 9, "CANCELLED"),
      appointment("next", 10, "PENDING"),
    ];

    const beforeTen = new Date("2026-04-02T12:00:00.000Z");

    expect(selectNextAppointment(appointments, beforeTen)?.id).toBe("next");
    expect(
      selectNextAppointment(
        appointments.filter(({ status }) => status !== "PENDING"),
        beforeTen,
      ),
    ).toBeUndefined();
  });

  it("D14: atendimento que já terminou sem ser concluído não é o próximo", () => {
    const missed = {
      ...appointment("missed", 8, "PENDING"),
      durationMinutes: 30,
    };
    const later = appointment("later", 16, "PENDING");
    const now = new Date("2026-04-02T18:00:00.000Z"); // 15:00 em São Paulo

    expect(selectNextAppointment([missed, later], now)?.id).toBe("later");
    expect(selectNextAppointment([missed], now)).toBeUndefined();
  });

  it("D14: atendimento em andamento ainda é o próximo", () => {
    const inProgress = {
      ...appointment("in-progress", 10, "PENDING"),
      durationMinutes: 50,
    };
    const later = appointment("later", 14, "PENDING");
    const now = new Date("2026-04-02T13:10:00.000Z"); // 10:10 em São Paulo

    expect(selectNextAppointment([inProgress, later], now)?.id).toBe(
      "in-progress",
    );
  });

  it("D14: sem atendimento elegível devolve undefined", () => {
    const now = new Date("2026-04-02T12:00:00.000Z");

    expect(selectNextAppointment([], now)).toBeUndefined();
    expect(
      selectNextAppointment([appointment("done", 10, "COMPLETED")], now),
    ).toBeUndefined();
  });
});
