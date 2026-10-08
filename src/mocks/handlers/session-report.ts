import type { SessionReport } from "@/api/endpoints/session-report";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const reportsBySessionId: Record<string, SessionReport> = {
  "mock-session-1": {
    sessionName: "Leitura inicial",
    totalTimeSession: 152,
    totalQuestions: 6,
    averageTimePerQuestion: 25,
    averageCorrectTime: 19,
    averageIncorrectTime: null,
    percentageByCategory: { reading: 83, writing: null },
    percentageByType: { multipleChoice: 83, multipleChoiceWithMedia: null },
    observation: null,
  },
  "mock-session-2": {
    sessionName: "Palavras do cotidiano",
    totalTimeSession: 118,
    totalQuestions: 4,
    averageTimePerQuestion: 30,
    averageCorrectTime: 24,
    averageIncorrectTime: 36,
    percentageByCategory: { vocabulary: 75 },
    percentageByType: { multipleChoice: 75 },
    observation: "Participou com interesse e pediu para continuar.",
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

    return { status: 200, data: report };
  },
);

export const sessionReportMockHandlersRegistered = true;
