// Escalas (API-05, leva 2): leituras e escritas. Contrato PROVISÓRIO de
// docs/entrega-4/ESPECIFICACAO-BACKEND.md §4, a conferir em API-04. Estado só em
// memória; dados fictícios.
//
// A ESCALA ABAIXO É FICTÍCIA: itens, opções e faixas de corte foram inventados
// só para exercitar o contrato. O instrumento real é escolhido pelo responsável
// clínico (G-55) e vem do seed do backend; nada aqui reproduz instrumento publicado.
import type {
  ScaleAnswer,
  ScaleApplication,
  ScaleApplicationSummary,
  ScaleBand,
  ScaleBandResult,
  ScaleScore,
  ScaleTemplate,
  ScaleTemplateSummary,
} from "@/api/types";
import { MOCK_EDUCATOR, MOCK_STUDENTS } from "@/mocks/fixtures";
import { MOCK_FOREIGN_STUDENT_ID } from "./plans";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

export const MOCK_SCALE_TEMPLATE_ID = "mock-scale-1";
/** Escala `active: false`: iniciar aplicação responde `409 SCALE_INACTIVE`. */
export const MOCK_SCALE_INACTIVE_TEMPLATE_ID = "mock-scale-inactive";
/** Aplicação `COMPLETED` de `student-1`, gravada na versão 1 (AV-02). */
export const MOCK_SCALE_APPLICATION_COMPLETED_ID = "mock-scale-app-completed";
/** Rascunho de `student-2` com 3 de 6 itens respondidos. */
export const MOCK_SCALE_APPLICATION_DRAFT_ID = "mock-scale-app-draft";
/** Aplicação de outro educador: tudo responde `403 UNAUTHORIZED`. */
export const MOCK_SCALE_APPLICATION_FOREIGN_ID = "mock-scale-app-foreign";

const FOREIGN_EDUCATOR_ID = "mock-educator-2";
const DISCLAIMER = "O resultado não substitui avaliação clínica completa.";

function buildTemplate(
  id: string,
  version: number,
  active: boolean,
): ScaleTemplate {
  // v1 e v2 diferem só nas faixas do escore total: o mesmo conjunto de respostas
  // cai em faixas diferentes (testa AV-02/BE-AV-06).
  const totalBands: ScaleBand[] =
    version === 1
      ? [
          { min: 0, max: 6, label: "Indicativo baixo", severity: "LOW" },
          {
            min: 7,
            max: 12,
            label: "Indicativo moderado",
            severity: "MODERATE",
          },
          { min: 13, max: 18, label: "Indicativo alto", severity: "HIGH" },
        ]
      : [
          { min: 0, max: 5, label: "Indicativo baixo", severity: "LOW" },
          {
            min: 6,
            max: 11,
            label: "Indicativo moderado",
            severity: "MODERATE",
          },
          { min: 12, max: 18, label: "Indicativo alto", severity: "HIGH" },
        ];
  const subscaleBands: ScaleBand[] = ["ATEN", "COMP"].flatMap(
    (subscaleCode): ScaleBand[] => [
      { subscaleCode, min: 0, max: 3, label: "Baixo", severity: "LOW" },
      { subscaleCode, min: 4, max: 6, label: "Moderado", severity: "MODERATE" },
      { subscaleCode, min: 7, max: 9, label: "Alto", severity: "HIGH" },
    ],
  );

  return {
    id,
    code: id === MOCK_SCALE_TEMPLATE_ID ? "ESCALA-FICTICIA" : "ESCALA-INATIVA",
    version,
    name:
      id === MOCK_SCALE_TEMPLATE_ID
        ? "Escala fictícia de exemplo"
        : "Escala fictícia inativa",
    description:
      "Escala inventada para testes do app, sem relação com instrumento publicado.",
    instructions:
      "Marque a opção que melhor descreve a frequência de cada situação nas últimas semanas.",
    respondent: "PROFESSIONAL",
    ageRange: { min: 6, max: 14 },
    estimatedMinutes: 5,
    options: [
      { value: 0, label: "Nunca" },
      { value: 1, label: "Às vezes" },
      { value: 2, label: "Frequentemente" },
      { value: 3, label: "Muito" },
    ],
    items: [1, 2, 3, 4, 5, 6].map((order) => ({
      id: `${id}-item-${order}`,
      order,
      text: `Item de exemplo ${order}`,
      subscaleCode: order <= 3 ? "ATEN" : "COMP",
    })),
    subscales: [
      { code: "ATEN", name: "Subescala A (exemplo)" },
      { code: "COMP", name: "Subescala B (exemplo)" },
    ],
    scoring: { method: "SUM", bands: [...totalBands, ...subscaleBands] },
    disclaimer: DISCLAIMER,
    reference:
      "Escala fictícia criada para os mocks do app. Sem fonte clínica.",
    active,
  };
}

