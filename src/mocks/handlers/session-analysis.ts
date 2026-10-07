import type { TaskNotebookSession } from "@/api/types";
import type { StudentAnalysis } from "@/api/endpoints/session-analysis";
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
  { method: "get", path: "/task-notebook-session/analysis/student/:studentId" },
  ({ params }) => {
    if (!MOCK_STUDENTS.some((student) => student.id === params.studentId)) {
      throw new MockApiError(404, "STUDENT_NOT_FOUND");
    }
    return { status: 200, data: analysisFor(params.studentId, params) };
  },
);

export const sessionAnalysisMockHandlersRegistered = true;
