import type { TaskNotebookSession } from "@/api/types";
import type {
  StudentAnalysis,
  StudentAnalysisReport,
} from "@/api/endpoints/session-analysis";
import { MOCK_EDUCATOR, MOCK_STUDENTS } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const analysisSessions: TaskNotebookSession[] = [
  {
    id: "mock-session-1",
    studentId: "student-1",
    educatorId: MOCK_EDUCATOR.id,
    name: "Leitura inicial",
    startedAt: "2026-10-01T10:00:00-03:00",
    finishedAt: "2026-10-01T10:25:00-03:00",
    answers: [
      {
        taskId: "task-1",
        selectedAlternativeId: "alternative-1",
        isCorrect: true,
        timeToAnswer: 12,
        answeredAt: "2026-10-01T10:02:00-03:00",
      },
      {
        taskId: "task-2",
        selectedAlternativeId: "alternative-2",
        isCorrect: false,
        timeToAnswer: 15,
        answeredAt: "2026-10-01T10:04:00-03:00",
      },
    ],
  },
  {
    id: "mock-session-2",
    studentId: "student-1",
    educatorId: MOCK_EDUCATOR.id,
    name: "Palavras do cotidiano",
    startedAt: "2026-10-03T10:00:00-03:00",
    finishedAt: "2026-10-03T10:20:00-03:00",
    answers: [
      {
        taskId: "task-3",
        selectedAlternativeId: "alternative-3",
        isCorrect: true,
        timeToAnswer: 11,
        answeredAt: "2026-10-03T10:02:00-03:00",
      },
    ],
  },
  {
    id: "mock-open-session",
    studentId: "student-5",
    educatorId: MOCK_EDUCATOR.id,
    name: "Sessão em andamento",
    startedAt: "2026-10-07T10:00:00-03:00",
    answers: [],
  },
];

function sessionsForStudent(studentId: string): TaskNotebookSession[] {
  return analysisSessions.filter((session) => session.studentId === studentId);
}

function analysisFor(
  studentId: string,
  params: Record<string, string>,
): StudentAnalysis {
  let sessions = sessionsForStudent(studentId);
  if (params.limit && (params.startDate || params.endDate)) {
    throw new MockApiError(
      400,
      "INVALID_ANALYSIS_FILTER",
      "limit não pode ser combinado com datas",
    );
  }
  if (params.limit) {
    sessions = sessions.slice(-Number(params.limit));
  }
  if (params.startDate && params.endDate) {
    sessions = sessions.filter(
      (session) =>
        session.startedAt >= params.startDate &&
        session.startedAt <= params.endDate,
    );
  }

  const answers = sessions.flatMap((session) => session.answers);
  const correct = answers.filter((answer) => answer.isCorrect).length;
  const accuracy = answers.length === 0 ? 0 : (correct / answers.length) * 100;

  return {
    categories: {
      reading: {
        category: "reading",
        total: answers.length,
        correct,
        accuracy,
      },
    },
    total: { total: answers.length, correct, accuracy },
    sessions,
  };
}

registerMockHandler(
  { method: "get", path: "/task-notebook-session/student/:studentId" },
  ({ params }) => {
    if (!MOCK_STUDENTS.some((student) => student.id === params.studentId)) {
      throw new MockApiError(400, "INVALID_STUDENT_ID");
    }
    return { status: 200, data: sessionsForStudent(params.studentId) };
  },
);

registerMockHandler(
  { method: "post", path: "/task-notebook-session/start" },
  ({ body }) => {
    const input = body as { studentId?: unknown; name?: unknown };
    if (
      typeof input.studentId !== "string" ||
      typeof input.name !== "string" ||
      input.name.trim().length === 0 ||
      input.name.length > 100
    ) {
      throw new MockApiError(400, "Validation error", "Validation error");
    }
    if (input.name === "erro de validação") {
      throw new MockApiError(400, "Validation error", "Validation error");
    }
    const session: TaskNotebookSession = {
      id: `mock-session-${Date.now()}`,
      studentId: input.studentId,
      educatorId: MOCK_EDUCATOR.id,
      name: input.name,
      startedAt: new Date().toISOString(),
      answers: [],
    };
    analysisSessions.push(session);
    return { status: 200, data: session };
  },
);

