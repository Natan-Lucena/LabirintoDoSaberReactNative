import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getTaskById } from "@/api/endpoints/content";
import { ApiError } from "@/api/errors";
import { createQueryClient } from "@/api/query-client";
import { render } from "@/test-utils/render";
import { ActivityPlayScreen } from "../ActivityPlayScreen";

const back = vi.fn();
vi.mock("expo-router", () => ({ useRouter: () => ({ back }) }));
vi.mock("@/api/endpoints/content", () => ({ getTaskById: vi.fn() }));
vi.mock("@/components/media/AudioPlayer", () => ({ AudioPlayer: () => null }));

function renderScreen() {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return render(<ActivityPlayScreen taskId="task-1" />, { queryClient });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getTaskById).mockResolvedValue({
    id: "task-1",
    category: "reading",
    type: "multipleChoice",
    prompt: "Qual palavra começa com A?",
    alternatives: [
      { id: "a", text: "Abelha", isCorrect: true },
      { id: "b", text: "Bola", isCorrect: false },
    ],
    createdAt: "2026-10-07T12:00:00.000Z",
  });
});

describe("ActivityPlayScreen", () => {
  it("carrega a atividade, joga até o fim e avisa que não há registro de resultado", async () => {
    await renderScreen();

    await waitFor(() =>
      expect(screen.getByText("Qual palavra começa com A?")).toBeTruthy(),
    );
    expect(getTaskById).toHaveBeenCalledWith("task-1");
    expect(screen.getByText(/não registra resultado/i)).toBeTruthy();

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Abelha" })),
    );
    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Concluir" })),
    );
    expect(screen.getByText("Atividade concluída")).toBeTruthy();

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Sair" })),
    );
    expect(back).toHaveBeenCalledTimes(1);
  });

  it("mostra carregando", async () => {
    vi.mocked(getTaskById).mockReturnValue(new Promise(() => {}));
    await renderScreen();

    expect(screen.getByLabelText("Carregando atividade")).toBeTruthy();
  });

  it("erro permite tentar novamente", async () => {
    vi.mocked(getTaskById).mockRejectedValueOnce(new Error("rede"));
    await renderScreen();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Tentar novamente" }),
      ).toBeTruthy(),
    );
    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" })),
    );
    await waitFor(() =>
      expect(screen.getByText("Qual palavra começa com A?")).toBeTruthy(),
    );
  });

  it("atividade inexistente mostra não encontrada", async () => {
    vi.mocked(getTaskById).mockRejectedValue(
      new ApiError({
        message: "TASK_NOT_FOUND",
        status: 500,
        code: "TASK_NOT_FOUND",
      }),
    );
    await renderScreen();

    await waitFor(() =>
      expect(screen.getByText("Não encontrado")).toBeTruthy(),
    );
  });
});
