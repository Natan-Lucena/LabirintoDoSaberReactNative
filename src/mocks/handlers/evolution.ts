// Evolução da sessão (API-05, leva 1): leituras e escritas. Contrato PROVISÓRIO
// de docs/entrega-4/ESPECIFICACAO-BACKEND.md §3, a conferir em API-04. Estado só
// em memória; dados fictícios. Decisões G-56/G-57: a evolução substitui a
// observação pós-sessão e os critérios vêm só do PE da sessão (sem PDI, EV-12).
import type { SessionReport } from "@/api/endpoints/session-report";
import type {
  CriterionResult,
  EvolutionContext,
  EvolutionCriterion,
  EvolutionCriterionInput,
  EvolutionGoalUpdate,
  GoalStatus,
  NextSessionSuggestion,
  PendingEvolution,
  Plan,
  SessionEvolution,
  SessionEvolutionSummary,
  TaskNotebookSession,
} from "@/api/types";
import { MOCK_EDUCATOR, MOCK_STUDENTS } from "@/mocks/fixtures";
import { dayKey } from "@/utils/date";
import "./session-analysis";
import "./session-report";
import {
  computeMockProgress,
  MOCK_FOREIGN_STUDENT_ID,
  mockPlans,
} from "./plans";
import { getMockHandler, registerMockHandler } from "./registry";
import { MockApiError } from "./types";

/** Sessão (PE do atendimento por data) de `student-2`, ainda sem evolução. */
export const MOCK_EVOLUTION_SESSION_PE = "mock-evo-session-pe";
/** Sessão de `student-3`, sem PE ativo: a evolução só tem o registro descritivo. */
export const MOCK_EVOLUTION_SESSION_FREE = "mock-evo-session-free";
/** Sessão finalizada ontem, sem evolução: aparece nas pendentes. */
export const MOCK_EVOLUTION_SESSION_RECENT = "mock-evo-session-recent";
/** Sessão finalizada há 60 dias, sem evolução: só aparece com `days` maior. */
export const MOCK_EVOLUTION_SESSION_OLD = "mock-evo-session-old";
/** Sessão de outro educador: tudo responde `403 UNAUTHORIZED`. */
export const MOCK_EVOLUTION_SESSION_FOREIGN = "mock-evo-session-foreign";
/** Evolução fictícia da sessão `mock-session-2`. */
export const MOCK_EVOLUTION_ID = "mock-evolution-1";
/** Evolução de outro educador: lê-la ou editá-la responde `403 UNAUTHORIZED`. */
export const MOCK_FOREIGN_EVOLUTION_ID = "mock-evolution-foreign";

const FOREIGN_EDUCATOR_ID = "mock-educator-2";
const DAY_MS = 24 * 60 * 60 * 1000;
const GOAL_STATUSES: GoalStatus[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "ACHIEVED",
  "DISCONTINUED",
];
const RESULTS: CriterionResult[] = [
  "ACHIEVED",
  "PARTIAL",
  "NOT_ACHIEVED",
  "NOT_OBSERVED",
];

function finishedSession(
  id: string,
  studentId: string,
  educatorId: string,
  name: string,
  startedAt: Date,
  minutes: number,
  answers: boolean[],
): TaskNotebookSession {
  const finishedAt = new Date(startedAt.getTime() + minutes * 60_000);
  return {
    id,
    studentId,
    educatorId,
    name,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    taskNotebookId: null,
    appointmentId: null,
    observation: null,
    answers: answers.map((isCorrect, index) => ({
      taskId: `task-${index + 1}`,
      selectedAlternativeId: `alternative-${index + 1}`,
      isCorrect,
      timeToAnswer: 10,
      answeredAt: new Date(
        startedAt.getTime() + (index + 1) * 60_000,
      ).toISOString(),
    })),
  };
}

const daysAgo = (days: number): Date => new Date(Date.now() - days * DAY_MS);

