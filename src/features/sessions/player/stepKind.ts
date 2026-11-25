import type { Task } from "@/api/types";
import { getActivityComponent } from "@/features/activities/engine/registry";
import { QuizActivity } from "@/features/activities/engine/QuizActivity";

export type SessionStepKind = "quiz" | "game" | "unavailable";

/**
 * Escolhe o passo do player pelo tipo da tarefa (EVO-03), com o registro do
 * motor como fonte da verdade: os tipos de múltipla escolha mapeiam para o
 * `QuizActivity` e seguem o fluxo de resposta (`answerSession`); os jogos do
 * registro enviam o resultado; imprimível (AT-10) e tipo desconhecido ficam
 * indisponíveis. Tarefa antiga sem `type` continua sendo quiz.
 */
export function sessionStepKind(task: Pick<Task, "type">): SessionStepKind {
  if (!task.type) {
    return "quiz";
  }
  const component = getActivityComponent(task.type);
  if (component === null) {
    return "unavailable";
  }
  return component === QuizActivity ? "quiz" : "game";
}
