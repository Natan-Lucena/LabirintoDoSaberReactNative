// Planos com IA (PLN-01): leitura. As escritas, a geração e as sugestões entram
// com PLN-02 a PLN-05 e estendem `mockPlans`. Dados fictícios; contrato em
// docs/entrega-3/BACKEND-ENTREGUE.md §3.
import type {
  GoalStatus,
  Plan,
  PlanDraft,
  PlanGoal,
  PlanReview,
  PlanSuggestion,
  PlanSummary,
} from "@/api/types";
import type {
  CreatePlanInput,
  GeneratePlanDraftInput,
  UpdatePlanInput,
} from "@/api/endpoints/plans";
import { MOCK_EDUCATOR, MOCK_STUDENTS } from "@/mocks/fixtures";
import { getTodayKey } from "@/utils/date";
import { MOCK_ANAMNESE_TEMPLATES } from "./anamnese";
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

function validDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

registerMockHandler({ method: "post", path: "/plan/" }, ({ body }) => {
  const input = body as Partial<CreatePlanInput>;
  if (input.studentId === MOCK_FOREIGN_STUDENT_ID)
    throw new MockApiError(403, "UNAUTHORIZED");
  const student = MOCK_STUDENTS.find((item) => item.id === input.studentId);
  if (!student) throw new MockApiError(404, "STUDENT_NOT_FOUND");
  if (student.educatorId !== MOCK_EDUCATOR.id)
    throw new MockApiError(403, "UNAUTHORIZED");
  if (!Array.isArray(input.goals) || input.goals.length === 0)
    throw new MockApiError(400, "PLAN_WITHOUT_GOALS");
  if (input.goals.length > 10) throw new MockApiError(400, "TOO_MANY_GOALS");
  if (input.type === "PDI") {
    if (input.sessionDate || input.parentPlanId || input.appointmentId)
      throw new MockApiError(400, "INVALID_FIELDS_FOR_PDI");
    if (
      !validDay(input.startDate) ||
      !validDay(input.endDate) ||
      input.endDate <= input.startDate ||
      (input.nextReviewDate !== undefined &&
        (!validDay(input.nextReviewDate) ||
          input.nextReviewDate < input.startDate ||
          input.nextReviewDate > input.endDate))
    )
      throw new MockApiError(400, "INVALID_DATES");
    const active = mockPlans.find(
      (plan) =>
        plan.studentId === input.studentId &&
        plan.type === "PDI" &&
        plan.status === "ACTIVE",
    );
    if (active)
      return {
        status: 409,
        data: { message: "ACTIVE_PDI_ALREADY_EXISTS", activePlanId: active.id },
      };
  } else if (input.type === "PE") {
    if (!input.sessionDate)
      throw new MockApiError(400, "SESSION_DATE_REQUIRED");
    if (!validDay(input.sessionDate))
      throw new MockApiError(400, "INVALID_DATES");
    if (input.parentPlanId) {
      const parent = mockPlans.find((plan) => plan.id === input.parentPlanId);
      if (
        !parent ||
        parent.type !== "PDI" ||
        parent.studentId !== input.studentId ||
        parent.educatorId !== MOCK_EDUCATOR.id
      )
        throw new MockApiError(400, "INVALID_PARENT_PLAN");
    }
    if (input.appointmentId) throw new MockApiError(400, "INVALID_APPOINTMENT");
  }
  if (
    !(["PDI", "PE"] as unknown[]).includes(input.type) ||
    !(["AI", "MANUAL"] as unknown[]).includes(input.source) ||
    typeof input.title !== "string" ||
    !input.title.trim() ||
    input.title.length > 120 ||
    typeof input.generalObjective !== "string" ||
    !input.generalObjective.trim() ||
    input.generalObjective.length > 2000 ||
    (input.professionalNotes !== undefined &&
      input.professionalNotes.length > 2000) ||
    (input.focus !== undefined && input.focus.length > 1000) ||
    (input.consideredDifficulties !== undefined &&
      (!Array.isArray(input.consideredDifficulties) ||
        input.consideredDifficulties.length > 20 ||
        input.consideredDifficulties.some(
          (item) =>
            typeof item !== "string" || !item.trim() || item.length > 100,
        ))) ||
    input.goals.some(
      (goal) =>
        typeof goal.description !== "string" ||
        !goal.description.trim() ||
        goal.description.length > 500 ||
        (goal.successCriterion !== undefined &&
          goal.successCriterion.length > 500),
    )
  )
    throw new MockApiError(400, "Bad Request");
  const now = new Date().toISOString();
  const id = `mock-plan-${Date.now()}-${mockPlans.length}`;
  const goals: PlanGoal[] = input.goals.map((goal, order) => ({
    id: `${id}-goal-${order + 1}`,
    order,
    description: goal.description,
    ...(goal.successCriterion
      ? { successCriterion: goal.successCriterion }
      : {}),
    status: "NOT_STARTED",
    updatedAt: now,
  }));
  const day = input.type === "PE" ? input.sessionDate! : input.startDate!;
  const plan = buildPlan({
    id,
    educatorId: MOCK_EDUCATOR.id,
    studentId: input.studentId!,
    type: input.type!,
    status: "ACTIVE",
    source: input.source!,
    title: input.title!,
    generalObjective: input.generalObjective!,
    ...(input.professionalNotes
      ? { professionalNotes: input.professionalNotes }
      : {}),
    ...(input.focus ? { focus: input.focus } : {}),
    consideredDifficulties: input.consideredDifficulties ?? [],
    startDate: day,
    endDate: input.type === "PE" ? day : input.endDate!,
    ...(input.type === "PDI" && input.nextReviewDate
      ? { nextReviewDate: input.nextReviewDate }
      : {}),
    ...(input.type === "PE" ? { sessionDate: day } : {}),
    ...(input.parentPlanId ? { parentPlanId: input.parentPlanId } : {}),
    goals,
    updatedAt: now,
  });
  mockPlans.push(plan);
  return { status: 201, data: plan };
});

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

