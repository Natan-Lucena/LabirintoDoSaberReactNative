// Destinos do módulo de avaliações.
export const ASSESSMENTS_ROUTE = "/assessments" as const;

interface ApplyRouteOptions {
  /** Paciente já escolhido (ex.: vindo da ficha). */
  studentId?: string;
  /** Rascunho a retomar. */
  applicationId?: string;
}

/** `/assessments/apply/[templateId]` (AVA-02), com `studentId` e `applicationId` opcionais. */
export const applyRoute = (
  templateId: string,
  { studentId, applicationId }: ApplyRouteOptions = {},
) =>
  ({
    pathname: "/assessments/apply/[templateId]",
    params: {
      templateId,
      ...(studentId ? { studentId } : {}),
      ...(applicationId ? { applicationId } : {}),
    },
  }) as const;

/** `/assessments/results/[id]` (AVA-04). */
export const resultRoute = (applicationId: string) =>
  ({
    pathname: "/assessments/results/[id]",
    params: { id: applicationId },
  }) as const;
