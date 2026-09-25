import type { TaskCategory, TaskGroup } from "@/api/types";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import { MOCK_TASK_GROUPS } from "@/mocks/handlers/content";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const categories: TaskCategory[] = [
  "reading",
  "writing",
  "vocabulary",
  "comprehension",
];
let nextGroupId = 1;

registerMockHandler(
  { method: "post", path: "/task-group/create" },
  ({ body }) => {
    const input = body as { name?: unknown; category?: unknown };
    const isValid =
      typeof input.name === "string" &&
      input.name.trim().length >= 1 &&
      input.name.trim().length <= 100 &&
      typeof input.category === "string" &&
      categories.includes(input.category as TaskCategory);

    if (!isValid) {
      throw new MockApiError(400, "INVALID_TASK_GROUP");
    }

    const group: TaskGroup = {
      id: `mock-group-${nextGroupId++}`,
      name: (input.name as string).trim(),
      category: input.category as TaskCategory,
      tasksIds: [],
      educatorId: MOCK_EDUCATOR.id,
    };
    MOCK_TASK_GROUPS.push(group);

    return { status: 200, data: group };
  },
);

export const groupCreateMockHandlersRegistered = true;
