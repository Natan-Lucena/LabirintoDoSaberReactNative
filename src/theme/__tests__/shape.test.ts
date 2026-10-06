import { describe, expect, it } from "vitest";

import { getContentPadding, shape } from "../shape";

describe("tokens de forma do Figma Make", () => {
  it("expõe raios e espaçamento de conteúdo", () => {
    expect(shape).toMatchObject({
      radius: { sm: 10, md: 16, lg: 24, button: 13, avatar: 15 },
      contentPadding: 20,
      contentPaddingCompact: 15,
    });
  });

  it("mapeia as sombras CSS para React Native e Android", () => {
    expect(shape.shadow.sm).toEqual({
      shadowColor: "rgb(31,75,70)",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 10,
      elevation: 2,
    });
    expect(shape.shadow.md).toEqual({
      shadowColor: "rgb(31,75,70)",
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.13,
      shadowRadius: 36,
      elevation: 8,
    });
  });

  it("reduz o padding somente em telas de até 370dp", () => {
    expect(getContentPadding(370)).toBe(15);
    expect(getContentPadding(371)).toBe(20);
  });
});
