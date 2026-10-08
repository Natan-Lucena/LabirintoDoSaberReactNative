import {
  getTaskById,
  listTaskGroupsByEducator,
  listTaskNotebooks,
} from "@/api/endpoints/content";
import type { Task } from "@/api/types";
import type { SessionFlowContent } from "@/stores/session-flow";

async function loadTasks(ids: string[]): Promise<Task[]> {
  return Promise.all(ids.map((id) => getTaskById(id)));
}

/**
 * G-06: substituída na INT-01 pela lista ordenada devolvida pela sessão.
 * A API atual não documenta esse vínculo, então usa o conteúdo escolhido localmente.
 */
export async function resolveSessionTasks(
  content: SessionFlowContent,
): Promise<Task[]> {
  if (content.kind === "task") {
    return [await getTaskById(content.id)];
  }

  if (content.kind === "group") {
    const group = (await listTaskGroupsByEducator()).find(
      (item) => item.id === content.id,
    );
    if (!group) {
      throw new Error("Grupo de atividades não encontrado.");
    }
    return loadTasks(group.tasksIds);
  }

  const notebook = (await listTaskNotebooks()).find(
    (item) => item.notebook.id === content.id,
  );
  if (!notebook) {
    throw new Error("Caderno de atividades não encontrado.");
  }
  return loadTasks(notebook.notebook.tasks);
}
