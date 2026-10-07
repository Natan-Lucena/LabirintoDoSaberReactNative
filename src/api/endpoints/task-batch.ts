import { apiClient } from "@/api/client";
import type { TaskCategory, TaskGroup, TaskInput } from "@/api/types";

export interface CreateTasksBatchInput {
  name: string;
  category: TaskCategory;
  tasks: TaskInput[];
}

export interface CreateTasksBatchResponse {
  taskGroup: TaskGroup;
  taskIds: string[];
}

/** POST /task/batch */
export async function createTasksBatch(
  input: CreateTasksBatchInput,
): Promise<CreateTasksBatchResponse> {
  const response = await apiClient.post<CreateTasksBatchResponse>(
    "/task/batch",
    input,
  );
  return response.data;
}
