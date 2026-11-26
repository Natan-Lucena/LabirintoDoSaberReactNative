import { apiClient } from "@/api/client";
import type { Task, TaskCategory, TaskContent, TaskTone } from "@/api/types";
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

export interface CreateActivityInput {
  category: TaskCategory;
  /** Sempre igual a `content.kind`. */
  type: TaskContent["kind"];
  prompt: string;
  content: TaskContent;
  skills?: string[];
  theme?: string;
  tone?: TaskTone;
}

/**
 * POST /task/create (multipart) para os tipos novos (ATV-11): `content` e
 * `skills` vão como strings JSON; sem `alternatives`. Resposta `201 Task`; o
 * contrato antigo (`201` vazio) devolve `null`.
 */
export async function createActivity(
  input: CreateActivityInput,
): Promise<Task | null> {
  const formData = new FormData();
  formData.append("category", input.category);
  formData.append("type", input.type);
  formData.append("prompt", input.prompt);
  formData.append("content", JSON.stringify(input.content));
  if (input.skills && input.skills.length > 0) {
    formData.append("skills", JSON.stringify(input.skills));
  }
  if (input.theme) formData.append("theme", input.theme);
  if (input.tone) formData.append("tone", input.tone);

  const response = await apiClient.post<Task | "" | undefined>(
    "/task/create",
    formData,
  );
  const data = response.data;
  return data && typeof data === "object" && "id" in data ? data : null;
}
