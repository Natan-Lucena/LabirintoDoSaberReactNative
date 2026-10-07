import { apiClient } from "@/api/client";
import type { TaskCategory } from "@/api/types";

export interface UpdateTaskGroupInput {
  id: string;
  name?: string;
  tasksIds?: string[];
  category?: TaskCategory;
}

/** PUT /task-group/update */
export async function updateTaskGroup(
  input: UpdateTaskGroupInput,
): Promise<void> {
  await apiClient.put("/task-group/update", input);
}
