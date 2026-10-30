/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

import { getContrastRatio } from "../contrast";
import { color, semanticColor } from "../tokens";

// QA-03 (divergência #26): textos de erro em `danger`/`pink` (4,04 a 4,25:1)
// e textos em `ink-500`/`textTertiary` (3,45 a 3,63:1) ficam abaixo de 4,5:1.
// Os substitutos de G-17 já existem em `semanticColor`; aqui garantimos que
// eles passam e que as cores fracas não voltam a ser usadas como cor de texto.

// Código-fonte do app (sem testes, mocks nem o próprio tema), lido como texto.
const SOURCES = import.meta.glob<string>(
  [
    "../../**/*.{ts,tsx}",
    "!../../**/__tests__/**",
    "!../../mocks/**",
    "!../../theme/**",
  ],
  { query: "?raw", import: "default", eager: true },
);
const WEAK_TEXT_COLOR =
  /\bcolor:\s*color\.(danger|pink|textTertiary|ink\[500\])(?![\w[])/;

describe("QA-03 contraste de texto (>= 4,5:1)", () => {
  it.each([
    [
      "dangerTextOnSurface/surface",
      semanticColor.dangerTextOnSurface,
      color.surface,
    ],
    [
      "dangerTextOnSurface/surfaceSoft",
      semanticColor.dangerTextOnSurface,
      color.surfaceSoft,
    ],
    [
      "dangerTextOnSurface/brand-50",
      semanticColor.dangerTextOnSurface,
      color.brand[50],
    ],
    ["ink-600/surface", color.ink[600], color.surface],
    ["ink-600/surfaceSoft", color.ink[600], color.surfaceSoft],
    ["ink-600/brand-50", color.ink[600], color.brand[50]],
  ])("%s", (_name, foreground, background) => {
    expect(getContrastRatio(foreground, background)).toBeGreaterThanOrEqual(
      4.5,
    );
  });

  it("nenhum estilo usa danger, pink, ink-500 ou textTertiary como cor de texto", () => {
    expect(Object.keys(SOURCES).length).toBeGreaterThan(100);
    const offenders = Object.entries(SOURCES).flatMap(([file, text]) =>
      text
        .split("\n")
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => WEAK_TEXT_COLOR.test(line))
        .map(({ line, index }) => `${file}:${index + 1} ${line.trim()}`),
    );
    expect(offenders).toEqual([]);
  });
});
