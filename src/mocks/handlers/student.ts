import { MOCK_STUDENTS } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";

registerMockHandler({ method: "get", path: "/student/" }, () => {
  return { status: 200, data: MOCK_STUDENTS };
});

export const studentMockHandlersRegistered = true;
