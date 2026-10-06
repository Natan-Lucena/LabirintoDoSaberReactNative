import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { InfoCard } from "../InfoCard";

// AC-DS-05-01: `InfoCard` do Make, com ação textual opcional.
describe("AC-DS-05 InfoCard", () => {
  it("renderiza título e descrição", async () => {
    await render(
      <InfoCard
        icon="book"
        title="Caderno de atividades"
        description="12 tarefas"
      />,
    );
    expect(screen.getByText("Caderno de atividades")).toBeTruthy();
    expect(screen.getByText("12 tarefas")).toBeTruthy();
  });

  it("dispara a ação textual ao tocar", async () => {
    const onPress = vi.fn();
    await render(
      <InfoCard
        icon="book"
        title="Caderno"
        description="12 tarefas"
        action={{ label: "Ver tudo", onPress }}
      />,
    );
    await fireEvent.press(screen.getByLabelText("Ver tudo"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("dispara onPress do cartão inteiro com papel de botão", async () => {
    const onPress = vi.fn();
    await render(
      <InfoCard
        icon="book"
        title="Caderno"
        description="12 tarefas"
        onPress={onPress}
      />,
    );
    const card = screen.getByLabelText("Caderno");
    expect(card.props.accessibilityRole).toBe("button");
    await fireEvent.press(card);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
