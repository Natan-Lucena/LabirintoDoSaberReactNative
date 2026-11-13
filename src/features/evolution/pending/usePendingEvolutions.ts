import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  evolutionQueryKeys,
  listPendingEvolutions,
} from "@/api/endpoints/evolution";
import type { ApiError } from "@/api/errors";
import type { PendingEvolution } from "@/api/types";

/**
 * Sessões finalizadas sem evolução (`GET /session-evolution/pending`). A chave
 * fica sob `evolutionQueryKeys.all`: salvar uma evolução (EVO-01) invalida
 * esta lista e os atalhos "Registrar evolução" somem. Usa a mesma chave do hub,
 * então os dois compartilham o cache.
 */
export function usePendingEvolutions(): UseQueryResult<
  PendingEvolution[],
  ApiError
> {
  return useQuery({
    queryKey: evolutionQueryKeys.pending(),
    queryFn: () => listPendingEvolutions(),
  });
}

/** Pendência do atendimento: só existe para sessão finalizada sem evolução. */
export function findPendingForAppointment(
  pending: readonly PendingEvolution[] | undefined,
  appointmentId: string,
): PendingEvolution | undefined {
  return pending?.find((item) => item.appointmentId === appointmentId);
}

/** Pendências do paciente, da mais recente para a mais antiga. */
export function pendingForStudent(
  pending: readonly PendingEvolution[] | undefined,
  studentId: string,
): PendingEvolution[] {
  return (pending ?? [])
    .filter((item) => item.studentId === studentId)
    .sort((a, b) => b.finishedAt.localeCompare(a.finishedAt));
}
