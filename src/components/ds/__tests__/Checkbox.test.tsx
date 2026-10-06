import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { Checkbox } from "../Checkbox";

// AC-DS-03-02: papel checkbox com `checked`; controlado, chama onChange.
describe("AC-DS-03 Checkbox", () => {
  it("expõe o papel checkbox com checked=false", async () => {
    await render(
      <Checkbox label="Linguagem" checked={false} onChange={vi.fn()} />,
    );
    const el = screen.getByLabelText("Linguagem");
    expect(el.props.accessibilityRole).toBe("checkbox");
    expect(el.props.accessibilityState).toMatchObject({ checked: false });
  });

  it("reflete checked=true e mostra o ícone de marcado", async () => {
    await render(
      <Checkbox label="Linguagem" checked={true} onChange={vi.fn()} />,
    );
    expect(
      screen.getByLabelText("Linguagem").props.accessibilityState,
    ).toMatchObject({ checked: true });
    expect(
      screen.getByTestId("figma-icon-check", { includeHiddenElements: true }),
    ).toBeTruthy();
  });

  it("chama onChange com o valor invertido", async () => {
    const onChange = vi.fn();
    await render(
      <Checkbox label="Linguagem" checked={false} onChange={onChange} />,
    );
    await fireEvent.press(screen.getByLabelText("Linguagem"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("não chama onChange quando disabled", async () => {
    const onChange = vi.fn();
    await render(
      <Checkbox
        label="Linguagem"
        checked={false}
        onChange={onChange}
        disabled
      />,
    );
    await fireEvent.press(screen.getByLabelText("Linguagem"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
