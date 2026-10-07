import { apiClient } from "@/api/client";
import type { TaskCategory, TaskInput } from "@/api/types";

export interface GenerateAiTasksInput {
  targetAudience: string;
  instructions: string;
  quantity: number;
  category: TaskCategory;
}

export interface GenerateAiTasksResponse {
  tasks: TaskInput[];
}

/** POST /ai-task/generate. A resposta é um rascunho e não é persistida. */
export async function generateAiTasks(
  input: GenerateAiTasksInput,
): Promise<GenerateAiTasksResponse> {
  const response = await apiClient.post<GenerateAiTasksResponse>(
    "/ai-task/generate",
    input,
  );
  return response.data;
}
