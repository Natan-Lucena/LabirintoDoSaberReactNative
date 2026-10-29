import { AppointmentApiError } from "@/api/endpoints/appointment";
import { ApiError } from "@/api/errors";

export const CONFLICT_MESSAGE = "Já existe um atendimento nesse horário";

export function isAppointmentNotFound(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.status === 400 &&
    error.code === "NOT_FOUND"
  );
}

/** Id do atendimento que ocupa o horário, quando o erro é um conflito. */
export function conflictingAppointmentId(error: unknown): string | undefined {
  return error instanceof AppointmentApiError &&
    error.code === "APPOINTMENT_CONFLICT"
    ? error.conflictingAppointmentId
    : undefined;
}

export function appointmentErrorMessage(error: unknown): string {
  if (isAppointmentNotFound(error)) {
    return "Atendimento não encontrado";
  }
  if (error instanceof ApiError) {
    if (error.code === "APPOINTMENT_CONFLICT") {
      return CONFLICT_MESSAGE;
    }
    if (error.code === "APPOINTMENT_NOT_EDITABLE") {
      return "Este atendimento não permite alterar horário, tipo ou duração.";
    }
    if (error.code === "INVALID_STATUS_TRANSITION") {
      return "Essa mudança de status não é permitida.";
    }
  }
  return "Não foi possível concluir a ação. Tente novamente.";
}
