// Relatórios (API-05, leva 3): leituras e escritas. Contrato PROVISÓRIO de
// docs/entrega-4/ESPECIFICACAO-BACKEND.md §6, a conferir em API-04. Estado só em
// memória; dados fictícios. O backend devolve o conteúdo e o app gera o PDF (G-58).
import type {
  CreateReportPayload,
  Report,
  ReportAudience,
  ReportContent,
  ReportOptions,
  ReportSection,
  ReportSummary,
  ReportType,
} from "@/api/types";
import { MOCK_EDUCATOR, MOCK_STUDENTS } from "@/mocks/fixtures";
import { MOCK_FOREIGN_STUDENT_ID } from "./plans";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

/** Relatório de `student-1`, gerado na semente. */
export const MOCK_REPORT_ID = "mock-report-1";
/** Relatório de outro educador: tudo responde `403 UNAUTHORIZED`. */
export const MOCK_REPORT_FOREIGN_ID = "mock-report-foreign";
/** Paciente sem dados no período: gerar responde `400 REPORT_EMPTY_PERIOD`. */
export const MOCK_REPORT_EMPTY_STUDENT_ID = "student-5";

const FOREIGN_EDUCATOR_ID = "mock-educator-2";
/** Início dos dados fictícios; período que termina antes dele é vazio (RP-05). */
const MOCK_DATA_START = "2026-01-01";
const MAX_PERIOD_DAYS = 365;

const ALL_SECTIONS: ReportSection[] = [
  "PATIENT_DATA",
  "SESSION_METRICS",
  "EVOLUTIONS",
  "PLAN_PROGRESS",
  "ASSESSMENTS",
  "ANAMNESIS_SUMMARY",
  "AI_SYNTHESIS",
];
const AUDIENCES: ReportAudience[] = ["FAMILY", "SCHOOL", "PROFESSIONAL"];

// RP-01: os padrões não trazem as seções sensíveis (anamnese e avaliações). As
// opções não variam por audiência na especificação, então valem para todas.
const OPTIONS: ReportOptions = {
  types: [
    {
      type: "PROGRESS",
      label: "Evolução do atendimento",
      description: "Sessões, evoluções registradas e progresso dos planos.",
      allowedSections: [
        "PATIENT_DATA",
        "SESSION_METRICS",
        "EVOLUTIONS",
        "PLAN_PROGRESS",
        "AI_SYNTHESIS",
      ],
      defaultSections: [
        "PATIENT_DATA",
        "SESSION_METRICS",
        "EVOLUTIONS",
        "PLAN_PROGRESS",
        "AI_SYNTHESIS",
      ],
    },
    {
      type: "ASSESSMENT",
      label: "Anamnese e avaliações",
      description: "Resumo da anamnese e escalas aplicadas.",
      allowedSections: [
        "PATIENT_DATA",
        "ASSESSMENTS",
        "ANAMNESIS_SUMMARY",
        "AI_SYNTHESIS",
      ],
      defaultSections: [
        "PATIENT_DATA",
        "ASSESSMENTS",
        "ANAMNESIS_SUMMARY",
        "AI_SYNTHESIS",
      ],
    },
    {
      type: "PDI_PROGRESS",
      label: "Evolução do PDI",
      description: "Metas do plano individual e o quanto avançaram.",
      allowedSections: [
        "PATIENT_DATA",
        "PLAN_PROGRESS",
        "EVOLUTIONS",
        "AI_SYNTHESIS",
      ],
      defaultSections: [
        "PATIENT_DATA",
        "PLAN_PROGRESS",
        "EVOLUTIONS",
        "AI_SYNTHESIS",
      ],
    },
  ],
  sections: [
    { section: "PATIENT_DATA", label: "Dados do paciente", sensitive: false },
    {
      section: "SESSION_METRICS",
      label: "Métricas das sessões",
      sensitive: false,
    },
    { section: "EVOLUTIONS", label: "Evoluções registradas", sensitive: false },
    {
      section: "PLAN_PROGRESS",
      label: "Progresso dos planos",
      sensitive: false,
    },
    { section: "ASSESSMENTS", label: "Avaliações e escalas", sensitive: true },
    {
      section: "ANAMNESIS_SUMMARY",
      label: "Resumo da anamnese",
      sensitive: true,
    },
    { section: "AI_SYNTHESIS", label: "Síntese", sensitive: false },
  ],
  audiences: [
    { audience: "FAMILY", label: "Família" },
    { audience: "SCHOOL", label: "Escola" },
    { audience: "PROFESSIONAL", label: "Outro profissional" },
  ],
  periods: [
    { key: "30d", label: "Últimos 30 dias", days: 30 },
    { key: "90d", label: "Últimos 90 dias", days: 90 },
    { key: "180d", label: "Últimos 180 dias", days: 180 },
  ],
  maxPeriodDays: MAX_PERIOD_DAYS,
};

let synthesisFails = false;

