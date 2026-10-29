import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { getPlan, listPlans } from "@/api/endpoints/plans";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_FOREIGN_PLAN_ID,
  MOCK_FOREIGN_STUDENT_ID,
} from "@/mocks/handlers/plans";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("leitura de planos pelo apiClient (PLN-01)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("lista os planos sem metas e com o nome do paciente", async () => {
    const plans = await listPlans();

    expect(plans.length).toBeGreaterThanOrEqual(3);
    for (const plan of plans) {
      expect(plan).not.toHaveProperty("goals");
      expect(plan.studentName).toBeTruthy();
      expect(plan.progress.percent).toBeGreaterThanOrEqual(0);
    }
    expect(
      plans.some((plan) => plan.type === "PDI" && plan.status === "ACTIVE"),
    ).toBe(true);
    expect(plans.some((plan) => plan.type === "PE")).toBe(true);
    expect(plans.some((plan) => plan.status !== "ACTIVE")).toBe(true);
  });

  it("devolve ACTIVE primeiro e depois updatedAt decrescente", async () => {
    const plans = await listPlans();
    const firstClosed = plans.findIndex((plan) => plan.status !== "ACTIVE");
    const active = plans.slice(0, firstClosed);
    const closed = plans.slice(firstClosed);

    expect(active.every((plan) => plan.status === "ACTIVE")).toBe(true);
    expect(closed.every((plan) => plan.status !== "ACTIVE")).toBe(true);
    for (const group of [active, closed]) {
      const dates = group.map((plan) => plan.updatedAt);
      expect(dates).toEqual([...dates].sort().reverse());
    }
  });

  it("filtra por paciente, status e tipo", async () => {
    const all = await listPlans();
    const studentId = all[0]!.studentId;

    const byStudent = await listPlans({ studentId });
    expect(byStudent.length).toBeGreaterThan(0);
    expect(byStudent.every((plan) => plan.studentId === studentId)).toBe(true);

    const active = await listPlans({ status: "ACTIVE" });
    expect(active.every((plan) => plan.status === "ACTIVE")).toBe(true);

    const pe = await listPlans({ type: "PE" });
    expect(pe.length).toBeGreaterThan(0);
    expect(pe.every((plan) => plan.type === "PE")).toBe(true);
  });

  it("recusa o paciente de outro educador com 403 UNAUTHORIZED", async () => {
    await expect(
      listPlans({ studentId: MOCK_FOREIGN_STUDENT_ID }),
    ).rejects.toMatchObject({ status: 403, code: "UNAUTHORIZED" });
  });

  it("lê o plano com as metas e o progresso coerente", async () => {
    const [summary] = await listPlans({ status: "ACTIVE", type: "PDI" });
    const plan = await getPlan(summary!.id);

    expect(plan.goals.length).toBeGreaterThan(0);
    expect(plan.goals.map((goal) => goal.order)).toEqual(
      plan.goals.map((_, index) => index),
    );
    const counted = plan.goals.filter((goal) => goal.status !== "DISCONTINUED");
    const achieved = counted.filter((goal) => goal.status === "ACHIEVED");
    expect(plan.progress.totalGoals).toBe(counted.length);
    expect(plan.progress.achievedGoals).toBe(achieved.length);
    expect(plan.progress.percent).toBe(
      counted.length === 0
        ? 0
        : Math.round((100 * achieved.length) / counted.length),
    );
  });

  it("devolve 404 PLAN_NOT_FOUND e 403 UNAUTHORIZED no detalhe", async () => {
    await expect(getPlan("plan-inexistente")).rejects.toMatchObject({
      status: 404,
      code: "PLAN_NOT_FOUND",
    });
    await expect(getPlan(MOCK_FOREIGN_PLAN_ID)).rejects.toMatchObject({
      status: 403,
      code: "UNAUTHORIZED",
    });
  });
});
