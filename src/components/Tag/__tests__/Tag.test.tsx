import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { Tag } from "../index";

// Stub mínimo da fase 1 (sem AC exclusivo; Tag é decorativa, DESIGN §4).
describe("Tag stub", () => {
  it("renderiza o rótulo", async () => {
    await render(<Tag label="Alfabetização" />);
    expect(screen.getByText("Alfabetização")).toBeTruthy();
  });
});
