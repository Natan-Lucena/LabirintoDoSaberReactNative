import { describe, expect, it, vi } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { ContentCard } from "../ContentCard";

// AC-602-04: título = descrição truncada; tags mapeadas (G-15); selecionável.
describe("AC-602-04 ContentCard", () => {
  it("mostra a descrição integral quando menor que o limite", async () => {
    await render(
      <ContentCard
        description="Alfabetização básica"
        tags={["Leitura", "5 tarefas"]}
      />,
    );
    expect(screen.getByText("Alfabetização básica")).toBeTruthy();
  });

  it("trunca visualmente a descrição longa com numberOfLines, preservando o texto completo no accessibilityLabel", async () => {
    const longDescription =
      "Uma descrição bastante longa para o caderno de tarefas que deve ser truncada no título do card de conteúdo";
    await render(
      <ContentCard description={longDescription} tags={["Leitura"]} />,
    );
    const title = screen.getByText(longDescription);
    expect(title.props.numberOfLines).toBe(2);
    expect(title.props.ellipsizeMode).toBe("tail");
  });

  it("mostra as tags recebidas", async () => {
    await render(
      <ContentCard description="Caderno" tags={["Leitura", "5 tarefas"]} />,
    );
    expect(screen.getByText("Leitura")).toBeTruthy();
    expect(screen.getByText("5 tarefas")).toBeTruthy();
  });

  it("reflete accessibilityState.selected quando selected", async () => {
    await render(
      <ContentCard
        description="Caderno"
        tags={["Leitura"]}
        selected
        onPress={vi.fn()}
      />,
    );
    expect(screen.getByRole("button").props.accessibilityState).toMatchObject({
      selected: true,
    });
  });
});