/** Faz a próxima geração perder a síntese da IA (`synthesisFailed: true`, RP-06). */
export function setMockReportSynthesisFailure(fails: boolean): void {
  synthesisFails = fails;
}

function buildContent(
  student: { name: string; age: number },
  type: ReportType,
  audience: ReportAudience,
  sections: ReportSection[],
  period: { from: string; to: string },
  withSynthesis: boolean,
): ReportContent {
  const has = (section: ReportSection): boolean => sections.includes(section);
  // RP-01: nunca entram documentos, endereço, telefones, responsável nem CPF.
  const content: ReportContent = {
    title: `Relatório de ${OPTIONS.types.find((t) => t.type === type)?.label ?? type}`,
    generatedAt: new Date().toISOString(),
    professional: { name: MOCK_EDUCATOR.name },
  };
  if (has("PATIENT_DATA"))
    content.patient = { displayName: student.name, ageYears: student.age };
  if (has("SESSION_METRICS"))
    content.sessionMetrics = {
      sessions: 6,
      answered: 48,
      accuracy: 0.75,
      byCategory: [
        { category: "reading", accuracy: 0.8 },
        { category: "comprehension", accuracy: 0.7 },
      ],
    };
  if (has("EVOLUTIONS"))
    content.evolutions = [
      {
        sessionDate: period.to,
        planTitle: "Plano de exemplo",
        achieved: 2,
        total: 3,
        record: "Paciente participou bem da atividade de exemplo.",
      },
    ];
  if (has("PLAN_PROGRESS"))
    content.planProgress = [
      {
        title: "Plano de exemplo",
        type: "PDI",
        percent: 60,
        goals: [
          { description: "Meta fictícia 1", status: "IN_PROGRESS" },
          { description: "Meta fictícia 2", status: "ACHIEVED" },
        ],
      },
    ];
  if (has("ASSESSMENTS"))
    content.assessments = [
      {
        templateName: "Escala fictícia de exemplo",
        completedAt: period.to,
        value: 8,
        max: 18,
        band: "Indicativo moderado",
      },
    ];
  if (has("ANAMNESIS_SUMMARY"))
    content.anamnesisSummary = "- Resumo fictício da anamnese.";
  if (has("AI_SYNTHESIS") && withSynthesis)
    content.synthesis =
      audience === "FAMILY"
        ? "Nas últimas semanas, o paciente participou das atividades e avançou. Seguimos juntos."
        : "O paciente manteve participação regular e avanço nas metas do plano.";
  return content;
}

function makeReport(
  id: string,
  educatorId: string,
  student: { id: string; name: string; age: number },
  type: ReportType,
  audience: ReportAudience,
  sections: ReportSection[],
  period: { from: string; to: string },
  createdAt: string,
): Report {
  return {
    id,
    studentId: student.id,
    studentName: student.name,
    educatorId,
    type,
    audience,
    period,
    sections,
    content: {
      ...buildContent(student, type, audience, sections, period, true),
      generatedAt: createdAt,
    },
    synthesisFailed: false,
    createdAt,
    shares: [],
  };
}

const seedReports: Report[] = [
  makeReport(
    MOCK_REPORT_ID,
    MOCK_EDUCATOR.id,
    MOCK_STUDENTS[0],
    "PROGRESS",
    "FAMILY",
    ["PATIENT_DATA", "SESSION_METRICS", "AI_SYNTHESIS"],
    { from: "2026-09-01", to: "2026-10-01" },
    "2026-10-02T12:00:00.000Z",
  ),
  makeReport(
    MOCK_REPORT_FOREIGN_ID,
    FOREIGN_EDUCATOR_ID,
    { id: MOCK_FOREIGN_STUDENT_ID, name: "Paciente Teste Alheio", age: 9 },
    "PROGRESS",
    "PROFESSIONAL",
    ["PATIENT_DATA"],
    { from: "2026-09-01", to: "2026-10-01" },
    "2026-10-03T12:00:00.000Z",
  ),
];

const mockReports: Report[] = structuredClone(seedReports);
let nextReportNumber = 1;

/** Restaura os relatórios semente e desliga a falha simulada da IA. */
export function resetMockReportState(): void {
  mockReports.splice(0, mockReports.length, ...structuredClone(seedReports));
  synthesisFails = false;
  nextReportNumber = 1;
}

function validationError(): MockApiError {
  return new MockApiError(400, "Bad Request");
}

function ownReport(id: string): Report {
  const report = mockReports.find((item) => item.id === id);
  if (!report) throw new MockApiError(404, "REPORT_NOT_FOUND");
  if (report.educatorId !== MOCK_EDUCATOR.id)
    throw new MockApiError(403, "UNAUTHORIZED");
  return report;
}

