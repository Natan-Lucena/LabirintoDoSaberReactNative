import { describe, expect, it } from "vitest";

import { render, screen } from "@/test-utils/render";
import { ComingSoonScreen } from "@/features/shell/ComingSoonScreen";

describe("ComingSoonScreen (AC-501-02)", () => {
  it("renders the given title as an accessible header", async () => {
    await render(<ComingSoonScreen title="Atividades" />);

    expect(screen.getByRole("header", { name: "Atividades" })).toBeTruthy();
  });

  it("renders a fixed explanatory message", async () => {
    await render(<ComingSoonScreen title="Menu" />);

    expect(
      screen.getByText("Esta área ainda não está disponível nesta entrega."),
    ).toBeTruthy();
  });
});