const extraSessions: TaskNotebookSession[] = [
  finishedSession(
    MOCK_EVOLUTION_SESSION_PE,
    "student-2",
    MOCK_EDUCATOR.id,
    "Contagem com materiais concretos",
    new Date("2026-10-27T10:00:00-03:00"),
    50,
    [true, true, false],
  ),
  finishedSession(
    MOCK_EVOLUTION_SESSION_FREE,
    "student-3",
    MOCK_EDUCATOR.id,
    "Rotina e atenção",
    new Date("2026-10-29T14:00:00-03:00"),
    40,
    [true, false],
  ),
  finishedSession(
    MOCK_EVOLUTION_SESSION_RECENT,
    "student-4",
    MOCK_EDUCATOR.id,
    "Sessão de ontem",
    daysAgo(1),
    45,
    [true],
  ),
  finishedSession(
    MOCK_EVOLUTION_SESSION_OLD,
    "student-5",
    MOCK_EDUCATOR.id,
    "Sessão antiga",
    daysAgo(60),
    45,
    [false],
  ),
  finishedSession(
    MOCK_EVOLUTION_SESSION_FOREIGN,
    MOCK_FOREIGN_STUDENT_ID,
    FOREIGN_EDUCATOR_ID,
    "Sessão de outro educador",
    new Date("2026-10-20T10:00:00-03:00"),
    30,
    [true],
  ),
];

const studentName = (id: string): string =>
  MOCK_STUDENTS.find((student) => student.id === id)?.name ??
  "Paciente fictício";

/** Sessões do mock: as deste arquivo mais as que o fluxo de sessão do app criou. */
async function listSessions(): Promise<TaskNotebookSession[]> {
  const handler = getMockHandler(
    "get",
    "/task-notebook-session/student/:studentId",
  );
  const live = handler
    ? (
        await Promise.all(
          MOCK_STUDENTS.map((student) =>
            handler({ body: undefined, params: { studentId: student.id } }),
          ),
        )
      ).flatMap((result) => result.data as TaskNotebookSession[])
    : [];

  return [...extraSessions, ...live];
}

async function findSession(id: string): Promise<TaskNotebookSession> {
  const session = (await listSessions()).find((item) => item.id === id);
  if (!session) throw new MockApiError(404, "SESSION_NOT_FOUND");
  return session;
}

/** Sessão do educador, finalizada: 404, 403 e 409 como na especificação (EV-01, EV-03). */
async function findFinishedOwnSession(
  id: string,
): Promise<TaskNotebookSession & { finishedAt: string }> {
  const session = await findSession(id);
  if (session.educatorId !== MOCK_EDUCATOR.id)
    throw new MockApiError(403, "UNAUTHORIZED");
  if (!session.finishedAt) throw new MockApiError(409, "SESSION_NOT_FINISHED");
  return session as TaskNotebookSession & { finishedAt: string };
}

const sessionDay = (session: TaskNotebookSession): string =>
  dayKey(new Date(session.startedAt));

function durationMinutes(session: { startedAt: string; finishedAt: string }) {
  return Math.round(
    (new Date(session.finishedAt).getTime() -
      new Date(session.startedAt).getTime()) /
      60_000,
  );
}

function validationError(): MockApiError {
  return new MockApiError(400, "Validation error");
}

function isDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function optionalText(value: unknown, max: number): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || value.length > max) throw validationError();
  return value;
}

function parseCriteria(value: unknown): EvolutionCriterionInput[] {
  if (!Array.isArray(value) || value.length > 20) throw validationError();
  let invalidAttempts = false;
  const criteria = value.map((raw: unknown): EvolutionCriterionInput => {
    const item = (raw ?? {}) as Record<string, unknown>;
    if (
      typeof item.description !== "string" ||
      !item.description.trim() ||
      item.description.length > 500 ||
      !RESULTS.includes(item.result as CriterionResult) ||
      (item.goalId !== undefined && typeof item.goalId !== "string")
    )
      throw validationError();
    const successCriterion = optionalText(item.successCriterion, 500);
    const note = optionalText(item.note, 500);
    for (const key of ["attempts", "successes"] as const) {
      const count = item[key];
      if (
        count !== undefined &&
        (typeof count !== "number" ||
          !Number.isInteger(count) ||
          count < 0 ||
          count > 100)
      )
        throw validationError();
    }
    const { attempts, successes } = item as {
      attempts?: number;
      successes?: number;
    };
    // EV-04: `successes` exige `attempts` e não passa dele.
    if (
      (successes !== undefined && attempts === undefined) ||
      (successes !== undefined &&
        attempts !== undefined &&
        successes > attempts)
    )
      invalidAttempts = true;

    return {
      ...(item.goalId === undefined ? {} : { goalId: item.goalId as string }),
      description: item.description,
      ...(successCriterion === undefined ? {} : { successCriterion }),
      ...(attempts === undefined ? {} : { attempts }),
      ...(successes === undefined ? {} : { successes }),
      result: item.result as CriterionResult,
      ...(note === undefined ? {} : { note }),
    };
  });
  if (invalidAttempts) throw new MockApiError(400, "INVALID_ATTEMPTS");
  return criteria;
}

