// Destinos do banco de atividades (ATV-09). A ATV-05 só altera `taskDestination`
// para levar o imprimível à tela dele.
import type { TaskSummary } from "@/api/types";

export function taskDestination(item: Pick<TaskSummary, "id" | "format">): {
  pathname: "/content/task/[id]";
  params: { id: string };
} {
  return { pathname: "/content/task/[id]", params: { id: item.id } };
}

export function playDestination(id: string): {
  pathname: "/activities/[id]";
  params: { id: string };
} {
  return { pathname: "/activities/[id]", params: { id } };
}
