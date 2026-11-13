import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  listScaleApplications,
  listScaleTemplates,
  scaleQueryKeys,
} from "@/api/endpoints/scales";
import type {
  ScaleApplicationSummary,
  ScaleTemplateSummary,
} from "@/api/types";

export function useScaleTemplates(): UseQueryResult<ScaleTemplateSummary[]> {
  return useQuery({
    queryKey: scaleQueryKeys.templates(),
    queryFn: () => listScaleTemplates(),
  });
}

/** Aplicações recentes (mais recente primeiro, ordem do servidor). */
export function useRecentApplications(
  studentId?: string,
): UseQueryResult<ScaleApplicationSummary[]> {
  const filters = studentId ? { studentId, limit: 20 } : { limit: 20 };

  return useQuery({
    queryKey: scaleQueryKeys.applications(filters),
    queryFn: () => listScaleApplications(filters),
  });
}
