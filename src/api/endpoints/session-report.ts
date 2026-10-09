import { apiClient } from "@/api/client";

export interface SessionReport {
  sessionName: string;
  totalTimeSession: number;
  totalQuestions: number;
  averageTimePerQuestion: number;
  averageCorrectTime: number | null;
  averageIncorrectTime: number | null;
  percentageByCategory: Record<string, number | null>;
  percentageByType: Record<string, number | null>;
  observation: string | null;
}

/** GET /task-notebook-session/report/:sessionId */
export async function getSessionReport(
  sessionId: string,
): Promise<SessionReport> {
  const response = await apiClient.get<SessionReport>(
    `/task-notebook-session/report/${sessionId}`,
  );

  return response.data;
}
