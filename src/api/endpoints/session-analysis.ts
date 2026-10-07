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

/** GET /task-notebook-session/analysis/student/:studentId */
export async function getStudentAnalysis(
  studentId: string,
  filter?: StudentAnalysisFilter,
): Promise<StudentAnalysis> {
  const query = filter
    ? `?${new URLSearchParams(
        Object.entries(filter).map(([key, value]) => [key, String(value)]),
      ).toString()}`
    : "";
  const response = await apiClient.get<StudentAnalysis>(
    `/task-notebook-session/analysis/student/${studentId}${query}`,
  );

  return response.data;
}
