import { createElement, type ReactElement } from "react";

import { QuizActivity } from "./QuizActivity";
import type { ActivityComponent, ActivityComponentProps } from "./types";

/**
 * Registro `type → componente` do motor (ATV-03). O catálogo de tipos jogáveis
 * da API ainda não existe (BACKLOG §2.3): na V1 só há o quiz. Um tipo novo
 * entra aqui com o seu componente, sem alterar o motor.
 */
const ACTIVITY_TYPE_REGISTRY: Record<string, ActivityComponent> = {
  multipleChoice: QuizActivity,
  multipleChoiceWithMedia: QuizActivity,
};

export function getActivityComponent(type: string): ActivityComponent | null {
  return ACTIVITY_TYPE_REGISTRY[type] ?? null;
}

export function isActivityTypePlayable(type: string): boolean {
  return getActivityComponent(type) !== null;
}

/** Renderiza o componente do tipo, ou `null` quando o tipo não é jogável. */
export function renderActivity(
  type: string,
  props: ActivityComponentProps,
): ReactElement | null {
  const component = getActivityComponent(type);
  return component ? createElement(component, props) : null;
}