export const mockPlanReviews: PlanReview[] = [];

function accessiblePlan(id: string): Plan {
  const plan = mockPlans.find((item) => item.id === id);
  if (!plan) throw new MockApiError(404, "PLAN_NOT_FOUND");
  if (plan.educatorId !== MOCK_EDUCATOR.id)
    throw new MockApiError(403, "UNAUTHORIZED");
  return plan;
}

function editablePlan(id: string): Plan {
  const plan = accessiblePlan(id);
  if (plan.status !== "ACTIVE")
    throw new MockApiError(409, "PLAN_NOT_EDITABLE");
  return plan;
}

function saveMockPlan(plan: Plan): Plan {
  if (plan.status !== "ACTIVE") dismissPendingSuggestions(plan.id);
  mockPlans.splice(
    mockPlans.findIndex((item) => item.id === plan.id),
    1,
    plan,
  );
  return plan;
}

function validReviewDate(plan: Plan, value: unknown): boolean {
  return validDay(value) && value >= plan.startDate && value <= plan.endDate;
}

registerMockHandler(
  { method: "put", path: "/plan/:id" },
  ({ params, body }) => {
    const plan = editablePlan(params.id);
    const input = body as UpdatePlanInput;
    if (
      (input.title !== undefined &&
        (!input.title.trim() || input.title.length > 120)) ||
      (input.generalObjective !== undefined &&
        (!input.generalObjective.trim() ||
          input.generalObjective.length > 2000)) ||
      (input.professionalNotes !== undefined &&
        input.professionalNotes.length > 2000)
    )
      throw new MockApiError(400, "Bad Request");
    const endDate = input.endDate ?? plan.endDate;
    const reviewDate = input.nextReviewDate ?? plan.nextReviewDate;
    if (
      (input.endDate !== undefined && plan.type === "PE") ||
      !validDay(endDate) ||
      (plan.type === "PDI" && endDate <= plan.startDate) ||
      (reviewDate !== undefined &&
        !validReviewDate({ ...plan, endDate }, reviewDate))
    )
      throw new MockApiError(400, "INVALID_DATES");
    let goals = plan.goals;
    const now = new Date().toISOString();
    if (input.goals !== undefined) {
      if (!Array.isArray(input.goals) || input.goals.length === 0)
        throw new MockApiError(400, "PLAN_WITHOUT_GOALS");
      if (input.goals.length > 10)
        throw new MockApiError(400, "TOO_MANY_GOALS");
      const ids = input.goals.flatMap((goal) => (goal.id ? [goal.id] : []));
      if (new Set(ids).size !== ids.length)
        throw new MockApiError(400, "DUPLICATE_GOAL_ID");
      if (ids.some((id) => !plan.goals.some((goal) => goal.id === id)))
        throw new MockApiError(400, "GOAL_NOT_FOUND");
      if (
        plan.goals.some(
          (goal) => goal.status === "ACHIEVED" && !ids.includes(goal.id),
        )
      ) {
        throw new MockApiError(409, "GOAL_ACHIEVED_CANNOT_BE_REMOVED");
      }
      if (
        input.goals.some(
          (goal) =>
            !goal.description?.trim() ||
            goal.description.length > 500 ||
            (goal.successCriterion !== undefined &&
              goal.successCriterion.length > 500),
        )
      ) {
        throw new MockApiError(400, "Bad Request");
      }
      goals = input.goals.map((goal, order) => {
        const existing = plan.goals.find((item) => item.id === goal.id);
        const {
          successCriterion: _previousCriterion,
          ...existingWithoutCriterion
        } = existing ?? {
          id: `${plan.id}-goal-${Date.now()}-${order}`,
          status: "NOT_STARTED" as const,
        };
        return {
          ...existingWithoutCriterion,
          order,
          description: goal.description,
          ...(goal.successCriterion?.trim()
            ? { successCriterion: goal.successCriterion }
            : {}),
          updatedAt: now,
        };
      });
    }
    const updated: Plan = {
      ...plan,
      ...(input.title?.trim() ? { title: input.title.trim() } : {}),
      ...(input.generalObjective?.trim()
        ? { generalObjective: input.generalObjective.trim() }
        : {}),
      ...(input.professionalNotes?.trim()
        ? { professionalNotes: input.professionalNotes.trim() }
        : {}),
      endDate,
      ...(input.nextReviewDate?.trim()
        ? { nextReviewDate: input.nextReviewDate }
        : {}),
      goals,
      progress: computeMockProgress(goals),
      updatedAt: now,
    };
    return { status: 200, data: saveMockPlan(updated) };
  },
);

