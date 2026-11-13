// Destinos do módulo de avaliações. As telas de aplicar (AVA-02) e de
// resultado (AVA-04) ainda não existem: o hub só navega para as rotas futuras.
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
  }) as never;

/** `/assessments/results/[id]` (AVA-04). */
export const resultRoute = (applicationId: string) =>
  ({
    pathname: "/assessments/results/[id]",
    params: { id: applicationId },
  }) as never;
