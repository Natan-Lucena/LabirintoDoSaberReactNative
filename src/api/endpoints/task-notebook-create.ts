import { apiClient } from "@/api/client";
import type { TaskCategory, TaskNotebookWithGroups } from "@/api/types";

export interface CreateTaskNotebookInput {
  description: string;
  category: TaskCategory;
  tasks: string[];
  taskGroupsIds: string[];
}

/** POST /task-notebook/create */
export async function createTaskNotebook(
  input: CreateTaskNotebookInput,
): Promise<TaskNotebookWithGroups> {
  const response = await apiClient.post<TaskNotebookWithGroups>(
    "/task-notebook/create",
    input,
  );

  return response.data;
}
