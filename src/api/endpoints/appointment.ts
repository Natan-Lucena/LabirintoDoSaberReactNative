import { apiClient } from "@/api/client";
import type { Appointment, AppointmentStatus } from "@/api/types";

/** GET /appointment/ */
export async function listAppointments(): Promise<Appointment[]> {
  const response = await apiClient.get<Appointment[]>("/appointment/");

  return response.data;
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
  const response = await apiClient.post<Appointment>("/appointment/", {
    ...input,
    scheduledAt: new Date(input.scheduledAt).toISOString(),
  });

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
  const response = await apiClient.put<Appointment>(`/appointment/${id}`, {
    ...input,
    ...(input.scheduledAt === undefined
      ? {}
      : { scheduledAt: new Date(input.scheduledAt).toISOString() }),
  });

  return response.data;
}

/** DELETE /appointment/:id */
export async function deleteAppointment(id: string): Promise<void> {
  await apiClient.delete<void>(`/appointment/${id}`);
}
