import { act, fireEvent, screen } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MemoryGameContent, Task } from "@/api/types";
import { render } from "@/test-utils/render";
import { MemoryGameActivity } from "../MemoryGameActivity";
import { buildDeck } from "../memoryGame";

vi.mock("@/components/media/AudioPlayer", () => ({ AudioPlayer: () => null }));

function task(content: MemoryGameContent | undefined) {
  return {
    id: "mg1",
    category: "vocabulary",
    type: "memoryGame",
    prompt: "Encontre os pares iguais",
    alternatives: [],
    createdAt: "2026-11-24T12:00:00.000Z",
    content,
  } as unknown as Task;
}

const CONTENT: MemoryGameContent = {
  kind: "memoryGame",
  cards: [
    { id: "c1", label: "Gato" },
    { id: "c2", label: "Pato" },
    { id: "c3", label: "Rato" },
  ],
};

// Com Math.random = 0 o baralho é determinístico; os testes usam a mesma ordem.
const DECK = buildDeck(CONTENT.cards, () => 0);

function positionsOf(pairId: string): number[] {
  return DECK.flatMap((c, i) => (c.pairId === pairId ? [i + 1] : []));
}

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

async function renderGame(content?: MemoryGameContent | null) {
  await render(
    <MemoryGameActivity
      task={task(content === null ? undefined : (content ?? CONTENT))}
      onAttempt={onAttempt}
      onSolved={onSolved}
      onGameResult={onGameResult}
    />,
  );
}

async function pressCard(n: number) {
  await act(async () =>
    fireEvent.press(screen.getByLabelText(new RegExp(`^Carta ${n}[,:]`))),
  );
}

describe("MemoryGameActivity", () => {
  it("mostra a instrução e 6 cartas viradas para baixo", async () => {
    await renderGame();
    expect(screen.getByText("Encontre os pares iguais")).toBeTruthy();
    for (let n = 1; n <= 6; n += 1) {
      expect(
        screen.getByLabelText(`Carta ${n}, virada para baixo`),
      ).toBeTruthy();
    }
  });

  it("AC-ATV-04b-04: cartas têm alvo de toque >= 44", async () => {
    await renderGame();
    const target = screen.getByLabelText("Carta 1, virada para baixo");
    const flat = Object.assign({}, ...[target.props.style].flat(5));
    const slop = target.props.hitSlop ?? {};
    const height = (flat.minHeight ?? flat.height ?? 0) + (slop.top ?? 0) * 2;
    const width = (flat.minWidth ?? flat.width ?? 0) + (slop.left ?? 0) * 2;
    expect(height).toBeGreaterThanOrEqual(44);
    expect(width).toBeGreaterThanOrEqual(44);
  });

  it("virar uma carta mostra o rótulo", async () => {
    await renderGame();
    const [n] = positionsOf("c1");
    await pressCard(n!);
    expect(screen.getByLabelText(`Carta ${n}: Gato`)).toBeTruthy();
  });

  it("par diferente volta a virar depois de 900 ms, com toque bloqueado", async () => {
    await renderGame();
    vi.useFakeTimers();
    const [a] = positionsOf("c1");
    const [b] = positionsOf("c2");
    const [c] = positionsOf("c3");
    await pressCard(a!);
    await pressCard(b!);
    expect(screen.getByLabelText(`Carta ${b}: Pato`)).toBeTruthy();

    await pressCard(c!);
    expect(screen.getByLabelText(`Carta ${c}, virada para baixo`)).toBeTruthy();

    await act(async () => {
      vi.advanceTimersByTime(899);
    });
    expect(screen.getByLabelText(`Carta ${a}: Gato`)).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByLabelText(`Carta ${a}, virada para baixo`)).toBeTruthy();
    expect(screen.getByLabelText(`Carta ${b}, virada para baixo`)).toBeTruthy();
    expect(onGameResult).not.toHaveBeenCalled();
  });

  it("par igual fica aberto com 'par encontrado'", async () => {
    await renderGame();
    const [a, b] = positionsOf("c1");
    await pressCard(a!);
    await pressCard(b!);
    expect(
      screen.getByLabelText(`Carta ${a}: Gato, par encontrado`),
    ).toBeTruthy();
    expect(
      screen.getByLabelText(`Carta ${b}: Gato, par encontrado`),
    ).toBeTruthy();
  });

  it("tocar numa carta já aberta não faz nada", async () => {
    await renderGame();
    const [a, b] = positionsOf("c1");
    await pressCard(a!);
    await pressCard(b!);
    await pressCard(a!);
    expect(
      screen.getByLabelText(`Carta ${a}: Gato, par encontrado`),
    ).toBeTruthy();
  });

  it("encontrar todos os pares chama onGameResult antes de onSolved", async () => {
    await renderGame();
    for (const id of ["c1", "c2", "c3"]) {
      const [a, b] = positionsOf(id);
      await pressCard(a!);
      await pressCard(b!);
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

  it("com uma jogada errada, reporta errors 1", async () => {
    await renderGame();
    vi.useFakeTimers();
    await pressCard(positionsOf("c1")[0]!);
    await pressCard(positionsOf("c2")[0]!);
    await act(async () => {
      vi.advanceTimersByTime(900);
    });
    for (const id of ["c1", "c2", "c3"]) {
      const [a, b] = positionsOf(id);
      await pressCard(a!);
      await pressCard(b!);
    }
    expect(onGameResult).toHaveBeenCalledWith(
      expect.objectContaining({ attempts: 4, errors: 1, correct: false }),
    );
  });

  it("imagem que falha mostra o rótulo, ou 'Figura n' sem rótulo", async () => {
    await renderGame({
      kind: "memoryGame",
      cards: [
        { id: "c1", imageUrl: "https://x.test/a.png" },
        { id: "c2", label: "Pato", imageUrl: "https://x.test/b.png" },
      ],
    });
    const deck = buildDeck(
      [
        { id: "c1", imageUrl: "https://x.test/a.png" },
        { id: "c2", label: "Pato", imageUrl: "https://x.test/b.png" },
      ],
      () => 0,
    );
    const n = deck.findIndex((c) => c.pairId === "c1") + 1;
    await pressCard(n);
    const image = screen.getByLabelText(`Imagem da carta ${n}`);
    await act(async () => fireEvent(image, "error"));
    expect(screen.getByText("Figura 1")).toBeTruthy();
  });

  it("conteúdo inválido libera o motor sem onGameResult", async () => {
    await renderGame(null);
    expect(screen.getByText("Esta atividade está incompleta.")).toBeTruthy();
    expect(onSolved).toHaveBeenCalledTimes(1);
    expect(onGameResult).not.toHaveBeenCalled();
  });

  it("menos de 2 cartas é conteúdo inválido", async () => {
    await renderGame({
      kind: "memoryGame",
      cards: [{ id: "c1", label: "Gato" }],
    });
    expect(screen.getByText("Esta atividade está incompleta.")).toBeTruthy();
    expect(onGameResult).not.toHaveBeenCalled();
  });
});
