import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  getSessionReport,
  type SessionReport,
} from "@/api/endpoints/session-report";
import type { ApiError } from "@/api/errors";

export function useSessionReport(
  sessionId: string,
): UseQueryResult<SessionReport, ApiError> {
  return useQuery({
    queryKey: ["task-notebook-session", "report", sessionId],
    queryFn: () => getSessionReport(sessionId),
    enabled: Boolean(sessionId),
  });
}