registerMockHandler(
  { method: "post", path: "/task-notebook-session/finish" },
  ({ body }) => {
    const input = body as { sessionId?: unknown };
    const session = analysisSessions.find(
      (item) => item.id === input.sessionId,
    );
    if (!session) throw new MockApiError(404, "SESSION_NOT_FOUND");
    if (session.finishedAt)
      throw new MockApiError(400, "SESSION_ALREADY_FINISHED");
    session.finishedAt = new Date().toISOString();
    return { status: 200, data: session };
  },
);

const analysisSnapshots: StudentAnalysisReport[] = [];

registerMockHandler(
  {
    method: "post",
    path: "/task-notebook-session/analysis/student/:studentId/snapshot",
  },
  ({ params }) => {
    if (!MOCK_STUDENTS.some((student) => student.id === params.studentId)) {
      throw new MockApiError(404, "STUDENT_NOT_FOUND");
    }
    const analysis = analysisFor(params.studentId, params);
    const snapshot: StudentAnalysisReport = {
      studentId: params.studentId,
      ...(params.limit ? { limit: Number(params.limit) } : {}),
      ...(params.startDate ? { startDate: params.startDate } : {}),
      ...(params.endDate ? { endDate: params.endDate } : {}),
      sessionIds: analysis.sessions.map((session) => session.id),
      categories: Object.values(analysis.categories).map((item) => ({
        category: item.category,
        total: item.total,
        correct: item.correct,
        accuracy: item.accuracy,
      })),
      totalQuestions: analysis.total.total,
      totalCorrect: analysis.total.correct,
      accuracy: analysis.total.accuracy,
    };
    analysisSnapshots.push(snapshot);
    return { status: 200, data: snapshot };
  },
);

registerMockHandler(
  {
    method: "get",
    path: "/task-notebook-session/analysis/student/:studentId/history",
  },
  ({ params }) => {
    if (!MOCK_STUDENTS.some((student) => student.id === params.studentId)) {
      throw new MockApiError(400, "INVALID_STUDENT_ID");
    }
    return {
      status: 200,
      data: analysisSnapshots.filter(
        (snapshot) => snapshot.studentId === params.studentId,
      ),
    };
  },
);

export type MockAiAnalysisScenario = "success" | "failure";

let aiAnalysisScenario: MockAiAnalysisScenario = "success";

/** Cenário manual da análise com IA; só vale com EXPO_PUBLIC_USE_MOCKS=true. */
export function setMockAiAnalysisScenario(
  scenario: MockAiAnalysisScenario,
): void {
  aiAnalysisScenario = scenario;
}

registerMockHandler(
  {
    method: "get",
    path: "/task-notebook-session/analysis/student/:studentId/ai",
  },
  ({ params }) => {
    if (!MOCK_STUDENTS.some((student) => student.id === params.studentId)) {
      throw new MockApiError(404, "STUDENT_NOT_FOUND");
    }
    if (params.limit && (params.startDate || params.endDate)) {
      throw new MockApiError(400, "Bad Request", "Bad Request");
    }
    if (aiAnalysisScenario === "failure") {
      throw new MockApiError(500, "AI_ANALYSIS_FAILED");
    }

    const analysis = analysisFor(params.studentId, params);
    const anamnese = params.templateId
      ? "\n\nA análise considerou as respostas da anamnese informada."
      : "";
    return {
      status: 200,
      data: {
        analysis: [
          "## Visão Geral",
          `O paciente respondeu ${analysis.total.total} questões no período, com ${analysis.total.correct} acertos.${anamnese}`,
          "## Maiores Acertos e Pontos Fortes",
          "- Boa atenção durante a leitura\n- Reconhece **palavras do cotidiano** com facilidade",
          "## Principais Fraquezas e Dificuldades",
          "- Hesita em enunciados mais longos",
          "## Observações de Padrões",
          "Os erros aparecem quando há mais de uma alternativa parecida.",
          "## Pontos de Melhoria",
          "1. Ampliar o vocabulário\n2. Praticar a releitura do enunciado",
          "## Guia de Intervenção",
          "- Atividades curtas com apoio de imagem\n- Reforço positivo a cada acerto",
          "## Considerações Finais",
          "Manter o acompanhamento e reavaliar em seis sessões.",
        ].join("\n\n"),
      },
    };
  },
);

registerMockHandler(
  { method: "get", path: "/task-notebook-session/analysis/student/:studentId" },
  ({ params }) => {
    if (!MOCK_STUDENTS.some((student) => student.id === params.studentId)) {
      throw new MockApiError(404, "STUDENT_NOT_FOUND");
    }
    return { status: 200, data: analysisFor(params.studentId, params) };
  },
);

export const sessionAnalysisMockHandlersRegistered = true;
