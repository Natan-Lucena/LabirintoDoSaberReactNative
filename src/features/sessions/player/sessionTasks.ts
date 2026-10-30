import {
  getTaskById,
  listTaskGroupsByEducator,
  listTaskNotebooks,
} from "@/api/endpoints/content";
import type { Task, TaskGroup } from "@/api/types";
import type { SessionFlowContent } from "@/stores/session-flow";

async function loadTasks(ids: string[]): Promise<Task[]> {
  return Promise.all(ids.map((id) => getTaskById(id)));
}

/**
 * Resolve as tarefas do conteúdo da sessão. G-06 (resolvido em 2026-10-29): o
 * backend guarda `taskNotebookId` na sessão, então o caderno vale em qualquer
 * aparelho; a lista ordenada continua vindo de `notebook.tasks` em
 * `GET /task-notebook/`. S-05: a maioria dos cadernos guarda as atividades em
 * grupos, então a ordem é `notebook.tasks`, depois as tarefas de cada grupo na
 * ordem de `taskGroupsIds` (grupos ausentes de `taskGroups` são ignorados), depois
 * os grupos restantes de `taskGroups`; repetidas ficam só na primeira posição.
 * Grupo e atividade avulsa não têm vínculo no servidor e
 * seguem o conteúdo salvo neste aparelho.
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

  const groupsById = new Map(notebook.taskGroups.map((g) => [g.id, g]));
  const listed = notebook.notebook.taskGroupsIds
    .map((id) => groupsById.get(id))
    .filter((g): g is TaskGroup => g !== undefined);
  const unlisted = notebook.taskGroups.filter((g) => !listed.includes(g));
  const ids = [
    ...notebook.notebook.tasks,
    ...[...listed, ...unlisted].flatMap((g) => g.tasksIds),
  ];
  return loadTasks([...new Set(ids)]);
}