registerMockHandler(
  { method: "put", path: "/plan/:id/goals/:goalId" },
  ({ params, body }) => {
    const plan = editablePlan(params.id);
    const goal = plan.goals.find((item) => item.id === params.goalId);
    if (!goal) throw new MockApiError(404, "GOAL_NOT_FOUND");
    const status = (body as { status?: GoalStatus }).status;
    if (
      !(
        ["NOT_STARTED", "IN_PROGRESS", "ACHIEVED", "DISCONTINUED"] as unknown[]
      ).includes(status)
    )
      throw new MockApiError(400, "Bad Request");
    const now = new Date().toISOString();
    const goals = plan.goals
      .map((item) =>
        item.id === goal.id
          ? {
              ...item,
              status: status!,
              ...(status === "ACHIEVED"
                ? { achievedAt: now }
                : { achievedAt: undefined }),
              updatedAt: now,
            }
          : item,
      )
      .map((item) => {
        if (item.achievedAt === undefined) {
          const { achievedAt: _achievedAt, ...withoutAchievedAt } = item;
          return withoutAchievedAt;
        }
        return item;
      });
    const updated = {
      ...plan,
      goals,
      progress: computeMockProgress(goals),
      updatedAt: now,
    };
    return { status: 200, data: saveMockPlan(updated) };
  },
);

