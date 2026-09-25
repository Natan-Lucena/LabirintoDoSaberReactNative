import type { Appointment } from "@/api/types";
import {
  getMockHomeScenario,
  MOCK_APPOINTMENTS,
  MOCK_EDUCATOR,
} from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

let appointments = MOCK_APPOINTMENTS.map((appointment) => ({ ...appointment }));
let nextAppointmentId = 1;

registerMockHandler({ method: "get", path: "/appointment/" }, () => {
  return {
    status: 200,
    data: getMockHomeScenario() === "no-appointments" ? [] : appointments,
  };
});

registerMockHandler({ method: "post", path: "/appointment/" }, ({ body }) => {
  const input = body as {
    studentId: string;
    scheduledAt: string;
    observation?: string;
  };
  const appointment: Appointment = {
    id: `mock-appointment-${nextAppointmentId++}`,
    educatorId: MOCK_EDUCATOR.id,
    studentId: input.studentId,
    scheduledAt: input.scheduledAt,
    ...(input.observation === undefined
      ? {}
      : { observation: input.observation }),
    status: "PENDING",
    createdAt: new Date().toISOString(),
  };
  appointments = [...appointments, appointment];

  return { status: 201, data: appointment };
});

registerMockHandler(
  { method: "put", path: "/appointment/:id" },
  ({ body, params }) => {
    const index = appointments.findIndex(({ id }) => id === params.id);
    if (index === -1) {
      throw new MockApiError(400, "NOT_FOUND");
    }
    const input = body as { scheduledAt?: string; observation?: string | null };
    const current = appointments[index];
    const updated: Appointment = {
      ...current,
      ...(input.scheduledAt === undefined
        ? {}
        : { scheduledAt: input.scheduledAt }),
      ...(input.observation === undefined
        ? {}
        : input.observation === null
          ? { observation: undefined }
          : { observation: input.observation }),
    };
    appointments[index] = updated;

    return { status: 200, data: updated };
  },
);

registerMockHandler(
  { method: "delete", path: "/appointment/:id" },
  ({ params }) => {
    const index = appointments.findIndex(({ id }) => id === params.id);
    if (index === -1) {
      throw new MockApiError(400, "NOT_FOUND");
    }
    appointments.splice(index, 1);

    return { status: 200, data: undefined };
  },
);

export const appointmentMockHandlersRegistered = true;
