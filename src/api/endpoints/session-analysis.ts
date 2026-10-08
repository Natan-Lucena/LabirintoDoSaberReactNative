import { apiClient } from "@/api/client";
import type { TaskCategory, TaskNotebookSession } from "@/api/types";

export interface StudentAnalysisCategory {
  category: TaskCategory;
  total: number;
  correct: number;
  accuracy: number;
}

export interface StudentAnalysis {
  categories: Partial<Record<TaskCategory, StudentAnalysisCategory>>;
  total: { total: number; correct: number; accuracy: number };
  sessions: TaskNotebookSession[];
}

export type StudentAnalysisFilter =
  | { limit: number; startDate?: never; endDate?: never }
  | { limit?: never; startDate: string; endDate: string };

function toQuery(filter?: StudentAnalysisFilter): string {
  return filter
    ? `?${new URLSearchParams(
        Object.entries(filter).map(([key, value]) => [key, String(value)]),
      ).toString()}`
    : "";
}

/** GET /task-notebook-session/analysis/student/:studentId */
export async function getStudentAnalysis(
  studentId: string,
  filter?: StudentAnalysisFilter,
): Promise<StudentAnalysis> {
  const response = await apiClient.get<StudentAnalysis>(
    `/task-notebook-session/analysis/student/${studentId}${toQuery(filter)}`,
  );

  return response.data;
}

/** Snapshot persistido da análise (contrato: `StudentAnalysisReport`). */
export interface StudentAnalysisReport {
  studentId: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  sessionIds: string[];
  categories: {
    category: TaskCategory;
    total: number;
    correct: number;
    accuracy: number;
  }[];
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
}

/** POST /task-notebook-session/analysis/student/:studentId/snapshot */
export async function createStudentSnapshot(
  studentId: string,
  filter?: StudentAnalysisFilter,
): Promise<StudentAnalysisReport> {
  const response = await apiClient.post<StudentAnalysisReport>(
    `/task-notebook-session/analysis/student/${studentId}/snapshot${toQuery(filter)}`,
  );

  return response.data;
}

/** GET /task-notebook-session/analysis/student/:studentId/history */
export async function listStudentSnapshots(
  studentId: string,
): Promise<StudentAnalysisReport[]> {
  const response = await apiClient.get<StudentAnalysisReport[]>(
    `/task-notebook-session/analysis/student/${studentId}/history`,
  );

  return response.data;
}
