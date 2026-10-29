import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/api/client";
import { createPlan, PlanApiError } from "@/api/endpoints/plans";
import { mockAdapter } from "@/mocks/adapter";
import { mockPlans } from "@/mocks/handlers/plans";

const originalAdapter = apiClient.defaults.adapter;
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
const base = {
  studentId: "student-2",
  type: "PDI" as const,
  source: "AI" as const,
  title: "PDI novo",
  generalObjective: "Ler com autonomia",
  startDate: "2026-11-01",
  endDate: "2027-02-01",
  nextReviewDate: "2026-12-01",
  goals: [{ description: "Ler frases", successCriterion: "Cinco frases" }],
};

describe("criação de plano pelo apiClient (PLN-03)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    mockPlans.splice(4);
  });

  it("persiste PDI com metas ordenadas e progresso calculado", async () => {
    const plan = await createPlan({
      ...base,
      goals: [...base.goals, { description: "Escrever" }],
    });
    expect(plan).toMatchObject({
      type: "PDI",
      status: "ACTIVE",
      source: "AI",
      progress: { totalGoals: 2, percent: 0 },
    });
    expect(plan.goals.map((goal) => goal.order)).toEqual([0, 1]);
    expect(mockPlans.some((item) => item.id === plan.id)).toBe(true);
  });

  it("preserva activePlanId no conflito 409", async () => {
    await expect(
      createPlan({ ...base, studentId: "student-1" }),
    ).rejects.toMatchObject({
      name: "PlanApiError",
      status: 409,
      code: "ACTIVE_PDI_ALREADY_EXISTS",
      activePlanId: "mock-plan-1",
    });
    expect(PlanApiError).toBeDefined();
  });

  it("usa a data da sessão no PE e valida limites", async () => {
    const pe = await createPlan({
      studentId: "student-2",
      type: "PE",
      source: "AI",
      title: "PE",
      generalObjective: "Ler",
      sessionDate: "2026-11-03",
      goals: base.goals,
    });
    expect(pe).toMatchObject({
      startDate: "2026-11-03",
      endDate: "2026-11-03",
      sessionDate: "2026-11-03",
    });
    await expect(createPlan({ ...base, goals: [] })).rejects.toMatchObject({
      code: "PLAN_WITHOUT_GOALS",
    });
    await expect(
      createPlan({ ...base, goals: Array(11).fill(base.goals[0]) }),
    ).rejects.toMatchObject({ code: "TOO_MANY_GOALS" });
  });
});
