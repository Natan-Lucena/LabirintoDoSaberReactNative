import { act, fireEvent, screen } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ColorMatchContent, Task } from "@/api/types";
import { render } from "@/test-utils/render";
import { ColorMatchActivity } from "../ColorMatchActivity";

vi.mock("@/components/media/AudioPlayer", () => ({ AudioPlayer: () => null }));

function task(content: ColorMatchContent | undefined) {
  return {
    id: "cm1",
    category: "vocabulary",
    type: "colorMatch",
    prompt: "Associe cada palavra à sua cor",
    alternatives: [],
    createdAt: "2026-11-24T12:00:00.000Z",
    content,
  } as unknown as Task;
}

const CONTENT: ColorMatchContent = {
  kind: "colorMatch",
  pairs: [
    { id: "p1", word: "Azul", colorHex: "#2563EB" },
    { id: "p2", word: "Vermelho", colorHex: "#DC2626" },
    { id: "p3", word: "Amarelo", colorHex: "#FACC15" },
  ],
};

const onAttempt = vi.fn();
const onSolved = vi.fn();
const onGameResult = vi.fn();
const calls: string[] = [];

beforeEach(() => {
  vi.clearAllMocks();
  calls.length = 0;
  vi.spyOn(Math, "random").mockReturnValue(0);
  onSolved.mockImplementation(() => calls.push("solved"));
  onGameResult.mockImplementation(() => calls.push("result"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

async function renderGame(content?: ColorMatchContent | null) {
  await render(
    <ColorMatchActivity
      task={task(content === null ? undefined : (content ?? CONTENT))}
      onAttempt={onAttempt}
      onSolved={onSolved}
      onGameResult={onGameResult}
    />,
  );
}

async function press(label: string) {
  await act(async () => fireEvent.press(screen.getByLabelText(label)));
}

describe("ColorMatchActivity", () => {
  it("mostra a instrução, as palavras e as amostras com o nome da cor", async () => {
    await renderGame();
    expect(screen.getByText("Associe cada palavra à sua cor")).toBeTruthy();
    for (const w of ["Azul", "Vermelho", "Amarelo"]) {
      expect(screen.getByLabelText(`Palavra ${w}`)).toBeTruthy();
    }
    for (const c of ["azul", "vermelho", "amarelo"]) {
      expect(screen.getByLabelText(`Cor ${c}`)).toBeTruthy();
    }
  });

  it("AC-ATV-04b-04: palavras e amostras têm alvo de toque >= 44", async () => {
    await renderGame();
    for (const label of ["Palavra Azul", "Cor azul"]) {
      const target = screen.getByLabelText(label);
      const flat = Object.assign({}, ...[target.props.style].flat(5));
      const slop = target.props.hitSlop ?? {};
      const height = (flat.minHeight ?? flat.height ?? 0) + (slop.top ?? 0) * 2;
      const width = (flat.minWidth ?? flat.width ?? 0) + (slop.left ?? 0) * 2;
      expect(height).toBeGreaterThanOrEqual(44);
      expect(width).toBeGreaterThanOrEqual(44);
    }
  });

  it("selecionar a palavra marca selected", async () => {
    await renderGame();
    await press("Palavra Azul");
    expect(
      screen.getByLabelText("Palavra Azul").props.accessibilityState,
    ).toEqual(expect.objectContaining({ selected: true }));
  });

  it("amostra sem palavra selecionada não faz nada", async () => {
    await renderGame();
    await press("Cor azul");
    expect(screen.queryByText("Não é essa cor.")).toBeNull();
    expect(onGameResult).not.toHaveBeenCalled();
  });

  it("cor errada mostra o aviso por 1,5 s e limpa a seleção", async () => {
    await renderGame();
    vi.useFakeTimers();
    await press("Palavra Azul");
    await press("Cor vermelho");
    expect(screen.getByText("Não é essa cor.")).toBeTruthy();
    expect(
      screen.getByLabelText("Palavra Azul").props.accessibilityState,
    ).toEqual(expect.objectContaining({ selected: false }));

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.queryByText("Não é essa cor.")).toBeNull();
  });

  it("par certo desabilita a palavra e a amostra", async () => {
    await renderGame();
    await press("Palavra Azul");
    await press("Cor azul");
    expect(
      screen.getByLabelText("Palavra Azul, par certo").props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
    expect(
      screen.getByLabelText("Cor azul, par certo").props.accessibilityState,
    ).toEqual(expect.objectContaining({ disabled: true }));
  });

  it("acertar tudo chama onGameResult antes de onSolved", async () => {
    await renderGame();
    for (const [w, c] of [
      ["Azul", "azul"],
      ["Vermelho", "vermelho"],
      ["Amarelo", "amarelo"],
    ]) {
      await press(`Palavra ${w}`);
      await press(`Cor ${c}`);
    }
    expect(screen.getByText("Muito bem!")).toBeTruthy();
    expect(calls).toEqual(["result", "solved"]);
    expect(onGameResult).toHaveBeenCalledTimes(1);
    expect(onGameResult).toHaveBeenCalledWith({
      completed: true,
      correct: true,
      attempts: 3,
      errors: 0,
      durationMs: expect.any(Number),
    });
    expect(onAttempt).not.toHaveBeenCalled();
  });

  it("com um erro, reporta errors 1 e correct false", async () => {
    await renderGame();
    await press("Palavra Azul");
    await press("Cor vermelho");
    for (const [w, c] of [
      ["Azul", "azul"],
      ["Vermelho", "vermelho"],
      ["Amarelo", "amarelo"],
    ]) {
      await press(`Palavra ${w}`);
      await press(`Cor ${c}`);
    }
    expect(onGameResult).toHaveBeenCalledTimes(1);
    expect(onGameResult).toHaveBeenCalledWith(
      expect.objectContaining({ attempts: 4, errors: 1, correct: false }),
    );
  });

  it("conteúdo inválido libera o motor sem onGameResult", async () => {
    await renderGame(null);
    expect(screen.getByText("Esta atividade está incompleta.")).toBeTruthy();
    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(onGameResult).not.toHaveBeenCalled();
  });

  it("menos de 2 pares é conteúdo inválido", async () => {
    await renderGame({
      kind: "colorMatch",
      pairs: [{ id: "p1", word: "Azul", colorHex: "#2563EB" }],
    });
    expect(screen.getByText("Esta atividade está incompleta.")).toBeTruthy();
    expect(onGameResult).not.toHaveBeenCalled();
  });
});
