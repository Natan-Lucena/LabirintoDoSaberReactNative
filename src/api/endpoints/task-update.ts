import { apiClient } from "@/api/client";
import type { TaskCategory, TaskType } from "@/api/types";

export interface UpdateTaskAlternativeInput {
  text: string;
  isCorrect: boolean;
}

export interface UpdateTaskInput {
  id: string;
  category?: TaskCategory;
  type?: TaskType;
  prompt?: string;
  alternatives?: UpdateTaskAlternativeInput[];
  imageFile?: string;
  audioFile?: string;
}

/** PUT /task/update — envia somente os campos modificados. */
export async function updateTask(input: UpdateTaskInput): Promise<void> {
  await apiClient.put("/task/update", input);
}
