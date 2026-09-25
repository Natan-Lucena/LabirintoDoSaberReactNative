import { apiClient } from "@/api/client";
import type { Appointment } from "@/api/types";

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
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  const response = await apiClient.post<Appointment>("/appointment/", input);

  return response.data;
}

/**
 * PUT /appointment/:id
 * Somente `scheduledAt` e `observation` são aceitos; aluno e status não
 * mudam. `observation: null` limpa a observação existente.
 */
export interface UpdateAppointmentInput {
  scheduledAt?: string;
  observation?: string | null;
}

export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
): Promise<Appointment> {
  const response = await apiClient.put<Appointment>(
    `/appointment/${id}`,
    input,
  );

  return response.data;
}

/** DELETE /appointment/:id */
export async function deleteAppointment(id: string): Promise<void> {
  await apiClient.delete<void>(`/appointment/${id}`);
}
