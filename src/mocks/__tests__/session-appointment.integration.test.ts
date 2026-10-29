import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { getAppointment } from "@/api/endpoints/appointment";
import { finishSession, startSession } from "@/api/endpoints/session";
import { normalizeApiError } from "@/api/errors";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/appointment";
import "@/mocks/handlers/session-analysis";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("sessão ligada ao atendimento nos mocks (AGE-04)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("start com atendimento inexistente devolve 404 APPOINTMENT_NOT_FOUND", async () => {
    const error = await startSession({
      studentId: "student-1",
      name: "Sessão",
      appointmentId: "inexistente",
    }).catch(normalizeApiError);

    expect(error).toMatchObject({
      status: 404,
      code: "APPOINTMENT_NOT_FOUND",
    });
  });

  it("start com atendimento de outro paciente devolve 404", async () => {
    const error = await startSession({
      studentId: "student-2",
      name: "Sessão",
      appointmentId: "appointment-1",
    }).catch(normalizeApiError);

    expect(error).toMatchObject({ status: 404 });
  });

  it("finish conclui o atendimento PENDING ligado à sessão", async () => {
    const session = await startSession({
      studentId: "student-3",
      name: "Sessão do atendimento",
      appointmentId: "appointment-3",
    });
    expect((await getAppointment("appointment-3")).status).toBe("PENDING");

    await finishSession({ sessionId: session.id });

    expect((await getAppointment("appointment-3")).status).toBe("COMPLETED");
  });

  it("finish não altera atendimento que não está PENDING", async () => {
    const session = await startSession({
      studentId: "student-4",
      name: "Sessão cancelada",
      appointmentId: "appointment-4",
    });

    await finishSession({ sessionId: session.id });

    expect((await getAppointment("appointment-4")).status).toBe("CANCELLED");
  });
});
