import type { ComponentType } from "react";

import type { Task } from "@/api/types";

/** Resultado de uma tentativa de resposta numa atividade. */
export interface ActivityAttempt {
  alternativeId: string;
  correct: boolean;
  elapsedMs: number;
}

/** Resultado de um jogo (tipos que não são de múltipla escolha). */
export interface GameResult {
  /** Chegou ao fim do jogo. */
  completed: boolean;
  /** Completou sem nenhum erro (regra do app). */
  correct: boolean;
  /** 1–50 */
  attempts: number;
  /** 0–50 */
  errors: number;
  /** 0–3 600 000 */
  durationMs: number;
}

/** Contrato que todo tipo de atividade jogável precisa cumprir (ATV-03). */
export interface ActivityComponentProps {
  task: Task;
  /** Chamado a cada tentativa; o motor registra só a primeira de cada item. */
  onAttempt: (attempt: ActivityAttempt) => void;
  /** Chamado quando o item foi resolvido e o motor pode oferecer o avanço. */
  onSolved: () => void;
  /** Jogos chamam uma única vez, antes de `onSolved`. */
  onGameResult?: (result: GameResult) => void;
}

export type ActivityComponent = ComponentType<ActivityComponentProps>;
