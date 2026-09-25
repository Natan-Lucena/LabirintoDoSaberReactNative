import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { Icon, resolveIconGlyph } from "../index";

describe("Icon", () => {
  it("renderiza sem rótulo acessível quando decorativo (sem accessibilityLabel)", async () => {
    await render(<Icon name="home" />);
    const icon = screen.getByTestId("icon-home", {
      includeHiddenElements: true,
    });
    expect(icon.props.accessibilityElementsHidden).toBe(true);
  });

  it("expõe o rótulo acessível quando fornecido", async () => {
    await render(<Icon name="menu" accessibilityLabel="Abrir menu" />);
    expect(screen.getByLabelText("Abrir menu")).toBeTruthy();
  });

  // UX2: aba "Tela Inicial" usa glifo preenchido quando ativa.
  it("usa o glifo preenchido para home quando active=true", () => {
    expect(resolveIconGlyph("home", true)).toBe("home");
  });

  it("usa o glifo outline para home quando active=false", () => {
    expect(resolveIconGlyph("home", false)).toBe("home-outline");
  });

  it("mapeia students para person-outline e reports para clipboard-outline (sempre outline)", () => {
    expect(resolveIconGlyph("students", false)).toBe("person-outline");
    expect(resolveIconGlyph("students", true)).toBe("person-outline");
    expect(resolveIconGlyph("reports", false)).toBe("clipboard-outline");
    expect(resolveIconGlyph("reports", true)).toBe("clipboard-outline");
  });

  it("renderiza o ícone home com testID estável independente do estado ativo", async () => {
    await render(<Icon name="home" active />);
    expect(
      screen.getByTestId("icon-home", { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
