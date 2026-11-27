import { apiClient } from "@/api/client";
import type { ActivityResult, ActivitySummary } from "@/api/types";

export interface SessionReport {
  sessionName: string;
  totalTimeSession: number;
  totalQuestions: number;
  averageTimePerQuestion: number | null;
  averageCorrectTime: number | null;
  averageIncorrectTime: number | null;
  percentageByCategory: Record<string, number | null>;
  percentageByType: Record<string, number | null>;
  observation: string | null;
  /** Evolução registrada para a sessão (§3.9); ausente = ainda não registrada. */
  evolutionId?: string;
  /** Jogos da sessão (RS-05/RS-07; Entrega 5, mock-first). */
  activitySummary?: ActivitySummary;
  activityResults?: ActivityResult[];
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
