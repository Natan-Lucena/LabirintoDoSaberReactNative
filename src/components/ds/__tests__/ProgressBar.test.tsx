import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { ProgressBar } from "../ProgressBar";

// AC-DS-05-01: `.progress` do Make, com valor acessível.
describe("AC-DS-05 ProgressBar", () => {
  it("expõe o papel e o valor acessíveis", async () => {
    await render(
      <ProgressBar value={40} accessibilityLabel="Progresso do PDI" />,
    );
    const bar = screen.getByLabelText("Progresso do PDI");
    expect(bar.props.accessibilityRole).toBe("progressbar");
    expect(bar.props.accessibilityValue).toMatchObject({
      min: 0,
      max: 100,
      now: 40,
    });
  });

  it("limita o valor entre 0 e 100", async () => {
    await render(<ProgressBar value={150} accessibilityLabel="Progresso" />);
    const bar = screen.getByLabelText("Progresso");
    expect(bar.props.accessibilityValue).toMatchObject({ now: 100 });
  });
});
