import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { getStudentAnalysis } from "@/api/endpoints/session-analysis";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/session-analysis";
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("handler de análise de sessão", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("responde ao caminho e query do contrato pelo apiClient", async () => {
    const analysis = await getStudentAnalysis("student-1", { limit: 6 });

    expect(analysis.total.accuracy).toBeGreaterThanOrEqual(0);
    expect(analysis.sessions).toHaveLength(2);
    expect(analysis.categories.reading?.category).toBe("reading");
  });

  it("rejeita limit combinado com intervalo de datas", async () => {
    await expect(
      getStudentAnalysis("student-1", {
        startDate: "2026-10-01T00:00:00-03:00",
        endDate: "2026-10-31T23:59:59-03:00",
        limit: 6,
      } as never),
    ).rejects.toThrow("INVALID_ANALYSIS_FILTER");
  });
});
