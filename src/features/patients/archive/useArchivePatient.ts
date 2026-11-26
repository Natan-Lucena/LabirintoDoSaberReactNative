import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  StudentStatusConflictError,
  updateStudentStatus,
  type UpdateStudentStatusInput,
} from "@/api/endpoints/student-status";
import { ApiError } from "@/api/errors";
import { OfflineError, withOfflineGuard } from "@/api/query-client";

/** `idle` → `confirm` → `confirmCancel(count)` → `idle` (PAC-11 §7). */
export type ArchiveStep =
  | { type: "idle" }
  | { type: "confirm" }
  | { type: "confirmCancel"; count?: number };

const IDLE: ArchiveStep = { type: "idle" };

export function archiveErrorMessage(error: unknown): string {
  if (error instanceof OfflineError) {
    return "Sem conexão com a internet. Verifique a rede e tente novamente.";
  }
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return "Só quem cadastrou o paciente pode arquivá-lo.";
    }
    if (error.code === "STUDENT_NOT_FOUND") {
      return "Paciente não encontrado";
    }
    // Backend sem a rota PUT /student/:id/status (404 sem code).
    if (error.status === 404 && !error.code) {
      return "Não foi possível arquivar agora.";
    }
    return error.message;
  }
  return "Não foi possível concluir. Tente novamente.";
}

function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.code === "STUDENT_NOT_FOUND";
}

export interface UseArchivePatientOptions {
  studentId: string;
  onToast: (message: string) => void;
  /** `404 STUDENT_NOT_FOUND`: a tela volta à lista. */
  onNotFound: () => void;
}

export interface ArchivePatientControls {
  step: ArchiveStep;
  loading: boolean;
  /** Erro da última tentativa, mostrado dentro da confirmação aberta. */
  error: string | null;
  open: () => void;
  keep: () => void;
  /** Primeira tentativa: nunca manda `cancelFutureAppointments` (AC-PAC-11-01). */
  archive: () => void;
  /** Só depois do segundo toque, na confirmação dos atendimentos futuros. */
  archiveAndCancel: () => void;
  reactivate: () => void;
}

export function useArchivePatient({
  studentId,
  onToast,
  onNotFound,
}: UseArchivePatientOptions): ArchivePatientControls {
  const client = useQueryClient();
  const [step, setStep] = useState<ArchiveStep>(IDLE);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: withOfflineGuard((input: UpdateStudentStatusInput) =>
      updateStudentStatus(studentId, input),
    ),
    onSuccess: async () => {
      // Lista, overview, detalhe e arquivados; atendimentos cancelados; avisos (PAC-11 §5).
      await Promise.all([
        client.invalidateQueries({ queryKey: ["student"] }),
        client.invalidateQueries({ queryKey: ["appointment"] }),
        client.invalidateQueries({ queryKey: ["notifications"] }),
      ]);
    },
  });

  function send(
    input: UpdateStudentStatusInput,
    options: { dialog: boolean; successMessage: string },
  ): void {
    setError(null);
    mutation.mutate(input, {
      onSuccess: () => {
        setStep(IDLE);
        onToast(options.successMessage);
      },
      onError: (failure) => {
        if (failure instanceof StudentStatusConflictError) {
          setStep({ type: "confirmCancel", count: failure.count });
          return;
        }
        if (isNotFound(failure)) {
          setStep(IDLE);
          onToast("Paciente não encontrado");
          onNotFound();
          return;
        }
        const message = archiveErrorMessage(failure);
        if (options.dialog) setError(message);
        else onToast(message);
      },
    });
  }

  return {
    step,
    loading: mutation.isPending,
    error,
    open: () => {
      setError(null);
      setStep({ type: "confirm" });
    },
    keep: () => {
      setError(null);
      setStep(IDLE);
    },
    archive: () =>
      send(
        { status: "ARCHIVED" },
        { dialog: true, successMessage: "Paciente arquivado" },
      ),
    archiveAndCancel: () =>
      send(
        { status: "ARCHIVED", cancelFutureAppointments: true },
        { dialog: true, successMessage: "Paciente arquivado" },
      ),
    reactivate: () =>
      send(
        { status: "ACTIVE" },
        { dialog: false, successMessage: "Paciente reativado" },
      ),
  };
}
