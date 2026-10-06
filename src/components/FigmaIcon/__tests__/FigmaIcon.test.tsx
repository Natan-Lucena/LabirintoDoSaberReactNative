import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { color as colorTokens } from "../../../theme";
import { FigmaIcon, type FigmaIconName } from "../index";

const ALL_NAMES: FigmaIconName[] = [
  "home",
  "calendar",
  "users",
  "grid",
  "bell",
  "search",
  "chevron",
  "clock",
  "message",
  "sparkles",
  "clipboard",
  "chart",
  "book",
  "file",
  "play",
  "plus",
  "check",
  "arrow",
  "brain",
  "print",
  "share",
  "close",
];

describe("FigmaIcon", () => {
  it.each(ALL_NAMES)("renderiza o ícone %s", async (name) => {
    await render(<FigmaIcon name={name} />);
    expect(
      screen.getByTestId(`figma-icon-${name}`, { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it("aplica tamanho padrão de 20 e cor ink-950 do tema", async () => {
    await render(<FigmaIcon name="home" />);
    const svg = screen.getByTestId("figma-icon-home", {
      includeHiddenElements: true,
    });
    expect(svg.props.width).toBe(20);
    expect(svg.props.height).toBe(20);
    expect(svg.props.stroke).toBe(colorTokens.ink[950]);
  });

  it("aplica tamanho e cor customizados", async () => {
    await render(<FigmaIcon name="close" size={32} color="#ff0000" />);
    const svg = screen.getByTestId("figma-icon-close", {
      includeHiddenElements: true,
    });
    expect(svg.props.width).toBe(32);
    expect(svg.props.height).toBe(32);
    expect(svg.props.stroke).toBe("#ff0000");
  });

  it("aplica strokeWidth padrão de 1.8", async () => {
    await render(<FigmaIcon name="plus" />);
    const defaultSvg = screen.getByTestId("figma-icon-plus", {
      includeHiddenElements: true,
    });
    expect(defaultSvg.props.strokeWidth).toBe(1.8);
  });

  it("permite customizar strokeWidth", async () => {
    await render(<FigmaIcon name="plus" strokeWidth={2.4} />);
    const customSvg = screen.getByTestId("figma-icon-plus", {
      includeHiddenElements: true,
    });
    expect(customSvg.props.strokeWidth).toBe(2.4);
  });

  it("é decorativo: oculto para leitores de tela e sem accessibilityLabel", async () => {
    await render(<FigmaIcon name="bell" />);
    const svg = screen.getByTestId("figma-icon-bell", {
      includeHiddenElements: true,
    });
    expect(svg.props.accessible).toBe(false);
    expect(svg.props.importantForAccessibility).toBe("no-hide-descendants");
    expect(svg.props.accessibilityLabel).toBeUndefined();
  });
});
