import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { FeatureRow } from "../FeatureRow";

// AC-DS-05-01: `.feature-row` do Make, tocável com `chevron`.
describe("AC-DS-05 FeatureRow", () => {
  it("renderiza título e subtítulo", async () => {
    await render(
      <FeatureRow
        icon="clipboard"
        title="Avaliações"
        subtitle="Escalas prontas"
        onPress={vi.fn()}
      />,
    );
    expect(screen.getByText("Avaliações")).toBeTruthy();
    expect(screen.getByText("Escalas prontas")).toBeTruthy();
  });

  it("dispara onPress com papel de botão", async () => {
    const onPress = vi.fn();
    await render(
      <FeatureRow
        icon="clipboard"
        title="Avaliações"
        subtitle="Escalas prontas"
        onPress={onPress}
      />,
    );
    const row = screen.getByLabelText("Avaliações");
    expect(row.props.accessibilityRole).toBe("button");
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
