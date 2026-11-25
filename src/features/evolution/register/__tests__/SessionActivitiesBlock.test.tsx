import { describe, expect, it } from "vitest";

import type { EvolutionContext } from "@/api/types";
import { render, screen } from "@/test-utils/render";
import { SessionActivitiesBlock } from "../SessionActivitiesBlock";

type Results = NonNullable<EvolutionContext["activityResults"]>;

const RESULTS: Results = [
  {
    taskId: "task-word-1",
    title: "BOLA",
    taskType: "wordBuilder",
    completed: true,
    correct: false,
    attempts: 2,
    errors: 1,
  },
  {
    taskId: "task-memory-1",
    title: "Material escolar",
    taskType: "memoryGame",
    completed: false,
    correct: false,
    attempts: 1,
    errors: 0,
  },
  {
    taskId: "task-color-1",
    title: "Cores",
    taskType: "colorMatch",
    completed: true,
    correct: true,
    attempts: 4,
    errors: 3,
  },
];

describe("SessionActivitiesBlock (AC-EVO-03-02)", () => {
  it("lista cada jogo com título, tipo, situação, tentativas e erros", async () => {
    await render(<SessionActivitiesBlock results={RESULTS} />);

    expect(screen.getByText("Atividades da sessão")).toBeTruthy();
    expect(screen.getByText("BOLA")).toBeTruthy();
    expect(
      screen.getByText("Forme a palavra · Concluída · 2 tentativas · 1 erro"),
    ).toBeTruthy();
    expect(screen.getByText("Material escolar")).toBeTruthy();
    expect(
      screen.getByText(
        "Memória visual · Não concluída · 1 tentativa · 0 erros",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText("Associe as cores · Concluída · 4 tentativas · 3 erros"),
    ).toBeTruthy();
  });

  it("é só leitura: não oferece nenhuma ação", async () => {
    await render(<SessionActivitiesBlock results={RESULTS} />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("não aparece sem resultados nem com a lista vazia (backend antigo)", async () => {
    await render(<SessionActivitiesBlock results={undefined} />);
    expect(screen.queryByText("Atividades da sessão")).toBeNull();

    await render(<SessionActivitiesBlock results={[]} />);
    expect(screen.queryByText("Atividades da sessão")).toBeNull();
  });
});
