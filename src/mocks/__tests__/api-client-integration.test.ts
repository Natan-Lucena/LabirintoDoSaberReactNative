import { apiClient } from "@/api/client";
import { createAppointment } from "@/api/endpoints/appointment";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_INVALID_CREDENTIALS_EMAIL,
  MOCK_TOKEN,
  MOCK_VALID_CREDENTIALS,
} from "@/mocks/fixtures";
import { clearMockSession } from "@/mocks/mock-auth-state";
import "@/mocks/handlers/appointment";
import "@/mocks/handlers/educator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("apiClient com mockAdapter", () => {
  beforeEach(() => {
    clearMockSession();
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("envia o corpo transformado do login válido ao handler", async () => {
    const response = await apiClient.post(
      "/educator/sign-in",
      MOCK_VALID_CREDENTIALS,
    );

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ token: MOCK_TOKEN });
  });

  it("mantém 401 para a credencial inválida", async () => {
    await expect(
      apiClient.post("/educator/sign-in", {
        email: MOCK_INVALID_CREDENTIALS_EMAIL,
        password: "senha123",
      }),
    ).rejects.toMatchObject({ status: 401, code: "INVALID_CREDENTIALS" });
  });

  it("entrega os campos do corpo POST de agendamento ao handler", async () => {
    const appointment = await createAppointment({
      studentId: "student-1",
      scheduledAt: "2026-04-02T10:00:00-03:00",
      observation: "Mock de integração",
    });

    expect(appointment).toMatchObject({
      studentId: "student-1",
      scheduledAt: "2026-04-02T10:00:00-03:00",
      observation: "Mock de integração",
    });
  });
});
