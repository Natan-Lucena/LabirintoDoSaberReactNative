import type { ComponentType } from "react";

import type { Task } from "@/api/types";

/** Resultado de uma tentativa de resposta numa atividade. */
export interface ActivityAttempt {
  alternativeId: string;
  correct: boolean;
  elapsedMs: number;
}

/** Contrato que todo tipo de atividade jogável precisa cumprir (ATV-03). */
export interface ActivityComponentProps {
  task: Task;
  /** Chamado a cada tentativa; o motor registra só a primeira de cada item. */
  onAttempt: (attempt: ActivityAttempt) => void;
  /** Chamado quando o item foi resolvido e o motor pode oferecer o avanço. */
  onSolved: () => void;
}

export type ActivityComponent = ComponentType<ActivityComponentProps>;
