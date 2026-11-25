import { describe, expect, it } from "vitest";

import {
  buildDeck,
  createState,
  flip,
  isComplete,
  isPendingMatch,
  resolve,
  toGameResult,
} from "../memoryGame";

const CARDS = [
  { id: "c1", label: "Gato" },
  { id: "c2", label: "Pato" },
  { id: "c3", label: "Rato" },
];

function deckIdsOf(
  state: ReturnType<typeof createState>,
  pairId: string,
): string[] {
  return state.deck.filter((c) => c.pairId === pairId).map((c) => c.deckId);
}

describe("memoryGame (lógica pura)", () => {
  it("buildDeck duplica cada carta com deckId próprio e pairId do conteúdo", () => {
    const deck = buildDeck(CARDS, () => 0.5);
    expect(deck).toHaveLength(6);
    expect(new Set(deck.map((c) => c.deckId)).size).toBe(6);
    for (const card of CARDS) {
      expect(deck.filter((c) => c.pairId === card.id)).toHaveLength(2);
    }
    expect(deck.find((c) => c.pairId === "c2")?.label).toBe("Pato");
  });

  it("buildDeck guarda a posição da carta no conteúdo", () => {
    const deck = buildDeck(CARDS, () => 0.5);
    expect(deck.find((c) => c.pairId === "c3")?.contentIndex).toBe(2);
  });

  it("flip vira uma carta; a mesma carta de novo é ignorada", () => {
    const s = createState(CARDS, () => 0.5);
    const [a] = deckIdsOf(s, "c1");
    const once = flip(s, a!);
    expect(once.open).toEqual([a]);
    expect(flip(once, a!)).toEqual(once);
  });

  it("AC-ATV-04b-02: par igual fica aberto e conta uma jogada sem erro", () => {
    let s = createState(CARDS, () => 0.5);
    const [a, b] = deckIdsOf(s, "c1");
    s = flip(flip(s, a!), b!);
    expect(isPendingMatch(s)).toBe(true);
    s = resolve(s);
    expect(s.found).toEqual(["c1"]);
    expect(s.open).toEqual([]);
    expect(s.attempts).toBe(1);
    expect(s.errors).toBe(0);
  });

  it("AC-ATV-04b-02: par diferente conta erro e volta a virar", () => {
    let s = createState(CARDS, () => 0.5);
    const [a] = deckIdsOf(s, "c1");
    const [b] = deckIdsOf(s, "c2");
    s = flip(flip(s, a!), b!);
    expect(isPendingMatch(s)).toBe(false);
    s = resolve(s);
    expect(s.found).toEqual([]);
    expect(s.open).toEqual([]);
    expect(s.attempts).toBe(1);
    expect(s.errors).toBe(1);
  });

  it("com duas abertas, uma terceira carta é ignorada", () => {
    let s = createState(CARDS, () => 0.5);
    const [a] = deckIdsOf(s, "c1");
    const [b] = deckIdsOf(s, "c2");
    const [c] = deckIdsOf(s, "c3");
    s = flip(flip(s, a!), b!);
    expect(flip(s, c!)).toEqual(s);
  });

  it("carta de par encontrado não vira", () => {
    let s = createState(CARDS, () => 0.5);
    const [a, b] = deckIdsOf(s, "c1");
    s = resolve(flip(flip(s, a!), b!));
    expect(flip(s, a!)).toEqual(s);
  });

  it("resolve sem duas abertas não muda nada", () => {
    const s = createState(CARDS, () => 0.5);
    expect(resolve(s)).toEqual(s);
  });

  it("AC-ATV-04b-02: termina quando todos os pares estão abertos", () => {
    let s = createState(CARDS, () => 0.5);
    expect(isComplete(s)).toBe(false);
    for (const card of CARDS) {
      const [a, b] = deckIdsOf(s, card.id);
      s = resolve(flip(flip(s, a!), b!));
    }
    expect(isComplete(s)).toBe(true);
    expect(toGameResult(s, 500)).toEqual({
      completed: true,
      correct: true,
      attempts: 3,
      errors: 0,
      durationMs: 500,
    });
  });

  it("com erro, correct é false", () => {
    let s = createState(CARDS, () => 0.5);
    const [a] = deckIdsOf(s, "c1");
    const [b] = deckIdsOf(s, "c2");
    s = resolve(flip(flip(s, a!), b!));
    for (const card of CARDS) {
      const [x, y] = deckIdsOf(s, card.id);
      s = resolve(flip(flip(s, x!), y!));
    }
    expect(toGameResult(s, 1)).toEqual(
      expect.objectContaining({ attempts: 4, errors: 1, correct: false }),
    );
  });
});