function parseGoalUpdates(value: unknown): EvolutionGoalUpdate[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw validationError();
  return value.map((raw: unknown) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    if (
      typeof item.goalId !== "string" ||
      !GOAL_STATUSES.includes(item.status as GoalStatus)
    )
      throw validationError();
    return { goalId: item.goalId, status: item.status as GoalStatus };
  });
}

function withIds(
  evolutionId: string,
  criteria: EvolutionCriterionInput[],
): EvolutionCriterion[] {
  return criteria.map((criterion, index) => ({
    id: `${evolutionId}-criterion-${index + 1}`,
    ...criterion,
  }));
}

// ---- Plano e metas --------------------------------------------------------

function ownPlan(planId: string, studentId: string): Plan {
  const plan = mockPlans.find((item) => item.id === planId);
  // EV-05 (G-57): só PE do mesmo paciente; inexistente, PDI, de outro paciente
  // ou de outro educador é inválido.
  if (
    !plan ||
    plan.type !== "PE" ||
    plan.studentId !== studentId ||
    plan.educatorId !== MOCK_EDUCATOR.id
  )
    throw new MockApiError(400, "INVALID_PLAN");
  return plan;
}

function assertGoalsInPlan(plan: Plan | undefined, goalIds: string[]): void {
  if (goalIds.length === 0) return;
  if (!plan) throw validationError();
  if (goalIds.some((id) => !plan.goals.some((goal) => goal.id === id)))
    throw new MockApiError(400, "GOAL_NOT_IN_PLAN");
}

function changedGoalUpdates(
  plan: Plan,
  updates: EvolutionGoalUpdate[],
): EvolutionGoalUpdate[] {
  return updates.filter(
    (update) =>
      plan.goals.find((goal) => goal.id === update.goalId)?.status !==
      update.status,
  );
}

/** Muda as metas no próprio plano do mock (PL-06, PL-08), recalculando o progresso. */
function applyGoalUpdates(plan: Plan, updates: EvolutionGoalUpdate[]): void {
  if (updates.length === 0) return;
  const now = new Date().toISOString();
  plan.goals = plan.goals.map((goal) => {
    const update = updates.find((item) => item.goalId === goal.id);
    if (!update) return goal;
    const { achievedAt: _achievedAt, ...rest } = goal;
    return {
      ...rest,
      status: update.status,
      ...(update.status === "ACHIEVED" ? { achievedAt: now } : {}),
      updatedAt: now,
    };
  });
  plan.progress = computeMockProgress(plan.goals);
  plan.updatedAt = now;
}

/** EV-12 (G-57): PE ativo do atendimento; senão PE ativo da data; senão nenhum. */
function choosePlan(session: TaskNotebookSession): Plan | undefined {
  const pes = mockPlans.filter(
    (plan) =>
      plan.type === "PE" &&
      plan.status === "ACTIVE" &&
      plan.studentId === session.studentId &&
      plan.educatorId === MOCK_EDUCATOR.id,
  );

  return (
    (session.appointmentId
      ? pes.find((plan) => plan.appointmentId === session.appointmentId)
      : undefined) ??
    pes.find((plan) => plan.sessionDate === sessionDay(session))
  );
}

// ---- Evolução --------------------------------------------------------------