registerMockHandler(
  { method: "put", path: "/plan/:id/status" },
  ({ params, body }) => {
    const plan = editablePlan(params.id);
    const status = (body as { status?: string }).status;
    if (status !== "COMPLETED" && status !== "CANCELLED")
      throw new MockApiError(400, "Bad Request");
    const now = new Date().toISOString();
    return {
      status: 200,
      data: saveMockPlan({ ...plan, status, closedAt: now, updatedAt: now }),
    };
  },
);

registerMockHandler(
  { method: "post", path: "/plan/:id/reviews" },
  ({ params, body }) => {
    const plan = editablePlan(params.id);
    const input = body as { note?: string; nextReviewDate?: string };
    if (!input.note?.trim() || input.note.length > 2000)
      throw new MockApiError(400, "Bad Request");
    if (
      input.nextReviewDate !== undefined &&
      !validReviewDate(plan, input.nextReviewDate)
    )
      throw new MockApiError(400, "INVALID_DATES");
    const now = new Date().toISOString();
    const review: PlanReview = {
      id: `mock-review-${Date.now()}-${mockPlanReviews.length}`,
      planId: plan.id,
      reviewedAt: now,
      note: input.note,
      ...(input.nextReviewDate ? { nextReviewDate: input.nextReviewDate } : {}),
      goalStatuses: plan.goals.map(({ id, status }) => ({
        goalId: id,
        status,
      })),
    };
    mockPlanReviews.push(review);
    saveMockPlan({
      ...plan,
      ...(input.nextReviewDate ? { nextReviewDate: input.nextReviewDate } : {}),
      updatedAt: now,
    });
    return { status: 201, data: review };
  },
);

registerMockHandler(
  { method: "get", path: "/plan/:id/reviews" },
  ({ params }) => {
    accessiblePlan(params.id);
    return {
      status: 200,
      data: mockPlanReviews
        .filter((item) => item.planId === params.id)
        .sort(
          (a, b) =>
            b.reviewedAt.localeCompare(a.reviewedAt) ||
            b.id.localeCompare(a.id),
        ),
    };
  },
);

function addMonths(day: string, months: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(date, lastDay));
  return target.toISOString().slice(0, 10);
}

