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

/** Respostas `409` do backend: o corpo leva `message` e, no conflito, o id. */
function conflictResponse(
  message:
    | "APPOINTMENT_CONFLICT"
    | "APPOINTMENT_NOT_EDITABLE"
    | "INVALID_STATUS_TRANSITION",
  conflictingAppointmentId?: string,
) {
  return {
    status: 409,
    data: {
      message,
      ...(conflictingAppointmentId ? { conflictingAppointmentId } : {}),
    },
  };
}

/** Transições: PENDING → COMPLETED | CANCELLED e CANCELLED → PENDING. */
const allowedTransitions: Record<
  Appointment["status"],
  Appointment["status"][]
> = {
  PENDING: ["COMPLETED", "CANCELLED"],
  CANCELLED: ["PENDING"],
  COMPLETED: [],
};

/** Intervalo [início, início + duração): horários encostados não conflitam. */
function findConflict(
  candidate: Pick<Appointment, "scheduledAt" | "durationMinutes">,
  ignoreId?: string,
): Appointment | undefined {
  const start = new Date(candidate.scheduledAt).getTime();
  const end = start + candidate.durationMinutes * 60_000;

  return appointments.find((other) => {
    if (other.id === ignoreId || other.status !== "PENDING") {
      return false;
    }
    const otherStart = new Date(other.scheduledAt).getTime();
    const otherEnd = otherStart + other.durationMinutes * 60_000;

    return start < otherEnd && otherStart < end;
  });
}

registerMockHandler(
  { method: "get", path: "/appointment/:id" },
  ({ params }) => {
    const appointment = appointments.find(({ id }) => id === params.id);
    if (!appointment) {
      throw new MockApiError(400, "NOT_FOUND");
    }

    return { status: 200, data: appointment };
  },
);

registerMockHandler({ method: "post", path: "/appointment/" }, ({ body }) => {
  const input = body as {
    studentId: string;
    scheduledAt: string;
    observation?: string;
    type?: string;
    durationMinutes?: number;
  };
  const durationMinutes = input.durationMinutes ?? 50;
  const conflicting = findConflict({
    scheduledAt: input.scheduledAt,
    durationMinutes,
  });
  if (conflicting) {
    return conflictResponse("APPOINTMENT_CONFLICT", conflicting.id);
  }
  const appointment: Appointment = {
    id: `mock-appointment-${nextAppointmentId++}`,
    educatorId: MOCK_EDUCATOR.id,
    studentId: input.studentId,
    scheduledAt: input.scheduledAt,
    type: input.type ?? null,
    durationMinutes,
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
    const nextStatus = input.status ?? current.status;
    if (
      nextStatus !== current.status &&
      !allowedTransitions[current.status].includes(nextStatus)
    ) {
      return conflictResponse("INVALID_STATUS_TRANSITION");
    }
    const changesSchedule =
      input.scheduledAt !== undefined ||
      input.type !== undefined ||
      input.durationMinutes !== undefined;
    if (changesSchedule && nextStatus !== "PENDING") {
      return conflictResponse("APPOINTMENT_NOT_EDITABLE");
    }
    if (nextStatus === "PENDING") {
      const conflicting = findConflict(
        {
          scheduledAt: input.scheduledAt ?? current.scheduledAt,
          durationMinutes: input.durationMinutes ?? current.durationMinutes,
        },
        current.id,
      );
      if (conflicting) {
        return conflictResponse("APPOINTMENT_CONFLICT", conflicting.id);
      }
    }
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

    return { status: 200, data: "OK" };
  },
);

export const appointmentMockHandlersRegistered = true;
