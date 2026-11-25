import type { SessionReport } from "@/api/endpoints/session-report";
import type { ActivityResult } from "@/api/types";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

/** Sessão com jogos registrados (API-07, leva 1; RS-05 a RS-07). As outras não têm o campo. */
export const MOCK_ACTIVITY_SESSION_ID = "mock-session-2";

export const MOCK_SESSION_ACTIVITY_RESULTS: ActivityResult[] = [
  {
    id: "mock-activity-result-1",
    sessionId: MOCK_ACTIVITY_SESSION_ID,
    taskId: "lib-word-bola",
    taskType: "wordBuilder",
    completed: true,
    correct: true,
    attempts: 5,
    errors: 1,
    durationMs: 48000,
    recordedAt: "2026-01-01T12:20:00.000Z",
  },
  {
    id: "mock-activity-result-2",
    sessionId: MOCK_ACTIVITY_SESSION_ID,
    taskId: "lib-memory-3",
    taskType: "memoryGame",
    completed: true,
    correct: false,
    attempts: 9,
    errors: 4,
    durationMs: 92000,
    recordedAt: "2026-01-01T12:24:00.000Z",
  },
];

const reportsBySessionId: Record<string, SessionReport> = {
  "mock-session-1": {
    sessionName: "Leitura inicial",
    totalTimeSession: 152,
    totalQuestions: 6,
    averageTimePerQuestion: 25000,
    averageCorrectTime: 19000,
    averageIncorrectTime: null,
    percentageByCategory: { reading: 83, writing: null },
    percentageByType: { multipleChoice: 83, multipleChoiceWithMedia: null },
    observation: null,
  },
  "mock-session-2": {
    sessionName: "Palavras do cotidiano",
    totalTimeSession: 118,
    totalQuestions: 4,
    averageTimePerQuestion: 30000,
    averageCorrectTime: 24000,
    averageIncorrectTime: 36000,
    percentageByCategory: { vocabulary: 75 },
    percentageByType: { multipleChoice: 75 },
    observation: "Participou com interesse e pediu para continuar.",
    activitySummary: { total: 2, completed: 2, correct: 1 },
    activityResults: MOCK_SESSION_ACTIVITY_RESULTS,
  },
};

registerMockHandler(
  { method: "get", path: "/task-notebook-session/report/:sessionId" },
  ({ params }) => {
    if (params.sessionId === "session-not-found") {
      throw new MockApiError(404, "SESSION_NOT_FOUND");
    }

    const report = reportsBySessionId[params.sessionId];
    if (!report) {
      throw new MockApiError(404, "SESSION_NOT_FOUND");
    }

    return { status: 200, data: structuredClone(report) };
  },
);

export const sessionReportMockHandlersRegistered = true;
