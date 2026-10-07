import { apiClient } from "@/api/client";
import type { TaskCategory } from "@/api/types";
import type { TaskMediaFile } from "./task-upload-media";

export interface CreateTaskAlternativeInput {
  text: string;
  isCorrect: boolean;
}

export interface CreateTaskInput {
  category: TaskCategory;
  prompt: string;
  alternatives: CreateTaskAlternativeInput[];
  imageFile?: TaskMediaFile;
  audioFile?: TaskMediaFile;
}

/** POST /task/create (multipart) — resposta 201 vazia. */
export async function createTask(input: CreateTaskInput): Promise<void> {
  const formData = new FormData();
  formData.append("category", input.category);
  const hasMedia = Boolean(input.imageFile || input.audioFile);
  formData.append(
    "type",
    hasMedia ? "multipleChoiceWithMedia" : "multipleChoice",
  );
  formData.append("prompt", input.prompt);
  formData.append("alternatives", JSON.stringify(input.alternatives));
  if (input.imageFile) {
    formData.append("imageFile", {
      uri: input.imageFile.uri,
      name: input.imageFile.name,
      type: input.imageFile.mimeType,
    } as unknown as Blob);
  }
  if (input.audioFile) {
    formData.append("audioFile", {
      uri: input.audioFile.uri,
      name: input.audioFile.name,
      type: input.audioFile.mimeType,
    } as unknown as Blob);
  }

  await apiClient.post("/task/create", formData);
}