const versionKey = (templateId: string, version: number): string =>
  `${templateId}@${version}`;

/** Todas as versões gravadas; a aplicação lê sempre a sua (AV-02). */
const templateVersions = new Map<string, ScaleTemplate>(
  [
    buildTemplate(MOCK_SCALE_TEMPLATE_ID, 1, true),
    buildTemplate(MOCK_SCALE_TEMPLATE_ID, 2, true),
    buildTemplate(MOCK_SCALE_INACTIVE_TEMPLATE_ID, 2, false),
  ].map((template) => [versionKey(template.id, template.version), template]),
);

/** Versão corrente (a maior) de cada escala do catálogo. */
function currentTemplates(): ScaleTemplate[] {
  const latest = new Map<string, ScaleTemplate>();
  for (const template of templateVersions.values()) {
    const found = latest.get(template.id);
    if (!found || found.version < template.version)
      latest.set(template.id, template);
  }
  return [...latest.values()];
}

function bandFor(
  template: ScaleTemplate,
  subscaleCode: string | undefined,
  value: number,
): ScaleBandResult | undefined {
  const band = template.scoring.bands.find(
    (item) =>
      item.subscaleCode === subscaleCode &&
      value >= item.min &&
      value <= item.max,
  );
  return band ? { label: band.label, severity: band.severity } : undefined;
}

function aggregate(method: "SUM" | "MEAN", values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((total, value) => total + value, 0);
  return method === "SUM" ? sum : Math.round((sum / values.length) * 100) / 100;
}

/** AV-05/AV-06: o escore, a faixa e as subescalas nascem aqui, nunca no app. */
export function computeMockScaleScore(
  template: ScaleTemplate,
  answers: ScaleAnswer[],
): ScaleScore {
  const method = template.scoring.method;
  const optionMax = Math.max(...template.options.map((o) => o.value));
  const valueOf = (itemId: string): number | undefined =>
    answers.find((answer) => answer.itemId === itemId)?.value;
  const answeredItems = template.items.filter(
    (item) => valueOf(item.id) !== undefined,
  );
  const total = aggregate(
    method,
    answeredItems.map((item) => valueOf(item.id)!),
  );

  return {
    partial: answeredItems.length < template.items.length,
    answered: answeredItems.length,
    total: template.items.length,
    value: total,
    max: method === "SUM" ? template.items.length * optionMax : optionMax,
    ...(answeredItems.length > 0
      ? (() => {
          const band = bandFor(template, undefined, total);
          return band ? { band } : {};
        })()
      : {}),
    subscales: template.subscales.map((subscale) => {
      const items = template.items.filter(
        (item) => item.subscaleCode === subscale.code,
      );
      const answered = items.filter((item) => valueOf(item.id) !== undefined);
      const value = aggregate(
        method,
        answered.map((item) => valueOf(item.id)!),
      );
      const band =
        answered.length > 0
          ? bandFor(template, subscale.code, value)
          : undefined;
      return {
        code: subscale.code,
        name: subscale.name,
        answered: answered.length,
        total: items.length,
        value,
        max: method === "SUM" ? items.length * optionMax : optionMax,
        ...(band ? { band } : {}),
      };
    }),
  };
}

function studentName(studentId: string): string {
  if (studentId === MOCK_FOREIGN_STUDENT_ID) return "Paciente Teste Alheio";
  return (
    MOCK_STUDENTS.find((student) => student.id === studentId)?.name ??
    "Paciente Teste"
  );
}

