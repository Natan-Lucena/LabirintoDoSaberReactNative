import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { AI_TIMEOUT_MS } from "@/api/endpoints/ai-timeout";
import { generateAiTasks } from "@/api/endpoints/ai-task";
import { getStudentAiAnalysis } from "@/api/endpoints/session-analysis";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        appEnvironment: "development",
        apiBaseUrl: "http://10.0.2.2:3000",
      },
    },
  },
}));

function recordTimeout(responseData: unknown): { timeout?: number } {
  const recorded: { timeout?: number } = {};
  const handler: AxiosAdapter = async (config) => {
    recorded.timeout = config.timeout;
    return {
      config: config as InternalAxiosRequestConfig,
      data: responseData,
      headers: {},
      status: 200,
      statusText: "OK",
    };
  };
  apiClient.defaults.adapter = handler;
  return recorded;
}

afterEach(() => {
  apiClient.defaults.adapter = undefined;
});

// A IA do backend leva cerca de 30 s; o timeout padrão do cliente é 10 s.
describe("chamadas de IA têm timeout maior que o padrão", () => {
  it("getStudentAiAnalysis", async () => {
    const recorded = recordTimeout({ analysis: "## Visão Geral" });
    await getStudentAiAnalysis("student-1");
    expect(recorded.timeout).toBe(AI_TIMEOUT_MS);
    expect(AI_TIMEOUT_MS).toBeGreaterThanOrEqual(60_000);
  });

  it("generateAiTasks", async () => {
    const recorded = recordTimeout({ tasks: [] });
    await generateAiTasks({
      targetAudience: "Crianças de 7 anos",
      instructions: "Palavras com B",
      quantity: 2,
      category: "reading",
    });
    expect(recorded.timeout).toBe(AI_TIMEOUT_MS);
  });
});
