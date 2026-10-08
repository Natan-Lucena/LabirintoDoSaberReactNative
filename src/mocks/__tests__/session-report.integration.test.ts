import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { getSessionReport } from "@/api/endpoints/session-report";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/session-report";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("handler do relatório da sessão", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("responde ao caminho do contrato pelo apiClient", async () => {
    const report = await getSessionReport("mock-session-1");

    expect(report.sessionName).toBe("Leitura inicial");
    expect(report.averageIncorrectTime).toBeNull();
    expect(report.percentageByCategory.writing).toBeNull();
  });

  it("expõe SESSION_NOT_FOUND para o cenário acionável", async () => {
    await expect(getSessionReport("session-not-found")).rejects.toThrow(
      "SESSION_NOT_FOUND",
    );
  });
});