function templateOf(application: ScaleApplication): ScaleTemplate {
  const template = templateVersions.get(
    versionKey(application.templateId, application.templateVersion),
  );
  if (!template) throw new MockApiError(404, "SCALE_NOT_FOUND");
  return template;
}

function seedApplication(
  id: string,
  studentId: string,
  educatorId: string,
  version: number,
  answers: number[],
  completed: boolean,
  startedAt: string,
): ScaleApplication {
  const template = templateVersions.get(
    versionKey(MOCK_SCALE_TEMPLATE_ID, version),
  )!;
  const scaleAnswers = answers.map((value, index) => ({
    itemId: template.items[index]!.id,
    value,
  }));
  const updatedAt = new Date(
    new Date(startedAt).getTime() + 10 * 60_000,
  ).toISOString();
  return {
    id,
    templateId: template.id,
    templateCode: template.code,
    templateVersion: version,
    templateName: template.name,
    studentId,
    studentName: studentName(studentId),
    educatorId,
    status: completed ? "COMPLETED" : "DRAFT",
    answers: scaleAnswers,
    score: computeMockScaleScore(template, scaleAnswers),
    disclaimer: DISCLAIMER,
    startedAt,
    updatedAt,
    ...(completed ? { completedAt: updatedAt } : {}),
  };
}

const mockApplications: ScaleApplication[] = [
  seedApplication(
    MOCK_SCALE_APPLICATION_COMPLETED_ID,
    "student-1",
    MOCK_EDUCATOR.id,
    1,
    [2, 2, 2, 2, 2, 2],
    true,
    "2026-10-20T14:00:00.000Z",
  ),
  seedApplication(
    MOCK_SCALE_APPLICATION_DRAFT_ID,
    "student-2",
    MOCK_EDUCATOR.id,
    2,
    [3, 2, 1],
    false,
    "2026-11-05T14:00:00.000Z",
  ),
  seedApplication(
    MOCK_SCALE_APPLICATION_FOREIGN_ID,
    MOCK_FOREIGN_STUDENT_ID,
    FOREIGN_EDUCATOR_ID,
    2,
    [1],
    false,
    "2026-11-01T14:00:00.000Z",
  ),
];

const seedApplications = structuredClone(mockApplications);
let aiFailure: "AI_GENERATION_FAILED" | "AI_INVALID_OUTPUT" | null = null;
let nextApplicationNumber = 1;

/**
 * Restaura as aplicações semente e desliga a falha simulada de IA (uso em
 * testes e cenários manuais). O catálogo é somente leitura e não muda.
 */
export function resetMockScaleState(): void {
  mockApplications.splice(
    0,
    mockApplications.length,
    ...structuredClone(seedApplications),
  );
  aiFailure = null;
  nextApplicationNumber = 1;
}

/** Faz o próximo `POST /scale-application/:id/insight` falhar (`null` desliga). */
export function setMockScaleAiFailure(
  code: "AI_GENERATION_FAILED" | "AI_INVALID_OUTPUT" | null,
): void {
  aiFailure = code;
}

function validationError(): MockApiError {
  return new MockApiError(400, "Validation error");
}

function ownApplication(id: string): ScaleApplication {
  const application = mockApplications.find((item) => item.id === id);
  if (!application) throw new MockApiError(404, "APPLICATION_NOT_FOUND");
  if (application.educatorId !== MOCK_EDUCATOR.id)
    throw new MockApiError(403, "UNAUTHORIZED");
  return application;
}

function editableApplication(id: string): ScaleApplication {
  const application = ownApplication(id);
  if (application.status !== "DRAFT")
    throw new MockApiError(409, "APPLICATION_NOT_EDITABLE");
  return application;
}

function toSummary(application: ScaleApplication): ScaleApplicationSummary {
  const { answers: _answers, ...summary } = application;
  return structuredClone(summary);
}

function rescore(application: ScaleApplication): void {
  application.score = computeMockScaleScore(
    templateOf(application),
    application.answers,
  );
  application.updatedAt = new Date().toISOString();
}

