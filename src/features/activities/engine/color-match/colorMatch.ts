import type { ColorMatchContent } from "@/api/types";
import { shuffle } from "../game/shuffle";
import type { GameResult } from "../types";

export type ColorPair = ColorMatchContent["pairs"][number];

export interface ColorMatchState {
  pairs: readonly ColorPair[];
  /** Ids dos pares na ordem (embaralhada) das amostras. */
  swatchIds: string[];
  selectedId: string | null;
  matched: string[];
  attempts: number;
  errors: number;
}

export type PairOutcome = "none" | "correct" | "wrong";

const MAX_SHUFFLE_TRIES = 5;

export function createState(
  pairs: readonly ColorPair[],
  random: () => number = Math.random,
): ColorMatchState {
  const ids = pairs.map((p) => p.id);
  let swatchIds = shuffle(ids, random);
  for (
    let i = 1;
    i < MAX_SHUFFLE_TRIES &&
    ids.length > 1 &&
    swatchIds.every((id, idx) => id === ids[idx]);
    i += 1
  ) {
    swatchIds = shuffle(ids, random);
  }
  if (ids.length > 1 && swatchIds.every((id, idx) => id === ids[idx])) {
    // Garante a mudança de ordem mesmo com sorteios ruins.
    swatchIds = [...ids.slice(1), ids[0]!];
  }
  return {
    pairs,
    swatchIds,
    selectedId: null,
    matched: [],
    attempts: 0,
    errors: 0,
  };
}

export function selectWord(
  state: ColorMatchState,
  id: string,
): ColorMatchState {
  if (state.matched.includes(id)) {
    return state;
  }
  return { ...state, selectedId: state.selectedId === id ? null : id };
}

export function tryPair(
  state: ColorMatchState,
  swatchId: string,
): { state: ColorMatchState; outcome: PairOutcome } {
  if (state.selectedId === null || state.matched.includes(swatchId)) {
    return { state, outcome: "none" };
  }
  if (state.selectedId === swatchId) {
    return {
      outcome: "correct",
      state: {
        ...state,
        matched: [...state.matched, swatchId],
        selectedId: null,
        attempts: state.attempts + 1,
      },
    };
  }
  return {
    outcome: "wrong",
    state: {
      ...state,
      selectedId: null,
      attempts: state.attempts + 1,
      errors: state.errors + 1,
    },
  };
}

export function isComplete(state: ColorMatchState): boolean {
  return state.matched.length === state.pairs.length;
}

export function toGameResult(
  state: ColorMatchState,
  durationMs: number,
): GameResult {
  return {
    completed: true,
    correct: state.errors === 0,
    attempts: state.attempts,
    errors: state.errors,
    durationMs,
  };
}
