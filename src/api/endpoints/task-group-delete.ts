import { apiClient } from "@/api/client";

/** DELETE /task-group/delete/:taskGroupId */
export async function deleteTaskGroup(taskGroupId: string): Promise<void> {
  await apiClient.delete<void>(`/task-group/delete/${taskGroupId}`);
}
