import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { FooterActions } from "../index";

describe("FooterActions", () => {
  it("renderiza Voltar e a ação primária", async () => {
    await render(
      <FooterActions
        onBack={vi.fn()}
        onPrimary={vi.fn()}
        primaryLabel="Próximo Passo"
      />,
    );
    expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Próximo Passo" })).toBeTruthy();
  });

  it("dispara onBack e onPrimary de forma independente", async () => {
    const onBack = vi.fn();
    const onPrimary = vi.fn();
    await render(
      <FooterActions
        onBack={onBack}
        onPrimary={onPrimary}
        primaryLabel="Próximo Passo"
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onPrimary).not.toHaveBeenCalled();
  });

  it("não dispara onPrimary quando primaryDisabled", async () => {
    const onPrimary = vi.fn();
    await render(
      <FooterActions
        onBack={vi.fn()}
        onPrimary={onPrimary}
        primaryLabel="Próximo Passo"
        primaryDisabled
      />,
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Próximo Passo" }),
    );
    expect(onPrimary).not.toHaveBeenCalled();
  });
});
