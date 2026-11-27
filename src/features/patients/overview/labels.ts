// Rótulo do status do paciente (PAC-10). O app não calcula o status: o texto
// vem só de `primaryStatus`, calculado no servidor (G-70, PA-06).
import type { PatientOverview } from "@/api/types";

/** `undefined` quando não há overview ou o valor é desconhecido (o cartão usa as dificuldades). */
export function primaryStatusLabel(
  overview: PatientOverview | undefined,
): string | undefined {
  if (!overview) return undefined;
  switch (overview.primaryStatus) {
    case "PDI_ACTIVE":
      return "PDI ativo";
    case "ASSESSMENT_PENDING":
      return "Avaliação pendente";
    case "PLAN_REVIEW":
      return overview.activePlan
        ? `${overview.activePlan.type} em revisão`
        : "Plano em revisão";
    case "NO_PLAN":
      return "Sem plano";
    default:
      return undefined;
  }
}