registerMockHandler({ method: "post", path: "/plan/generate" }, ({ body }) => {
  const input = body as Partial<GeneratePlanDraftInput>;
  const focus = typeof input.focus === "string" ? input.focus : "";
  if (input.studentId === MOCK_FOREIGN_STUDENT_ID) {
    throw new MockApiError(403, "UNAUTHORIZED");
  }
  const student = MOCK_STUDENTS.find((item) => item.id === input.studentId);
  if (!student) throw new MockApiError(404, "STUDENT_NOT_FOUND");
  if (student.educatorId !== MOCK_EDUCATOR.id)
    throw new MockApiError(403, "UNAUTHORIZED");
  if (
    input.includeAnamnesisTemplateId &&
    !MOCK_ANAMNESE_TEMPLATES.some(
      (item) => item.id === input.includeAnamnesisTemplateId,
    )
  ) {
    throw new MockApiError(404, "TEMPLATE_NOT_FOUND");
  }
  if (input.parentPlanId) {
    const parent = mockPlans.find((item) => item.id === input.parentPlanId);
    if (!parent) throw new MockApiError(404, "PLAN_NOT_FOUND");
    if (parent.educatorId !== MOCK_EDUCATOR.id) {
      throw new MockApiError(403, "UNAUTHORIZED");
    }
    if (
      parent.type !== "PDI" ||
      parent.studentId !== student.id ||
      input.type !== "PE"
    ) {
      throw new MockApiError(400, "INVALID_PARENT_PLAN");
    }
  }
  if (focus.includes("[AI_GENERATION_FAILED]"))
    throw new MockApiError(500, "AI_GENERATION_FAILED");
  if (focus.includes("[AI_INVALID_OUTPUT]"))
    throw new MockApiError(500, "AI_INVALID_OUTPUT");
  const difficulties = input.consideredDifficulties;
  if (
    !["PDI", "PE"].includes(input.type ?? "") ||
    !focus.trim() ||
    focus.length > 1000 ||
    !Array.isArray(difficulties) ||
    difficulties.length < 1 ||
    difficulties.length > 20 ||
    difficulties.some(
      (item) => typeof item !== "string" || !item.trim() || item.length > 100,
    ) ||
    (input.type === "PDI" && ![3, 6].includes(input.durationMonths ?? 0)) ||
    (input.type === "PE" &&
      (!input.sessionDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.sessionDate)))
  )
    throw new MockApiError(400, "Bad Request");
  const start = input.type === "PE" ? input.sessionDate! : getTodayKey();
  const topic = difficulties[0]!;
  const draft: PlanDraft = {
    type: input.type!,
    title:
      input.type === "PDI" ? `PDI de ${topic}` : `Plano da sessão de ${topic}`,
    generalObjective: `Desenvolver ${topic} com atividades graduais e acompanhamento individual.`,
    goals: [
      {
        description: `Identificar habilidades relacionadas a ${topic}`,
        successCriterion: "Registra 3 exemplos com apoio",
      },
      {
        description: `Praticar ${topic} em atividades orientadas`,
        successCriterion: "Conclui 4 de 5 atividades propostas",
      },
      {
        description: `Aplicar ${topic} com maior autonomia`,
        successCriterion: "Conclui 3 atividades com apoio reduzido",
      },
    ],
    suggestedStartDate: start,
    suggestedEndDate:
      input.type === "PE" ? start : addMonths(start, input.durationMonths!),
    ...(input.type === "PDI"
      ? { suggestedNextReviewDate: addMonths(start, 1) }
      : {}),
    rationale:
      "Metas propostas a partir do foco e das dificuldades informadas, sem histórico de sessões.",
  };
  return { status: 200, data: draft };
});

// Sugestões da IA sob demanda (PLN-05); contrato em BACKEND-ENTREGUE.md §5.
const MAX_PENDING_SUGGESTIONS = 3;
const MAX_GOALS = 10;

export const mockPlanSuggestions: PlanSuggestion[] = [
  {
    id: "mock-suggestion-1",
    planId: "mock-plan-1",
    studentId: "student-1",
    studentName: studentName("student-1"),
    goalId: "mock-plan-1-goal-2",
    kind: "UPDATE_GOAL_STATUS",
    text: "A escrita de frases com maiúscula apareceu em várias atividades recentes.",
    proposedChange: { status: "ACHIEVED" },
    status: "PENDING",
    createdAt: "2026-10-28T12:00:00.000Z",
  },
];

/** Encerrar um plano descarta as sugestões pendentes dele. */
function dismissPendingSuggestions(planId: string): void {
  const now = new Date().toISOString();
  mockPlanSuggestions.forEach((item, index) => {
    if (item.planId === planId && item.status === "PENDING")
      mockPlanSuggestions[index] = {
        ...item,
        status: "DISMISSED",
        resolvedAt: now,
      };
  });
}

function pendingOf(planId: string): PlanSuggestion[] {
  return mockPlanSuggestions.filter(
    (item) => item.planId === planId && item.status === "PENDING",
  );
}

type SuggestionDraft = Pick<
  PlanSuggestion,
  "kind" | "goalId" | "text" | "proposedChange"
>;

