import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { IconButton } from "../IconButton";

// AC-DS-03-01/02: papel button, rótulo acessível obrigatório, onPress.
describe("AC-DS-03 IconButton", () => {
  it("expõe o papel button com o accessibilityLabel informado", async () => {
    await render(
      <IconButton
        icon="bell"
        accessibilityLabel="Notificações"
        onPress={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Notificações").props.accessibilityRole).toBe(
      "button",
    );
  });

  it("dispara onPress", async () => {
    const onPress = vi.fn();
    await render(
      <IconButton
        icon="bell"
        accessibilityLabel="Notificações"
        onPress={onPress}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Notificações"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("não dispara onPress quando disabled e reflete o estado", async () => {
    const onPress = vi.fn();
    await render(
      <IconButton
        icon="bell"
        accessibilityLabel="Notificações"
        onPress={onPress}
        disabled
      />,
    );
    const button = screen.getByLabelText("Notificações");
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it("tem alvo de toque 42×42 por padrão", async () => {
    await render(
      <IconButton
        icon="bell"
        accessibilityLabel="Notificações"
        onPress={vi.fn()}
      />,
    );
    const flatStyle = [screen.getByLabelText("Notificações").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.width).toBe(42);
    expect(flatStyle.height).toBe(42);
  });
});
