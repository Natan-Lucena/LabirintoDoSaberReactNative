import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@/test-utils/render";
import { Field } from "../Field";

describe("AC-DS-04-01 Field rótulo e erro acessíveis", () => {
  it("usa o rótulo como accessibilityLabel por padrão", async () => {
    await render(<Field label="Nome" value="" onChangeText={vi.fn()} />);
    expect(screen.getByLabelText("Nome")).toBeTruthy();
  });

  it("exibe o erro com papel alert e live region polite abaixo do campo", async () => {
    await render(
      <Field
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

  it("chama onChangeText ao digitar", async () => {
    const onChangeText = vi.fn();
    await render(<Field label="Nome" value="" onChangeText={onChangeText} />);
    fireEvent.changeText(screen.getByLabelText("Nome"), "Ana");
    expect(onChangeText).toHaveBeenCalledWith("Ana");
  });

  it("chama onBlur ao perder o foco", async () => {
    const onBlur = vi.fn();
    await render(
      <Field label="Nome" value="" onChangeText={vi.fn()} onBlur={onBlur} />,
    );
    fireEvent(screen.getByLabelText("Nome"), "blur");
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it("tem altura mínima 44 no campo de entrada", async () => {
    await render(<Field label="Nome" value="" onChangeText={vi.fn()} />);
    const input = screen.getByLabelText("Nome");
    const flatStyle = [input.props.style]
      .flat()
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.minHeight).toBeGreaterThanOrEqual(44);
  });

  it("desabilita o campo quando disabled", async () => {
    await render(
      <Field label="Nome" value="" onChangeText={vi.fn()} disabled />,
    );
    expect(screen.getByLabelText("Nome").props.editable).toBe(false);
  });

  it("aplica maxLength ao campo", async () => {
    await render(
      <Field label="Nome" value="" onChangeText={vi.fn()} maxLength={10} />,
    );
    expect(screen.getByLabelText("Nome").props.maxLength).toBe(10);
  });

  it("renderiza multilinha quando solicitado", async () => {
    await render(
      <Field label="Observações" value="" onChangeText={vi.fn()} multiline />,
    );
    expect(screen.getByLabelText("Observações").props.multiline).toBe(true);
  });
});
