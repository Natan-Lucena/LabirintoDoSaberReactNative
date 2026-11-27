// Rótulo e destino de cada pendência do overview (PAC-10, §6 item 4).
import type { Href } from "expo-router";

import type { PatientOverview } from "@/api/types";
import { evolutionRoute } from "@/features/evolution/register/routes";
import { planDetailRoute } from "@/features/plans/routes";

export type Pending = PatientOverview["pendings"][number];

export type PendingTarget =
  | { type: "route"; route: Href }
  | { type: "tab"; tab: "plans" | "assessments" }
  | { type: "scale"; applicationId: string };

/** `undefined` para um tipo desconhecido (a linha não aparece). */
export function pendingLabel(pending: Pending): string | undefined {
  const many = pending.count > 1;
  switch (pending.kind) {
    case "EVOLUTION_PENDING":
      return many
        ? `${pending.count} evoluções pendentes`
        : "Evolução pendente";
    case "PLAN_REVIEW_DUE":
      return "Revisão do plano vencida";
    case "SCALE_DRAFT":
      return many
        ? `${pending.count} escalas em rascunho`
        : "Escala em rascunho";
    case "ANAMNESIS_MISSING":
      return "Anamnese não preenchida";
    default:
      return undefined;
  }
}

/** Destino da pendência; `undefined` para um tipo desconhecido. */
export function pendingRoute(
  pending: Pending,
  studentId: string,
): PendingTarget | undefined {
  switch (pending.kind) {
    case "EVOLUTION_PENDING":
      return {
        type: "route",
        route: pending.targetId
          ? evolutionRoute(pending.targetId, "entry")
          : "/evolution",
      };
    case "PLAN_REVIEW_DUE":
      return pending.targetId
        ? { type: "route", route: planDetailRoute(pending.targetId) }
        : { type: "tab", tab: "plans" };
    case "SCALE_DRAFT":
      return pending.targetId
        ? { type: "scale", applicationId: pending.targetId }
        : { type: "tab", tab: "assessments" };
    case "ANAMNESIS_MISSING":
      return {
        type: "route",
        route: {
          pathname: "/patients/[id]/anamnese",
          params: { id: studentId },
        },
      };
    default:
      return undefined;
  }
}
