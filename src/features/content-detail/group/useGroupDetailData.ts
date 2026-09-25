import { useQuery } from "@tanstack/react-query";

import { listTaskGroupsByEducator, listTasks } from "@/api/endpoints/content";
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
  const groupsQuery = useQuery({
    queryKey: ["task-group"],
    queryFn: listTaskGroupsByEducator,
  });
  const tasksQuery = useQuery({
    queryKey: ["task"],
    queryFn: () => listTasks(),
  });

  const isPending = groupsQuery.isPending || tasksQuery.isPending;
  const isError = groupsQuery.isError || tasksQuery.isError;
  const hasData =
    groupsQuery.data !== undefined && tasksQuery.data !== undefined;
  const group = groupsQuery.data?.find((candidate) => candidate.id === groupId);
  const isNotFound = hasData && !group;

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
    refetch: () => Promise.all([groupsQuery.refetch(), tasksQuery.refetch()]),
  };
}
