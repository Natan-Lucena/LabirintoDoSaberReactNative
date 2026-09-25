import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../../test-utils/render";
import { RecentActivityCard } from "../RecentActivityCard";

// UX2 (Figma "Home sem agenda"): card de "Atividades Recentes" com ícone
// alternado por índice, título e tags pill.
describe("RecentActivityCard", () => {
  it("mostra o título e as tags recebidas", async () => {
    await render(
      <RecentActivityCard
        title="Caderno de leitura"
        tags={["Leitura", "3 tarefas"]}
        index={0}
        onPress={vi.fn()}
      />,
    );
    expect(screen.getByText("Caderno de leitura")).toBeTruthy();
    expect(screen.getByText("Leitura")).toBeTruthy();
    expect(screen.getByText("3 tarefas")).toBeTruthy();
  });

  it("aciona onPress ao tocar no card", async () => {
    const onPress = vi.fn();
    await render(
      <RecentActivityCard
        title="Caderno"
        tags={["Leitura", "1 tarefa"]}
        index={0}
        onPress={onPress}
      />,
    );
    await fireEvent.press(screen.getByText("Caderno"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("alterna o ícone conforme o índice (book/calculator/pencil)", async () => {
    await render(
      <RecentActivityCard title="A" tags={[]} index={0} onPress={vi.fn()} />,
    );
    expect(screen.getByTestId("icon-book-outline")).toBeTruthy();

    await render(
      <RecentActivityCard title="B" tags={[]} index={1} onPress={vi.fn()} />,
    );
    expect(screen.getByTestId("icon-calculator-outline")).toBeTruthy();

    await render(
      <RecentActivityCard title="C" tags={[]} index={2} onPress={vi.fn()} />,
    );
    expect(screen.getByTestId("icon-pencil-outline")).toBeTruthy();
  });
});
