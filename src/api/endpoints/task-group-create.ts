import { apiClient } from "@/api/client";
import type { TaskCategory, TaskGroup } from "@/api/types";

export interface CreateTaskGroupInput {
  name: string;
  category: TaskCategory;
}

/** POST /task-group/create */
export async function createTaskGroup(
  input: CreateTaskGroupInput,
): Promise<TaskGroup> {
  const response = await apiClient.post<TaskGroup>("/task-group/create", input);

  return response.data;
}
