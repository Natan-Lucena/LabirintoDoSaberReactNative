import { useQuery } from "@tanstack/react-query";

import {
  listTaskGroupsByEducator,
  listTaskNotebooks,
  listTasks,
} from "@/api/endpoints/content";
import type { TaskCategory } from "@/api/types";
import type { SessionFlowContentKind } from "@/stores/session-flow";

export interface ContentCatalogItem {
  kind: SessionFlowContentKind;
  id: string;
  name: string;
  tags: string[];
}

export interface UseContentCatalogResult {
  items: ContentCatalogItem[];
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  reading: "Leitura",
  writing: "Escrita",
  vocabulary: "Vocabulário",
  comprehension: "Compreensão",
};

export function categoryLabel(category: TaskCategory): string {
  return CATEGORY_LABELS[category];
}

export const contentCatalogQueryKey = (
  chip: SessionFlowContentKind,
): readonly [string, SessionFlowContentKind] => ["content-catalog", chip];

export function useContentCatalog(
  chip: SessionFlowContentKind,
): UseContentCatalogResult {
  const query = useQuery({
    queryKey: contentCatalogQueryKey(chip),
    queryFn: async (): Promise<ContentCatalogItem[]> => {
      if (chip === "notebook") {
        const notebooks = await listTaskNotebooks();
        return notebooks.map(({ notebook }) => ({
          kind: "notebook" as const,
          id: notebook.id,
          name: notebook.description,
          tags: [
            categoryLabel(notebook.category),
            `${notebook.tasks.length} tarefas`,
          ],
        }));
      }
      if (chip === "group") {
        const groups = await listTaskGroupsByEducator();
        return groups.map((group) => ({
          kind: "group" as const,
          id: group.id,
          name: group.name,
          tags: [
            categoryLabel(group.category),
            `${group.tasksIds.length} tarefas`,
          ],
        }));
      }
      const tasks = await listTasks();
      return tasks.map((task) => ({
        kind: "task" as const,
        id: task.id,
        name: task.prompt,
        tags: [categoryLabel(task.category)],
      }));
    },
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: () => {
      query.refetch();
    },
  };
}
