import { describe, expect, it } from "vitest";

import {
  createState,
  isComplete,
  selectWord,
  toGameResult,
  tryPair,
} from "../colorMatch";
import { COLOR_PALETTE, colorName } from "../colorNames";

const PAIRS = [
  { id: "p1", word: "Azul", colorHex: "#2563EB" },
  { id: "p2", word: "Vermelho", colorHex: "#DC2626" },
  { id: "p3", word: "Amarelo", colorHex: "#FACC15" },
];

describe("colorMatch (lógica pura)", () => {
  it("embaralha as amostras sem repetir a ordem das palavras", () => {
    const state = createState(PAIRS, () => 0);
    expect(state.swatchIds).toHaveLength(3);
    expect([...state.swatchIds].sort()).toEqual(["p1", "p2", "p3"]);
    expect(state.swatchIds).not.toEqual(["p1", "p2", "p3"]);
  });

  it("um único par mantém a ordem", () => {
    const state = createState(PAIRS.slice(0, 1), () => 0);
    expect(state.swatchIds).toEqual(["p1"]);
  });

  it("tocar de novo na palavra desmarca; outra palavra troca a seleção", () => {
    let s = createState(PAIRS);
    s = selectWord(s, "p1");
    expect(s.selectedId).toBe("p1");
    s = selectWord(s, "p2");
    expect(s.selectedId).toBe("p2");
    s = selectWord(s, "p2");
    expect(s.selectedId).toBeNull();
  });

  it("AC-ATV-04b-01: amostra sem palavra selecionada não faz nada nem conta erro", () => {
    const s = createState(PAIRS);
    const r = tryPair(s, "p2");
    expect(r.outcome).toBe("none");
    expect(r.state).toEqual(s);
  });

  it("AC-ATV-04b-01: par do mesmo id é aceito", () => {
    let s = selectWord(createState(PAIRS), "p1");
    const r = tryPair(s, "p1");
    expect(r.outcome).toBe("correct");
    expect(r.state.matched).toEqual(["p1"]);
    expect(r.state.selectedId).toBeNull();
    expect(r.state.attempts).toBe(1);
    expect(r.state.errors).toBe(0);
    s = r.state;
    expect(selectWord(s, "p1")).toEqual(s);
  });

  it("AC-ATV-04b-01: par de outro id conta erro e limpa a seleção", () => {
    const s = selectWord(createState(PAIRS), "p1");
    const r = tryPair(s, "p2");
    expect(r.outcome).toBe("wrong");
    expect(r.state.matched).toEqual([]);
    expect(r.state.selectedId).toBeNull();
    expect(r.state.attempts).toBe(1);
    expect(r.state.errors).toBe(1);
  });

  it("amostra já pareada é ignorada", () => {
    let s = selectWord(createState(PAIRS), "p1");
    s = tryPair(s, "p1").state;
    s = selectWord(s, "p2");
    const r = tryPair(s, "p1");
    expect(r.outcome).toBe("none");
    expect(r.state.errors).toBe(0);
  });

  it("duas palavras com a mesma cor são pares diferentes", () => {
    const dup = [
      { id: "a", word: "Céu", colorHex: "#2563EB" },
      { id: "b", word: "Mar", colorHex: "#2563EB" },
    ];
    const s = selectWord(createState(dup), "a");
    expect(tryPair(s, "b").outcome).toBe("wrong");
  });

  it("isComplete e toGameResult: sem erro é correct", () => {
    let s = createState(PAIRS);
    expect(isComplete(s)).toBe(false);
    for (const p of PAIRS) {
      s = tryPair(selectWord(s, p.id), p.id).state;
    }
    expect(isComplete(s)).toBe(true);
    expect(toGameResult(s, 1234)).toEqual({
      completed: true,
      correct: true,
      attempts: 3,
      errors: 0,
      durationMs: 1234,
    });
  });

  it("toGameResult: com erro, correct é false", () => {
    let s = tryPair(selectWord(createState(PAIRS), "p1"), "p2").state;
    for (const p of PAIRS) {
      s = tryPair(selectWord(s, p.id), p.id).state;
    }
    expect(toGameResult(s, 10)).toEqual(
      expect.objectContaining({ attempts: 4, errors: 1, correct: false }),
    );
  });
});

describe("colorNames", () => {
  it("tem os 11 nomes em português", () => {
    expect(COLOR_PALETTE.map((c) => c.name).sort()).toEqual(
      [
        "amarelo",
        "azul",
        "branco",
        "cinza",
        "laranja",
        "marrom",
        "preto",
        "rosa",
        "roxo",
        "verde",
        "vermelho",
      ].sort(),
    );
  });

  it("nomeia as cores do mock", () => {
    expect(colorName("#2563EB")).toBe("azul");
    expect(colorName("#DC2626")).toBe("vermelho");
    expect(colorName("#FACC15")).toBe("amarelo");
    expect(colorName("#16A34A")).toBe("verde");
  });

  it("aceita minúsculas e cores extremas", () => {
    expect(colorName("#000000")).toBe("preto");
    expect(colorName("#ffffff")).toBe("branco");
    expect(colorName("#808080")).toBe("cinza");
  });

  it("hex inválido cai em cinza", () => {
    expect(colorName("xyz")).toBe("cinza");
  });
});
