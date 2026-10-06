import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { Switch } from "../Switch";

// AC-DS-03-02: papel switch com `checked`; controlado, chama onValueChange.
describe("AC-DS-03 Switch", () => {
  it("expõe o papel switch com checked=false", async () => {
    await render(
      <Switch
        value={false}
        onValueChange={vi.fn()}
        accessibilityLabel="Mensagens automáticas"
      />,
    );
    const el = screen.getByLabelText("Mensagens automáticas");
    expect(el.props.accessibilityRole).toBe("switch");
    expect(el.props.accessibilityState).toMatchObject({ checked: false });
  });

  it("reflete checked=true", async () => {
    await render(
      <Switch
        value={true}
        onValueChange={vi.fn()}
        accessibilityLabel="Mensagens automáticas"
      />,
    );
    expect(
      screen.getByLabelText("Mensagens automáticas").props.accessibilityState,
    ).toMatchObject({ checked: true });
  });

  it("chama onValueChange com o valor invertido", async () => {
    const onValueChange = vi.fn();
    await render(
      <Switch
        value={false}
        onValueChange={onValueChange}
        accessibilityLabel="Mensagens automáticas"
      />,
    );
    await fireEvent.press(screen.getByLabelText("Mensagens automáticas"));
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it("não chama onValueChange quando disabled", async () => {
    const onValueChange = vi.fn();
    await render(
      <Switch
        value={false}
        onValueChange={onValueChange}
        accessibilityLabel="Mensagens automáticas"
        disabled
      />,
    );
    await fireEvent.press(screen.getByLabelText("Mensagens automáticas"));
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
