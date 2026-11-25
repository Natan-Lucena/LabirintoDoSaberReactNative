import type { MemoryGameContent } from "@/api/types";
import { shuffle } from "../game/shuffle";
import type { GameResult } from "../types";

export type MemoryCardContent = MemoryGameContent["cards"][number];

export interface DeckCard {
  deckId: string;
  /** `id` da carta no conteúdo; as duas cartas do par o compartilham. */
  pairId: string;
  /** Posição (0-based) da carta no conteúdo. */
  contentIndex: number;
  label?: string;
  imageUrl?: string;
}

export interface MemoryState {
  deck: DeckCard[];
  /** `deckId` das cartas viradas e ainda não resolvidas (0–2). */
  open: string[];
  /** `pairId` dos pares encontrados. */
  found: string[];
  attempts: number;
  errors: number;
}

export function buildDeck(
  cards: readonly MemoryCardContent[],
  random: () => number = Math.random,
): DeckCard[] {
  const deck = cards.flatMap((card, contentIndex) =>
    [0, 1].map((copy) => ({
      deckId: `${card.id}#${copy}`,
      pairId: card.id,
      contentIndex,
      label: card.label,
      imageUrl: card.imageUrl,
    })),
  );
  return shuffle(deck, random);
}

export function createState(
  cards: readonly MemoryCardContent[],
  random: () => number = Math.random,
): MemoryState {
  return {
    deck: buildDeck(cards, random),
    open: [],
    found: [],
    attempts: 0,
    errors: 0,
  };
}

export function flip(state: MemoryState, deckId: string): MemoryState {
  const card = state.deck.find((c) => c.deckId === deckId);
  if (
    !card ||
    state.open.length >= 2 ||
    state.open.includes(deckId) ||
    state.found.includes(card.pairId)
  ) {
    return state;
  }
  return { ...state, open: [...state.open, deckId] };
}

function openCards(state: MemoryState): DeckCard[] {
  return state.open.flatMap((id) => state.deck.filter((c) => c.deckId === id));
}

/** Há duas cartas viradas e elas formam um par. */
export function isPendingMatch(state: MemoryState): boolean {
  const [a, b] = openCards(state);
  return state.open.length === 2 && !!a && !!b && a.pairId === b.pairId;
}

/** Fecha a jogada: par encontrado ou as duas cartas voltam a ficar viradas. */
export function resolve(state: MemoryState): MemoryState {
  if (state.open.length !== 2) {
    return state;
  }
  const [a] = openCards(state);
  if (isPendingMatch(state)) {
    return {
      ...state,
      found: [...state.found, a!.pairId],
      open: [],
      attempts: state.attempts + 1,
    };
  }
  return {
    ...state,
    open: [],
    attempts: state.attempts + 1,
    errors: state.errors + 1,
  };
}

export function isComplete(state: MemoryState): boolean {
  return state.deck.length > 0 && state.found.length * 2 === state.deck.length;
}

export function toGameResult(
  state: MemoryState,
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
