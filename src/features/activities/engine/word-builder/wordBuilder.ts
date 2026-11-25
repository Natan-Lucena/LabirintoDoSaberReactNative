import type { WordBuilderContent } from "@/api/types";
import { shuffle } from "../game/shuffle";
import type { GameResult } from "../types";

export interface Tile {
  id: string;
  letter: string;
}

export interface BuilderState {
  /** Fichas do banco, na ordem embaralhada (posição fixa durante o jogo). */
  tiles: Tile[];
  /** Id da ficha em cada espaço, ou `null` se vazio. */
  slots: (string | null)[];
  attempts: number;
  errors: number;
}

const MAX_RESHUFFLES = 5;

/** Letras como grafemas, em NFC: "PÃO" tem 3 letras. */
export function toLetters(word: string): string[] {
  return Array.from(word.normalize("NFC"));
}

export function buildTiles(
  content: WordBuilderContent,
  random: () => number = Math.random,
): Tile[] {
  const wordLetters = toLetters(content.word);
  const extras = (content.distractors ?? []).flatMap((item) =>
    toLetters(item.toUpperCase()),
  );
  const target = wordLetters.join("");
  const distinct = new Set(wordLetters).size > 1;

  const pool = [...wordLetters, ...extras].map((letter, index) => ({
    id: `tile-${index}`,
    letter,
  }));
  let tiles = shuffle(pool, random);
  for (
    let attempt = 0;
    attempt < MAX_RESHUFFLES &&
    distinct &&
    tiles.map((tile) => tile.letter).join("") === target;
    attempt += 1
  ) {
    tiles = shuffle(pool, random);
  }
  return tiles;
}

export function createState(tiles: Tile[], slotCount: number): BuilderState {
  return {
    tiles,
    slots: Array.from({ length: slotCount }, () => null),
    attempts: 0,
    errors: 0,
  };
}

export function placeTile(state: BuilderState, tileId: string): BuilderState {
  const index = state.slots.indexOf(null);
  if (index === -1 || state.slots.includes(tileId)) {
    return state;
  }
  const slots = [...state.slots];
  slots[index] = tileId;
  return { ...state, slots };
}

/** Devolve ao banco a ficha do espaço `slotIndex` e as seguintes. */
export function undoFrom(state: BuilderState, slotIndex: number): BuilderState {
  if (state.slots[slotIndex] == null) {
    return state;
  }
  const slots = state.slots.map((id, index) =>
    index >= slotIndex ? null : id,
  );
  return { ...state, slots };
}

export function clearSlots(state: BuilderState): BuilderState {
  return { ...state, slots: state.slots.map(() => null) };
}

export function letterOf(state: BuilderState, tileId: string | null): string {
  return state.tiles.find((tile) => tile.id === tileId)?.letter ?? "";
}

export function formedWord(state: BuilderState): string {
  return state.slots.map((id) => letterOf(state, id)).join("");
}

export function isFull(state: BuilderState): boolean {
  return state.slots.every((id) => id !== null);
}

/** Confere a palavra completa e conta a tentativa; incompleta não conta. */
export function check(
  state: BuilderState,
  word: string,
): { state: BuilderState; correct: boolean } {
  if (!isFull(state)) {
    return { state, correct: false };
  }
  const correct = formedWord(state) === word.normalize("NFC");
  return {
    correct,
    state: {
      ...state,
      attempts: state.attempts + 1,
      errors: state.errors + (correct ? 0 : 1),
    },
  };
}

/** Resultado do jogo concluído (ainda sem os limites do contrato). */
export function toGameResult(
  state: BuilderState,
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
