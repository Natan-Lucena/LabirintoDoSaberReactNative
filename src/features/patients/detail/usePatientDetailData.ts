import { useQuery, type UseQueryResult } from "@tanstack/react-query";

import {
  getStudentAnalysis,
  type StudentAnalysis,
} from "@/api/endpoints/session-analysis";
import { listSessionsByStudent } from "@/api/endpoints/session";
import type { ApiError } from "@/api/errors";
import type { TaskNotebookSession } from "@/api/types";

export function useStudentAnalysis(
  studentId: string,
): UseQueryResult<StudentAnalysis, ApiError> {
  return useQuery({
    queryKey: ["student-analysis", studentId, 6],
    queryFn: () => getStudentAnalysis(studentId, { limit: 6 }),
    enabled: Boolean(studentId),
  });
}

export function useStudentSessions(
  studentId: string,
): UseQueryResult<TaskNotebookSession[], ApiError> {
  return useQuery({
    queryKey: ["task-notebook-session", "student", studentId],
    queryFn: () => listSessionsByStudent(studentId),
    enabled: Boolean(studentId),
  });
}
