import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import type { Task } from "@/api/types";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { ActivityTypeChooser } from "../ActivityTypeChooser";
import { ActivityTypeForm } from "../ActivityTypeForm";

const routerBack = vi.fn();
const routerReplace = vi.fn();
const routerCanGoBack = vi.fn(() => true);
const createActivity = vi.fn();
const updateTask = vi.fn();
const listTaskSkills = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({
    back: routerBack,
    replace: routerReplace,
    canGoBack: routerCanGoBack,
  }),
}));

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

vi.mock("@/components/media/AudioPlayer", () => ({ AudioPlayer: () => null }));
vi.mock("@/components/media/ImagePickerField", () => ({
  ImagePickerField: () => null,
}));
vi.mock("@/components/media/AudioPickerField", () => ({
  AudioPickerField: () => null,
}));

vi.mock("@/api/endpoints/task-create", () => ({
  createActivity: (...args: unknown[]) => createActivity(...args),
}));
vi.mock("@/api/endpoints/task-update", () => ({
  updateTask: (...args: unknown[]) => updateTask(...args),
}));
vi.mock("@/api/endpoints/task-catalog", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/api/endpoints/task-catalog")>();
  return { ...actual, listTaskSkills: () => listTaskSkills() };
});

const skills = [
  { code: "LETTER_RECOGNITION", label: "Letras", learningTopics: [] },
];

async function fillWordBuilder(word = "gato") {
  await fireEvent.changeText(
    screen.getByLabelText("Instrução para a criança *"),
    "Forme a palavra da figura",
  );
  await fireEvent.press(screen.getByRole("button", { name: "Categoria *" }));
  await fireEvent.press(screen.getByRole("button", { name: "Escrita" }));
  await fireEvent.changeText(screen.getByLabelText("Palavra *"), word);
  await fireEvent.changeText(screen.getByLabelText("Letras extras"), "e i");
}

const saveButton = () =>
  screen.getByRole("button", { name: "Salvar atividade" });

describe("ActivityTypeForm", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerReplace.mockClear();
    routerCanGoBack.mockReset().mockReturnValue(true);
    createActivity.mockReset();
    updateTask.mockReset();
    listTaskSkills.mockReset().mockResolvedValue(skills);
  });

  it("AC-ATV-11-01: bloqueia palavra inválida e envia kind igual ao tipo", async () => {
    createActivity.mockResolvedValue({ id: "novo-1" } as Task);
    await render(<ActivityTypeForm type="wordBuilder" />);

    await fillWordBuilder("GAT0");
    expect(saveButton().props.accessibilityState.disabled).toBe(true);
    expect(
      screen.getByText("Use apenas letras, sem números ou espaços"),
    ).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText("Palavra *"), "gato");
    await fireEvent.press(saveButton());

    await waitFor(() =>
      expect(createActivity).toHaveBeenCalledWith({
        category: "writing",
        type: "wordBuilder",
        prompt: "Forme a palavra da figura",
        content: { kind: "wordBuilder", word: "GATO", distractors: ["E", "I"] },
      }),
    );
    await waitFor(() =>
      expect(routerReplace).toHaveBeenCalledWith("/content/task/novo-1"),
    );
  });

  it("aceita 201 vazio e volta ao banco de atividades", async () => {
    createActivity.mockResolvedValue(null);
    await render(<ActivityTypeForm type="wordBuilder" />);
    await fillWordBuilder();
    await fireEvent.press(saveButton());

    await waitFor(() =>
      expect(routerReplace).toHaveBeenCalledWith("/(tabs)/activities"),
    );
  });

  it("AC-ATV-11-02: INVALID_CONTENT com caminho completo marca o campo certo", async () => {
    createActivity.mockRejectedValue(
      new ApiError({
        message: "O conteúdo da atividade é inválido.",
        status: 400,
        code: "INVALID_CONTENT",
        errors: [{ path: "content.word", message: "Palavra proibida" }],
      }),
    );
    await render(<ActivityTypeForm type="wordBuilder" />);
    await fillWordBuilder();
    await fireEvent.press(saveButton());

    expect(await screen.findByText("Palavra proibida")).toBeTruthy();
    expect(screen.getByText("Revise os campos marcados.")).toBeTruthy();
  });

  it("AC-ATV-11-02: só `content` mostra o erro no topo do formulário", async () => {
    createActivity.mockRejectedValue(
      new ApiError({
        message: "x",
        status: 400,
        code: "INVALID_CONTENT",
        errors: [{ path: "content", message: "inválido" }],
      }),
    );
    await render(<ActivityTypeForm type="wordBuilder" />);
    await fillWordBuilder();
    await fireEvent.press(saveButton());

    expect(
      await screen.findByText("Revise o conteúdo da atividade."),
    ).toBeTruthy();
  });

  it("habilidades indisponíveis: mostra aviso e o formulário ainda salva", async () => {
    listTaskSkills.mockRejectedValue(new Error("falha"));
    createActivity.mockResolvedValue(null);
    await render(<ActivityTypeForm type="wordBuilder" />);

    expect(
      await screen.findByText("Não foi possível carregar as habilidades."),
    ).toBeTruthy();
    await fillWordBuilder();
    await fireEvent.press(saveButton());
    await waitFor(() => expect(createActivity).toHaveBeenCalled());
  });

  it("AC-ATV-11-03: editar só o tema envia id e tema, sem type, e volta ao detalhe", async () => {
    updateTask.mockResolvedValue(undefined);
    const task: Task = {
      id: "task-1",
      category: "writing",
      type: "wordBuilder",
      prompt: "Forme a palavra",
      alternatives: [],
      createdAt: "2026-11-01T10:00:00.000Z",
      skills: [],
      tone: "mint",
      content: { kind: "wordBuilder", word: "GATO" },
    };
    await render(<ActivityTypeForm type="wordBuilder" task={task} />);

    expect(screen.getByLabelText("Palavra *").props.value).toBe("GATO");
    await fireEvent.changeText(screen.getByLabelText("Tema"), "Animais");
    await fireEvent.press(saveButton());

    await waitFor(() =>
      expect(updateTask).toHaveBeenCalledWith({
        id: "task-1",
        theme: "Animais",
      }),
    );
    await waitFor(() => expect(routerBack).toHaveBeenCalledTimes(1));
  });
});

describe("ActivityTypeChooser", () => {
  beforeEach(() => routerReplace.mockClear());

  it("AC-ATV-11-04: múltipla escolha abre o formulário atual; os novos abrem o editor", async () => {
    await render(<ActivityTypeChooser />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Múltipla escolha" }),
    );
    expect(routerReplace).toHaveBeenCalledWith({
      pathname: "/content/new-task",
      params: { type: "multipleChoice" },
    });

    await fireEvent.press(
      screen.getByRole("button", { name: "Memória visual" }),
    );
    expect(routerReplace).toHaveBeenLastCalledWith({
      pathname: "/content/new-activity",
      params: { type: "memoryGame" },
    });
  });
});
