import { describe, expect, it } from "vitest";

import type { Appointment } from "@/api/types";
import {
  selectAppointmentCountsByDay,
  selectAppointmentDayKeys,
  selectAppointmentsForDay,
  selectDaySummary,
} from "@/features/appointments/selectors";

function appointment(
  id: string,
  scheduledAt: string,
  status: Appointment["status"] = "PENDING",
): Appointment {
  return {
    id,
    educatorId: "educator-1",
    studentId: "student-1",
    scheduledAt,
    status,
    durationMinutes: 50,
    createdAt: "2026-04-01T12:00:00.000Z",
  };
}

describe("seletores da Agenda (AC-901-01, G-13)", () => {
  const appointments = [
    appointment("late", "2026-04-02T18:00:00.000Z"),
    appointment("cancelled", "2026-04-02T12:00:00.000Z", "CANCELLED"),
    appointment("early", "2026-04-02T11:00:00.000Z", "COMPLETED"),
    appointment("other-month", "2026-05-01T12:00:00.000Z"),
  ];

  it("marca somente os dias do mes visivel com agendamento", () => {
    expect(selectAppointmentDayKeys(appointments, 2026, 3)).toEqual([
      "2026-04-02",
    ]);
  });

  it("conta por dia de Sao Paulo, sem cancelados e dentro do intervalo (AC-AGE-05-01/02)", () => {
    const list = [
      appointment("a", "2026-04-02T12:00:00.000Z"),
      appointment("b", "2026-04-02T15:00:00.000Z", "COMPLETED"),
      appointment("c", "2026-04-03T01:30:00.000Z"), // 22:30 de 02/04 em SP
      appointment("d", "2026-04-04T12:00:00.000Z", "CANCELLED"),
      appointment("e", "2026-05-10T12:00:00.000Z"),
    ];
    expect(
      selectAppointmentCountsByDay(list, "2026-03-30", "2026-05-03"),
    ).toEqual({
      "2026-04-02": 3,
    });
  });

  it("lista o dia em ordem de horario e mantem cancelados", () => {
    expect(
      selectAppointmentsForDay(appointments, "2026-04-02").map(({ id }) => id),
    ).toEqual(["early", "cancelled", "late"]);
  });

  it("exclui cancelados do resumo do dia", () => {
    expect(
      selectDaySummary(selectAppointmentsForDay(appointments, "2026-04-02")),
    ).toMatchObject({
      total: 2,
      first: { id: "early" },
      last: { id: "late" },
    });
  });
});