function toTemplateSummary(template: ScaleTemplate): ScaleTemplateSummary {
  return {
    id: template.id,
    code: template.code,
    version: template.version,
    name: template.name,
    description: template.description,
    respondent: template.respondent,
    ...(template.ageRange ? { ageRange: { ...template.ageRange } } : {}),
    estimatedMinutes: template.estimatedMinutes,
    itemCount: template.items.length,
  };
}

registerMockHandler({ method: "get", path: "/scale-template/" }, () => ({
  status: 200,
  // Só as ativas (a maior versão de cada uma), como o backend publicado.
  data: currentTemplates()
    .filter((template) => template.active)
    .map(toTemplateSummary),
}));

registerMockHandler(
  { method: "get", path: "/scale-template/:id" },
  ({ params }) => {
    const template = currentTemplates().find((item) => item.id === params.id);
    if (!template) throw new MockApiError(404, "SCALE_NOT_FOUND");
    return { status: 200, data: structuredClone(template) };
  },
);

registerMockHandler(
  { method: "post", path: "/scale-application/" },
  ({ body }) => {
    const input = (body ?? {}) as Record<string, unknown>;
    if (
      typeof input.studentId !== "string" ||
      !input.studentId ||
      typeof input.templateId !== "string" ||
      !input.templateId ||
      (input.appointmentId !== undefined &&
        (typeof input.appointmentId !== "string" || !input.appointmentId))
    )
      throw validationError();

    if (input.studentId === MOCK_FOREIGN_STUDENT_ID)
      throw new MockApiError(403, "UNAUTHORIZED");
    const student = MOCK_STUDENTS.find((item) => item.id === input.studentId);
    if (!student) throw new MockApiError(404, "STUDENT_NOT_FOUND");
    if (student.educatorId !== MOCK_EDUCATOR.id)
      throw new MockApiError(403, "UNAUTHORIZED");

    const template = currentTemplates().find(
      (item) => item.id === input.templateId,
    );
    if (!template) throw new MockApiError(404, "SCALE_NOT_FOUND");
    if (!template.active) throw new MockApiError(409, "SCALE_INACTIVE");

    const draft = mockApplications.find(
      (item) =>
        item.studentId === student.id &&
        item.templateId === template.id &&
        item.status === "DRAFT" &&
        item.educatorId === MOCK_EDUCATOR.id,
    );
    if (draft) {
      // AV-03: o `applicationId` extra viaja como resposta 409 (ver README dos mocks).
      return {
        status: 409,
        data: { message: "DRAFT_ALREADY_EXISTS", applicationId: draft.id },
      };
    }

    const now = new Date().toISOString();
    const application: ScaleApplication = {
      id: `mock-scale-app-${Date.now()}-${nextApplicationNumber++}`,
      templateId: template.id,
      templateCode: template.code,
      templateVersion: template.version,
      templateName: template.name,
      studentId: student.id,
      studentName: student.name,
      educatorId: MOCK_EDUCATOR.id,
      ...(typeof input.appointmentId === "string"
        ? { appointmentId: input.appointmentId }
        : {}),
      status: "DRAFT",
      answers: [],
      score: computeMockScaleScore(template, []),
      disclaimer: template.disclaimer,
      startedAt: now,
      updatedAt: now,
    };
    mockApplications.push(application);

    return { status: 201, data: structuredClone(application) };
  },
);

registerMockHandler(
  { method: "get", path: "/scale-application/" },
  ({ params }) => {
    const { studentId, status, limit } = params;
    if (status !== undefined && status !== "DRAFT" && status !== "COMPLETED")
      throw validationError();
    if (
      limit !== undefined &&
      (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100)
    )
      throw validationError();
    if (studentId !== undefined) {
      const student = MOCK_STUDENTS.find((item) => item.id === studentId);
      if (
        studentId === MOCK_FOREIGN_STUDENT_ID ||
        (student && student.educatorId !== MOCK_EDUCATOR.id)
      )
        throw new MockApiError(403, "UNAUTHORIZED");
    }

    const list = mockApplications
      .filter(
        (item) =>
          item.educatorId === MOCK_EDUCATOR.id &&
          (studentId === undefined || item.studentId === studentId) &&
          (status === undefined || item.status === status),
      )
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit === undefined ? 50 : Number(limit))
      .map(toSummary);

    return { status: 200, data: list };
  },
);

