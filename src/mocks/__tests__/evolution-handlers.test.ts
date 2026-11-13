import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_EVOLUTION_ID,
  MOCK_EVOLUTION_SESSION_FOREIGN,
  MOCK_EVOLUTION_SESSION_FREE,
  MOCK_EVOLUTION_SESSION_PE,
  MOCK_FOREIGN_EVOLUTION_ID,
  resetMockEvolutionState,
} from "@/mocks/handlers/evolution";
import type { Plan } from "@/api/types";
import { mockPlans } from "@/mocks/handlers/plans";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

interface Reply {
  status: number;
  data: any;
}

/** Normaliza resposta e erro numa só forma: `{ status, data }`. */
async function send(
  method: "get" | "post" | "put",
  url: string,
  body?: unknown,
): Promise<Reply> {
  try {
    const response = await apiClient.request({ method, url, data: body });
    return { status: response.status, data: response.data };
  } catch (error) {
    const apiError = error as { status?: number; code?: string };
    return { status: apiError.status ?? 0, data: { message: apiError.code } };
  }
}

const validCriterion = {
  description: "Contar objetos até 10",
  attempts: 10,
  successes: 8,
  result: "ACHIEVED" as const,
};

describe("mocks da evolução da sessão (API-05, leva 1)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockEvolutionState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    // Remove o PE encerrado e devolve metas/progresso dos planos semente.
    resetMockEvolutionState();
  });

  it("resetMockEvolutionState restaura evoluções, planos e sessões semente", async () => {
    await send("post", "/session-evolution/", {
      sessionId: MOCK_EVOLUTION_SESSION_PE,
      planId: "mock-plan-2",
      criteria: [],
      descriptiveRecord: "x",
      goalUpdates: [{ goalId: "mock-plan-2-goal-1", status: "ACHIEVED" }],
    });
    mockPlans.push({
      ...mockPlans.find((plan) => plan.id === "mock-plan-2")!,
      id: "mock-plan-extra",
    });

    resetMockEvolutionState();

    const plan = mockPlans.find((item) => item.id === "mock-plan-2")!;
    expect(plan.goals[0]!.status).toBe("IN_PROGRESS");
    expect(plan.progress.achievedGoals).toBe(0);
    expect(mockPlans.some((item) => item.id === "mock-plan-extra")).toBe(false);
    const context = await send(
      "get",
      `/session-evolution/context/${MOCK_EVOLUTION_SESSION_PE}`,
    );
    expect(context.data.existingEvolutionId).toBeUndefined();
  });

  it("EV-08: o registro vira a observação do relatório, também em sessão criada pelo fluxo do app", async () => {
    const started = await send("post", "/task-notebook-session/start", {
      studentId: "student-4",
      name: "Sessão criada pelo app",
    });
    await send("post", "/task-notebook-session/finish", {
      sessionId: started.data.id,
    });
    const before = await send(
      "get",
      `/task-notebook-session/report/${started.data.id}`,
    );
    expect(before.data.observation).toBeNull();

    const created = await send("post", "/session-evolution/", {
      sessionId: started.data.id,
      criteria: [],
      descriptiveRecord: "Registro da sessão viva.",
    });
    expect(created.status).toBe(201);

    const report = await send(
      "get",
      `/task-notebook-session/report/${started.data.id}`,
    );
    expect(report.status).toBe(200);
    expect(report.data.sessionName).toBe("Sessão criada pelo app");
    expect(report.data.observation).toBe("Registro da sessão viva.");

    const edited = await send("put", `/session-evolution/${created.data.id}`, {
      descriptiveRecord: "Registro revisado.",
    });
    expect(edited.status).toBe(200);
    const after = await send(
      "get",
      `/task-notebook-session/report/${started.data.id}`,
    );
    expect(after.data.observation).toBe("Registro revisado.");

    // sessão com relatório fixo também reflete a evolução salva
    const fixed = await send(
      "get",
      "/task-notebook-session/report/mock-session-2",
    );
    expect(fixed.data.observation).toBe(
      "Participou com interesse e pediu para continuar.",
    );
  });

  it("EV-03: sessão aberta não aceita evolução (409) e sessão inexistente dá 404", async () => {
    const open = await send("post", "/session-evolution/", {
      sessionId: "mock-open-session",
      criteria: [],
      descriptiveRecord: "x",
    });
    const missing = await send("post", "/session-evolution/", {
      sessionId: "nao-existe",
      criteria: [],
      descriptiveRecord: "x",
    });

    expect(open).toMatchObject({
      status: 409,
      data: { message: "SESSION_NOT_FINISHED" },
    });
    expect(missing).toMatchObject({
      status: 404,
      data: { message: "SESSION_NOT_FOUND" },
    });
  });

  it("EV-01: sessão de outro educador devolve 403 UNAUTHORIZED", async () => {
    const created = await send("post", "/session-evolution/", {
      sessionId: MOCK_EVOLUTION_SESSION_FOREIGN,
      criteria: [],
      descriptiveRecord: "x",
    });
    const read = await send(
      "get",
      `/session-evolution/${MOCK_FOREIGN_EVOLUTION_ID}`,
    );
    const edit = await send(
      "put",
      `/session-evolution/${MOCK_FOREIGN_EVOLUTION_ID}`,
      { descriptiveRecord: "novo" },
    );

    for (const reply of [created, read, edit]) {
      expect(reply).toMatchObject({
        status: 403,
        data: { message: "UNAUTHORIZED" },
      });
    }
  });

  it("valida o corpo: registro obrigatório, tentativas e acertos (EV-04)", async () => {
    const base = { sessionId: MOCK_EVOLUTION_SESSION_FREE, criteria: [] };

    const noRecord = await send("post", "/session-evolution/", {
      ...base,
      descriptiveRecord: "",
    });
    const tooLong = await send("post", "/session-evolution/", {
      ...base,
      descriptiveRecord: "a".repeat(5001),
    });
    const successesWithoutAttempts = await send("post", "/session-evolution/", {
      ...base,
      criteria: [{ description: "c", successes: 1, result: "PARTIAL" }],
      descriptiveRecord: "ok",
    });
    const moreSuccessesThanAttempts = await send(
      "post",
      "/session-evolution/",
      {
        ...base,
        criteria: [
          { description: "c", attempts: 2, successes: 3, result: "PARTIAL" },
        ],
        descriptiveRecord: "ok",
      },
    );
    const tooMany = await send("post", "/session-evolution/", {
      ...base,
      criteria: Array.from({ length: 21 }, () => ({
        description: "c",
        result: "NOT_OBSERVED",
      })),
      descriptiveRecord: "ok",
    });

    expect(noRecord.status).toBe(400);
    expect(tooLong.status).toBe(400);
    expect(successesWithoutAttempts).toMatchObject({
      status: 400,
      data: { message: "INVALID_ATTEMPTS" },
    });
    expect(moreSuccessesThanAttempts).toMatchObject({
      status: 400,
      data: { message: "INVALID_ATTEMPTS" },
    });
    expect(tooMany.status).toBe(400);
  });

  it("EV-05/EV-06: plano inválido e meta fora do plano", async () => {
    const unknownPlan = await send("post", "/session-evolution/", {
      sessionId: MOCK_EVOLUTION_SESSION_FREE,
      planId: "nao-existe",
      criteria: [],
      descriptiveRecord: "ok",
    });
    const otherStudentPlan = await send("post", "/session-evolution/", {
      sessionId: MOCK_EVOLUTION_SESSION_FREE,
      planId: "mock-plan-2",
      criteria: [],
      descriptiveRecord: "ok",
    });
    const goalWithoutPlan = await send("post", "/session-evolution/", {
      sessionId: MOCK_EVOLUTION_SESSION_FREE,
      criteria: [
        { goalId: "mock-plan-2-goal-1", description: "c", result: "ACHIEVED" },
      ],
      descriptiveRecord: "ok",
    });
    const foreignGoal = await send("post", "/session-evolution/", {
      sessionId: MOCK_EVOLUTION_SESSION_PE,
      planId: "mock-plan-2",
      criteria: [
        { goalId: "mock-plan-1-goal-1", description: "c", result: "ACHIEVED" },
      ],
      descriptiveRecord: "ok",
    });

    expect(unknownPlan).toMatchObject({
      status: 400,
      data: { message: "INVALID_PLAN" },
    });
    expect(otherStudentPlan).toMatchObject({
      status: 400,
      data: { message: "INVALID_PLAN" },
    });
    expect(goalWithoutPlan.status).toBe(400);
    expect(foreignGoal).toMatchObject({
      status: 400,
      data: { message: "GOAL_NOT_IN_PLAN" },
    });
  });

  it("EV-02/EV-07/EV-09: salva, aplica goalUpdates, recusa a segunda e edita sem excluir", async () => {
    const created = await send("post", "/session-evolution/", {
      sessionId: MOCK_EVOLUTION_SESSION_PE,
      planId: "mock-plan-2",
      criteria: [
        {
          goalId: "mock-plan-2-goal-1",
          ...validCriterion,
        },
      ],
      descriptiveRecord: "Participou bem da atividade.",
      nextSessionSuggestion: "Retomar a contagem até 15.",
      goalUpdates: [{ goalId: "mock-plan-2-goal-1", status: "ACHIEVED" }],
    });

    expect(created.status).toBe(201);
    expect(created.data.id).toBeTruthy();
    expect(created.data.planType).toBe("PE");
    expect(created.data.planTitle).toMatch(/^PE · /);
    expect(created.data.criteria[0].id).toBeTruthy();
    expect(created.data.sessionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(created.data.goalUpdates).toEqual([
      { goalId: "mock-plan-2-goal-1", status: "ACHIEVED" },
    ]);

    const plan = mockPlans.find((item) => item.id === "mock-plan-2")!;
    const goal = plan.goals.find((item) => item.id === "mock-plan-2-goal-1")!;
    expect(goal.status).toBe("ACHIEVED");
    expect(goal.achievedAt).toBeTruthy();
    expect(plan.progress.achievedGoals).toBe(1);

    const duplicate = await send("post", "/session-evolution/", {
      sessionId: MOCK_EVOLUTION_SESSION_PE,
      criteria: [],
      descriptiveRecord: "outra",
    });
    expect(duplicate).toMatchObject({
      status: 409,
      data: {
        message: "EVOLUTION_ALREADY_EXISTS",
        evolutionId: created.data.id,
      },
    });

    const context = await send(
      "get",
      `/session-evolution/context/${MOCK_EVOLUTION_SESSION_PE}`,
    );
    expect(context.data.existingEvolutionId).toBe(created.data.id);
    // meta ACHIEVED sai dos critérios sugeridos
    expect(
      context.data.suggestedCriteria.map((c: { goalId: string }) => c.goalId),
    ).not.toContain("mock-plan-2-goal-1");

    const edited = await send("put", `/session-evolution/${created.data.id}`, {
      descriptiveRecord: "Registro revisado.",
      goalUpdates: [{ goalId: "mock-plan-2-goal-2", status: "IN_PROGRESS" }],
    });
    expect(edited.status).toBe(200);
    expect(edited.data.descriptiveRecord).toBe("Registro revisado.");
    expect(edited.data.criteria).toHaveLength(1);
    expect(edited.data.updatedAt >= created.data.updatedAt).toBe(true);
    expect(
      plan.goals.find((item) => item.id === "mock-plan-2-goal-2")!.status,
    ).toBe("IN_PROGRESS");

    const pending = await send("get", "/session-evolution/pending?days=90");
    expect(
      pending.data.map((item: { sessionId: string }) => item.sessionId),
    ).not.toContain(MOCK_EVOLUTION_SESSION_PE);
  });

  it("BE-EV-03: plano encerrado do mesmo paciente faz tudo falhar com 409 PLAN_NOT_EDITABLE, sem gravar", async () => {
    const template = mockPlans.find((plan) => plan.id === "mock-plan-2")!;
    const closed: Plan = {
      ...template,
      id: "mock-plan-closed-pe",
      studentId: "student-3",
      status: "COMPLETED",
      closedAt: "2026-10-29T12:00:00.000Z",
      goals: template.goals.map((goal) => ({
        ...goal,
        id: `mock-plan-closed-pe-${goal.id}`,
        status: "ACHIEVED" as const,
      })),
    };
    mockPlans.push(closed);

    const reply = await send("post", "/session-evolution/", {
      sessionId: MOCK_EVOLUTION_SESSION_FREE,
      planId: closed.id,
      criteria: [],
      descriptiveRecord: "ok",
      goalUpdates: [{ goalId: closed.goals[0]!.id, status: "IN_PROGRESS" }],
    });

    expect(reply).toMatchObject({
      status: 409,
      data: { message: "PLAN_NOT_EDITABLE" },
    });
    expect(closed.goals[0]!.status).toBe("ACHIEVED");
    const context = await send(
      "get",
      `/session-evolution/context/${MOCK_EVOLUTION_SESSION_FREE}`,
    );
    expect(context.data.existingEvolutionId).toBeUndefined();
  });

  it("EV-05 (G-57): planId de um PDI do mesmo paciente é recusado com 400 INVALID_PLAN, no POST e no PUT", async () => {
    // mock-plan-1 é um PDI ACTIVE de student-1; mock-session-1 é de student-1.
    const created = await send("post", "/session-evolution/", {
      sessionId: "mock-session-1",
      planId: "mock-plan-1",
      criteria: [],
      descriptiveRecord: "ok",
    });
    const edited = await send(
      "put",
      `/session-evolution/${MOCK_EVOLUTION_ID}`,
      {
        planId: "mock-plan-1",
        descriptiveRecord: "novo",
      },
    );

    for (const reply of [created, edited]) {
      expect(reply).toMatchObject({
        status: 400,
        data: { message: "INVALID_PLAN" },
      });
    }
    // nada foi gravado
    const context = await send(
      "get",
      "/session-evolution/context/mock-session-1",
    );
    expect(context.data.existingEvolutionId).toBeUndefined();
  });

  it("sessão sem plano salva só com o registro descritivo", async () => {
    const created = await send("post", "/session-evolution/", {
      sessionId: MOCK_EVOLUTION_SESSION_FREE,
      criteria: [],
      descriptiveRecord: "Sessão livre.",
    });

    expect(created.status).toBe(201);
    expect(created.data).not.toHaveProperty("planId");
    expect(created.data.goalUpdates).toEqual([]);
  });

  describe("próxima sessão (IA)", () => {
    it("devolve sugestão sem persistir e sem diagnóstico", async () => {
      const before = await send("get", "/session-evolution/?limit=100");
      const reply = await send(
        "post",
        "/session-evolution/next-session-suggestion",
        {
          sessionId: "mock-session-1",
          criteria: [{ description: "c", result: "PARTIAL" }],
          descriptiveRecord: "Oscilou na atenção.",
        },
      );
      const after = await send("get", "/session-evolution/?limit=100");

      expect(reply.status).toBe(200);
      expect(reply.data.suggestion.length).toBeGreaterThan(0);
      expect(reply.data.suggestion.length).toBeLessThanOrEqual(1000);
      expect(reply.data.rationale?.length ?? 0).toBeLessThanOrEqual(500);
      expect(reply.data.suggestion).not.toMatch(/diagn/i);
      expect(after.data).toHaveLength(before.data.length);
    });

    it("erros: 400, 404, 403, 409 e falhas simuladas da IA", async () => {
      const url = "/session-evolution/next-session-suggestion";

      expect((await send("post", url, {})).status).toBe(400);
      expect(
        (await send("post", url, { sessionId: "nao-existe" })).data.message,
      ).toBe("SESSION_NOT_FOUND");
      expect(
        (await send("post", url, { sessionId: MOCK_EVOLUTION_SESSION_FOREIGN }))
          .status,
      ).toBe(403);
      expect(
        (await send("post", url, { sessionId: "mock-open-session" })).data
          .message,
      ).toBe("SESSION_NOT_FINISHED");
      expect(
        await send("post", url, {
          sessionId: "mock-session-1",
          descriptiveRecord: "[AI_GENERATION_FAILED]",
        }),
      ).toMatchObject({
        status: 500,
        data: { message: "AI_GENERATION_FAILED" },
      });
      expect(
        await send("post", url, {
          sessionId: "mock-session-1",
          descriptiveRecord: "[AI_INVALID_OUTPUT]",
        }),
      ).toMatchObject({ status: 500, data: { message: "AI_INVALID_OUTPUT" } });
    });
  });
});
