import type { Task, TaskCategory, TaskType } from "@/api/types";
import { MOCK_TASKS } from "@/mocks/handlers/content";
import { MOCK_LIBRARY_TASKS } from "@/mocks/fixtures-task-catalog";
import { registerMockHandler } from "./registry";
import {
  assertValidSkills,
  NEW_ACTIVITY_TYPES,
  validateActivityContent,
} from "./task-create";
import { MockApiError } from "./types";

interface UpdateTaskBody {
  id?: unknown;
  category?: unknown;
  type?: unknown;
  prompt?: unknown;
  alternatives?: unknown;
  imageFile?: unknown;
  audioFile?: unknown;
  content?: unknown;
  skills?: unknown;
  theme?: unknown;
  tone?: unknown;
}

registerMockHandler({ method: "put", path: "/task/update" }, ({ body }) => {
  const input = body as UpdateTaskBody;
  if (MOCK_LIBRARY_TASKS.some((item) => item.id === input.id)) {
    throw new MockApiError(403, "LIBRARY_TASK_READ_ONLY");
  }
  const task = MOCK_TASKS.find((item) => item.id === input.id);
  if (!task) {
    throw new MockApiError(500, "TASK_NOT_FOUND");
  }
  const isNewType = (NEW_ACTIVITY_TYPES as readonly string[]).includes(
    task.type,
  );
  if (isNewType) {
    if (typeof input.type === "string" && input.type !== task.type) {
      throw new MockApiError(400, "TYPE_CHANGE_NOT_ALLOWED");
    }
    if (Array.isArray(input.alternatives)) {
      throw new MockApiError(400, "ALTERNATIVES_NOT_ALLOWED");
    }
    if (input.content !== undefined) {
      const errors = validateActivityContent(task.type, input.content);
      if (errors.length > 0) {
        throw new MockApiError(400, "INVALID_CONTENT", undefined, errors);
      }
    }
    assertValidSkills(input.skills);
  } else if (
    typeof input.type === "string" &&
    (NEW_ACTIVITY_TYPES as readonly string[]).includes(input.type)
  ) {
    throw new MockApiError(400, "TYPE_CHANGE_NOT_ALLOWED");
  }
  const nextType = typeof input.type === "string" ? input.type : task.type;
  const nextImage =
    input.imageFile === null
      ? undefined
      : typeof input.imageFile === "string"
        ? input.imageFile
        : task.imageFile;
  const nextAudio =
    input.audioFile === null
      ? undefined
      : typeof input.audioFile === "string"
        ? input.audioFile
        : task.audioFile;
  if (nextType === "multipleChoiceWithMedia" && !nextImage && !nextAudio) {
    throw new MockApiError(400, "MEDIA_TASK_REQUIRES_IMAGE_OR_AUDIO");
  }
  if (nextType === "multipleChoice" && (nextImage || nextAudio)) {
    throw new MockApiError(400, "TEXT_TASK_CANNOT_HAVE_MEDIA");
  }
  if (typeof input.prompt === "string") task.prompt = input.prompt;
  if (typeof input.category === "string") {
    task.category = input.category as TaskCategory;
  }
  if (typeof input.type === "string") task.type = input.type as TaskType;
  if (Array.isArray(input.alternatives)) {
    task.alternatives = input.alternatives as Task["alternatives"];
  }
  if (typeof input.imageFile === "string") task.imageFile = input.imageFile;
  if (typeof input.audioFile === "string") task.audioFile = input.audioFile;
  // PP-05: `null` apaga a mídia; sem mídia a atividade vira múltipla escolha.
  if (input.imageFile === null) delete task.imageFile;
  if (input.audioFile === null) delete task.audioFile;

  if (isNewType) {
    if (input.content !== undefined) {
      task.content = input.content as Task["content"];
    }
    if (Array.isArray(input.skills)) task.skills = input.skills as string[];
    if (typeof input.theme === "string") task.theme = input.theme;
    if (typeof input.tone === "string") task.tone = input.tone as Task["tone"];
  }
  return { status: 200, data: undefined };
});

export const taskUpdateMockHandlersRegistered = true;
