import type { Task, TaskGroup, TaskNotebookWithGroups } from "@/api/types";
import type {
  ActivityKind,
  ActivityListItem,
} from "@/features/activities/types";

export const PAGE_SIZE = 10;

export const CATEGORY_LABELS = {
  reading: "Leitura",
  writing: "Escrita",
  vocabulary: "Vocabulário",
  comprehension: "Compreensão",
} as const;

export const KIND_LABELS: Record<ActivityKind, string> = {
  notebook: "Caderno",
  group: "Grupo",
  task: "Atividade",
};

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}

export function normalizeText(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function buildActivityItems(
  notebooks: TaskNotebookWithGroups[],
  groups: TaskGroup[],
  tasks: Task[],
): ActivityListItem[] {
  const notebookItems: ActivityListItem[] = notebooks.map(({ notebook }) => ({
    id: notebook.id,
    kind: "notebook",
    title: notebook.description,
    secondary: pluralize(notebook.tasks.length, "tarefa", "tarefas"),
    category: notebook.category,
  }));

  const groupItems: ActivityListItem[] = groups.map((group) => ({
    id: group.id,
    kind: "group",
    title: group.name,
    secondary: pluralize(group.tasksIds.length, "atividade", "atividades"),
    category: group.category,
  }));

  const taskItems: ActivityListItem[] = tasks.map((task) => ({
    id: task.id,
    kind: "task",
    title: task.prompt,
    secondary: `${task.alternatives.length} alternativas`,
    category: task.category,
  }));

  return [...notebookItems, ...groupItems, ...taskItems];
}

export type ActivityFilterKey = "all" | ActivityKind;

export function filterByKind(
  items: ActivityListItem[],
  filter: ActivityFilterKey,
): ActivityListItem[] {
  if (filter === "all") {
    return items;
  }
  return items.filter((item) => item.kind === filter);
}

export function filterBySearch(
  items: ActivityListItem[],
  query: string,
): ActivityListItem[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return items;
  }
  return items.filter((item) =>
    normalizeText(item.title).includes(normalizedQuery),
  );
}

export interface PaginatedResult {
  pageItems: ActivityListItem[];
  totalPages: number;
}

export function paginate(
  items: ActivityListItem[],
  page: number,
  pageSize: number = PAGE_SIZE,
): PaginatedResult {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
  };
}
