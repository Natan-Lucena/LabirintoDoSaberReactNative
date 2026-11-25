import { act, fireEvent, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Task, WordBuilderContent } from "@/api/types";
import { render } from "@/test-utils/render";
import { WordBuilderActivity } from "../WordBuilderActivity";

vi.mock("@/components/media/AudioPlayer", () => ({ AudioPlayer: () => null }));

function task(content: WordBuilderContent | undefined) {
  return {
    id: "w1",
    category: "writing",
    type: "wordBuilder",
    prompt: "Forme a palavra da figura",
    alternatives: [],
    createdAt: "2026-11-24T12:00:00.000Z",
    content,
  } as unknown as Task;
}

const BOLA: WordBuilderContent = {
  kind: "wordBuilder",
  word: "BOLA",
  distractors: ["E"],
};

const onAttempt = vi.fn();
const onSolved = vi.fn();
const onGameResult = vi.fn();
const calls: string[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  calls.length = 0;
  onSolved.mockImplementation(() => calls.push("solved"));
  onGameResult.mockImplementation(() => calls.push("result"));
});

async function renderGame(content?: WordBuilderContent | null) {
  await render(
    <WordBuilderActivity
      task={task(content === null ? undefined : (content ?? BOLA))}
      onAttempt={onAttempt}
      onSolved={onSolved}
      onGameResult={onGameResult}
    />,
  );
}

async function letter(name: string) {
  await act(async () =>
    fireEvent.press(screen.getByRole("button", { name: `Letra ${name}` })),
  );
}

async function slot(label: string) {
  await act(async () => fireEvent.press(screen.getByLabelText(label)));
}

async function spell(letters: string[]) {
  for (const l of letters) {
    await letter(l);
  }
}

async function retry() {
  await act(async () =>
    fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" })),
  );
}

describe("WordBuilderActivity", () => {
  it("mostra a instrução, os espaços vazios e as letras do banco", async () => {
    await renderGame();
    expect(screen.getByText("Forme a palavra da figura")).toBeTruthy();
    for (let i = 1; i <= 4; i += 1) {
      expect(screen.getByLabelText(`Espaço ${i} de 4, vazio`)).toBeTruthy();
    }
    for (const l of ["B", "O", "L", "A", "E"]) {
      expect(screen.getByLabelText(`Letra ${l}`)).toBeTruthy();
    }
  });

  it("AC-ATV-04a-03: espaço preenchido tem rótulo com a letra e alvo >= 44", async () => {
    await renderGame();
    await letter("B");
    await letter("O");
    expect(screen.getByLabelText("Espaço 1 de 4, letra B")).toBeTruthy();
    expect(screen.getByLabelText("Espaço 2 de 4, letra O")).toBeTruthy();

    const target = screen.getByLabelText("Espaço 3 de 4, vazio");
    const flat = Object.assign({}, ...[target.props.style].flat(5));
    const slop = target.props.hitSlop ?? {};
    const height = (flat.minHeight ?? flat.height ?? 0) + (slop.top ?? 0) * 2;
    const width = (flat.minWidth ?? flat.width ?? 0) + (slop.left ?? 0) * 2;
    expect(height).toBeGreaterThanOrEqual(44);
    expect(width).toBeGreaterThanOrEqual(44);
  });

  it("letra usada some do banco", async () => {
    await renderGame();
    await letter("B");
    expect(screen.queryByLabelText("Letra B")).toBeNull();
  });

  it("AC-ATV-04a-02: tocar num espaço devolve a letra dele e as seguintes", async () => {
    await renderGame();
    await spell(["B", "O", "L"]);
    expect(screen.queryByLabelText("Letra O")).toBeNull();

    await slot("Espaço 2 de 4, letra O");

    expect(screen.getByLabelText("Letra O")).toBeTruthy();
    expect(screen.getByLabelText("Letra L")).toBeTruthy();
    expect(screen.queryByLabelText("Letra B")).toBeNull();
    expect(screen.getByLabelText("Espaço 1 de 4, letra B")).toBeTruthy();
    expect(screen.getByLabelText("Espaço 2 de 4, vazio")).toBeTruthy();
    expect(screen.getByLabelText("Espaço 3 de 4, vazio")).toBeTruthy();
  });

  it("errar mostra a mensagem, e 'Tentar novamente' limpa os espaços", async () => {
    await renderGame();
    await spell(["B", "L", "O", "A"]);

    expect(screen.getByText("Ainda não. Tente de novo.")).toBeTruthy();
    expect(onGameResult).not.toHaveBeenCalled();
    expect(onSolved).not.toHaveBeenCalled();

    await retry();

    expect(screen.queryByText("Ainda não. Tente de novo.")).toBeNull();
    expect(screen.getByLabelText("Espaço 1 de 4, vazio")).toBeTruthy();
    expect(screen.getByLabelText("Letra B")).toBeTruthy();
  });

  it("acertar mostra 'Muito bem!' e chama onGameResult antes de onSolved", async () => {
    await renderGame();
    await spell(["B", "O", "L", "A"]);

    expect(screen.getByText("Muito bem!")).toBeTruthy();
    expect(onGameResult).toHaveBeenCalledTimes(1);
    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["result", "solved"]);
    expect(onGameResult).toHaveBeenCalledWith({
      completed: true,
      correct: true,
      attempts: 1,
      errors: 0,
      durationMs: expect.any(Number),
    });
    expect(onAttempt).not.toHaveBeenCalled();
  });

  it("AC-ATV-04a-04: errar e depois acertar reporta attempts 2, errors 1", async () => {
    await renderGame();
    await spell(["B", "L", "O", "A"]);
    await retry();
    await spell(["B", "O", "L", "A"]);

    expect(onGameResult).toHaveBeenCalledTimes(1);
    expect(onGameResult).toHaveBeenCalledWith(
      expect.objectContaining({ attempts: 2, errors: 1, correct: false }),
    );
  });

  it("PAO não serve para PÃO", async () => {
    await renderGame({
      kind: "wordBuilder",
      word: "PÃO",
      distractors: ["A"],
    });
    await spell(["P", "A", "O"]);
    expect(screen.getByText("Ainda não. Tente de novo.")).toBeTruthy();
    expect(onGameResult).not.toHaveBeenCalled();
  });

  it("conteúdo inválido libera o motor sem onGameResult", async () => {
    await renderGame(null);
    expect(screen.getByText("Esta atividade está incompleta.")).toBeTruthy();
    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(onGameResult).not.toHaveBeenCalled();
  });

  it("palavra vazia também é conteúdo inválido", async () => {
    await renderGame({ kind: "wordBuilder", word: "" });
    expect(screen.getByText("Esta atividade está incompleta.")).toBeTruthy();
    expect(onGameResult).not.toHaveBeenCalled();
  });
});
