import { apiClient } from "@/api/client";
import type {
  TaskCategory,
  TaskContent,
  TaskTone,
  TaskType,
} from "@/api/types";

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
  /** `null` apaga a mídia (PP-05). */
  imageFile?: string | null;
  /** `null` apaga a mídia (PP-05). */
  audioFile?: string | null;
  /** Tipos novos (ATV-11): lista completa, ids dos itens preservados. */
  content?: TaskContent;
  skills?: string[];
  theme?: string;
  tone?: TaskTone;
}

/** PUT /task/update — envia somente os campos modificados. */
export async function updateTask(input: UpdateTaskInput): Promise<void> {
  await apiClient.put("/task/update", input);
}
