// Destinos do banco de atividades (ATV-09). O imprimível (ATV-05) vai direto
// para a tela de impressão; os demais, para o detalhe.
import type { TaskSummary } from "@/api/types";

export type TaskDestination =
  | { pathname: "/content/task/[id]"; params: { id: string } }
  | { pathname: "/activities/print/[id]"; params: { id: string } };

export function taskDestination(
  item: Pick<TaskSummary, "id" | "format">,
): TaskDestination {
  if (item.format === "PRINTABLE") {
    return { pathname: "/activities/print/[id]", params: { id: item.id } };
  }
  return { pathname: "/content/task/[id]", params: { id: item.id } };
}

export function playDestination(id: string): {
  pathname: "/activities/[id]";
  params: { id: string };
} {
  return { pathname: "/activities/[id]", params: { id } };
}
