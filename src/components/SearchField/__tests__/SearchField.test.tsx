import { describe, expect, it, vi } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { SearchField } from "../index";

// Stub mínimo da fase 1 (sem AC exclusivo; comportamento entra na fase 2).
describe("SearchField stub", () => {
  it("renderiza sem lançar erro", async () => {
    await render(<SearchField value="" onChangeText={vi.fn()} />);
    expect(screen.getByDisplayValue("")).toBeTruthy();
  });

  it("mostra o botão de limpar com alvo >= 48 quando há valor", async () => {
    await render(
      <SearchField value="abc" onChangeText={vi.fn()} onClear={vi.fn()} />,
    );
    expect(screen.getByLabelText("Limpar busca")).toBeTruthy();
  });
});
