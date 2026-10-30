import { describe, expect, it } from "vitest";
import type { Appointment } from "@/api/types";
import { selectCurrentAppointment } from "@/features/agenda/selectors";

const at = (
  id: string,
  scheduledAt: string,
  status: Appointment["status"],
): Appointment => ({
  id,
  educatorId: "educator-1",
  studentId: "student-1",
  scheduledAt,
  status,
  durationMinutes: 50,
  createdAt: "2026-04-01T12:00:00Z",
});

describe("selectCurrentAppointment (AC-AGE-01-03)", () => {
  const items = [
    at("later", "2026-04-02T15:00:00Z", "PENDING"),
    at("done", "2026-04-02T11:00:00Z", "COMPLETED"),
    at("next", "2026-04-02T13:00:00Z", "PENDING"),
    at("cancelled", "2026-04-02T12:00:00Z", "CANCELLED"),
  ];
  it("escolhe o primeiro pendente de hoje em São Paulo, mesmo com lista desordenada", () => {
    expect(
      selectCurrentAppointment(
        items,
        "2026-04-02",
        new Date("2026-04-02T12:00:00Z"),
      )?.id,
    ).toBe("next");
  });
  it("não destaca item de outro dia", () => {
    expect(
      selectCurrentAppointment(
        items,
        "2026-04-03",
        new Date("2026-04-02T12:00:00Z"),
      ),
    ).toBeUndefined();
  });

  describe("só destaca o que ainda não terminou (D14)", () => {
    const now = new Date("2026-04-02T03:57:00Z"); // 00:57 em São Paulo
    const ended = {
      ...at("ended", "2026-04-02T03:00:00Z", "PENDING"),
      durationMinutes: 15,
    };
    const running = {
      ...at("running", "2026-04-02T03:30:00Z", "PENDING"),
      durationMinutes: 60,
    };
    it("pula o pendente que já terminou e destaca o em andamento", () => {
      expect(
        selectCurrentAppointment([ended, running], "2026-04-02", now)?.id,
      ).toBe("running");
    });
    it("não destaca nada quando o único pendente já terminou", () => {
      expect(
        selectCurrentAppointment([ended], "2026-04-02", now),
      ).toBeUndefined();
    });
    it("não destaca item de outro dia selecionado", () => {
      expect(
        selectCurrentAppointment([ended, running], "2026-04-03", now),
      ).toBeUndefined();
    });
  });
});