export const mockEvolutions: SessionEvolution[] = [
  {
    id: MOCK_EVOLUTION_ID,
    sessionId: "mock-session-2",
    studentId: "student-1",
    educatorId: MOCK_EDUCATOR.id,
    sessionDate: "2026-10-03",
    durationMinutes: 20,
    criteria: [
      {
        id: `${MOCK_EVOLUTION_ID}-criterion-1`,
        description: "Escrever frases com letra maiúscula",
        attempts: 10,
        successes: 8,
        result: "ACHIEVED",
        note: "Lembrou da maiúscula sem ajuda.",
      },
      {
        id: `${MOCK_EVOLUTION_ID}-criterion-2`,
        description: "Manter a atenção na leitura",
        result: "PARTIAL",
      },
    ],
    descriptiveRecord: "Participou com interesse e pediu para continuar.",
    nextSessionSuggestion:
      "Retomar a leitura de frases curtas com apoio visual.",
    goalUpdates: [],
    createdAt: "2026-10-03T14:00:00.000Z",
    updatedAt: "2026-10-03T14:00:00.000Z",
  },
  {
    id: MOCK_FOREIGN_EVOLUTION_ID,
    sessionId: MOCK_EVOLUTION_SESSION_FOREIGN,
    studentId: MOCK_FOREIGN_STUDENT_ID,
    educatorId: FOREIGN_EDUCATOR_ID,
    sessionDate: "2026-10-20",
    durationMinutes: 30,
    criteria: [],
    descriptiveRecord: "Registro de outro educador, não acessível.",
    goalUpdates: [],
    createdAt: "2026-10-20T14:00:00.000Z",
    updatedAt: "2026-10-20T14:00:00.000Z",
  },
];

// Cópias das sementes e do estado que este handler muta (evoluções, planos, sessões
// deste arquivo e a observação das sessões), para `resetMockEvolutionState()`.
const seedEvolutions = structuredClone(mockEvolutions);
const seedPlans = structuredClone(mockPlans);
const seedExtraSessions = structuredClone(extraSessions);
const observationBackups = new Map<
  TaskNotebookSession,
  TaskNotebookSession["observation"]
>();

/**
 * Restaura as evoluções, os planos e as sessões fictícias ao estado inicial
 * (uso em testes e cenários manuais). Planos criados depois do carregamento
 * saem de `mockPlans`; as metas e o progresso dos planos semente voltam.
 */
export function resetMockEvolutionState(): void {
  for (const [session, observation] of observationBackups) {
    session.observation = observation;
  }
  observationBackups.clear();
  extraSessions.splice(
    0,
    extraSessions.length,
    ...structuredClone(seedExtraSessions),
  );
  mockEvolutions.splice(
    0,
    mockEvolutions.length,
    ...structuredClone(seedEvolutions),
  );
  const seedIds = new Set(seedPlans.map((plan) => plan.id));
  for (let index = mockPlans.length - 1; index >= 0; index -= 1) {
    if (!seedIds.has(mockPlans[index]!.id)) mockPlans.splice(index, 1);
  }
  for (const seed of seedPlans) {
    const fresh = structuredClone(seed);
    const live = mockPlans.find((plan) => plan.id === seed.id);
    if (!live) {
      mockPlans.push(fresh);
      continue;
    }
    for (const key of Object.keys(live)) {
      if (!(key in fresh))
        delete (live as unknown as Record<string, unknown>)[key];
    }
    Object.assign(live, fresh);
  }
}

function ownEvolution(id: string): SessionEvolution {
  const evolution = mockEvolutions.find((item) => item.id === id);
  if (!evolution) throw new MockApiError(404, "EVOLUTION_NOT_FOUND");
  if (evolution.educatorId !== MOCK_EDUCATOR.id)
    throw new MockApiError(403, "UNAUTHORIZED");
  return evolution;
}

function toSummary(evolution: SessionEvolution): SessionEvolutionSummary {
  return {
    id: evolution.id,
    sessionId: evolution.sessionId,
    studentId: evolution.studentId,
    studentName: studentName(evolution.studentId),
    sessionDate: evolution.sessionDate,
    ...(evolution.planTitle ? { planTitle: evolution.planTitle } : {}),
    criteriaCount: evolution.criteria.length,
    achievedCount: evolution.criteria.filter((c) => c.result === "ACHIEVED")
      .length,
    excerpt: evolution.descriptiveRecord.slice(0, 200),
    createdAt: evolution.createdAt,
  };
}

