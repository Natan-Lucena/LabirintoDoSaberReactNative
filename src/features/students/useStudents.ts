import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { listStudents } from "@/api/endpoints/student";
import { listStudentsByStatus } from "@/api/endpoints/student-status";
import type { ApiError } from "@/api/errors";
import type { Student, StudentStatusFilter } from "@/api/types";

export interface UseStudentsOptions {
  /** Sem `status` vale a lista ativa de sempre, com a chave `["student"]`. */
  status?: StudentStatusFilter;
  enabled?: boolean;
}

/**
 * `useStudents()` = pacientes ativos (chave `["student"]`). Com `status`
 * (`ARCHIVED` ou `ALL`, PAC-11) a chave é `["student", { status }]`, que também
 * cai sob as invalidações de `["student"]`.
 */
export function useStudents({
  status,
  enabled = true,
}: UseStudentsOptions = {}): UseQueryResult<Student[], ApiError> {
  return useQuery({
    queryKey: status ? ["student", { status }] : ["student"],
    queryFn: status ? () => listStudentsByStatus(status) : listStudents,
    enabled,
  });
}
