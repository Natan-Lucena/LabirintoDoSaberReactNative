import { MOCK_TASK_GROUPS } from "@/mocks/handlers/content";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

registerMockHandler(
  { method: "delete", path: "/task-group/delete/:taskGroupId" },
  ({ params }) => {
    const index = MOCK_TASK_GROUPS.findIndex(
      (group) => group.id === params.taskGroupId,
    );
    if (index === -1) {
      throw new MockApiError(500, "TASK_GROUP_NOT_FOUND");
    }
    MOCK_TASK_GROUPS.splice(index, 1);

    return { status: 200, data: null };
  },
);

export const groupDeleteMockHandlerRegistered = true;