function toSummary(report: Report): ReportSummary {
  const { content: _content, shares, ...summary } = report;
  return structuredClone({
    ...summary,
    ...(shares.length > 0 ? { lastShare: shares[shares.length - 1] } : {}),
  });
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const dayNumber = (date: string): number => Date.parse(`${date}T00:00:00Z`);

function checkStudentAccess(studentId: string) {
  const student = MOCK_STUDENTS.find((item) => item.id === studentId);
  if (studentId === MOCK_FOREIGN_STUDENT_ID)
    throw new MockApiError(403, "UNAUTHORIZED");
  if (!student) throw new MockApiError(404, "STUDENT_NOT_FOUND");
  if (student.educatorId !== MOCK_EDUCATOR.id)
    throw new MockApiError(403, "UNAUTHORIZED");
  return student;
}

registerMockHandler({ method: "get", path: "/report/options" }, () => ({
  status: 200,
  data: structuredClone(OPTIONS),
}));

registerMockHandler({ method: "post", path: "/report/" }, ({ body }) => {
  const input = (body ?? {}) as Partial<CreateReportPayload>;
  const period = input.period;
  if (
    typeof input.studentId !== "string" ||
    !OPTIONS.types.some((t) => t.type === input.type) ||
    !AUDIENCES.includes(input.audience as ReportAudience) ||
    !period ||
    typeof period.from !== "string" ||
    typeof period.to !== "string" ||
    !DATE.test(period.from) ||
    !DATE.test(period.to) ||
    Number.isNaN(dayNumber(period.from)) ||
    Number.isNaN(dayNumber(period.to)) ||
    !Array.isArray(input.sections) ||
    input.sections.length === 0 ||
    input.sections.length > 20 ||
    input.sections.some((s) => !ALL_SECTIONS.includes(s))
  )
    throw validationError();
  // RP-04: from <= to e no máximo `maxPeriodDays`.
  const span = (dayNumber(period.to) - dayNumber(period.from)) / 86_400_000;
  if (span < 0 || span + 1 > MAX_PERIOD_DAYS)
    throw new MockApiError(400, "INVALID_PERIOD");

  const type = input.type as ReportType;
  const audience = input.audience as ReportAudience;
  const requested = new Set(input.sections);
  const student = checkStudentAccess(input.studentId);
  const allowed = OPTIONS.types.find((t) => t.type === type)!.allowedSections;
  if ([...requested].some((section) => !allowed.includes(section)))
    throw new MockApiError(400, "SECTION_NOT_ALLOWED");
  // Sem repetição e na ordem do tipo.
  const sections = allowed.filter((section) => requested.has(section));
  // RP-05: vazio só quando NENHUMA das seções pedidas tem dado. PATIENT_DATA e
  // AI_SYNTHESIS não contam; a anamnese vale independente do período.
  const noData = student.id === MOCK_REPORT_EMPTY_STUDENT_ID;
  const hasData = (section: ReportSection): boolean =>
    section === "PATIENT_DATA" || section === "AI_SYNTHESIS" || noData
      ? false
      : section === "ANAMNESIS_SUMMARY" || period.to >= MOCK_DATA_START;
  if (!sections.some(hasData))
    throw new MockApiError(400, "REPORT_EMPTY_PERIOD");

  const asked = sections.includes("AI_SYNTHESIS");
  const failed = asked && synthesisFails;
  synthesisFails = false;
  const createdAt = new Date().toISOString();
  const report: Report = {
    id: `mock-report-new-${nextReportNumber++}`,
    studentId: student.id,
    studentName: student.name,
    educatorId: MOCK_EDUCATOR.id,
    type,
    audience,
    period: { from: period.from, to: period.to },
    sections,
    content: buildContent(student, type, audience, sections, period, !failed),
    synthesisFailed: failed,
    createdAt,
    shares: [],
  };
  mockReports.push(report);

  return { status: 201, data: structuredClone(report) };
});

registerMockHandler({ method: "get", path: "/report/" }, ({ params }) => {
  const { studentId, limit } = params;
  if (
    limit !== undefined &&
    (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 100)
  )
    throw validationError();
  if (studentId !== undefined) checkStudentAccess(studentId);

  const list = mockReports
    .filter(
      (item) =>
        item.educatorId === MOCK_EDUCATOR.id &&
        (studentId === undefined || item.studentId === studentId),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit === undefined ? 50 : Number(limit))
    .map(toSummary);

  return { status: 200, data: list };
});

registerMockHandler({ method: "get", path: "/report/:id" }, ({ params }) => ({
  status: 200,
  data: structuredClone(ownReport(params.id)),
}));

registerMockHandler(
  { method: "post", path: "/report/:id/share" },
  ({ params, body }) => {
    const report = ownReport(params.id);
    const channel = ((body ?? {}) as { channel?: unknown }).channel;
    if (channel !== "SHARE" && channel !== "PRINT") throw validationError();
    // RP-08: só registra; o envio é pelo compartilhamento do aparelho.
    report.shares.push({ channel, at: new Date().toISOString() });
    return { status: 200, data: structuredClone(report) };
  },
);

registerMockHandler({ method: "delete", path: "/report/:id" }, ({ params }) => {
  const report = ownReport(params.id);
  mockReports.splice(mockReports.indexOf(report), 1);
  return { status: 204, data: undefined };
});
