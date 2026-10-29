import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/api/client";
import {
  createPlanReview,
  listPlanReviews,
  updateGoalStatus,
  updatePlan,
  updatePlanStatus,
} from "@/api/endpoints/plans";
import { mockAdapter } from "@/mocks/adapter";
import { mockPlans } from "@/mocks/handlers/plans";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
const originalAdapter = apiClient.defaults.adapter;

describe("detalhe de planos pelo apiClient (PLN-04)", () => {
  const original = structuredClone(mockPlans);
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    mockPlans.splice(0, mockPlans.length, ...structuredClone(original));
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    mockPlans.splice(0, mockPlans.length, ...structuredClone(original));
  });

  it("atualiza status da meta, achievedAt e progresso vindo do servidor", async () => {
    const goalId = mockPlans[0].goals[1].id;
    const achieved = await updateGoalStatus("mock-plan-1", goalId, "ACHIEVED");
    expect(achieved.goals[1].achievedAt).toBeTruthy();
    expect(achieved.progress).toMatchObject({ achievedGoals: 2, percent: 50 });
    const resumed = await updateGoalStatus(
      "mock-plan-1",
      goalId,
      "IN_PROGRESS",
    );
    expect(resumed.goals[1]).not.toHaveProperty("achievedAt");
    expect(resumed.progress.percent).toBe(25);
  });

  it("edita a lista completa, preserva IDs e rejeita remoção de meta atingida", async () => {
    const plan = mockPlans[0];
    await expect(
      updatePlan(plan.id, { goals: [plan.goals[1]] }),
    ).rejects.toMatchObject({
      status: 409,
      code: "GOAL_ACHIEVED_CANNOT_BE_REMOVED",
    });
    const updated = await updatePlan(plan.id, {
      title: "Título revisto",
      goals: [
        { id: plan.goals[0].id, description: "Meta revista" },
        { description: "Meta nova" },
      ],
    });
    expect(updated.title).toBe("Título revisto");
    expect(updated.goals.map(({ id, order }) => ({ id, order }))).toEqual([
      { id: plan.goals[0].id, order: 0 },
      { id: expect.any(String), order: 1 },
    ]);
    expect(updated.progress).toMatchObject({
      totalGoals: 2,
      achievedGoals: 1,
      percent: 50,
    });
  });

  it("valida IDs duplicados, ausentes, datas e limites de metas", async () => {
    const id = "mock-plan-1";
    const goal = mockPlans[0].goals[0];
    await expect(updatePlan(id, { goals: [goal, goal] })).rejects.toMatchObject(
      { code: "DUPLICATE_GOAL_ID" },
    );
    await expect(
      updatePlan(id, { goals: [{ id: "unknown", description: "Meta" }] }),
    ).rejects.toMatchObject({ code: "GOAL_NOT_FOUND" });
    await expect(updatePlan(id, { goals: [] })).rejects.toMatchObject({
      code: "PLAN_WITHOUT_GOALS",
    });
    await expect(
      updatePlan(id, { goals: Array(11).fill({ description: "Meta" }) }),
    ).rejects.toMatchObject({ code: "TOO_MANY_GOALS" });
    await expect(
      updatePlan(id, { nextReviewDate: "2030-01-01" }),
    ).rejects.toMatchObject({ code: "INVALID_DATES" });
  });

  it("registra revisão com retrato e lista mais recente primeiro", async () => {
    const first = await createPlanReview("mock-plan-1", {
      note: "Primeira revisão",
    });
    const second = await createPlanReview("mock-plan-1", {
      note: "Segunda revisão",
      nextReviewDate: "2026-12-01",
    });
    expect(first.goalStatuses).toHaveLength(4);
    expect(
      (await listPlanReviews("mock-plan-1")).map((item) => item.id),
    ).toEqual([second.id, first.id]);
    expect(mockPlans[0].nextReviewDate).toBe("2026-12-01");
  });

  it("encerra definitivamente e bloqueia todas as escritas", async () => {
    const closed = await updatePlanStatus("mock-plan-1", "COMPLETED");
    expect(closed).toMatchObject({
      status: "COMPLETED",
      closedAt: expect.any(String),
    });
    await expect(
      updatePlan(closed.id, { title: "Novo" }),
    ).rejects.toMatchObject({ code: "PLAN_NOT_EDITABLE" });
    await expect(
      updateGoalStatus(closed.id, closed.goals[0].id, "ACHIEVED"),
    ).rejects.toMatchObject({ code: "PLAN_NOT_EDITABLE" });
    await expect(
      createPlanReview(closed.id, { note: "Revisão" }),
    ).rejects.toMatchObject({ code: "PLAN_NOT_EDITABLE" });
    await expect(
      updatePlanStatus(closed.id, "CANCELLED"),
    ).rejects.toMatchObject({ code: "PLAN_NOT_EDITABLE" });
  });
});
