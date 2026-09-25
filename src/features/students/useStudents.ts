import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import { listStudents } from "@/api/endpoints/student";
import type { ApiError } from "@/api/errors";
import type { Student } from "@/api/types";

export function useStudents(): UseQueryResult<Student[], ApiError> {
  return useQuery({ queryKey: ["student"], queryFn: listStudents });
}
