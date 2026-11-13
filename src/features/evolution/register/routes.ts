// Destinos da Evolução da sessão (EVO-01).
export const HOME_ROUTE = "/" as const;

export const evolutionRoute = (sessionId: string) =>
  ({
    pathname: "/evolution/[sessionId]",
    params: { sessionId },
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
