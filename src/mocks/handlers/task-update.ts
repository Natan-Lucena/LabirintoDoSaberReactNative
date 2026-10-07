import type { Task, TaskCategory, TaskType } from "@/api/types";
import { MOCK_TASKS } from "@/mocks/handlers/content";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

interface UpdateTaskBody {
  id?: unknown;
  category?: unknown;
  type?: unknown;
  prompt?: unknown;
  alternatives?: unknown;
  imageFile?: unknown;
  audioFile?: unknown;
}

registerMockHandler({ method: "put", path: "/task/update" }, ({ body }) => {
  const input = body as UpdateTaskBody;
  const task = MOCK_TASKS.find((item) => item.id === input.id);
  if (!task) {
    throw new MockApiError(500, "TASK_NOT_FOUND");
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
  return { status: 200, data: undefined };
});

export const taskUpdateMockHandlersRegistered = true;
