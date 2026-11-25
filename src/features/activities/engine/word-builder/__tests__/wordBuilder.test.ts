import { describe, expect, it } from "vitest";

import type { WordBuilderContent } from "@/api/types";
import { clampGameResult, createGameTimer } from "../../game/gameResult";
import { shuffle } from "../../game/shuffle";
import {
  buildTiles,
  check,
  clearSlots,
  createState,
  formedWord,
  placeTile,
  toGameResult,
  toLetters,
  undoFrom,
  type BuilderState,
} from "../wordBuilder";

function content(word: string, distractors: string[] = []): WordBuilderContent {
  return { kind: "wordBuilder", word, distractors };
}

/** Estado com fichas na ordem pedida (sem embaralhar). */
function stateFor(word: string, letters: string[] = toLetters(word)) {
  return createState(
    letters.map((letter, index) => ({ id: `tile-${index}`, letter })),
    toLetters(word).length,
  );
}

function fill(state: BuilderState, letters: string[]): BuilderState {
  let next = state;
  for (const letter of letters) {
    const tile = next.tiles.find(
      (item) => item.letter === letter && !next.slots.includes(item.id),
    )!;
    next = placeTile(next, tile.id);
  }
  return next;
}

describe("toLetters", () => {
  it("separa em grafemas NFC: PÃO tem 3 letras", () => {
    expect(toLetters("PÃO")).toEqual(["P", "Ã", "O"]);
    expect(toLetters("PÃO".normalize("NFD"))).toEqual(["P", "Ã", "O"]);
  });
});

describe("shuffle", () => {
  it("usa o random injetado (Fisher-Yates) sem mudar a entrada", () => {
    const input = ["a", "b", "c"];
    expect(shuffle(input, () => 0)).toEqual(["b", "c", "a"]);
    expect(input).toEqual(["a", "b", "c"]);
    expect(shuffle(input, () => 0.999)).toEqual(["a", "b", "c"]);
  });
});

describe("buildTiles", () => {
  it("junta as letras da palavra com os distratores, com ids próprios", () => {
    const tiles = buildTiles(content("PÃO", ["t", "r"]), () => 0.5);
    expect(tiles).toHaveLength(5);
    expect(tiles.map((tile) => tile.letter).sort()).toEqual(
      ["P", "Ã", "O", "T", "R"].sort(),
    );
    expect(new Set(tiles.map((tile) => tile.id)).size).toBe(5);
  });

  it("re-embaralha quando sai igual à palavra", () => {
    const values = [0.99, 0.99, 0.99, 0, 0, 0];
    let calls = 0;
    const tiles = buildTiles(content("BOLA"), () => values[calls++] ?? 0);
    expect(tiles.map((tile) => tile.letter).join("")).not.toBe("BOLA");
    expect(calls).toBe(6);
  });

  it("desiste depois de 5 re-embaralhamentos", () => {
    let calls = 0;
    const tiles = buildTiles(content("BOLA"), () => {
      calls += 1;
      return 0.999;
    });
    expect(tiles.map((tile) => tile.letter).join("")).toBe("BOLA");
    expect(calls).toBe(3 * 6);
  });

  it("não re-embaralha palavra de uma letra distinta", () => {
    let calls = 0;
    buildTiles(content("AAA"), () => {
      calls += 1;
      return 0.999;
    });
    expect(calls).toBe(2);
  });
});

