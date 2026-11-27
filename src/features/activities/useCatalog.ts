// Leituras do banco de atividades (ATV-09): catálogo paginado por cursor,
// habilidades, recomendação e paciente de contexto.
import { useCallback, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  listRecommendedTasks,
  listTaskCatalog,
  listTaskSkills,
  taskCatalogQueryKeys,
  type ListTaskCatalogParams,
} from "@/api/endpoints/task-catalog";
import { ApiError } from "@/api/errors";
import type { RecommendedTask, TaskSkill, TaskSummary } from "@/api/types";
import { useAppointments } from "@/features/appointments/useAppointments";
import { selectTodayAppointments } from "@/features/home/selectors";
import { useStudents } from "@/features/students/useStudents";

/** `search` só vai ao servidor com 2 ou mais letras (já sem espaços nas pontas). */
export const MIN_SEARCH_LENGTH = 2;

export function effectiveSearch(search: string): string | undefined {
  const trimmed = search.trim();
  return trimmed.length >= MIN_SEARCH_LENGTH ? trimmed : undefined;
}

export function firstName(name: string | undefined): string {
  return name?.trim().split(/\s+/)[0] ?? "";
}

export interface UseTaskCatalogResult {
  items: TaskSummary[];
  isPending: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  /** Erro ao carregar a página seguinte (a lista já carregada continua). */
  loadMoreError: unknown;
  refetch: () => void;
  loadMore: () => void;
}

export function useTaskCatalog(
  params: ListTaskCatalogParams,
  enabled = true,
): UseTaskCatalogResult {
  const queryClient = useQueryClient();
  const key = taskCatalogQueryKeys.list(params);
  const query = useInfiniteQuery({
    queryKey: key,
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      listTaskCatalog({ ...params, cursor: pageParam }),
    getNextPageParam: (last) => last.nextCursor,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );
  const loadMoreError =
    query.isFetchNextPageError && query.error ? query.error : undefined;
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const refetch = useCallback(() => {
    // Cursor inválido: recomeça do início em vez de repetir a página.
    if (
      loadMoreError instanceof ApiError &&
      loadMoreError.code === "INVALID_CURSOR"
    ) {
      void queryClient.resetQueries({ queryKey: key });
      return;
    }
    void query.refetch();
  }, [loadMoreError, queryClient, key, query]);

  return {
    items,
    isPending: query.isPending,
    isError: query.isError && !query.isFetchNextPageError,
    hasNextPage,
    isFetchingNextPage,
    loadMoreError,
    refetch,
    loadMore,
  };
}

export function useTaskSkills() {
  return useQuery<TaskSkill[]>({
    queryKey: taskCatalogQueryKeys.skills,
    queryFn: listTaskSkills,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useRecommendedTasks(studentId: string | undefined) {
  return useQuery<RecommendedTask[]>({
    queryKey: taskCatalogQueryKeys.recommended(studentId ?? ""),
    queryFn: () => listRecommendedTasks(studentId!),
    enabled: Boolean(studentId),
    retry: false,
  });
}

export interface ActivityContextStudent {
  studentId: string | undefined;
  firstName: string;
}

/** Parâmetro da rota, senão o próximo atendimento `PENDING` de hoje, senão nenhum. */
export function useActivityContextStudent(
  studentIdParam?: string,
): ActivityContextStudent {
  const students = useStudents();
  const appointments = useAppointments();
  const [now] = useState(() => Date.now());

  const studentId = useMemo(() => {
    if (studentIdParam) return studentIdParam;
    const next = selectTodayAppointments(appointments.data ?? []).find(
      (appointment) =>
        appointment.status === "PENDING" &&
        new Date(appointment.scheduledAt).getTime() +
          appointment.durationMinutes * 60_000 >
          now,
    );
    return next?.studentId;
  }, [studentIdParam, appointments.data, now]);

  const student = students.data?.find(({ id }) => id === studentId);
  return { studentId, firstName: firstName(student?.name) };
}
