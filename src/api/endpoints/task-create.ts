import { apiClient } from "@/api/client";
import type { TaskCategory } from "@/api/types";

export interface CreateTaskAlternativeInput {
  text: string;
  isCorrect: boolean;
}

export interface CreateTaskInput {
  category: TaskCategory;
  prompt: string;
  alternatives: CreateTaskAlternativeInput[];
}

/** POST /task/create (multipart) — resposta 201 vazia. */
export async function createTask(input: CreateTaskInput): Promise<void> {
  const formData = new FormData();
  formData.append("category", input.category);
  formData.append("type", "multipleChoice");
  formData.append("prompt", input.prompt);
  formData.append("alternatives", JSON.stringify(input.alternatives));

  await apiClient.post("/task/create", formData);
}
