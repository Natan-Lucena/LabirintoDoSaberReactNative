import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { CheckList } from "../CheckList";

const OPTIONS = [
  { key: "language", label: "Linguagem" },
  { key: "attention", label: "Atenção" },
];

// AC-DS-03-02: cada item expõe o papel checkbox; controlado, chama onChange.
describe("AC-DS-03 CheckList", () => {
  it("renderiza todas as opções", async () => {
    await render(
      <CheckList options={OPTIONS} selected={[]} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Linguagem")).toBeTruthy();
    expect(screen.getByLabelText("Atenção")).toBeTruthy();
  });

  it("marca os itens selecionados", async () => {
    await render(
      <CheckList
        options={OPTIONS}
        selected={["attention"]}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.getByLabelText("Linguagem").props.accessibilityState,
    ).toMatchObject({ checked: false });
    expect(
      screen.getByLabelText("Atenção").props.accessibilityState,
    ).toMatchObject({ checked: true });
  });

  it("adiciona a chave ao marcar um item não selecionado", async () => {
    const onChange = vi.fn();
    await render(
      <CheckList options={OPTIONS} selected={[]} onChange={onChange} />,
    );
    await fireEvent.press(screen.getByLabelText("Linguagem"));
    expect(onChange).toHaveBeenCalledWith(["language"]);
  });

  it("remove a chave ao desmarcar um item selecionado", async () => {
    const onChange = vi.fn();
    await render(
      <CheckList
        options={OPTIONS}
        selected={["language", "attention"]}
        onChange={onChange}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Linguagem"));
    expect(onChange).toHaveBeenCalledWith(["attention"]);
  });
});
