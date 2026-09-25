import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { Icon } from "../index";

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
});
