import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { NewTaskScreen } from "../NewTaskScreen";

const routerBack = vi.fn();
const routerReplace = vi.fn();
const createTask = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack, replace: routerReplace }),
}));

vi.mock("@/api/endpoints/task-create", () => ({
  createTask: (...args: unknown[]) => createTask(...args),
}));

describe("NewTaskScreen", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerReplace.mockClear();
    createTask.mockReset();
  });

  it("bloqueia a criação até preencher enunciado, categoria e alternativas", async () => {
    await render(<NewTaskScreen />);

    expect(
      screen.getByRole("button", { name: "Criar Atividade" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("mostra as mídias desabilitadas com o selo Em breve", async () => {
    await render(<NewTaskScreen />);

    expect(screen.getByText("Imagem da Atividade")).toBeTruthy();
    expect(screen.getByText("Áudio da Atividade")).toBeTruthy();
    expect(screen.getAllByText("Em breve")).toHaveLength(2);
  });

  it("bloqueia com apenas 1 alternativa preenchida e marcada", async () => {
    await render(<NewTaskScreen />);

    await fireEvent.changeText(
      screen.getByLabelText("Enunciado *"),
      "Qual é a capital do Brasil?",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Leitura" }));
    await fireEvent.changeText(
      screen.getByLabelText("Alternativa A"),
      "Brasília",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Marcar alternativa A como correta" }),
    );

    expect(
      screen.getByRole("button", { name: "Criar Atividade" }).props
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
      screen.getByRole("button", { name: "Marcar alternativa A como correta" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Criar Atividade" }),
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

  it("cancela sem salvar", async () => {
    await render(<NewTaskScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    expect(routerBack).toHaveBeenCalledOnce();
    expect(createTask).not.toHaveBeenCalled();
  });
});
