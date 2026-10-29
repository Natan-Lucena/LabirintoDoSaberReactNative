import { useQuery } from "@tanstack/react-query";

import { getTaskGroupById, listTasks } from "@/api/endpoints/content";
import { ApiError } from "@/api/errors";
import type { Task, TaskGroup } from "@/api/types";

export interface UseGroupDetailDataResult {
  group: TaskGroup | undefined;
  tasks: Task[];
  isPending: boolean;
  isError: boolean;
  isNotFound: boolean;
  refetch: () => Promise<unknown>;
}

export function useGroupDetailData(groupId: string): UseGroupDetailDataResult {
  const groupQuery = useQuery({
    queryKey: ["task-group", groupId],
    queryFn: () => getTaskGroupById(groupId),
  });
  const tasksQuery = useQuery({
    queryKey: ["task"],
    queryFn: () => listTasks(),
  });

  const group = groupQuery.data;
  const isPending = groupQuery.isPending || (!!group && tasksQuery.isPending);
  const isNotFound =
    groupQuery.error instanceof ApiError &&
    [403, 404].includes(groupQuery.error.status ?? 0);
  const isError =
    (groupQuery.isError && !isNotFound) || (!!group && tasksQuery.isError);

  const tasks = group
    ? group.tasksIds
        .map((taskId) => tasksQuery.data?.find((task) => task.id === taskId))
        .filter((task): task is Task => task !== undefined)
    : [];

  return {
    group,
    tasks,
    isPending,
    isError,
    isNotFound,
    refetch: () => Promise.all([groupQuery.refetch(), tasksQuery.refetch()]),
  };
}
