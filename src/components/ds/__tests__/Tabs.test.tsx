import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { Tabs } from "../Tabs";

const OPTIONS = [
  { key: "plans", label: "Planos" },
  { key: "assessments", label: "Avaliações" },
];

// AC-DS-03-02: cada aba expõe o papel tab com `selected`; controlado.
describe("AC-DS-03 Tabs", () => {
  it("marca a aba ativa como selected", async () => {
    await render(<Tabs options={OPTIONS} value="plans" onChange={vi.fn()} />);
    const active = screen.getByLabelText("Planos");
    expect(active.props.accessibilityRole).toBe("tab");
    expect(active.props.accessibilityState).toMatchObject({ selected: true });
    expect(
      screen.getByLabelText("Avaliações").props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("chama onChange com a chave da aba tocada", async () => {
    const onChange = vi.fn();
    await render(<Tabs options={OPTIONS} value="plans" onChange={onChange} />);
    await fireEvent.press(screen.getByLabelText("Avaliações"));
    expect(onChange).toHaveBeenCalledWith("assessments");
  });

  it("não chama onChange quando disabled", async () => {
    const onChange = vi.fn();
    await render(
      <Tabs options={OPTIONS} value="plans" onChange={onChange} disabled />,
    );
    await fireEvent.press(screen.getByLabelText("Avaliações"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
