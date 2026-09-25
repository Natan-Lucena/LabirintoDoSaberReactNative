import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { SectionHeader } from "../index";

// Stub mínimo da fase 1 (título como cabeçalho; sem AC exclusivo da T-202).
describe("SectionHeader stub", () => {
  it("expõe o título com papel header", async () => {
    await render(<SectionHeader title="Últimas Sessões" />);
    expect(screen.getByRole("header")).toBeTruthy();
  });
});
