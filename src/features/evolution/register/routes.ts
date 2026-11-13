// Destinos da Evolução da sessão (EVO-01).
export const HOME_ROUTE = "/" as const;

/** Telas que abrem a Evolução e para onde ela volta ao sair. */
export type EvolutionOrigin = "hub" | "entry";

/**
 * `from` só vem de quem tem uma tela para onde voltar: o hub ("hub") e os
 * atalhos da agenda, da Início e da ficha ("entry"). Sem ele — fluxo de sessão,
 * retomada — a saída vai para a Início: a pilha abaixo pode ter telas da sessão
 * já encerrada.
 */
export const evolutionRoute = (sessionId: string, from?: EvolutionOrigin) =>
  ({
    pathname: "/evolution/[sessionId]",
    params: from ? { sessionId, from } : { sessionId },
  }) as const;

/** "Ver prontuário": histórico de evoluções do paciente (EVO-02). */
export const patientRecordRoute = (studentId: string) =>
  ({
    pathname: "/patients/[id]/records",
    params: { id: studentId },
  }) as const;

/** Detalhe de uma evolução (EVO-02). */
export const evolutionRecordRoute = (evolutionId: string) =>
  ({
    pathname: "/evolution/record/[id]",
    params: { id: evolutionId },
  }) as const;
