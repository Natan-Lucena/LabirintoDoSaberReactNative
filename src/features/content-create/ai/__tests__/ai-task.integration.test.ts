import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { generateAiTasks } from "@/api/endpoints/ai-task";
import { createTasksBatch } from "@/api/endpoints/task-batch";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/ai-task";
import "@/mocks/handlers/task-batch";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("endpoints de atividades com IA", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("gera a quantidade solicitada sem persistir", async () => {
    const result = await generateAiTasks({
      targetAudience: "Crianças de 7 anos",
      instructions: "Trabalhe sílabas iniciais",
      quantity: 2,
      category: "reading",
    });

    expect(result.tasks).toHaveLength(2);
    expect(result.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "reading",
          type: "multipleChoice",
        }),
      ]),
    );
  });

  it("rejeita quantidade inválida com INVALID_QUANTITY", async () => {
    await expect(
      generateAiTasks({
        targetAudience: "Crianças",
        instructions: "Teste",
        quantity: 16,
        category: "reading",
      }),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_QUANTITY" });
  });

  it("cria somente as atividades enviadas no lote", async () => {
    await expect(
      createTasksBatch({
        name: "Atividades geradas",
        category: "reading",
        tasks: [
          {
            category: "reading",
            type: "multipleChoice",
            prompt: "Qual palavra começa com A?",
            alternatives: [
              { text: "Abelha", isCorrect: true },
              { text: "Bola", isCorrect: false },
            ],
          },
        ],
      }),
    ).resolves.toMatchObject({ taskIds: [expect.any(String)] });
  });
});
