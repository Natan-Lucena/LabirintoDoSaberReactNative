import type { PlanSummary, PlanType } from "@/api/types";

export type PlanTypeFilter = "ALL" | PlanType;

export const planTypeLabel: Record<PlanType, string> = {
  PDI: "PDI",
  PE: "PE",
};

/** `AAAA-MM-DD` → `dd/mm`; é data de calendário, sem conversão de fuso. */
export function formatReviewDate(date: string): string {
  const [, month, day] = date.split("-");

  return `${day}/${month}`;
}

/** Mantém a ordem do servidor: ativos primeiro, depois `updatedAt` decrescente. */
export function selectPlanSections(
  plans: PlanSummary[],
  filter: PlanTypeFilter,
): { active: PlanSummary[]; closed: PlanSummary[] } {
  const visible = plans.filter(
    (plan) => filter === "ALL" || plan.type === filter,
  );

  return {
    active: visible.filter((plan) => plan.status === "ACTIVE"),
    closed: visible.filter((plan) => plan.status !== "ACTIVE"),
  };
}
