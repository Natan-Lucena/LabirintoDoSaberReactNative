import { describe, expect, it } from "vitest";

import type { ScaleApplication, ScaleTemplate } from "@/api/types";
import {
  firstUnansweredIndex,
  normalizeForSearch,
  savedAnswer,
  sortedItems,
} from "../selectors";

const template = {
  items: [
    { id: "b", order: 2, text: "B" },
    { id: "a", order: 1, text: "A" },
    { id: "c", order: 3, text: "C" },
  ],
  options: [
    { value: 3, label: "Muito" },
    { value: 0, label: "Nunca" },
  ],
} as unknown as ScaleTemplate;

function application(
  answers: { itemId: string; value: number }[],
): ScaleApplication {
  return { answers } as unknown as ScaleApplication;
}

describe("selectors de aplicar escala (AC-AVA-02-01)", () => {
  it("ordena os itens por order sem mexer nas opções do servidor", () => {
    expect(sortedItems(template).map((item) => item.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(template.options.map((option) => option.value)).toEqual([3, 0]);
    expect(template.items[0]!.id).toBe("b");
  });

  it("lê a resposta salva, inclusive o valor 0", () => {
    const app = application([{ itemId: "a", value: 0 }]);

    expect(savedAnswer(app, "a")).toBe(0);
    expect(savedAnswer(app, "b")).toBeUndefined();
  });

  it("retoma na primeira pergunta sem resposta", () => {
    const items = sortedItems(template);

    expect(firstUnansweredIndex(items, application([]))).toBe(0);
    expect(
      firstUnansweredIndex(
        items,
        application([
          { itemId: "a", value: 1 },
          { itemId: "c", value: 1 },
        ]),
      ),
    ).toBe(1);
    expect(
      firstUnansweredIndex(
        items,
        application([
          { itemId: "a", value: 1 },
          { itemId: "b", value: 1 },
          { itemId: "c", value: 1 },
        ]),
      ),
    ).toBe(-1);
  });

  it("normaliza acentos na busca", () => {
    expect(normalizeForSearch("Ágata")).toBe("agata");
  });
});
