import { apiClient } from "@/api/client";
import type { TaskCategory } from "@/api/types";

export interface UpdateTaskNotebookInput {
  taskNotebookId: string;
  category?: TaskCategory;
  description?: string;
  taskGroupsIds?: string[];
}

/** PUT /task-notebook/update */
export async function updateTaskNotebook(
  input: UpdateTaskNotebookInput,
): Promise<void> {
  await apiClient.put("/task-notebook/update", input);
}
