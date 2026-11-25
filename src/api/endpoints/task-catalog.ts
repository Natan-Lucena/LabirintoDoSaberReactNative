// Banco de atividades: leitura (API-07, leva 1). Contrato PROPOSTO em
// docs/entrega-5/ESPECIFICACAO-BACKEND.md §2 (mock-first): o backend real ainda
// não o publica. Escritas (duplicar, criar/editar, resultado) não entram aqui.
import { apiClient } from "@/api/client";
import { normalizeApiError } from "@/api/errors";
import type {
  RecommendedTask,
  Task,
  TaskCatalogPage,
  TaskCategory,
  TaskFormat,
  TaskSkill,
  TaskSource,
  TaskType,
} from "@/api/types";

export interface ListTaskCatalogParams {
  search?: string;
  format?: TaskFormat;
  type?: TaskType;
  /** Código da habilidade (`GET /task/skills`). */
  skill?: string;
  category?: TaskCategory;
  /** Ausente = biblioteca e do educador. */
  source?: TaskSource;
  /** 1 a 50 (padrão do servidor: 20). */
  limit?: number;
  cursor?: string;
}

export const taskCatalogQueryKeys = {
  list: (params: ListTaskCatalogParams = {}) =>
    ["task", "catalog", params] as const,
  skills: ["task", "skills"] as const,
  recommended: (studentId: string) =>
    ["task", "recommended", studentId] as const,
};

// Query na própria URL: o adaptador de mocks lê `searchParams`, não `config.params`.
function withQuery(
  path: string,
  params: Record<string, string | number | undefined>,
): string {
  const query = new URLSearchParams(
    Object.entries(params)
      .filter(
        (entry): entry is [string, string | number] => entry[1] !== undefined,
      )
      .map(([key, value]) => [key, String(value)]),
  ).toString();

  return query ? `${path}?${query}` : path;
}

/** `printable` é `PRINTABLE`; o resto, `INTERACTIVE` (AT-03), quando o campo faltar. */
export function taskFormat(task: Pick<Task, "type" | "format">): TaskFormat {
  return (
    task.format ?? (task.type === "printable" ? "PRINTABLE" : "INTERACTIVE")
  );
}

/** Ausente = atividade do educador. */
export function taskSource(task: Partial<Task>): TaskSource {
  return task.source ?? "EDUCATOR";
}

/** Só os tipos de múltipla escolha têm `alternatives` (AT-04). */
export function isMultipleChoice(type: TaskType): boolean {
  return type === "multipleChoice" || type === "multipleChoiceWithMedia";
}

/** GET /task/catalog */
export async function listTaskCatalog(
  params: ListTaskCatalogParams = {},
): Promise<TaskCatalogPage> {
  try {
    const response = await apiClient.get<TaskCatalogPage>(
      withQuery("/task/catalog", { ...params }),
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** GET /task/skills */
export async function listTaskSkills(): Promise<TaskSkill[]> {
  try {
    const response = await apiClient.get<TaskSkill[]>("/task/skills");
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}

/** GET /task/recommended?studentId= (0 a 6 itens). */
export async function listRecommendedTasks(
  studentId: string,
): Promise<RecommendedTask[]> {
  try {
    const response = await apiClient.get<RecommendedTask[]>(
      withQuery("/task/recommended", {
        studentId: studentId === "" ? undefined : studentId,
      }),
    );
    return response.data;
  } catch (error) {
    throw normalizeApiError(error);
  }
}
