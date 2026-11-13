// Destinos da Evolução da sessão (EVO-01).
export const HOME_ROUTE = "/" as const;

export const evolutionRoute = (sessionId: string) =>
  ({
    pathname: "/evolution/[sessionId]",
    params: { sessionId },
  }) as const;

/**
 * "Ver prontuário": o prontuário (`/patients/[id]/records`) chega com a EVO-02.
 * Até lá, o destino é a ficha do paciente.
 */
export const patientRecordRoute = (studentId: string) =>
  ({
    pathname: "/patients/[id]",
    params: { id: studentId },
  }) as const;
