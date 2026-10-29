import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  AppointmentApiError,
  createAppointment,
  deleteAppointment,
  getAppointment,
  updateAppointment,
} from "@/api/endpoints/appointment";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/appointment";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("endpoints de atendimento pelo apiClient (AGE-03)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("cria, lê, atualiza e exclui", async () => {
    const created = await createAppointment({
      studentId: "student-1",
      scheduledAt: "2032-01-10T10:00:00-03:00",
      type: "Avaliação",
    });
    expect(created.scheduledAt).toBe("2032-01-10T13:00:00.000Z");

    await expect(getAppointment(created.id)).resolves.toMatchObject({
      id: created.id,
      type: "Avaliação",
    });
    await expect(
      updateAppointment(created.id, { status: "CANCELLED" }),
    ).resolves.toMatchObject({ status: "CANCELLED" });
    await expect(deleteAppointment(created.id)).resolves.toBeUndefined();
    await expect(getAppointment(created.id)).rejects.toMatchObject({
      status: 400,
      code: "NOT_FOUND",
    });
  });

  it("expõe o atendimento conflitante no erro 409", async () => {
    const first = await createAppointment({
      studentId: "student-1",
      scheduledAt: "2032-02-10T13:00:00.000Z",
    });

    const error = await createAppointment({
      studentId: "student-2",
      scheduledAt: "2032-02-10T13:20:00.000Z",
    }).catch((reason: unknown) => reason);

    expect(error).toBeInstanceOf(AppointmentApiError);
    expect(error).toMatchObject({
      status: 409,
      code: "APPOINTMENT_CONFLICT",
      conflictingAppointmentId: first.id,
    });
  });

  it("devolve o código dos demais 409 sem atendimento conflitante", async () => {
    const created = await createAppointment({
      studentId: "student-1",
      scheduledAt: "2032-03-10T13:00:00.000Z",
    });
    await updateAppointment(created.id, { status: "CANCELLED" });

    await expect(
      updateAppointment(created.id, { durationMinutes: 30 }),
    ).rejects.toMatchObject({
      status: 409,
      code: "APPOINTMENT_NOT_EDITABLE",
    });
  });
});
