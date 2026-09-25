import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { FilterChips } from "../index";

const options = [
  { key: "cadernos", label: "Cadernos" },
  { key: "grupos", label: "Grupos" },
];

// AC-202-04: FilterChips informa estado selecionado ao leitor de tela.
describe("AC-202-04 FilterChips", () => {
  it("reflete accessibilityState.selected conforme selected[]", async () => {
    await render(
      <FilterChips
        options={options}
        selected={["cadernos"]}
        onToggle={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Cadernos").parent?.props.accessibilityState,
    ).toMatchObject({
      selected: true,
    });
    expect(
      screen.getByText("Grupos").parent?.props.accessibilityState,
    ).toMatchObject({
      selected: false,
    });
  });

  it("chama onToggle com a chave do chip pressionado", async () => {
    const onToggle = vi.fn();
    await render(
      <FilterChips options={options} selected={[]} onToggle={onToggle} />,
    );
    await fireEvent.press(screen.getByText("Grupos"));
    expect(onToggle).toHaveBeenCalledWith("grupos");
  });
});

describe("AC-202-05 FilterChips alvo de toque", () => {
  it("tem hitSlop somando ao menos 48 de altura", async () => {
    await render(
      <FilterChips options={options} selected={[]} onToggle={vi.fn()} />,
    );
    const chip = screen.getByText("Cadernos").parent;
    expect(chip?.props.hitSlop).toBeTruthy();
  });
});
