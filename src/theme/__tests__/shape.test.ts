import { describe, expect, it } from "vitest";

import { shape } from "../shape";

// Correção de lacuna da T-201 (tokens de forma, DESIGN §4/G-17) feita na T-202.
describe("tokens de forma (DESIGN §4, G-17)", () => {
  it("expõe os raios e alvo mínimo de toque aprovados", () => {
    expect(shape.cardRadius).toBe(16);
    expect(shape.buttonRadius).toBe(16);
    expect(shape.inputRadius).toBe(12);
    expect(shape.minTouchTarget).toBe(48);
  });

  it("expõe padding de tag e borda de acento", () => {
    expect(shape.tagPaddingVertical).toBe(4);
    expect(shape.tagPaddingHorizontal).toBe(10);
    expect(shape.accentBorderWidth).toBe(3);
    expect(shape.avatarSize).toBe(40);
  });

  it("expõe hairlineWidth numérico", () => {
    expect(typeof shape.hairlineWidth).toBe("number");
    expect(shape.hairlineWidth).toBeGreaterThan(0);
  });
});
