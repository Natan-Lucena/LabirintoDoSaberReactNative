import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { SegmentedControl } from "../SegmentedControl";

const OPTIONS = [
  { key: "week", label: "Semana" },
  { key: "month", label: "Mês" },
];

// AC-DS-03-02: cada segmento expõe o papel radio com `selected`; controlado.
describe("AC-DS-03 SegmentedControl", () => {
  it("marca o segmento ativo como selected", async () => {
    await render(
      <SegmentedControl options={OPTIONS} value="week" onChange={vi.fn()} />,
    );
    expect(
      screen.getByLabelText("Semana").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(screen.getByLabelText("Mês").props.accessibilityState).toMatchObject(
      {
        selected: false,
      },
    );
  });

  it("chama onChange com a chave do segmento tocado", async () => {
    const onChange = vi.fn();
    await render(
      <SegmentedControl options={OPTIONS} value="week" onChange={onChange} />,
    );
    await fireEvent.press(screen.getByLabelText("Mês"));
    expect(onChange).toHaveBeenCalledWith("month");
  });

  it("não chama onChange quando disabled", async () => {
    const onChange = vi.fn();
    await render(
      <SegmentedControl
        options={OPTIONS}
        value="week"
        onChange={onChange}
        disabled
      />,
    );
    await fireEvent.press(screen.getByLabelText("Mês"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
