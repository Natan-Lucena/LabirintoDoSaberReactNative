import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  listStudentOverview,
  studentStatusQueryKeys,
} from "@/api/endpoints/student-status";
import type { PatientOverview } from "@/api/types";

/**
 * Overview dos pacientes ativos (PAC-10). Registrar evolução, salvar plano etc.
 * mudam as pendências sem invalidar esta chave: por isso `staleTime: 0` e
 * recarga ao montar (como o contador do sino).
 */
export function usePatientOverview() {
  const query = useQuery({
    queryKey: studentStatusQueryKeys.overview("ACTIVE"),
    queryFn: () => listStudentOverview("ACTIVE"),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const byId = useMemo(
    () =>
      new Map<string, PatientOverview>(
        (query.data ?? []).map((item) => [item.studentId, item]),
      ),
    [query.data],
  );
  return { query, byId };
}