/** Candidatas coerentes com o plano; só entram as que mudariam algo. */
function suggestionCandidates(plan: Plan): SuggestionDraft[] {
  const drafts: SuggestionDraft[] = [];
  const open = plan.goals.find(
    (goal) => goal.status === "NOT_STARTED" || goal.status === "IN_PROGRESS",
  );
  if (open)
    drafts.push({
      kind: "UPDATE_GOAL_STATUS",
      goalId: open.id,
      text: `Os registros recentes indicam avanço na meta "${open.description}".`,
      proposedChange: {
        status: open.status === "NOT_STARTED" ? "IN_PROGRESS" : "ACHIEVED",
      },
    });
  if (plan.goals.length < MAX_GOALS)
    drafts.push({
      kind: "ADD_GOAL",
      text: "Uma meta de generalização ajudaria a consolidar o que já foi trabalhado.",
      proposedChange: {
        description: `Aplicar o que foi aprendido em ${plan.title.toLowerCase()} em situações do dia a dia`,
        successCriterion: "Aplica em 3 situações diferentes",
      },
    });
  const today = getTodayKey();
  const review = addMonths(today > plan.startDate ? today : plan.startDate, 1);
  const reviewDate = review > plan.endDate ? plan.endDate : review;
  if (plan.type === "PDI" && reviewDate !== plan.nextReviewDate)
    drafts.push({
      kind: "SCHEDULE_REVIEW",
      text: "Uma revisão nas próximas semanas ajuda a ajustar as metas a tempo.",
      proposedChange: { nextReviewDate: reviewDate },
    });
  if (open)
    drafts.push({
      kind: "REWRITE_GOAL",
      goalId: open.id,
      text: "A meta fica mais fácil de acompanhar com o apoio descrito de forma explícita.",
      proposedChange: {
        description: `${open.description} com apoio visual`,
        successCriterion: "Conclui 4 de 5 tentativas",
      },
    });
  return drafts;
}

registerMockHandler(
  { method: "post", path: "/plan/:id/suggestions/generate" },
  ({ params }) => {
    const plan = editablePlan(params.id);
    if (plan.title.includes("[AI_GENERATION_FAILED]"))
      throw new MockApiError(500, "AI_GENERATION_FAILED");
    const pending = pendingOf(plan.id);
    const created: PlanSuggestion[] = [];
    for (const draft of suggestionCandidates(plan)) {
      if (pending.length + created.length >= MAX_PENDING_SUGGESTIONS) break;
      if (
        pending.some(
          (item) => item.kind === draft.kind && item.goalId === draft.goalId,
        )
      )
        continue;
      created.push({
        id: `mock-suggestion-${Date.now()}-${mockPlanSuggestions.length + created.length}`,
        planId: plan.id,
        studentId: plan.studentId,
        studentName: studentName(plan.studentId),
        ...(draft.goalId ? { goalId: draft.goalId } : {}),
        kind: draft.kind,
        text: draft.text,
        proposedChange: draft.proposedChange,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      });
    }
    mockPlanSuggestions.push(...created);
    return { status: created.length ? 201 : 200, data: created };
  },
);

registerMockHandler(
  { method: "get", path: "/plan/suggestions" },
  ({ params }) => {
    if (
      params.status !== undefined &&
      !["PENDING", "ACCEPTED", "DISMISSED"].includes(params.status)
    )
      throw new MockApiError(400, "Bad Request");
    const ownPlanIds = mockPlans
      .filter((plan) => plan.educatorId === MOCK_EDUCATOR.id)
      .map((plan) => plan.id);
    const visible = mockPlanSuggestions
      .filter(
        (item) =>
          ownPlanIds.includes(item.planId) &&
          (params.status === undefined || item.status === params.status),
      )
      .sort(
        (a, b) =>
          b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
      );
    return { status: 200, data: visible };
  },
);

function findSuggestion(id: string): PlanSuggestion {
  const suggestion = mockPlanSuggestions.find((item) => item.id === id);
  if (!suggestion) throw new MockApiError(404, "SUGGESTION_NOT_FOUND");
  accessiblePlan(suggestion.planId);
  return suggestion;
}

