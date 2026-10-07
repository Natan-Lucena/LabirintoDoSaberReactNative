import type { TaskCategory } from "@/api/types";
import { MOCK_TASK_GROUPS } from "@/mocks/handlers/content";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

registerMockHandler(
  { method: "put", path: "/task-group/update" },
  ({ body }) => {
    const input = body as {
      id?: unknown;
      name?: unknown;
      category?: unknown;
      tasksIds?: unknown;
    };
    const group = MOCK_TASK_GROUPS.find((item) => item.id === input.id);
    if (!group) throw new MockApiError(500, "TASK_GROUP_NOT_FOUND");
    if (typeof input.name === "string") group.name = input.name;
    if (typeof input.category === "string")
      group.category = input.category as TaskCategory;
    if (Array.isArray(input.tasksIds))
      group.tasksIds = input.tasksIds as string[];
    return { status: 200, data: null };
  },
);

export const groupUpdateMockHandlersRegistered = true;
