import { apiClient } from "@/api/client";

/** DELETE /task-notebook/delete/:taskNotebookId */
export async function deleteTaskNotebook(
  taskNotebookId: string,
): Promise<void> {
  await apiClient.delete(`/task-notebook/delete/${taskNotebookId}`);
}
