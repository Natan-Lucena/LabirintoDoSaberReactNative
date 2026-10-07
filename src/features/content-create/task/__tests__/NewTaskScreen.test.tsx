import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { ApiError } from "@/api/errors";
import { NewTaskScreen } from "../NewTaskScreen";

const routerBack = vi.fn();
const routerReplace = vi.fn();
const createTask = vi.fn();
const updateTask = vi.fn();
const getTaskById = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack, replace: routerReplace }),
}));

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

vi.mock("@/components/media/AudioPlayer", () => ({
  AudioPlayer: () => null,
}));

vi.mock("@/components/media/ImagePickerField", () => ({
  ImagePickerField: () => null,
}));

vi.mock("@/components/media/AudioPickerField", () => ({
  AudioPickerField: () => null,
}));

vi.mock("@/api/endpoints/task-create", () => ({
  createTask: (...args: unknown[]) => createTask(...args),
}));

vi.mock("@/api/endpoints/task-update", () => ({
  updateTask: (...args: unknown[]) => updateTask(...args),
}));

vi.mock("@/api/endpoints/content", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/endpoints/content")>();
  return {
    ...actual,
    getTaskById: (...args: unknown[]) => getTaskById(...args),
  };
});

const existingTask = {
  id: "task-1",
  category: "reading" as const,
  type: "multipleChoice" as const,
  prompt: "Qual palavra começa com a letra A?",
  alternatives: [
    { id: "alt-1", text: "Abelha", isCorrect: true },
    { id: "alt-2", text: "Bola", isCorrect: false },
  ],
  createdAt: "2026-01-01T12:00:00.000Z",
};

describe("NewTaskScreen", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerReplace.mockClear();
    createTask.mockReset();
    updateTask.mockReset();
    getTaskById.mockReset();
  });

  it("bloqueia a criação até preencher enunciado, categoria e alternativas", async () => {
    await render(<NewTaskScreen />);

    expect(
      screen.getByRole("button", { name: "Salvar atividade" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("bloqueia com apenas 1 alternativa preenchida e marcada", async () => {
    await render(<NewTaskScreen />);

    await fireEvent.changeText(
      screen.getByLabelText("Enunciado *"),
      "Qual é a capital do Brasil?",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Categoria *" }));
    await fireEvent.press(screen.getByRole("button", { name: "Leitura" }));
    await fireEvent.changeText(
      screen.getByLabelText("Alternativa A"),
      "Brasília",
    );
    await fireEvent.press(
      screen.getByRole("checkbox", {
        name: "Marcar alternativa A como correta",
      }),
    );

    expect(
      screen.getByRole("button", { name: "Salvar atividade" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("envia enunciado, categoria e alternativas preenchidas e navega para atividades", async () => {
    createTask.mockResolvedValue(undefined);
    await render(<NewTaskScreen />);

    await fireEvent.changeText(
      screen.getByLabelText("Enunciado *"),
      "Qual é a capital do Brasil?",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Categoria *" }));
    await fireEvent.press(screen.getByRole("button", { name: "Leitura" }));
    await fireEvent.changeText(
      screen.getByLabelText("Alternativa A"),
      "Brasília",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Alternativa B"),
      "Rio de Janeiro",
    );
    await fireEvent.press(
      screen.getByRole("checkbox", {
        name: "Marcar alternativa A como correta",
      }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar atividade" }),
    );

    await waitFor(() =>
      expect(createTask).toHaveBeenCalledWith({
        category: "reading",
        prompt: "Qual é a capital do Brasil?",
        alternatives: [
          { text: "Brasília", isCorrect: true },
          { text: "Rio de Janeiro", isCorrect: false },
        ],
      }),
    );
    expect(routerReplace).toHaveBeenCalledWith("/(tabs)/activities");
  });

  it("carrega a atividade existente e preenche o formulário em modo edição", async () => {
    getTaskById.mockResolvedValue(existingTask);
    await render(<NewTaskScreen taskId="task-1" />);

    await waitFor(() =>
      expect(screen.getByLabelText("Enunciado *").props.value).toBe(
        existingTask.prompt,
      ),
    );
    expect(screen.getByLabelText("Alternativa A").props.value).toBe("Abelha");
    expect(screen.getByLabelText("Alternativa B").props.value).toBe("Bola");
  });

  it("envia somente os campos alterados pelo PUT /task/update", async () => {
    getTaskById.mockResolvedValue(existingTask);
    updateTask.mockResolvedValue(undefined);
    await render(<NewTaskScreen taskId="task-1" />);

    await waitFor(() =>
      expect(screen.getByLabelText("Enunciado *").props.value).toBe(
        existingTask.prompt,
      ),
    );

    await fireEvent.changeText(
      screen.getByLabelText("Enunciado *"),
      "Qual palavra começa com a letra B?",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar atividade" }),
    );

    await waitFor(() =>
      expect(updateTask).toHaveBeenCalledWith({
        id: "task-1",
        prompt: "Qual palavra começa com a letra B?",
      }),
    );
    expect(routerReplace).toHaveBeenCalledWith("/content/task/task-1");
  });

  it("mostra mensagem de erro legível quando a API rejeita a atividade", async () => {
    createTask.mockRejectedValue(
      new ApiError({
        message: "AT_LEAST_ONE_ALTERNATIVE_MUST_BE_CORRECT",
        status: 500,
        code: "AT_LEAST_ONE_ALTERNATIVE_MUST_BE_CORRECT",
      }),
    );
    await render(<NewTaskScreen />);

    await fireEvent.changeText(
      screen.getByLabelText("Enunciado *"),
      "Qual é a capital do Brasil?",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Categoria *" }));
    await fireEvent.press(screen.getByRole("button", { name: "Leitura" }));
    await fireEvent.changeText(
      screen.getByLabelText("Alternativa A"),
      "Brasília",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Alternativa B"),
      "Rio de Janeiro",
    );
    await fireEvent.press(
      screen.getByRole("checkbox", {
        name: "Marcar alternativa A como correta",
      }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar atividade" }),
    );

    await waitFor(() =>
      expect(
        screen.getByText("Marque pelo menos uma alternativa correta."),
      ).toBeTruthy(),
    );
  });
});
