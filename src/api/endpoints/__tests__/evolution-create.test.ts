import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  createSessionEvolution,
  EvolutionApiError,
  getEvolutionContext,
} from "@/api/endpoints/evolution";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_EVOLUTION_ID,
  MOCK_EVOLUTION_SESSION_FREE,
  MOCK_EVOLUTION_SESSION_PE,
  mockEvolutions,
  resetMockEvolutionState,
} from "@/mocks/handlers/evolution";
import { mockPlans } from "@/mocks/handlers/plans";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("criação da evolução pelo apiClient (EVO-01)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockEvolutionState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockEvolutionState();
  });

  it("salva critérios, registro e goalUpdates do PE da sessão", async () => {
    const context = await getEvolutionContext(MOCK_EVOLUTION_SESSION_PE);
    const goal = context.suggestedCriteria[0]!;

    const evolution = await createSessionEvolution({
      sessionId: MOCK_EVOLUTION_SESSION_PE,
      planId: context.plan!.id,
      criteria: [
        {
          goalId: goal.goalId,
          description: goal.description,
          attempts: 10,
          successes: 8,
          result: "ACHIEVED",
          note: "Contou sem ajuda.",
        },
        { description: "Critério livre", result: "PARTIAL" },
      ],
      descriptiveRecord: "Sessão tranquila.",
      goalUpdates: [{ goalId: goal.goalId, status: "ACHIEVED" }],
    });

    expect(evolution).toMatchObject({
      sessionId: MOCK_EVOLUTION_SESSION_PE,
      planId: context.plan!.id,
      descriptiveRecord: "Sessão tranquila.",
      goalUpdates: [{ goalId: goal.goalId, status: "ACHIEVED" }],
    });
    expect(evolution.criteria).toHaveLength(2);
    expect(evolution.criteria[0]).toMatchObject({ attempts: 10, successes: 8 });
    const plan = mockPlans.find((item) => item.id === context.plan!.id)!;
    expect(plan.goals.find((g) => g.id === goal.goalId)?.status).toBe(
      "ACHIEVED",
    );
  });

  it("sem plano, salva só o registro descritivo", async () => {
    const evolution = await createSessionEvolution({
      sessionId: MOCK_EVOLUTION_SESSION_FREE,
      criteria: [],
      descriptiveRecord: "Só o registro.",
    });

    expect(evolution.planId).toBeUndefined();
    expect(evolution.criteria).toEqual([]);
  });

  it("AC-EVO-01-06: segunda criação lança EvolutionApiError com o evolutionId existente", async () => {
    const before = mockEvolutions.length;

    const error = await createSessionEvolution({
      sessionId: "mock-session-2",
      criteria: [],
      descriptiveRecord: "Duplicada.",
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(EvolutionApiError);
    expect(error).toMatchObject({
      status: 409,
      code: "EVOLUTION_ALREADY_EXISTS",
      evolutionId: MOCK_EVOLUTION_ID,
    });
    expect(mockEvolutions).toHaveLength(before);
  });

  it("propaga os erros de negócio pelo code", async () => {
    await expect(
      createSessionEvolution({
        sessionId: "mock-open-session",
        criteria: [],
        descriptiveRecord: "Aberta.",
      }),
    ).rejects.toMatchObject({ status: 409, code: "SESSION_NOT_FINISHED" });
    await expect(
      createSessionEvolution({
        sessionId: "nao-existe",
        criteria: [],
        descriptiveRecord: "Inexistente.",
      }),
    ).rejects.toMatchObject({ status: 404, code: "SESSION_NOT_FOUND" });
    await expect(
      createSessionEvolution({
        sessionId: MOCK_EVOLUTION_SESSION_FREE,
        criteria: [
          {
            description: "Contagem",
            attempts: 5,
            successes: 6,
            result: "PARTIAL",
          },
        ],
        descriptiveRecord: "Acertos demais.",
      }),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_ATTEMPTS" });
  });
});
