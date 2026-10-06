import { describe, expect, it, vi } from "vitest";

import { color } from "../../../theme";
import { fireEvent, render, screen } from "../../../test-utils/render";
import { FilterChip, FilterRow } from "../FilterChip";

// AC-DS-03-01/02: cores do Make e papel button com `selected`.
describe("AC-DS-03 FilterChip", () => {
  it("reflete o estado ativo em accessibilityState e cor", async () => {
    await render(<FilterChip label="Todos" active onPress={vi.fn()} />);
    const chip = screen.getByLabelText("Todos");
    expect(chip.props.accessibilityState).toMatchObject({ selected: true });
    const flatStyle = [chip.props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.backgroundColor).toBe(color.brand[50]);
  });

  it("dispara onPress", async () => {
    const onPress = vi.fn();
    await render(<FilterChip label="Todos" onPress={onPress} />);
    await fireEvent.press(screen.getByLabelText("Todos"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

const OPTIONS = [
  { key: "all", label: "Todos" },
  { key: "today", label: "Com sessão hoje" },
];

describe("AC-DS-03 FilterRow", () => {
  it("renderiza as opções e marca a selecionada", async () => {
    await render(
      <FilterRow options={OPTIONS} value="all" onChange={vi.fn()} />,
    );
    expect(
      screen.getByLabelText("Todos").props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByLabelText("Com sessão hoje").props.accessibilityState,
    ).toMatchObject({ selected: false });
  });

  it("chama onChange com a chave da opção tocada", async () => {
    const onChange = vi.fn();
    await render(
      <FilterRow options={OPTIONS} value="all" onChange={onChange} />,
    );
    await fireEvent.press(screen.getByLabelText("Com sessão hoje"));
    expect(onChange).toHaveBeenCalledWith("today");
  });
});
