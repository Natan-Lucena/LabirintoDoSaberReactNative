import {
  useMutation,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";

import {
  createAppointment,
  deleteAppointment,
  type CreateAppointmentInput,
  updateAppointment,
  type UpdateAppointmentInput,
} from "@/api/endpoints/appointment";
import { ApiError } from "@/api/errors";
import { withOfflineGuard } from "@/api/query-client";
import type { Appointment } from "@/api/types";
import { appointmentQueryKeys } from "@/features/appointments/useAppointments";

export interface UpdateAppointmentVariables {
  id: string;
  input: UpdateAppointmentInput;
}

export interface RescheduleAppointmentVariables {
  id: string;
  scheduledAt: string;
}

export interface AppointmentMutationOptions<TVariables, TData> {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onSuccess?: (data: TData, ...args: unknown[]) => void | Promise<void>;
  onError?: (error: Error, ...args: unknown[]) => void | Promise<void>;
}

async function invalidateAppointments(client: QueryClient): Promise<void> {
  await client.invalidateQueries({ queryKey: appointmentQueryKeys.all });
}

async function refetchOnNotFound(
  client: QueryClient,
  error: Error,
): Promise<void> {
  if (
    error instanceof ApiError &&
    error.status === 400 &&
    error.code === "NOT_FOUND"
  ) {
    await client.refetchQueries({ queryKey: appointmentQueryKeys.all });
  }
}

export function createAppointmentMutationOptions(
  _client: QueryClient,
): AppointmentMutationOptions<CreateAppointmentInput, Appointment> {
  return {
    mutationFn: withOfflineGuard(createAppointment),
    onSuccess: () => invalidateAppointments(_client),
  };
}

export function updateAppointmentMutationOptions(
  _client: QueryClient,
): AppointmentMutationOptions<UpdateAppointmentVariables, Appointment> {
  return {
    mutationFn: withOfflineGuard(({ id, input }) =>
      updateAppointment(id, input),
    ),
    onSuccess: () => invalidateAppointments(_client),
    onError: (error) => refetchOnNotFound(_client, error),
  };
}

export function rescheduleAppointmentMutationOptions(
  _client: QueryClient,
): AppointmentMutationOptions<RescheduleAppointmentVariables, Appointment> {
  return {
    mutationFn: withOfflineGuard(({ id, scheduledAt }) =>
      updateAppointment(id, { scheduledAt }),
    ),
    onSuccess: () => invalidateAppointments(_client),
    onError: (error) => refetchOnNotFound(_client, error),
  };
}

export function deleteAppointmentMutationOptions(
  _client: QueryClient,
): AppointmentMutationOptions<string, void> {
  return {
    mutationFn: withOfflineGuard(deleteAppointment),
    onSuccess: () => invalidateAppointments(_client),
    onError: (error) => refetchOnNotFound(_client, error),
  };
}

export function useCreateAppointmentMutation(): UseMutationResult<
  Appointment,
  Error,
  CreateAppointmentInput
> {
  return useMutation(createAppointmentMutationOptions(useQueryClient()));
}

export function useUpdateAppointmentMutation(): UseMutationResult<
  Appointment,
  Error,
  UpdateAppointmentVariables
> {
  return useMutation(updateAppointmentMutationOptions(useQueryClient()));
}

export function useRescheduleAppointmentMutation(): UseMutationResult<
  Appointment,
  Error,
  RescheduleAppointmentVariables
> {
  return useMutation(rescheduleAppointmentMutationOptions(useQueryClient()));
}

export function useDeleteAppointmentMutation(): UseMutationResult<
  void,
  Error,
  string
> {
  return useMutation(deleteAppointmentMutationOptions(useQueryClient()));
}
