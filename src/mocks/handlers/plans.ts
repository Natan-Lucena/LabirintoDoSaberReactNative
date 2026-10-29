// Planos com IA (PLN-01): leitura. As escritas, a geração e as sugestões entram
// com PLN-02 a PLN-05 e estendem `mockPlans`. Dados fictícios; contrato em
// docs/entrega-3/BACKEND-ENTREGUE.md §3.
import type { GoalStatus, Plan, PlanGoal, PlanSummary } from "@/api/types";
import { MOCK_EDUCATOR, MOCK_STUDENTS } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

/** Paciente de outro educador: filtrar por ele responde `403 UNAUTHORIZED`. */
export const MOCK_FOREIGN_STUDENT_ID = "mock-student-foreign";
/** Plano de outro educador: lê-lo responde `403 UNAUTHORIZED`. */
export const MOCK_FOREIGN_PLAN_ID = "mock-plan-foreign";

const FOREIGN_EDUCATOR_ID = "mock-educator-2";

/** Mesma regra do servidor: sem `DISCONTINUED`; `round(100 × achieved / total)`. */
export function computeMockProgress(goals: PlanGoal[]): Plan["progress"] {
  const counted = goals.filter((goal) => goal.status !== "DISCONTINUED");
  const achievedGoals = counted.filter((g) => g.status === "ACHIEVED").length;
  const inProgressGoals = counted.filter(
    (g) => g.status === "IN_PROGRESS",
  ).length;

  return {
    totalGoals: counted.length,
    achievedGoals,
    inProgressGoals,
    percent:
      counted.length === 0
        ? 0
        : Math.round((100 * achievedGoals) / counted.length),
  };
}

function buildGoals(
  planKey: string,
  entries: [string, GoalStatus, string?][],
  updatedAt: string,
): PlanGoal[] {
  return entries.map(([description, status, successCriterion], order) => ({
    id: `${planKey}-goal-${order + 1}`,
    order,
    description,
    ...(successCriterion === undefined ? {} : { successCriterion }),
    status,
    ...(status === "ACHIEVED" ? { achievedAt: updatedAt } : {}),
    updatedAt,
  }));
}

type PlanInput = Omit<Plan, "progress" | "createdAt"> & { createdAt?: string };

function buildPlan(input: PlanInput): Plan {
  return {
    ...input,
    createdAt: input.createdAt ?? input.updatedAt,
    progress: computeMockProgress(input.goals),
  };
}

const studentName = (id: string): string =>
  MOCK_STUDENTS.find((student) => student.id === id)?.name ??
  "Paciente fictício";

