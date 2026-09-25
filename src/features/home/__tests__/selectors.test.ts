import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Appointment, TaskNotebookWithGroups } from "@/api/types";
import {
  countScheduledAppointments,
  selectRecentNotebooks,
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
    createdAt: "2026-04-01T12:00:00.000Z",
  };
}

const notebooks = ["first", "second", "third", "fourth"].map(
  (id) =>
    ({
      notebook: {
        id,
        educator: "educator-1",
        tasks: [],
        category: "reading",
        description: id,
        createdAt: "2026-04-01T12:00:00.000Z",
        taskGroupsIds: [],
      },
      taskGroups: [],
    }) satisfies TaskNotebookWithGroups,
);

describe("seletores da Home (AC-601-01, AC-601-05)", () => {
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

  it("preserva os tres primeiros cadernos na ordem da API", () => {
    expect(
      selectRecentNotebooks(notebooks).map(({ notebook }) => notebook.id),
    ).toEqual(["first", "second", "third"]);
    expect(selectRecentNotebooks([])).toEqual([]);
  });
});
