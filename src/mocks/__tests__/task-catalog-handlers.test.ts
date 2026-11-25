import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSessionReport } from "@/api/endpoints/session-report";
import { apiClient } from "@/api/client";
import type { EvolutionContext } from "@/api/types";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/evolution";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

// API-07, leva 1: RS-05 a RS-07 nos mocks de evolução e relatório.
describe("activityResults nos mocks de evolução e relatório (API-07, leva 1)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("o contexto da evolução de uma sessão traz dois activityResults", async () => {
    const { data } = await apiClient.get<EvolutionContext>(
      "/session-evolution/context/mock-session-2",
    );

    expect(data.activityResults).toHaveLength(2);
    expect(data.activityResults?.[0]).toEqual(
      expect.objectContaining({
        taskId: expect.any(String),
        title: expect.any(String),
        taskType: expect.any(String),
        completed: expect.any(Boolean),
        correct: expect.any(Boolean),
        attempts: expect.any(Number),
        errors: expect.any(Number),
      }),
    );
  });

  it("as outras sessões não têm o campo", async () => {
    const { data } = await apiClient.get<EvolutionContext>(
      "/session-evolution/context/mock-evo-session-pe",
    );

    expect(data.activityResults).toBeUndefined();
  });

  it("o relatório da mesma sessão traz o activitySummary coerente", async () => {
    const report = await getSessionReport("mock-session-2");

    expect(report.activitySummary).toEqual({
      total: 2,
      completed: 2,
      correct: 1,
    });
    expect(report.activityResults).toHaveLength(2);
    expect((await getSessionReport("mock-session-1")).activitySummary).toBe(
      undefined,
    );
  });
});