describe("AC-ATV-04a-01: aceite da palavra", () => {
  it("só aceita as letras na ordem certa", () => {
    const right = fill(stateFor("BOLA"), ["B", "O", "L", "A"]);
    expect(check(right, "BOLA").correct).toBe(true);
    const wrong = fill(stateFor("BOLA"), ["B", "L", "O", "A"]);
    expect(check(wrong, "BOLA").correct).toBe(false);
  });

  it("acento conta: PAO não é PÃO", () => {
    const state = fill(stateFor("PÃO", ["P", "A", "Ã", "O"]), ["P", "A", "O"]);
    expect(formedWord(state)).toBe("PAO");
    expect(check(state, "PÃO").correct).toBe(false);
  });

  it("letras repetidas são intercambiáveis em BANANA", () => {
    const state = stateFor("BANANA");
    const a = state.tiles.filter((tile) => tile.letter === "A").reverse();
    const n = state.tiles.filter((tile) => tile.letter === "N");
    const b = state.tiles.find((tile) => tile.letter === "B")!;
    let next = state;
    for (const tile of [b, a[0]!, n[0]!, a[1]!, n[1]!, a[2]!]) {
      next = placeTile(next, tile.id);
    }
    expect(check(next, "BANANA").correct).toBe(true);
  });

  it("palavra incompleta não é conferida", () => {
    const state = fill(stateFor("BOLA"), ["B", "O"]);
    expect(check(state, "BOLA").state).toBe(state);
    expect(check(state, "BOLA").correct).toBe(false);
  });
});

describe("placeTile / undoFrom / clearSlots", () => {
  it("põe a letra no primeiro espaço vazio e ignora ficha já usada", () => {
    let state = stateFor("BOLA");
    state = placeTile(state, "tile-2");
    state = placeTile(state, "tile-2");
    state = placeTile(state, "tile-0");
    expect(state.slots).toEqual(["tile-2", "tile-0", null, null]);
  });

  it("não coloca mais fichas que espaços", () => {
    const state = fill(stateFor("BO", ["B", "O", "X"]), ["B", "O"]);
    expect(placeTile(state, "tile-2")).toBe(state);
  });

  it("devolve a letra do espaço e as seguintes", () => {
    const state = fill(stateFor("BOLA"), ["B", "O", "L"]);
    const next = undoFrom(state, 1);
    expect(next.slots).toEqual(["tile-0", null, null, null]);
  });

  it("espaço vazio não faz nada", () => {
    const state = fill(stateFor("BOLA"), ["B"]);
    expect(undoFrom(state, 2)).toBe(state);
  });

  it("clearSlots esvazia tudo e mantém a contagem", () => {
    const state = fill(stateFor("BOLA"), ["B"]);
    const cleared = clearSlots({ ...state, attempts: 1, errors: 1 });
    expect(cleared.slots).toEqual([null, null, null, null]);
    expect(cleared.errors).toBe(1);
  });
});

describe("AC-ATV-04a-04: contagem", () => {
  it("errar e depois acertar dá attempts 2, errors 1, correct false", () => {
    let state = fill(stateFor("BOLA"), ["B", "L", "O", "A"]);
    const first = check(state, "BOLA");
    expect(first.correct).toBe(false);
    state = clearSlots(first.state);
    state = fill(state, ["B", "O", "L", "A"]);
    const second = check(state, "BOLA");
    expect(second.correct).toBe(true);
    expect(toGameResult(second.state, 4200)).toEqual({
      completed: true,
      correct: false,
      attempts: 2,
      errors: 1,
      durationMs: 4200,
    });
  });

  it("acertar de primeira dá correct true", () => {
    const state = fill(stateFor("BOLA"), ["B", "O", "L", "A"]);
    const result = toGameResult(check(state, "BOLA").state, 10);
    expect(result).toMatchObject({ correct: true, attempts: 1, errors: 0 });
  });
});

describe("clampGameResult / createGameTimer", () => {
  it("limita tentativas e erros a 50 e a duração a 3 600 000", () => {
    expect(
      clampGameResult({
        completed: true,
        correct: false,
        attempts: 400,
        errors: 399,
        durationMs: 9_999_999,
      }),
    ).toEqual({
      completed: true,
      correct: false,
      attempts: 50,
      errors: 50,
      durationMs: 3_600_000,
    });
  });

  it("limita o mínimo: tentativas 1, erros e duração 0", () => {
    expect(
      clampGameResult({
        completed: true,
        correct: true,
        attempts: 0,
        errors: -3,
        durationMs: -5,
      }),
    ).toMatchObject({ attempts: 1, errors: 0, durationMs: 0 });
  });

  it("o cronômetro mede do start ao elapsed", () => {
    let t = 1000;
    const timer = createGameTimer(() => t);
    timer.start();
    t = 1750;
    expect(timer.elapsed()).toBe(750);
  });
});
