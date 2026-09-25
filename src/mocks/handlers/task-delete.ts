import { MOCK_TASKS } from "@/mocks/handlers/content";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

// GET /task/:id (D-02): não havia handler registrado para busca por id.
registerMockHandler({ method: "get", path: "/task/:id" }, ({ params }) => {
  const task = MOCK_TASKS.find(({ id }) => id === params.id);
  if (!task) {
    throw new MockApiError(500, "TASK_NOT_FOUND");
  }

  return { status: 200, data: task };
});

// DELETE /task/delete/:id (D-05).
registerMockHandler(
  { method: "delete", path: "/task/delete/:id" },
  ({ params }) => {
    const index = MOCK_TASKS.findIndex(({ id }) => id === params.id);
    if (index === -1) {
      throw new MockApiError(500, "TASK_NOT_FOUND");
    }
    MOCK_TASKS.splice(index, 1);

    return { status: 200, data: undefined };
  },
);

export const taskDeleteMockHandlersRegistered = true;
