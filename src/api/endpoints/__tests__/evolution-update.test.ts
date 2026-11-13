import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  getSessionEvolution,
  listSessionEvolutions,
  updateSessionEvolution,
} from "@/api/endpoints/evolution";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_EVOLUTION_ID,
  MOCK_FOREIGN_EVOLUTION_ID,
  resetMockEvolutionState,
} from "@/mocks/handlers/evolution";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("edição da evolução pelo apiClient (EVO-02)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockEvolutionState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockEvolutionState();
  });

  it("AC-EVO-02-02: o PUT substitui a lista completa de critérios e o registro", async () => {
    const updated = await updateSessionEvolution(MOCK_EVOLUTION_ID, {
      criteria: [
        {
          description: "Escrever frases com letra maiúscula",
          attempts: 10,
          successes: 9,
          result: "ACHIEVED",
        },
      ],
      descriptiveRecord: "Registro corrigido.",
    });

    expect(updated.criteria).toHaveLength(1);
    expect(updated.criteria[0]).toMatchObject({ successes: 9 });

    const reread = await getSessionEvolution(MOCK_EVOLUTION_ID);
    expect(reread.criteria).toHaveLength(1);
    expect(reread.descriptiveRecord).toBe("Registro corrigido.");

    const [summary] = await listSessionEvolutions({ studentId: "student-1" });
    expect(summary).toMatchObject({
      id: MOCK_EVOLUTION_ID,
      criteriaCount: 1,
      excerpt: "Registro corrigido.",
    });
  });

  it("propaga os erros pelo code", async () => {
    await expect(
      updateSessionEvolution(MOCK_FOREIGN_EVOLUTION_ID, {
        descriptiveRecord: "x",
      }),
    ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
    await expect(
      updateSessionEvolution("nao-existe", { descriptiveRecord: "x" }),
    ).rejects.toMatchObject({ status: 404, code: "EVOLUTION_NOT_FOUND" });
    await expect(
      updateSessionEvolution(MOCK_EVOLUTION_ID, {
        criteria: [
          {
            description: "Contagem",
            attempts: 2,
            successes: 3,
            result: "PARTIAL",
          },
        ],
      }),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_ATTEMPTS" });
  });
});
