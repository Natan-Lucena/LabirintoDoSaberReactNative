import { describe, expect, it } from "vitest";

import palette from "../palette.js";
import { getContrastRatio } from "../contrast";
import { color, semanticColor } from "../tokens";
import tailwindConfig from "../../../tailwind.config.js";

const figmaColors = {
  brand: {
    50: "#eefaf8",
    100: "#d9f3ef",
    200: "#b6e7df",
    500: "#25a99d",
    600: "#168d84",
    700: "#116f69",
  },
  ink: {
    950: "#173331",
    800: "#294b48",
    600: "#5a7471",
    500: "#748b88",
    300: "#b8c9c6",
  },
  surface: "#ffffff",
  surfaceSoft: "#f6faf9",
  border: "#dfeae8",
  peach: "#fff1e7",
  peachStrong: "#e88a4f",
  lavender: "#f1ecff",
  lavenderStrong: "#7661b5",
  yellow: "#fff7d8",
  warning: "#a36414",
  success: "#16845e",
  danger: "#d44c4c",
} as const;

describe("AC-DS-01-01 tokens do Figma Make", () => {
  it("expõe todos os valores exatos em TypeScript", () => {
    expect(color).toMatchObject(figmaColors);
  });

  it("mantém palette.js como fonte única dos valores", () => {
    expect(color).toBe(palette.color);
    expect(palette.color).toMatchObject(figmaColors);
  });

  it("expõe a mesma paleta no Tailwind", () => {
    expect(tailwindConfig.theme?.extend?.colors).toStrictEqual(color);
  });

  it("mantém os aliases legados mapeados para a nova paleta", () => {
    expect(color).toMatchObject({
      primary: color.brand[600],
      selection: color.brand[50],
      accent: color.brand[700],
      pink: color.danger,
      background: color.surfaceSoft,
      tagNeutral: color.brand[50],
      text: color.ink[950],
      textSecondary: color.ink[600],
      textTertiary: color.ink[500],
    });
  });
});

describe("AC-DS-01-02 contraste", () => {
  it.each([
    ["ink-950/surface", color.ink[950], color.surface],
    ["ink-600/surface", color.ink[600], color.surface],
    ["brand-700/brand-50", color.brand[700], color.brand[50]],
    ["success/surface", color.success, color.surface],
    ["branco/brand-700 (G-42)", "#ffffff", color.brand[700]],
    [
      "branco/primaryFill (G-42)",
      semanticColor.textOnPrimary,
      semanticColor.primaryFill,
    ],
  ])("mantém %s em pelo menos 4,5:1", (_name, foreground, background) => {
    expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it.each([
    [
      "ink-500/surface-soft",
      color.ink[500],
      color.surfaceSoft,
      semanticColor.textMutedOnSoft,
    ],
    [
      "warning/yellow",
      color.warning,
      color.yellow,
      semanticColor.warningTextOnYellow,
    ],
    [
      "danger/surface",
      color.danger,
      color.surface,
      semanticColor.dangerTextOnSurface,
    ],
    [
      "lavender-strong/lavender",
      color.lavenderStrong,
      color.lavender,
      semanticColor.lavenderTextOnLavender,
    ],
  ])(
    "documenta o par Figma inacessível %s e usa substituto >= 4,5:1",
    (_name, figmaForeground, background, accessibleForeground) => {
      expect(getContrastRatio(figmaForeground, background)).toBeLessThan(4.5);
      expect(
        getContrastRatio(accessibleForeground, background),
      ).toBeGreaterThanOrEqual(4.5);
    },
  );
});
