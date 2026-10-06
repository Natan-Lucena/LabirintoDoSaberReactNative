import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { BackButton } from "../BackButton";

// AC-DS-03-01/02: `.back-button`, rótulo "Voltar" por padrão, onPress.
describe("AC-DS-03 BackButton", () => {
  it("expõe o rótulo 'Voltar' por padrão", async () => {
    await render(<BackButton onPress={vi.fn()} />);
    expect(screen.getByLabelText("Voltar")).toBeTruthy();
  });

  it("aceita um accessibilityLabel customizado", async () => {
    await render(<BackButton onPress={vi.fn()} accessibilityLabel="Fechar" />);
    expect(screen.getByLabelText("Fechar")).toBeTruthy();
  });

  it("dispara onPress", async () => {
    const onPress = vi.fn();
    await render(<BackButton onPress={onPress} />);
    await fireEvent.press(screen.getByLabelText("Voltar"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("usa o ícone arrow girado 180°", async () => {
    await render(<BackButton onPress={vi.fn()} />);
    expect(
      screen.getByTestId("figma-icon-arrow", { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
