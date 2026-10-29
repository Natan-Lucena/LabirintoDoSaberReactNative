import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { generatePlanDraft, listPlans } from "@/api/endpoints/plans";
import { mockAdapter } from "@/mocks/adapter";
import { MOCK_FOREIGN_STUDENT_ID, mockPlans } from "@/mocks/handlers/plans";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;
const input = {
  studentId: "student-1",
  type: "PDI" as const,
  focus: "Leitura de textos curtos",
  consideredDifficulties: ["leitura"],
  durationMonths: 3 as const,
};

describe("geração de plano pelo apiClient (PLN-02)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("devolve rascunho PDI sem persistir um plano", async () => {
    const before = mockPlans.length;
    const draft = await generatePlanDraft(input);
    expect(draft.type).toBe("PDI");
    expect(draft.goals.length).toBeGreaterThanOrEqual(3);
    expect(draft.goals.length).toBeLessThanOrEqual(6);
    expect(draft.suggestedNextReviewDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(mockPlans).toHaveLength(before);
    expect(await listPlans({ studentId: input.studentId })).toHaveLength(1);
  });

  it("usa a data da sessão para o PE e omite revisão", async () => {
    const draft = await generatePlanDraft({
      ...input,
      type: "PE",
      durationMonths: undefined,
      sessionDate: "2026-11-03",
      parentPlanId: "mock-plan-1",
    });
    expect(draft.suggestedStartDate).toBe("2026-11-03");
    expect(draft.suggestedEndDate).toBe("2026-11-03");
    expect(draft).not.toHaveProperty("suggestedNextReviewDate");
  });

  it("expõe erros de paciente, PDI pai, modelo e IA", async () => {
    await expect(
      generatePlanDraft({ ...input, studentId: "unknown" }),
    ).rejects.toMatchObject({ status: 404, code: "STUDENT_NOT_FOUND" });
    await expect(
      generatePlanDraft({ ...input, studentId: MOCK_FOREIGN_STUDENT_ID }),
    ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
    await expect(
      generatePlanDraft({
        ...input,
        type: "PE",
        durationMonths: undefined,
        sessionDate: "2026-11-03",
        parentPlanId: "mock-plan-2",
      }),
    ).rejects.toMatchObject({ status: 400, code: "INVALID_PARENT_PLAN" });
    await expect(
      generatePlanDraft({ ...input, includeAnamnesisTemplateId: "unknown" }),
    ).rejects.toMatchObject({ status: 404, code: "TEMPLATE_NOT_FOUND" });
    await expect(
      generatePlanDraft({ ...input, focus: "[AI_GENERATION_FAILED]" }),
    ).rejects.toMatchObject({ status: 500, code: "AI_GENERATION_FAILED" });
  });
});