registerMockHandler(
  { method: "get", path: "/session-evolution/context/:sessionId" },
  async ({ params }) => {
    const session = await findFinishedOwnSession(params.sessionId);
    const plan = choosePlan(session);
    const existing = mockEvolutions.find(
      (item) => item.sessionId === session.id,
    );
    const context: EvolutionContext = {
      session: {
        id: session.id,
        studentId: session.studentId,
        studentName: studentName(session.studentId),
        name: session.name,
        startedAt: session.startedAt,
        finishedAt: session.finishedAt,
        durationMinutes: durationMinutes(session),
        ...(session.appointmentId
          ? { appointmentId: session.appointmentId }
          : {}),
        answeredCount: session.answers.length,
        correctCount: session.answers.filter((answer) => answer.isCorrect)
          .length,
      },
      ...(plan
        ? { plan: { id: plan.id, type: "PE" as const, title: plan.title } }
        : {}),
      suggestedCriteria: (plan?.goals ?? [])
        .filter(
          (goal) =>
            goal.status === "NOT_STARTED" || goal.status === "IN_PROGRESS",
        )
        .map((goal) => ({
          goalId: goal.id,
          description: goal.description,
          ...(goal.successCriterion
            ? { successCriterion: goal.successCriterion }
            : {}),
          goalStatus: goal.status,
        })),
      ...(existing ? { existingEvolutionId: existing.id } : {}),
    };

    return { status: 200, data: context };
  },
);

registerMockHandler(
  { method: "post", path: "/session-evolution/" },
  async ({ body }) => {
    const input = (body ?? {}) as Record<string, unknown>;
    if (typeof input.sessionId !== "string" || !input.sessionId)
      throw validationError();
    if (
      typeof input.descriptiveRecord !== "string" ||
      !input.descriptiveRecord.trim() ||
      input.descriptiveRecord.length > 5000 ||
      (input.planId !== undefined && typeof input.planId !== "string")
    )
      throw validationError();
    const nextSessionSuggestion = optionalText(
      input.nextSessionSuggestion,
      2000,
    );
    const criteria = parseCriteria(input.criteria ?? []);
    const goalUpdates = parseGoalUpdates(input.goalUpdates);

    const session = await findFinishedOwnSession(input.sessionId);
    const existing = mockEvolutions.find(
      (item) => item.sessionId === session.id,
    );
    if (existing) {
      // EV-02: o `evolutionId` extra viaja como resposta 409 (ver README dos mocks).
      return {
        status: 409,
        data: { message: "EVOLUTION_ALREADY_EXISTS", evolutionId: existing.id },
      };
    }

    const plan =
      input.planId === undefined
        ? undefined
        : ownPlan(input.planId as string, session.studentId);
    if (plan && plan.status !== "ACTIVE")
      throw new MockApiError(409, "PLAN_NOT_EDITABLE");
    assertGoalsInPlan(plan, [
      ...criteria.flatMap((c) => (c.goalId ? [c.goalId] : [])),
      ...goalUpdates.map((update) => update.goalId),
    ]);

    // Tudo validado: a partir daqui nada falha, então a gravação é atômica (EV-07).
    if (plan) applyGoalUpdates(plan, changedGoalUpdates(plan, goalUpdates));
    const now = new Date().toISOString();
    const id = `mock-evolution-${Date.now()}-${mockEvolutions.length}`;
    const evolution: SessionEvolution = {
      id,
      sessionId: session.id,
      studentId: session.studentId,
      educatorId: MOCK_EDUCATOR.id,
      ...(session.appointmentId
        ? { appointmentId: session.appointmentId }
        : {}),
      ...(plan
        ? {
            planId: plan.id,
            planType: "PE" as const,
            planTitle: `PE · ${plan.title}`,
          }
        : {}),
      sessionDate: sessionDay(session),
      durationMinutes: durationMinutes(session),
      criteria: withIds(id, criteria),
      descriptiveRecord: input.descriptiveRecord,
      ...(nextSessionSuggestion ? { nextSessionSuggestion } : {}),
      goalUpdates,
      createdAt: now,
      updatedAt: now,
    };
    mockEvolutions.push(evolution);
    // EV-08: o registro também vira a observação da sessão (e o relatório a lê, ver abaixo).
    if (!observationBackups.has(session))
      observationBackups.set(session, session.observation);
    session.observation = evolution.descriptiveRecord;

    return { status: 201, data: evolution };
  },
);

