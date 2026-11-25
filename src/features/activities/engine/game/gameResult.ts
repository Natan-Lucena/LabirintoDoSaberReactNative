import type { GameResult } from "../types";

export const MAX_GAME_COUNT = 50;
export const MAX_GAME_DURATION_MS = 3_600_000;

function clamp(value: number, min: number, max: number): number {
  const safe = Number.isFinite(value) ? Math.trunc(value) : min;
  return Math.min(max, Math.max(min, safe));
}

/** Limites do contrato: tentativas 1–50, erros 0–50, duração 0–3 600 000 ms. */
export function clampGameResult(input: GameResult): GameResult {
  return {
    completed: input.completed,
    correct: input.correct,
    attempts: clamp(input.attempts, 1, MAX_GAME_COUNT),
    errors: clamp(input.errors, 0, MAX_GAME_COUNT),
    durationMs: clamp(input.durationMs, 0, MAX_GAME_DURATION_MS),
  };
}

export interface GameTimer {
  start: () => void;
  elapsed: () => number;
}

export function createGameTimer(now: () => number = Date.now): GameTimer {
  let startedAt = now();
  return {
    start: () => {
      startedAt = now();
    },
    elapsed: () => Math.max(0, now() - startedAt),
  };
}
