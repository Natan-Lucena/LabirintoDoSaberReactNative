import type { TaskCategory, TaskNotebookWithGroups } from "@/api/types";
import { MOCK_EDUCATOR, MOCK_TASK_NOTEBOOKS } from "@/mocks/fixtures";
import { MOCK_TASK_GROUPS } from "@/mocks/handlers/content";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const categories: TaskCategory[] = [
  "reading",
  "writing",
  "vocabulary",
  "comprehension",
];
let nextNotebookId = 1;

registerMockHandler(
  { method: "post", path: "/task-notebook/create" },
  ({ body }) => {
    const input = body as {
      description?: unknown;
      category?: unknown;
      tasks?: unknown;
      taskGroupsIds?: unknown;
    };
    const isValid =
      typeof input.description === "string" &&
      input.description.trim().length >= 1 &&
      input.description.trim().length <= 100 &&
      typeof input.category === "string" &&
      categories.includes(input.category as TaskCategory) &&
      Array.isArray(input.tasks) &&
      input.tasks.length > 0 &&
      input.tasks.every((task) => typeof task === "string") &&
      Array.isArray(input.taskGroupsIds) &&
      input.taskGroupsIds.length > 0 &&
      input.taskGroupsIds.every((group) => typeof group === "string");

    if (!isValid) {
      throw new MockApiError(400, "INVALID_TASK_NOTEBOOK");
    }

    const description = input.description as string;
    const category = input.category as TaskCategory;
    const tasks = input.tasks as string[];
    const taskGroupsIds = input.taskGroupsIds as string[];
    const taskGroups = MOCK_TASK_GROUPS.filter((group) =>
      taskGroupsIds.includes(group.id),
    );
    if (taskGroups.length !== taskGroupsIds.length) {
      throw new MockApiError(400, "INVALID_TASK_GROUP");
    }

    const notebook: TaskNotebookWithGroups = {
      notebook: {
        id: `mock-notebook-${nextNotebookId++}`,
        educator: MOCK_EDUCATOR.id,
        description: description.trim(),
        category,
        tasks,
        taskGroupsIds,
        createdAt: new Date().toISOString(),
      },
      taskGroups,
    };
    MOCK_TASK_NOTEBOOKS.push(notebook);

    return { status: 201, data: notebook };
  },
);

export const notebookCreateMockHandlersRegistered = true;
