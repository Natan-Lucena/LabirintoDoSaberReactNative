import { describe, expect, it, vi } from "vitest";

import { color, semanticColor } from "../../../theme";
import { fireEvent, render, screen } from "../../../test-utils/render";
import { DsButton } from "../DsButton";

// AC-DS-03-01/02/03: variantes do Make, papel/estado acessíveis, onPress.
describe("AC-DS-03 DsButton", () => {
  it("expõe papel button", async () => {
    await render(<DsButton label="Salvar" onPress={vi.fn()} />);
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("dispara onPress", async () => {
    const onPress = vi.fn();
    await render(<DsButton label="Salvar" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("não dispara onPress quando disabled", async () => {
    const onPress = vi.fn();
    await render(<DsButton label="Salvar" onPress={onPress} disabled />);
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("não dispara onPress quando loading", async () => {
    const onPress = vi.fn();
    await render(<DsButton label="Salvar" onPress={onPress} loading />);
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("reflete disabled e busy em accessibilityState", async () => {
    await render(
      <DsButton label="Salvar" onPress={vi.fn()} disabled loading />,
    );
    expect(screen.getByRole("button").props.accessibilityState).toMatchObject({
      disabled: true,
      busy: true,
    });
  });

  it("tem altura mínima de alvo 44", async () => {
    await render(<DsButton label="Salvar" onPress={vi.fn()} />);
    const flatStyle = [screen.getByRole("button").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
  });

  it("variante primary usa fundo brand-600 e texto acessível (G-17)", async () => {
    await render(
      <DsButton label="Salvar" onPress={vi.fn()} variant="primary" />,
    );
    const flatStyle = [screen.getByRole("button").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.backgroundColor).toBe(color.brand[600]);
    const flatLabelStyle = [screen.getByText("Salvar").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatLabelStyle.color).toBe(semanticColor.textOnPrimary);
  });

  it("variante secondary usa borda brand-200 e texto brand-700", async () => {
    await render(
      <DsButton label="Salvar" onPress={vi.fn()} variant="secondary" />,
    );
    const flatStyle = [screen.getByRole("button").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.borderColor).toBe(color.brand[200]);
    const flatLabelStyle = [screen.getByText("Salvar").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatLabelStyle.color).toBe(color.brand[700]);
  });

  it("variante soft usa borda tracejada", async () => {
    await render(<DsButton label="Salvar" onPress={vi.fn()} variant="soft" />);
    const flatStyle = [screen.getByRole("button").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.borderStyle).toBe("dashed");
  });

  it("fullWidth aplica largura 100% e altura mínima 50", async () => {
    await render(<DsButton label="Salvar" onPress={vi.fn()} fullWidth />);
    const flatStyle = [screen.getByRole("button").props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.width).toBe("100%");
    expect(flatStyle.minHeight).toBe(50);
  });

  it("mostra o ícone quando informado", async () => {
    await render(<DsButton label="Salvar" onPress={vi.fn()} icon="plus" />);
    expect(
      screen.getByTestId("figma-icon-plus", { includeHiddenElements: true }),
    ).toBeTruthy();
  });
});
