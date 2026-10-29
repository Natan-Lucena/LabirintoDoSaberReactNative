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
    type?: string;
    durationMinutes?: number;
  };
  const appointment: Appointment = {
    id: `mock-appointment-${nextAppointmentId++}`,
    educatorId: MOCK_EDUCATOR.id,
    studentId: input.studentId,
    scheduledAt: input.scheduledAt,
    type: input.type ?? null,
    durationMinutes: input.durationMinutes ?? 50,
    notifiedAt: null,
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
    const input = body as {
      scheduledAt?: string;
      observation?: string | null;
      status?: Appointment["status"];
      type?: string;
      durationMinutes?: number;
    };
    const current = appointments[index];
    const updated: Appointment = {
      ...current,
      ...(input.scheduledAt === undefined
        ? {}
        : { scheduledAt: input.scheduledAt }),
      ...(input.status === undefined ? {} : { status: input.status }),
      ...(input.type === undefined ? {} : { type: input.type }),
      ...(input.durationMinutes === undefined
        ? {}
        : { durationMinutes: input.durationMinutes }),
      ...(input.observation === undefined
        ? {}
        : input.observation === null
          ? { observation: null }
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
