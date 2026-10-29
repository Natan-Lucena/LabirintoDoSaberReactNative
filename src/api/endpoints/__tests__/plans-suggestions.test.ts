import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/api/client";
import {
  acceptPlanSuggestion,
  dismissPlanSuggestion,
  generatePlanSuggestions,
  listPlanSuggestions,
  updatePlanStatus,
} from "@/api/endpoints/plans";
import { AI_TIMEOUT_MS } from "@/api/endpoints/ai-timeout";
import { mockAdapter } from "@/mocks/adapter";
import { mockPlans, mockPlanSuggestions } from "@/mocks/handlers/plans";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
const originalAdapter = apiClient.defaults.adapter;

describe("sugestões da IA pelo apiClient (PLN-05)", () => {
  const originalPlans = structuredClone(mockPlans);
  const originalSuggestions = structuredClone(mockPlanSuggestions);
  function restore(): void {
    mockPlans.splice(0, mockPlans.length, ...structuredClone(originalPlans));
    mockPlanSuggestions.splice(
      0,
      mockPlanSuggestions.length,
      ...structuredClone(originalSuggestions),
    );
  }
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    restore();
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    restore();
  });

  it("gera até completar 3 pendentes e devolve [] quando já há 3", async () => {
    const created = await generatePlanSuggestions("mock-plan-1");
    expect(created).toHaveLength(2);
    expect(created.every((item) => item.status === "PENDING")).toBe(true);
    expect(created[0]).toMatchObject({
      planId: "mock-plan-1",
      studentId: "student-1",
      studentName: expect.any(String),
    });
    expect(await generatePlanSuggestions("mock-plan-1")).toEqual([]);
    const pending = await listPlanSuggestions("PENDING");
    expect(
      pending.filter((item) => item.planId === "mock-plan-1"),
    ).toHaveLength(3);
  });

  it("usa o timeout da IA na geração", async () => {
    const post = vi.spyOn(apiClient, "post");
    await generatePlanSuggestions("mock-plan-2");
    expect(post).toHaveBeenCalledWith(
      "/plan/mock-plan-2/suggestions/generate",
      undefined,
      { timeout: AI_TIMEOUT_MS },
    );
    post.mockRestore();
  });

  it("recusa gerar para plano encerrado, de outro educador ou inexistente", async () => {
    await expect(generatePlanSuggestions("mock-plan-3")).rejects.toMatchObject({
      status: 409,
      code: "PLAN_NOT_EDITABLE",
    });
    await expect(
      generatePlanSuggestions("mock-plan-foreign"),
    ).rejects.toMatchObject({ status: 403 });
    await expect(generatePlanSuggestions("nope")).rejects.toMatchObject({
      status: 404,
      code: "PLAN_NOT_FOUND",
    });
  });

  it("propaga a falha 500 AI_* da geração", async () => {
    mockPlans[1].title = "Plano [AI_GENERATION_FAILED]";
    await expect(generatePlanSuggestions("mock-plan-2")).rejects.toMatchObject({
      status: 500,
      code: "AI_GENERATION_FAILED",
    });
  });

  it("lista as pendentes e filtra por status pela URL", async () => {
    const all = await listPlanSuggestions();
    expect(all).toHaveLength(1);
    expect(await listPlanSuggestions("ACCEPTED")).toEqual([]);
    expect(await listPlanSuggestions("PENDING")).toHaveLength(1);
  });

  it("aceitar aplica a mudança no plano e resolve a sugestão", async () => {
    const plan = await acceptPlanSuggestion("mock-suggestion-1");
    expect(plan.goals[1].status).toBe("ACHIEVED");
    expect(plan.goals[1].achievedAt).toBeTruthy();
    expect(plan.progress).toMatchObject({ achievedGoals: 2, percent: 50 });
    expect(await listPlanSuggestions("PENDING")).toEqual([]);
    expect(await listPlanSuggestions("ACCEPTED")).toHaveLength(1);
    await expect(
      acceptPlanSuggestion("mock-suggestion-1"),
    ).rejects.toMatchObject({
      status: 409,
      code: "SUGGESTION_ALREADY_RESOLVED",
    });
  });

  it("aplica ADD_GOAL, SCHEDULE_REVIEW e REWRITE_GOAL", async () => {
    mockPlanSuggestions.length = 0;
    const created = await generatePlanSuggestions("mock-plan-1");
    expect(created.map((item) => item.kind)).toEqual([
      "UPDATE_GOAL_STATUS",
      "ADD_GOAL",
      "SCHEDULE_REVIEW",
    ]);
    let plan = await acceptPlanSuggestion(created[1].id);
    expect(plan.goals).toHaveLength(5);
    expect(plan.goals[4].description).toBe(
      created[1].proposedChange.description,
    );
    plan = await acceptPlanSuggestion(created[2].id);
    expect(plan.nextReviewDate).toBe(created[2].proposedChange.nextReviewDate);
    await acceptPlanSuggestion(created[0].id);
    const more = await generatePlanSuggestions("mock-plan-1");
    const rewrite = more.find((item) => item.kind === "REWRITE_GOAL");
    plan = await acceptPlanSuggestion(rewrite!.id);
    expect(
      plan.goals.find((goal) => goal.id === rewrite!.goalId)?.description,
    ).toBe(rewrite!.proposedChange.description);
  });

  it("SUGGESTION_NOT_APPLICABLE descarta a sugestão (meta removida)", async () => {
    mockPlans[0].goals = mockPlans[0].goals.filter(
      (goal) => goal.id !== "mock-plan-1-goal-2",
    );
    await expect(
      acceptPlanSuggestion("mock-suggestion-1"),
    ).rejects.toMatchObject({
      status: 409,
      code: "SUGGESTION_NOT_APPLICABLE",
    });
    expect(mockPlanSuggestions[0]).toMatchObject({ status: "DISMISSED" });
    expect(await listPlanSuggestions("PENDING")).toEqual([]);
  });

  it("descartar resolve a sugestão e uma segunda tentativa responde 409", async () => {
    const dismissed = await dismissPlanSuggestion("mock-suggestion-1");
    expect(dismissed).toMatchObject({
      id: "mock-suggestion-1",
      status: "DISMISSED",
      resolvedAt: expect.any(String),
    });
    await expect(
      dismissPlanSuggestion("mock-suggestion-1"),
    ).rejects.toMatchObject({
      status: 409,
      code: "SUGGESTION_ALREADY_RESOLVED",
    });
    await expect(dismissPlanSuggestion("nope")).rejects.toMatchObject({
      status: 404,
      code: "SUGGESTION_NOT_FOUND",
    });
  });

  it("encerrar o plano descarta as pendentes dele", async () => {
    await updatePlanStatus("mock-plan-1", "COMPLETED");
    expect(await listPlanSuggestions("PENDING")).toEqual([]);
    expect(mockPlanSuggestions[0].status).toBe("DISMISSED");
  });
});