function resolveSuggestion(
  suggestion: PlanSuggestion,
  status: "ACCEPTED" | "DISMISSED",
): PlanSuggestion {
  if (suggestion.status !== "PENDING")
    throw new MockApiError(409, "SUGGESTION_ALREADY_RESOLVED");
  const resolved = {
    ...suggestion,
    status,
    resolvedAt: new Date().toISOString(),
  };
  mockPlanSuggestions.splice(
    mockPlanSuggestions.indexOf(suggestion),
    1,
    resolved,
  );
  return resolved;
}

/** Mesmas regras da edição; `undefined` quando a mudança não pode ser aplicada. */
function applySuggestion(
  plan: Plan,
  suggestion: PlanSuggestion,
): Plan | undefined {
  if (plan.status !== "ACTIVE") return undefined;
  const change = suggestion.proposedChange;
  const now = new Date().toISOString();
  let goals = plan.goals;
  let nextReviewDate = plan.nextReviewDate;
  if (
    suggestion.kind === "UPDATE_GOAL_STATUS" ||
    suggestion.kind === "REWRITE_GOAL"
  ) {
    const goal = plan.goals.find((item) => item.id === suggestion.goalId);
    if (!goal) return undefined;
    if (suggestion.kind === "UPDATE_GOAL_STATUS") {
      if (!change.status) return undefined;
      const { achievedAt: _achievedAt, ...rest } = goal;
      goals = plan.goals.map((item) =>
        item.id === goal.id
          ? {
              ...rest,
              status: change.status!,
              ...(change.status === "ACHIEVED" ? { achievedAt: now } : {}),
              updatedAt: now,
            }
          : item,
      );
    } else {
      if (!change.description?.trim()) return undefined;
      goals = plan.goals.map((item) =>
        item.id === goal.id
          ? {
              ...item,
              description: change.description!,
              ...(change.successCriterion
                ? { successCriterion: change.successCriterion }
                : {}),
              updatedAt: now,
            }
          : item,
      );
    }
  } else if (suggestion.kind === "ADD_GOAL") {
    if (plan.goals.length >= MAX_GOALS || !change.description?.trim())
      return undefined;
    goals = [
      ...plan.goals,
      {
        id: `${plan.id}-goal-${Date.now()}-${plan.goals.length}`,
        order: plan.goals.length,
        description: change.description,
        ...(change.successCriterion
          ? { successCriterion: change.successCriterion }
          : {}),
        status: "NOT_STARTED",
        updatedAt: now,
      },
    ];
  } else {
    if (!validReviewDate(plan, change.nextReviewDate)) return undefined;
    nextReviewDate = change.nextReviewDate;
  }
  return {
    ...plan,
    goals,
    ...(nextReviewDate ? { nextReviewDate } : {}),
    progress: computeMockProgress(goals),
    updatedAt: now,
  };
}

registerMockHandler(
  { method: "post", path: "/plan/suggestions/:id/accept" },
  ({ params }) => {
    const suggestion = findSuggestion(params.id);
    if (suggestion.status !== "PENDING")
      throw new MockApiError(409, "SUGGESTION_ALREADY_RESOLVED");
    const updated = applySuggestion(
      accessiblePlan(suggestion.planId),
      suggestion,
    );
    if (!updated) {
      resolveSuggestion(suggestion, "DISMISSED");
      throw new MockApiError(409, "SUGGESTION_NOT_APPLICABLE");
    }
    resolveSuggestion(suggestion, "ACCEPTED");
    return { status: 200, data: saveMockPlan(updated) };
  },
);

registerMockHandler(
  { method: "post", path: "/plan/suggestions/:id/dismiss" },
  ({ params }) => ({
    status: 200,
    data: resolveSuggestion(findSuggestion(params.id), "DISMISSED"),
  }),
);

export const planMockHandlersRegistered = true;
