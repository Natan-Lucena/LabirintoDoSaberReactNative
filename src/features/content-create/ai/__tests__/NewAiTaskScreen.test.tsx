import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { NewAiTaskScreen } from "../NewAiTaskScreen";

const routerBack = vi.fn();
const routerReplace = vi.fn();
const generateAiTasks = vi.fn();
const createTasksBatch = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack, replace: routerReplace }),
}));
vi.mock("@/api/endpoints/ai-task", () => ({
  generateAiTasks: (...args: unknown[]) => generateAiTasks(...args),
}));
vi.mock("@/api/endpoints/task-batch", () => ({
  createTasksBatch: (...args: unknown[]) => createTasksBatch(...args),
}));

describe("NewAiTaskScreen", () => {
  beforeEach(() => {
    routerBack.mockReset();
    routerReplace.mockReset();
    generateAiTasks.mockReset();
    createTasksBatch.mockReset();
  });

  it("bloqueia o envio sem público-alvo, instruções, quantidade e categoria", async () => {
    await render(<NewAiTaskScreen />);
    await fireEvent.changeText(
      screen.getByLabelText("Público-alvo"),
      "Crianças",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Instruções"),
      "Trabalhe leitura",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Categoria" }));
    await fireEvent.press(screen.getByRole("button", { name: "Leitura" }));

    expect(
      screen.getByRole("button", { name: "Gerar atividades com IA" }).props
        .accessibilityState.disabled,
    ).toBe(true);

    await fireEvent.press(
      screen.getByRole("button", { name: "Gerar atividades com IA" }),
    );

    expect(generateAiTasks).not.toHaveBeenCalled();
  });

  it("permite revisar, descartar e salvar somente as atividades selecionadas", async () => {
    generateAiTasks.mockResolvedValue({
      tasks: [
        {
          category: "reading",
          type: "multipleChoice",
          prompt: "Primeira",
          alternatives: [
            { text: "A", isCorrect: true },
            { text: "B", isCorrect: false },
          ],
        },
        {
          category: "reading",
          type: "multipleChoice",
          prompt: "Segunda",
          alternatives: [
            { text: "C", isCorrect: true },
            { text: "D", isCorrect: false },
          ],
        },
      ],
    });
    createTasksBatch.mockResolvedValue({ taskIds: ["task-1"], taskGroup: {} });
    await render(<NewAiTaskScreen />);
    await fireEvent.changeText(
      screen.getByLabelText("Público-alvo"),
      "Crianças",
    );
    await fireEvent.changeText(
      screen.getByLabelText("Instruções"),
      "Trabalhe leitura",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Quantidade" }));
    await fireEvent.press(screen.getByRole("button", { name: "2" }));
    await fireEvent.press(screen.getByRole("button", { name: "Categoria" }));
    await fireEvent.press(screen.getByRole("button", { name: "Leitura" }));
    await fireEvent.press(
      screen.getByRole("button", { name: "Gerar atividades com IA" }),
    );
    await waitFor(() =>
      expect(screen.getByText("Rascunho gerado")).toBeTruthy(),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Descartar atividade 2" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar 1 atividade" }),
    );

    await waitFor(() =>
      expect(createTasksBatch).toHaveBeenCalledWith(
        expect.objectContaining({
          tasks: [expect.objectContaining({ prompt: "Primeira" })],
        }),
      ),
    );
    expect(routerReplace).toHaveBeenCalledWith("/activities");
  });
});