registerMockHandler(
  { method: "get", path: "/scale-application/:id" },
  ({ params }) => ({
    status: 200,
    data: structuredClone(ownApplication(params.id)),
  }),
);

registerMockHandler(
  { method: "put", path: "/scale-application/:id/answers" },
  ({ params, body }) => {
    const application = editableApplication(params.id);
    const input = (body ?? {}) as Record<string, unknown>;
    if (!Array.isArray(input.answers) || input.answers.length === 0)
      throw validationError();
    const template = templateOf(application);
    const answers = input.answers as unknown[];
    for (const answer of answers) {
      const item = (answer ?? {}) as Record<string, unknown>;
      if (
        typeof item.itemId !== "string" ||
        typeof item.value !== "number" ||
        !Number.isInteger(item.value)
      )
        throw validationError();
    }
    const typed = answers as ScaleAnswer[];
    // Valida tudo antes de gravar: a gravação é atômica.
    if (typed.some((a) => !template.items.some((item) => item.id === a.itemId)))
      throw new MockApiError(400, "ITEM_NOT_IN_SCALE");
    if (typed.some((a) => !template.options.some((o) => o.value === a.value)))
      throw new MockApiError(400, "INVALID_ANSWER_VALUE");

    // AV-04: upsert por `itemId`; o último valor do mesmo item na requisição vale.
    for (const answer of typed) {
      const existing = application.answers.find(
        (a) => a.itemId === answer.itemId,
      );
      if (existing) existing.value = answer.value;
      else
        application.answers.push({
          itemId: answer.itemId,
          value: answer.value,
        });
    }
    rescore(application);

    return { status: 200, data: structuredClone(application) };
  },
);

registerMockHandler(
  { method: "post", path: "/scale-application/:id/complete" },
  ({ params }) => {
    const application = editableApplication(params.id);
    const template = templateOf(application);
    const missingItemIds = template.items
      .filter((item) => !application.answers.some((a) => a.itemId === item.id))
      .map((item) => item.id);
    if (missingItemIds.length > 0) {
      // AV-07: `missingItemIds` extra viaja como resposta 400 (ver README dos mocks).
      return {
        status: 400,
        data: { message: "SCALE_INCOMPLETE", missingItemIds },
      };
    }

    rescore(application);
    application.status = "COMPLETED";
    application.completedAt = application.updatedAt;

    return { status: 200, data: structuredClone(application) };
  },
);

registerMockHandler(
  { method: "post", path: "/scale-application/:id/insight" },
  ({ params }) => {
    const application = ownApplication(params.id);
    if (application.answers.length === 0)
      throw new MockApiError(400, "NO_ANSWERS_YET");
    if (aiFailure) throw new MockApiError(500, aiFailure);

    const { score } = application;
    const bandLabel = score.band?.label ?? "sem faixa definida";
    const subscales = score.subscales
      .map(
        (s) =>
          `${s.name}: ${s.value} de ${s.max}${s.band ? ` (${s.band.label})` : ""}`,
      )
      .join("; ");
    const draft = application.status === "DRAFT";
    const now = new Date().toISOString();
    application.insight = {
      text: [
        `${draft ? "Resultado parcial" : "Resultado"}: ${score.value} de ${score.max} pontos, faixa "${bandLabel}".`,
        subscales ? `Por subescala, ${subscales}.` : "",
        "Isto descreve o que o escore indica, sem diagnóstico. Vale observar em quais situações as respostas mais altas aparecem e aprofundar na conversa com a família e a escola.",
      ]
        .filter(Boolean)
        .join(" ")
        .slice(0, 800),
      generatedAt: now,
      preliminary: draft,
    };
    application.updatedAt = now;

    return { status: 200, data: structuredClone(application) };
  },
);

registerMockHandler(
  { method: "delete", path: "/scale-application/:id" },
  ({ params }) => {
    const application = editableApplication(params.id);
    mockApplications.splice(mockApplications.indexOf(application), 1);

    return { status: 204, data: undefined };
  },
);
