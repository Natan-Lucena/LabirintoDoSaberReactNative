import type { TaskCategory } from "@/api/types";
import { MOCK_TASK_NOTEBOOKS } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

registerMockHandler(
  { method: "put", path: "/task-notebook/update" },
  ({ body }) => {
    const input = body as {
      taskNotebookId?: unknown;
      description?: unknown;
      category?: unknown;
      taskGroupsIds?: unknown;
    };
    const entry = MOCK_TASK_NOTEBOOKS.find(
      ({ notebook }) => notebook.id === input.taskNotebookId,
    );
    if (!entry) throw new MockApiError(500, "TASK_NOTEBOOK_NOT_FOUND");
    if (typeof input.description === "string")
      entry.notebook.description = input.description;
    if (typeof input.category === "string")
      entry.notebook.category = input.category as TaskCategory;
    if (Array.isArray(input.taskGroupsIds))
      entry.notebook.taskGroupsIds = input.taskGroupsIds as string[];
    return { status: 200, data: null };
  },
);

export const notebookUpdateMockHandlersRegistered = true;
