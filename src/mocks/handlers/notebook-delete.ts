import { MOCK_TASK_NOTEBOOKS } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

registerMockHandler(
  { method: "delete", path: "/task-notebook/delete/:taskNotebookId" },
  ({ params }) => {
    const index = MOCK_TASK_NOTEBOOKS.findIndex(
      ({ notebook }) => notebook.id === params.taskNotebookId,
    );
    if (index === -1) {
      throw new MockApiError(500, "TASK_NOTEBOOK_NOT_FOUND");
    }
    MOCK_TASK_NOTEBOOKS.splice(index, 1);

    return { status: 200, data: null };
  },
);

export const notebookDeleteMockHandlersRegistered = true;
