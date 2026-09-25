import { useQuery } from "@tanstack/react-query";

import {
  listTaskGroupsByEducator,
  listTaskNotebooks,
  listTasks,
} from "@/api/endpoints/content";
import { buildActivityItems } from "@/features/activities/selectors";
import type { ActivityListItem } from "@/features/activities/types";

export const activitiesQueryKeys = {
  notebooks: ["task-notebook"] as const,
  groups: ["task-group"] as const,
  tasks: ["task"] as const,
};

export interface UseActivitiesQueryResult {
  items: ActivityListItem[] | undefined;
  isPending: boolean;
  isError: boolean;
  refetch: () => Promise<unknown[]>;
}

export function useActivitiesQuery(): UseActivitiesQueryResult {
  const notebooksQuery = useQuery({
    queryKey: activitiesQueryKeys.notebooks,
    queryFn: () => listTaskNotebooks(),
  });
  const groupsQuery = useQuery({
    queryKey: activitiesQueryKeys.groups,
    queryFn: listTaskGroupsByEducator,
  });
  const tasksQuery = useQuery({
    queryKey: activitiesQueryKeys.tasks,
    queryFn: () => listTasks(),
  });
  const queries = [notebooksQuery, groupsQuery, tasksQuery];
  const isPending = queries.some((query) => query.isPending);
  const isError = queries.some((query) => query.isError);
  const hasData = queries.every((query) => query.data !== undefined);

  const items = hasData
    ? buildActivityItems(
        notebooksQuery.data!,
        groupsQuery.data!,
        tasksQuery.data!,
      )
    : undefined;

  return {
    items,
    isPending,
    isError,
    refetch: async () => Promise.all(queries.map((query) => query.refetch())),
  };
}
