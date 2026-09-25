import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { AppHeader } from "../index";

// AC-203-03: menu e avatar com rótulos, título como cabeçalho.
describe("AC-203-03 AppHeader", () => {
  it("tem botão de menu com rótulo acessível", async () => {
    await render(
      <AppHeader
        title="Início"
        onMenuPress={vi.fn()}
        onAvatarPress={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Abrir menu").props.accessibilityRole).toBe(
      "button",
    );
  });

  it("tem botão de avatar com rótulo acessível", async () => {
    await render(
      <AppHeader
        title="Início"
        onMenuPress={vi.fn()}
        onAvatarPress={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Abrir perfil").props.accessibilityRole).toBe(
      "button",
    );
  });

  it("dispara onMenuPress e onAvatarPress", async () => {
    const onMenuPress = vi.fn();
    const onAvatarPress = vi.fn();
    await render(
      <AppHeader
        title="Início"
        onMenuPress={onMenuPress}
        onAvatarPress={onAvatarPress}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Abrir menu"));
    await fireEvent.press(screen.getByLabelText("Abrir perfil"));
    expect(onMenuPress).toHaveBeenCalledTimes(1);
    expect(onAvatarPress).toHaveBeenCalledTimes(1);
  });

  it("tem o título como cabeçalho", async () => {
    await render(
      <AppHeader
        title="Início"
        onMenuPress={vi.fn()}
        onAvatarPress={vi.fn()}
      />,
    );
    const header = screen.getByRole("header");
    expect(header.props.children).toBe("Início");
  });
});
