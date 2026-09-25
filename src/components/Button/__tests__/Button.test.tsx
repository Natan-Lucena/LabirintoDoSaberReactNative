import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { Button } from "../index";

// AC-202-01: papel button, estados desabilitado/carregando, onPress bloqueado.
describe("AC-202-01 Button", () => {
  it("expõe papel button", async () => {
    await render(<Button label="Entrar" onPress={vi.fn()} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("não dispara onPress quando disabled", async () => {
    const onPress = vi.fn();
    await render(<Button label="Entrar" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("não dispara onPress quando loading", async () => {
    const onPress = vi.fn();
    await render(<Button label="Entrar" onPress={onPress} loading />);
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("reflete disabled e busy em accessibilityState", async () => {
    await render(<Button label="Entrar" onPress={vi.fn()} disabled loading />);
    const button = screen.getByRole("button");
    expect(button.props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
  });

  it("tem altura mínima de alvo 48", async () => {
    await render(<Button label="Entrar" onPress={vi.fn()} />);
    const button = screen.getByRole("button");
    const flatStyle = [button.props.style]
      .flat()
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(48);
  });

  // FX4: no Android, o rótulo pode quebrar linha por mismatch de medida de
  // fonte customizada, cortando a última letra ("Entrar" -> "Entra") quando
  // a 2ª linha é cortada pela altura do container. numberOfLines=1 evita a
  // quebra silenciosa.
  it("limita o rótulo a uma linha (evita corte da última letra no Android)", async () => {
    await render(<Button label="Entrar" onPress={vi.fn()} />);
    const label = screen.getByText("Entrar");
    expect(label.props.numberOfLines).toBe(1);
  });
});