registerMockHandler(
  { method: "get", path: "/session-evolution/" },
  ({ params }) => {
    const { studentId, from, to, limit } = params;
    if (
      (from !== undefined && !isDay(from)) ||
      (to !== undefined && !isDay(to)) ||
      (from !== undefined && to !== undefined && from > to) ||
      (limit !== undefined &&
        (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100))
    )
      throw validationError();
    if (studentId === MOCK_FOREIGN_STUDENT_ID)
      throw new MockApiError(403, "UNAUTHORIZED");

    const list = mockEvolutions
      .filter(
        (item) =>
          item.educatorId === MOCK_EDUCATOR.id &&
          (studentId === undefined || item.studentId === studentId) &&
          (from === undefined || item.sessionDate >= from) &&
          (to === undefined || item.sessionDate <= to),
      )
      .sort(
        (a, b) =>
          b.sessionDate.localeCompare(a.sessionDate) ||
          b.createdAt.localeCompare(a.createdAt),
      )
      .slice(0, limit === undefined ? 50 : Number(limit))
      .map(toSummary);

    return { status: 200, data: list };
  },
);

registerMockHandler(
  { method: "get", path: "/session-evolution/pending" },
  async ({ params }) => {
    const { days } = params;
    if (
      days !== undefined &&
      (!/^\d+$/.test(days) || Number(days) < 1 || Number(days) > 90)
    )
      throw validationError();
    const since =
      Date.now() - (days === undefined ? 30 : Number(days)) * DAY_MS;

    const pending = (await listSessions())
      .filter(
        (session) =>
          session.educatorId === MOCK_EDUCATOR.id &&
          session.finishedAt &&
          new Date(session.finishedAt).getTime() >= since &&
          !mockEvolutions.some((item) => item.sessionId === session.id),
      )
      .sort((a, b) => b.finishedAt!.localeCompare(a.finishedAt!))
      .map((session): PendingEvolution => ({
        sessionId: session.id,
        studentId: session.studentId,
        studentName: studentName(session.studentId),
        sessionName: session.name,
        finishedAt: session.finishedAt!,
        ...(session.appointmentId
          ? { appointmentId: session.appointmentId }
          : {}),
      }));

    return { status: 200, data: pending };
  },
);

registerMockHandler(
  { method: "get", path: "/session-evolution/:id" },
  ({ params }) => ({ status: 200, data: ownEvolution(params.id) }),
);

registerMockHandler(
  { method: "put", path: "/session-evolution/:id" },
  ({ params, body }) => {
    const evolution = ownEvolution(params.id);
    const input = (body ?? {}) as Record<string, unknown>;
    if (
      input.descriptiveRecord !== undefined &&
      (typeof input.descriptiveRecord !== "string" ||
        !input.descriptiveRecord.trim() ||
        input.descriptiveRecord.length > 5000)
    )
      throw validationError();
    const nextSessionSuggestion = optionalText(
      input.nextSessionSuggestion,
      2000,
    );
    const criteria =
      input.criteria === undefined ? undefined : parseCriteria(input.criteria);
    const goalUpdates = parseGoalUpdates(input.goalUpdates);
    // O corpo do PUT não troca o plano; se `planId` vier, vale a regra do EV-05 (só PE).
    if (input.planId !== undefined) {
      if (typeof input.planId !== "string") throw validationError();
      ownPlan(input.planId, evolution.studentId);
    }
    const plan = evolution.planId
      ? mockPlans.find((item) => item.id === evolution.planId)
      : undefined;

    assertGoalsInPlan(plan, [
      ...(criteria ?? []).flatMap((c) => (c.goalId ? [c.goalId] : [])),
      ...goalUpdates.map((update) => update.goalId),
    ]);
    // EV-09: na edição, `goalUpdates` aplica só a diferença.
    const changed = plan ? changedGoalUpdates(plan, goalUpdates) : [];
    if (plan && changed.length > 0 && plan.status !== "ACTIVE")
      throw new MockApiError(409, "PLAN_NOT_EDITABLE");

    if (plan) applyGoalUpdates(plan, changed);
    if (criteria) evolution.criteria = withIds(evolution.id, criteria);
    if (input.descriptiveRecord !== undefined)
      evolution.descriptiveRecord = input.descriptiveRecord as string;
    if (nextSessionSuggestion !== undefined) {
      if (nextSessionSuggestion) {
        evolution.nextSessionSuggestion = nextSessionSuggestion;
      } else {
        delete evolution.nextSessionSuggestion;
      }
    }
    evolution.goalUpdates = [
      ...evolution.goalUpdates.filter(
        (old) => !goalUpdates.some((update) => update.goalId === old.goalId),
      ),
      ...goalUpdates,
    ];
    evolution.updatedAt = new Date().toISOString();

    return { status: 200, data: evolution };
  },
);