export const mockPlans: Plan[] = [
  buildPlan({
    id: "mock-plan-1",
    educatorId: MOCK_EDUCATOR.id,
    studentId: "student-1",
    type: "PDI",
    status: "ACTIVE",
    source: "AI",
    title: "PDI de leitura e escrita",
    generalObjective:
      "Ampliar a fluência de leitura e a escrita de frases com autonomia.",
    focus: "Leitura de textos curtos",
    consideredDifficulties: ["Troca de letras", "Leitura silabada"],
    startDate: "2026-10-01",
    endDate: "2027-01-01",
    nextReviewDate: "2026-11-05",
    goals: buildGoals(
      "mock-plan-1",
      [
        ["Ler frases curtas sem apoio", "ACHIEVED", "Lê 5 frases sem pausas"],
        ["Escrever frases com letra maiúscula", "IN_PROGRESS"],
        ["Reconhecer sílabas complexas", "NOT_STARTED"],
        ["Ler um texto de um parágrafo", "NOT_STARTED"],
      ],
      "2026-10-22T12:00:00.000Z",
    ),
    updatedAt: "2026-10-22T12:00:00.000Z",
  }),
  buildPlan({
    id: "mock-plan-2",
    educatorId: MOCK_EDUCATOR.id,
    studentId: "student-2",
    type: "PE",
    status: "ACTIVE",
    source: "MANUAL",
    title: "Planejamento da sessão de matemática",
    generalObjective: "Trabalhar a contagem até 20 com materiais concretos.",
    consideredDifficulties: ["Atenção sustentada"],
    startDate: "2026-10-27",
    endDate: "2026-10-27",
    sessionDate: "2026-10-27",
    goals: buildGoals(
      "mock-plan-2",
      [
        ["Contar objetos até 10", "IN_PROGRESS"],
        ["Associar quantidade e numeral", "NOT_STARTED"],
      ],
      "2026-10-27T15:00:00.000Z",
    ),
    updatedAt: "2026-10-27T15:00:00.000Z",
  }),
  buildPlan({
    id: "mock-plan-3",
    educatorId: MOCK_EDUCATOR.id,
    studentId: "student-3",
    type: "PDI",
    status: "COMPLETED",
    source: "AI",
    title: "PDI de atenção e rotina",
    generalObjective: "Sustentar a atenção em atividades de 15 minutos.",
    consideredDifficulties: ["Distração com estímulos sonoros"],
    startDate: "2026-04-01",
    endDate: "2026-07-01",
    goals: buildGoals(
      "mock-plan-3",
      [
        ["Concluir tarefas de 10 minutos", "ACHIEVED"],
        ["Seguir a rotina visual", "ACHIEVED"],
        ["Pedir ajuda quando precisar", "ACHIEVED"],
      ],
      "2026-07-01T12:00:00.000Z",
    ),
    updatedAt: "2026-07-01T12:00:00.000Z",
    closedAt: "2026-07-01T12:00:00.000Z",
  }),
  buildPlan({
    id: MOCK_FOREIGN_PLAN_ID,
    educatorId: FOREIGN_EDUCATOR_ID,
    studentId: MOCK_FOREIGN_STUDENT_ID,
    type: "PDI",
    status: "ACTIVE",
    source: "MANUAL",
    title: "Plano de outro educador",
    generalObjective: "Não acessível ao educador fictício.",
    consideredDifficulties: [],
    startDate: "2026-10-01",
    endDate: "2027-01-01",
    goals: buildGoals(
      MOCK_FOREIGN_PLAN_ID,
      [["Meta fictícia", "NOT_STARTED"]],
      "2026-10-01T12:00:00.000Z",
    ),
    updatedAt: "2026-10-01T12:00:00.000Z",
  }),
];

/** Resumo da listagem: tudo menos `goals`, mais `studentName`. */
export function toMockPlanSummary(plan: Plan): PlanSummary {
  const { goals: _goals, ...rest } = plan;

  return { ...rest, studentName: studentName(plan.studentId) };
}

/** `ACTIVE` primeiro e depois `updatedAt` decrescente. */
export function sortMockPlans(plans: Plan[]): Plan[] {
  return [...plans].sort((a, b) => {
    if ((a.status === "ACTIVE") !== (b.status === "ACTIVE")) {
      return a.status === "ACTIVE" ? -1 : 1;
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

registerMockHandler({ method: "get", path: "/plan/" }, ({ params }) => {
  if (params.studentId === MOCK_FOREIGN_STUDENT_ID) {
    throw new MockApiError(403, "UNAUTHORIZED");
  }
  const visible = mockPlans.filter(
    (plan) =>
      plan.educatorId === MOCK_EDUCATOR.id &&
      (params.studentId === undefined || plan.studentId === params.studentId) &&
      (params.status === undefined || plan.status === params.status) &&
      (params.type === undefined || plan.type === params.type),
  );

  return { status: 200, data: sortMockPlans(visible).map(toMockPlanSummary) };
});

registerMockHandler({ method: "get", path: "/plan/:id" }, ({ params }) => {
  const plan = mockPlans.find(({ id }) => id === params.id);
  if (!plan) {
    throw new MockApiError(404, "PLAN_NOT_FOUND");
  }
  if (plan.educatorId !== MOCK_EDUCATOR.id) {
    throw new MockApiError(403, "UNAUTHORIZED");
  }

  return { status: 200, data: plan };
});

export const planMockHandlersRegistered = true;
