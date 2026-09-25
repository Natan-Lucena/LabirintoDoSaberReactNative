import { apiClient } from "@/api/client";
import type {
  Task,
  TaskCategory,
  TaskGroup,
  TaskNotebookWithGroups,
  TaskType,
} from "@/api/types";

/** GET /task-notebook/ */
export interface ListTaskNotebooksParams {
  id?: string;
  educatorId?: string;
  category?: TaskCategory;
  descriptionContains?: string;
}

export async function listTaskNotebooks(
  params?: ListTaskNotebooksParams,
): Promise<TaskNotebookWithGroups[]> {
  const response = await apiClient.get<TaskNotebookWithGroups[]>(
    "/task-notebook/",
    { params },
  );

  return response.data;
}

/** GET /task-group/list-by-educator */
export async function listTaskGroupsByEducator(): Promise<TaskGroup[]> {
  const response = await apiClient.get<TaskGroup[]>(
    "/task-group/list-by-educator",
  );

  return response.data;
}

/** GET /task/ */
export interface ListTasksParams {
  id?: string;
  category?: TaskCategory;
  type?: TaskType;
  promptContains?: string;
}

export async function listTasks(params?: ListTasksParams): Promise<Task[]> {
  const response = await apiClient.get<Task[]>("/task/", { params });

  return response.data;
}

/** GET /task/:id */
export async function getTaskById(id: string): Promise<Task> {
  const response = await apiClient.get<Task>(`/task/${id}`);

  return response.data;
}
