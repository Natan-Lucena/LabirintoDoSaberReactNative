import { describe, expect, it } from "vitest";

import type { Task } from "@/api/types";
import { CONTENT_ERROR_KEY, fieldFromApiPath } from "../fieldFromApiPath";
import {
  buildContent,
  buildUpdateInput,
  contentToFormValues,
  defaultValues,
  emptyPair,
  resolveMedia,
  validateActivity,
  type ActivityFormValues,
} from "../schema";

function base(overrides: Partial<ActivityFormValues>): ActivityFormValues {
  return {
    ...defaultValues(),
    prompt: "Forme a palavra",
    category: "writing",
    ...overrides,
  };
}

describe("buildContent", () => {
  it("AC-ATV-11-01: wordBuilder em maiúsculas, com acento e letras extras", () => {
    const content = buildContent(
      "wordBuilder",
      base({ word: "pão", distractors: "e i" }),
    );
    expect(content).toEqual({
      kind: "wordBuilder",
      word: "PÃO",
      distractors: ["E", "I"],
    });
  });

  it("gera ids p1, p2... sem repetir e preserva os existentes", () => {
    const pairs = [
      { ...emptyPair(), id: "p2", word: "Sol", colorHex: "#FACC15" },
      { ...emptyPair(), word: "Mar", colorHex: "#2563EB" },
      { ...emptyPair(), word: "Folha", colorHex: "#16A34A" },
    ];
    const content = buildContent("colorMatch", base({ pairs }));
    expect(content.kind).toBe("colorMatch");
    expect(
      content.kind === "colorMatch" && content.pairs.map((pair) => pair.id),
    ).toEqual(["p2", "p1", "p3"]);
  });

  it("imprimível omite linhas quando 0 e repete as linhas em cada item", () => {
    const item = (text: string) => ({
      key: text,
      id: "",
      text,
      image: { file: null },
    });
    const content = buildContent(
      "printable",
      base({
        title: "Treino",
        instructions: "Copie",
        layout: "SEQUENCE",
        answerLines: "2",
        items: [item("a"), item("b")],
      }),
    );
    expect(content).toMatchObject({
      kind: "printable",
      layout: "SEQUENCE",
      items: [
        { id: "i1", text: "a", answerLines: 2 },
        { id: "i2", text: "b", answerLines: 2 },
      ],
    });
  });
});

describe("validateActivity", () => {
  it("rejeita palavra com número e aceita acento", () => {
    expect(validateActivity("wordBuilder", base({ word: "GAT0" })).word).toBe(
      "Use apenas letras, sem números ou espaços",
    );
    expect(validateActivity("wordBuilder", base({ word: "pão" }))).toEqual({});
  });

  it("limita palavra a 12 letras e letras extras a 6 sem repetir", () => {
    expect(
      validateActivity("wordBuilder", base({ word: "abcdefghijklm" })).word,
    ).toBeDefined();
    expect(
      validateActivity(
        "wordBuilder",
        base({ word: "gato", distractors: "a b c d e f g" }),
      ).distractors,
    ).toBe("Use até 6 letras extras");
    expect(
      validateActivity(
        "wordBuilder",
        base({ word: "gato", distractors: "a a" }),
      ).distractors,
    ).toBe("Não repita letras extras");
  });

  it("colorMatch exige 2 a 6 pares, cada um com palavra e cor da paleta", () => {
    const pair = (word: string, colorHex: string) => ({
      ...emptyPair(),
      word,
      colorHex,
    });
    expect(
      validateActivity("colorMatch", base({ pairs: [pair("Sol", "#FACC15")] }))
        .pairs,
    ).toBeDefined();
    const errors = validateActivity(
      "colorMatch",
      base({ pairs: [pair("Sol", "#FACC15"), pair("", "azul")] }),
    );
    expect(errors["pairs.1.word"]).toBe("Informe a palavra");
    expect(errors["pairs.1.colorHex"]).toBe("Escolha uma cor");
  });

  it("D-16: aceita #RRGGBB fora da paleta e rótulo de carta com 40 caracteres", () => {
    const pair = (word: string, colorHex: string) => ({
      ...emptyPair(),
      word,
      colorHex,
    });
    expect(
      validateActivity(
        "colorMatch",
        base({ pairs: [pair("Sol", "#123456"), pair("Mar", "#abcdef")] }),
      ),
    ).toEqual({});
    const card = (label: string) => ({
      key: label,
      id: "",
      label,
      image: { url: undefined, file: null },
    });
    expect(
      validateActivity(
        "memoryGame",
        base({ cards: [card("a".repeat(40)), card("b")] }),
      ),
    ).toEqual({});
    expect(
      validateActivity(
        "memoryGame",
        base({ cards: [card("a".repeat(41)), card("b")] }),
      )["cards.0.label"],
    ).toBe("Use até 40 caracteres");
  });

  it("D-16: edição de imprimível preserva answerLines diferentes por item", () => {
    const task = {
      id: "t1",
      category: "writing",
      type: "printable",
      prompt: "Folha",
      alternatives: [],
      createdAt: "2026-01-01T00:00:00.000Z",
      content: {
        kind: "printable",
        title: "Folha",
        instructions: "Escreva",
        layout: "LIST",
        items: [
          { id: "i1", text: "A", answerLines: 1 },
          { id: "i2", text: "B", answerLines: 4 },
          { id: "i3", text: "C" },
        ],
      },
    } as unknown as Task;
    const content = buildContent("printable", contentToFormValues(task));
    expect(content).toMatchObject({
      items: [
        { id: "i1", answerLines: 1 },
        { id: "i2", answerLines: 4 },
        { id: "i3" },
      ],
    });
    expect(
      (content as { items: { answerLines?: number }[] }).items[2].answerLines,
    ).toBeUndefined();
  });

  it("carta precisa de texto ou imagem", () => {
    const card = (label: string, url?: string) => ({
      key: label + String(url),
      id: "",
      label,
      image: { url, file: null },
    });
    const errors = validateActivity(
      "memoryGame",
      base({
        cards: [card("Sol"), card("", "https://x.test/a.png"), card("")],
      }),
    );
    expect(Object.keys(errors)).toEqual(["cards.2.label"]);
  });
});

