import { describe, expect, it } from "vitest";

import type { Appointment } from "@/api/types";
import {
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
