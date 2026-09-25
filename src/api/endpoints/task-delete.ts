import { apiClient } from "@/api/client";

/** DELETE /task/delete/:id (D-05). */
export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete<void>(`/task/delete/${id}`);
}