registerMockHandler(
  { method: "post", path: "/session-evolution/next-session-suggestion" },
  async ({ body }) => {
    const input = (body ?? {}) as Record<string, unknown>;
    if (typeof input.sessionId !== "string" || !input.sessionId)
      throw validationError();
    const record = optionalText(input.descriptiveRecord, 5000) ?? "";
    const criteria =
      input.criteria === undefined ? [] : parseCriteria(input.criteria);
    const session = await findFinishedOwnSession(input.sessionId);

    if (record.includes("[AI_GENERATION_FAILED]"))
      throw new MockApiError(500, "AI_GENERATION_FAILED");
    if (record.includes("[AI_INVALID_OUTPUT]"))
      throw new MockApiError(500, "AI_INVALID_OUTPUT");

    const achieved = criteria.filter((c) => c.result === "ACHIEVED").length;
    const open = criteria.filter(
      (c) => c.result === "PARTIAL" || c.result === "NOT_ACHIEVED",
    ).length;
    const data: NextSessionSuggestion = {
      suggestion:
        open > 0
          ? "Retomar os critérios que ficaram parciais ou não atingidos com apoio visual e atividades curtas, e propor um desafio um pouco maior nos critérios já atingidos."
          : "Manter a sequência da sessão e propor uma variação um pouco mais desafiadora nos critérios já atingidos.",
      rationale: `Baseada em ${criteria.length} critérios marcados (${achieved} atingidos) e em ${session.answers.length} respostas da sessão. É uma sugestão para o profissional revisar.`,
    };

    return { status: 200, data };
  },
);

// EV-08: o relatório da sessão mostra o registro descritivo salvo. O handler de
// `session-report.ts` só conhece duas sessões fixas, então este o envolve: a
// observação vem da evolução e, para sessões criadas pelo fluxo do app, o
// relatório é montado das respostas da sessão.
const reportHandler = getMockHandler(
  "get",
  "/task-notebook-session/report/:sessionId",
);

registerMockHandler(
  { method: "get", path: "/task-notebook-session/report/:sessionId" },
  async (context) => {
    const evolution = mockEvolutions.find(
      (item) => item.sessionId === context.params.sessionId,
    );
    try {
      const result = reportHandler ? await reportHandler(context) : undefined;
      if (!result) throw new MockApiError(404, "SESSION_NOT_FOUND");
      if (!evolution) return result;

      return {
        ...result,
        data: {
          ...(result.data as SessionReport),
          observation: evolution.descriptiveRecord,
        },
      };
    } catch (error) {
      if (!(error instanceof MockApiError) || error.status !== 404) throw error;
      const session = (await listSessions()).find(
        (item) => item.id === context.params.sessionId,
      );
      if (!session?.finishedAt) throw error;

      const report: SessionReport = {
        sessionName: session.name,
        totalTimeSession:
          durationMinutes({
            startedAt: session.startedAt,
            finishedAt: session.finishedAt,
          }) * 60,
        totalQuestions: session.answers.length,
        averageTimePerQuestion: 0,
        averageCorrectTime: null,
        averageIncorrectTime: null,
        percentageByCategory: {},
        percentageByType: {},
        observation:
          evolution?.descriptiveRecord ?? session.observation ?? null,
      };
      return { status: 200, data: report };
    }
  },
);
