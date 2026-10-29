import type { AxiosResponse } from "axios";

import { apiClient } from "@/api/client";
import { ApiError } from "@/api/errors";
import type { Appointment, AppointmentStatus } from "@/api/types";

/** GET /appointment/ */
export async function listAppointments(): Promise<Appointment[]> {
  const response = await apiClient.get<Appointment[]>("/appointment/");

  return response.data;
}

/** GET /appointment/:id — id inexistente responde `400 NOT_FOUND`. */
export async function getAppointment(id: string): Promise<Appointment> {
  const response = await apiClient.get<Appointment>(`/appointment/${id}`);

  return response.data;
}

/**
 * Erro `409` do atendimento (`APPOINTMENT_CONFLICT`, `APPOINTMENT_NOT_EDITABLE`,
 * `INVALID_STATUS_TRANSITION`). O cliente HTTP normaliza só `message`; o `409`
 * é lido aqui para preservar `conflictingAppointmentId`.
 */
export class AppointmentApiError extends ApiError {
  readonly conflictingAppointmentId?: string;

  constructor({
    conflictingAppointmentId,
    ...rest
  }: ConstructorParameters<typeof ApiError>[0] & {
    conflictingAppointmentId?: string;
  }) {
    super(rest);
    this.name = "AppointmentApiError";
    this.conflictingAppointmentId = conflictingAppointmentId;
  }
}

const acceptConflict = {
  validateStatus: (status: number) =>
    (status >= 200 && status < 300) || status === 409,
};

function throwOnConflict(response: AxiosResponse<unknown>): void {
  if (response.status !== 409) {
    return;
  }
  const body = (response.data ?? {}) as {
    message?: unknown;
    conflictingAppointmentId?: unknown;
  };
  const code = typeof body.message === "string" ? body.message : undefined;

  throw new AppointmentApiError({
    message: code ?? "Conflict",
    status: 409,
    code,
    conflictingAppointmentId:
      typeof body.conflictingAppointmentId === "string"
        ? body.conflictingAppointmentId
        : undefined,
  });
}

/** POST /appointment/ */
export interface CreateAppointmentInput {
  studentId: string;
  scheduledAt: string;
  observation?: string;
  type?: string;
  durationMinutes?: number;
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  const response = await apiClient.post<Appointment>(
    "/appointment/",
    {
      ...input,
      scheduledAt: new Date(input.scheduledAt).toISOString(),
    },
    acceptConflict,
  );
  throwOnConflict(response);

  return response.data;
}

/**
 * PUT /appointment/:id
 * Aceita horário, observação, status, tipo e duração. O aluno não muda.
 * `observation: null` limpa a observação existente.
 */
export interface UpdateAppointmentInput {
  scheduledAt?: string;
  observation?: string | null;
  status?: AppointmentStatus;
  type?: string;
  durationMinutes?: number;
}

export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
): Promise<Appointment> {
  const response = await apiClient.put<Appointment>(
    `/appointment/${id}`,
    {
      ...input,
      ...(input.scheduledAt === undefined
        ? {}
        : { scheduledAt: new Date(input.scheduledAt).toISOString() }),
    },
    acceptConflict,
  );
  throwOnConflict(response);

  return response.data;
}

/** DELETE /appointment/:id */
export async function deleteAppointment(id: string): Promise<void> {
  await apiClient.delete<void>(`/appointment/${id}`);
}
