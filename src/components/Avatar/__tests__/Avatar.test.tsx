import { describe, expect, it } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { Avatar } from "../index";

// AC-203-02: iniciais sem foto e fallback em erro de imagem.
describe("AC-203-02 Avatar", () => {
  it("mostra iniciais quando não há foto", async () => {
    await render(<Avatar name="Ana Carolina" />);
    expect(screen.getByText("AC")).toBeTruthy();
  });

  it("volta para iniciais quando a imagem falha ao carregar", async () => {
    await render(<Avatar name="Lara Silva" uri="https://example.com/a.png" />);
    const image = screen.getByTestId("avatar-image");
    fireEvent(image, "error");
    expect(await screen.findByText("LS")).toBeTruthy();
  });
});