const existing: Task = {
  id: "task-1",
  category: "writing",
  type: "colorMatch",
  prompt: "Associe",
  alternatives: [],
  createdAt: "2026-11-01T10:00:00.000Z",
  skills: ["VOCABULARY"],
  theme: "Cores",
  tone: "peach",
  content: {
    kind: "colorMatch",
    pairs: [
      { id: "p1", word: "Sol", colorHex: "#FACC15" },
      { id: "p3", word: "Mar", colorHex: "#2563EB" },
    ],
  },
};

describe("buildUpdateInput", () => {
  it("AC-ATV-11-03: sem mudanças só leva o id; nunca envia type", () => {
    const input = buildUpdateInput(
      existing,
      "colorMatch",
      contentToFormValues(existing),
    );
    expect(input).toEqual({ id: "task-1" });
  });

  it("envia só o tema alterado e mantém os ids ao trocar uma palavra", () => {
    const values = contentToFormValues(existing);
    expect(
      buildUpdateInput(existing, "colorMatch", {
        ...values,
        theme: "Natureza",
      }),
    ).toEqual({ id: "task-1", theme: "Natureza" });

    const pairs = values.pairs.map((pair, index) =>
      index === 0 ? { ...pair, word: "Estrela" } : pair,
    );
    const input = buildUpdateInput(existing, "colorMatch", {
      ...values,
      pairs,
    });
    expect(input).not.toHaveProperty("type");
    expect(input).toEqual({
      id: "task-1",
      content: {
        kind: "colorMatch",
        pairs: [
          { id: "p1", word: "Estrela", colorHex: "#FACC15" },
          { id: "p3", word: "Mar", colorHex: "#2563EB" },
        ],
      },
    });
  });

  it("par novo na edição recebe o próximo id livre", () => {
    const values = contentToFormValues(existing);
    const withNew = {
      ...values,
      pairs: [
        ...values.pairs,
        { ...emptyPair(), word: "Folha", colorHex: "#16A34A" },
      ],
    };
    const input = buildUpdateInput(existing, "colorMatch", withNew);
    expect(
      input.content?.kind === "colorMatch" &&
        input.content.pairs.map((pair) => pair.id),
    ).toEqual(["p1", "p3", "p2"]);
  });
});

describe("resolveMedia", () => {
  it("sobe uma mídia por vez e troca o arquivo pela URL", async () => {
    const calls: string[] = [];
    const file = (name: string) => ({
      uri: `file://${name}`,
      name,
      mimeType: "image/png",
    });
    const values = base({
      hintImage: { file: file("dica.png") },
      cards: [
        { key: "a", id: "", label: "", image: { file: file("c1.png") } },
        {
          key: "b",
          id: "",
          label: "Sol",
          image: { url: "https://x/y", file: null },
        },
      ],
    });
    const resolved = await resolveMedia(values, async (media) => {
      calls.push(media.name);
      return `https://mock.local/${media.name}`;
    });
    expect(calls).toEqual(["dica.png", "c1.png"]);
    expect(resolved.hintImage).toEqual({
      url: "https://mock.local/dica.png",
      file: null,
    });
    expect(resolved.cards[1]?.image.url).toBe("https://x/y");
  });
});

describe("fieldFromApiPath", () => {
  it("AC-ATV-11-02: caminho completo marca o campo exato", () => {
    expect(fieldFromApiPath("content.word")).toBe("word");
    expect(fieldFromApiPath("content.pairs.2.word")).toBe("pairs.2.word");
    expect(fieldFromApiPath("content.cards.1.imageUrl")).toBe("cards.1.image");
    expect(fieldFromApiPath("content.items.0")).toBe("items.0.text");
    expect(fieldFromApiPath("content.hintImageUrl")).toBe("hintImage");
    expect(fieldFromApiPath("prompt")).toBe("prompt");
  });

  it("só `content` vira o erro do topo; desconhecido fora de content é ignorado", () => {
    expect(fieldFromApiPath("content")).toBe(CONTENT_ERROR_KEY);
    expect(fieldFromApiPath("alternatives")).toBeNull();
  });
});
