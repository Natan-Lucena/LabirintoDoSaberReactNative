import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { TextField } from "../index";

// AC-202-02: senha alterna visibilidade com rótulo acessível.
describe("AC-202-02 TextField senha", () => {
  it("mostra controle com rótulo 'Mostrar senha' quando oculta", async () => {
    await render(
      <TextField
        label="Senha"
        value=""
        onChangeText={vi.fn()}
        secureTextEntry
      />,
    );
    expect(screen.getByLabelText("Mostrar senha")).toBeTruthy();
  });

  it("alterna para 'Ocultar senha' após pressionar o controle", async () => {
    await render(
      <TextField
        label="Senha"
        value=""
        onChangeText={vi.fn()}
        secureTextEntry
      />,
    );
    await fireEvent.press(screen.getByLabelText("Mostrar senha"));
    expect(screen.getByLabelText("Ocultar senha")).toBeTruthy();
  });
});

// AC-202-03: erro associado ao campo e anunciável (multiplataforma:
// accessibilityLabelledBy é só Android; usa alert + live region + hint).
describe("AC-202-03 TextField erro", () => {
  it("exibe o texto de erro com papel alert e live region polite", async () => {
    await render(
      <TextField
        label="E-mail"
        value=""
        onChangeText={vi.fn()}
        error="E-mail inválido"
      />,
    );
    const errorNode = screen.getByText("E-mail inválido");
    expect(errorNode.props.accessibilityRole).toBe("alert");
    expect(errorNode.props.accessibilityLiveRegion).toBe("polite");
  });

  it("inclui o erro no accessibilityHint do input", async () => {
    await render(
      <TextField
        label="E-mail"
        value=""
        onChangeText={vi.fn()}
        error="E-mail inválido"
      />,
    );
    const input = screen.getByDisplayValue("");
    expect(input.props.accessibilityHint).toBe("E-mail inválido");
  });
});

describe("AC-202-05 TextField alvo de toque", () => {
  it("tem altura mínima 48 no input", async () => {
    await render(<TextField label="Nome" value="" onChangeText={vi.fn()} />);
    const input = screen.getByDisplayValue("");
    const flatStyle = [input.props.style]
      .flat()
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(48);
  });
});
