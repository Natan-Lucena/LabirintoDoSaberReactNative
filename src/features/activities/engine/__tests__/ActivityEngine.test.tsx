import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Task } from "@/api/types";
import { render } from "@/test-utils/render";
import { ActivityEngine } from "../ActivityEngine";

vi.mock("@/components/media/AudioPlayer", () => ({ AudioPlayer: () => null }));

function task(id: string, prompt: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    category: "reading",
    type: "multipleChoice",
    prompt,
    alternatives: [
      { id: `${id}-a`, text: `Certa ${id}`, isCorrect: true },
      { id: `${id}-b`, text: `Errada ${id}`, isCorrect: false },
    ],
    createdAt: "2026-10-07T12:00:00.000Z",
    ...overrides,
  };
}

const TASKS = [task("t1", "Primeira pergunta"), task("t2", "Segunda pergunta")];

const onResult = vi.fn();
const onFinish = vi.fn();
const onGameResult = vi.fn();

beforeEach(() => vi.clearAllMocks());

async function press(name: string) {
  await act(async () => fireEvent.press(screen.getByRole("button", { name })));
}

describe("ActivityEngine", () => {
  it("AC-ATV-03-02: mostra o progresso e avança entre os itens", async () => {
    await render(
      <ActivityEngine tasks={TASKS} onResult={onResult} onFinish={onFinish} />,
    );

    expect(screen.getByText("Atividade 1 de 2")).toBeTruthy();
    expect(screen.getByText("Primeira pergunta")).toBeTruthy();

    await press("Certa t1");
    expect(screen.getByText("Muito bem!")).toBeTruthy();
    await press("Próxima");

    expect(screen.getByText("Atividade 2 de 2")).toBeTruthy();
    expect(screen.getByText("Segunda pergunta")).toBeTruthy();
  });

  it("resposta errada pede nova tentativa e só avança depois de acertar", async () => {
    await render(
      <ActivityEngine tasks={TASKS} onResult={onResult} onFinish={onFinish} />,
    );

    await press("Errada t1");
    expect(screen.getByText("Quase lá! Tente de novo.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Próxima" })).toBeNull();

    await press("Tentar novamente");
    expect(screen.queryByText("Quase lá! Tente de novo.")).toBeNull();

    await press("Certa t1");
    expect(screen.getByRole("button", { name: "Próxima" })).toBeTruthy();
  });

  it("AC-ATV-03-03: o resultado de cada item é enviado uma vez, com a primeira tentativa", async () => {
    await render(
      <ActivityEngine tasks={TASKS} onResult={onResult} onFinish={onFinish} />,
    );

    await press("Errada t1");
    await press("Tentar novamente");
    await press("Certa t1");

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ id: "t1" }),
      expect.objectContaining({
        correct: false,
        alternativeId: "t1-b",
        elapsedMs: expect.any(Number),
      }),
    );
  });

  it("conclui mostrando o resumo de acertos na primeira tentativa", async () => {
    await render(
      <ActivityEngine tasks={TASKS} onResult={onResult} onFinish={onFinish} />,
    );

    await press("Certa t1");
    await press("Próxima");
    await press("Errada t2");
    await press("Tentar novamente");
    await press("Certa t2");
    await press("Concluir");

    expect(screen.getByText("Atividade concluída")).toBeTruthy();
    expect(screen.getByText(/1 de 2/)).toBeTruthy();

    await press("Sair");
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it("AC-ATV-03-01: tipo desconhecido mostra indisponível e permite pular", async () => {
    await render(
      <ActivityEngine
        tasks={[
          task("t1", "Memória", { type: "memoriaVisual" as never }),
          ...TASKS.slice(1),
        ]}
        onFinish={onFinish}
      />,
    );

    expect(screen.getByText("Tipo de atividade indisponível")).toBeTruthy();
    expect(onResult).not.toHaveBeenCalled();

    await press("Pular");
    expect(screen.getByText("Segunda pergunta")).toBeTruthy();
  });

  it("sem atividades mostra o estado vazio", async () => {
    await render(<ActivityEngine tasks={[]} onFinish={onFinish} />);

    expect(screen.getByText("Nenhuma atividade para jogar.")).toBeTruthy();
  });

  describe("jogos (ATV-04a)", () => {
    function wordTask(id: string, word: string): Task {
      return task(id, "Forme a palavra", {
        type: "wordBuilder",
        alternatives: [],
        content: { kind: "wordBuilder", word },
      });
    }

    async function spell(letters: string[]) {
      for (const l of letters) {
        await press(`Letra ${l}`);
      }
    }

    it("AC-ATV-04a-05: registra o resultado do jogo uma vez e soma os acertos", async () => {
      await render(
        <ActivityEngine
          tasks={[wordTask("g1", "SOL"), TASKS[0]!]}
          onResult={onResult}
          onGameResult={onGameResult}
          onFinish={onFinish}
        />,
      );

      await spell(["S", "O", "L"]);
      expect(onGameResult).toHaveBeenCalledTimes(1);
      expect(onGameResult).toHaveBeenCalledWith(
        expect.objectContaining({ id: "g1" }),
        expect.objectContaining({ correct: true, attempts: 1, errors: 0 }),
      );
      expect(onResult).not.toHaveBeenCalled();

      await press("Próxima");
      await press("Certa t1");
      await press("Concluir");

      expect(onGameResult).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/2 de 2/)).toBeTruthy();
    });

    it("jogo com erro não soma como acerto de primeira", async () => {
      await render(
        <ActivityEngine
          tasks={[wordTask("g1", "SOL")]}
          onGameResult={onGameResult}
          onFinish={onFinish}
        />,
      );

      await spell(["S", "L", "O"]);
      await press("Tentar novamente");
      await spell(["S", "O", "L"]);
      await press("Concluir");

      expect(onGameResult).toHaveBeenCalledTimes(1);
      expect(screen.getByText(/0 de 1/)).toBeTruthy();
    });

    it("sem onGameResult o jogo roda sem registro", async () => {
      await render(
        <ActivityEngine tasks={[wordTask("g1", "SOL")]} onFinish={onFinish} />,
      );
      await spell(["S", "O", "L"]);
      expect(screen.getByRole("button", { name: "Concluir" })).toBeTruthy();
    });
  });

  it("mostra a imagem da tarefa quando existe", async () => {
    await render(
      <ActivityEngine
        tasks={[
          task("t1", "Com imagem", { imageFile: "https://x.test/a.png" }),
        ]}
        onFinish={onFinish}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText("Imagem da atividade")).toBeTruthy(),
    );
  });
});
