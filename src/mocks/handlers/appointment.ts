import { getMockHomeScenario, MOCK_APPOINTMENTS } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";

registerMockHandler({ method: "get", path: "/appointment/" }, () => {
  return {
    status: 200,
    data: getMockHomeScenario() === "no-appointments" ? [] : MOCK_APPOINTMENTS,
  };
});

export const appointmentMockHandlersRegistered = true;
