import { describe, expect, it } from "vitest";

import { color, semanticColor } from "../../../theme";
import { render, screen } from "../../../test-utils/render";
import { Badge } from "../Badge";

// AC-DS-05-01: `.badge` e `.badge--warning` do Make.
describe("AC-DS-05 Badge", () => {
  it("renderiza o rótulo com as cores padrão", async () => {
    await render(<Badge label="Em dia" />);
    const text = screen.getByText("Em dia");
    const flatStyle = [text.props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.color).toBe(color.brand[700]);
  });

  it("aplica a variante warning", async () => {
    await render(<Badge label="Atrasado" variant="warning" />);
    const text = screen.getByText("Atrasado");
    const flatStyle = [text.props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.color).toBe(semanticColor.warningTextOnYellow);
  });
});
