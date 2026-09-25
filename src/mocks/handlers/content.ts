import { MOCK_TASK_NOTEBOOKS } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";

registerMockHandler({ method: "get", path: "/task-notebook/" }, () => {
  return { status: 200, data: MOCK_TASK_NOTEBOOKS };
});

export const contentMockHandlersRegistered = true;
