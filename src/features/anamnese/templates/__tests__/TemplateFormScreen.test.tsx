import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { TemplateFormScreen } from "../TemplateFormScreen";

const back = vi.fn();
const create = vi.fn();
const update = vi.fn();
const deletion = vi.fn();
vi.mock("expo-router", () => ({ useRouter: () => ({ back }) }));
vi.mock("@/api/endpoints/anamnese", () => ({
  createAnamneseTemplate: (...args: unknown[]) => create(...args),
  updateAnamneseTemplate: (...args: unknown[]) => update(...args),
  deleteAnamneseTemplate: (...args: unknown[]) => deletion(...args),
  getAnamneseTemplate: async () => ({
    id: "template-1",
    title: "Original",
    questions: [
      {
        id: "q1",
        text: "Pergunta antiga",
        type: "Descriptive",
        required: true,
        order: 1,
        options: [],
      },
    ],
  }),
}));

describe("TemplateFormScreen PAC-08", () => {
  beforeEach(() => {
    back.mockClear();
    create.mockReset();
    update.mockReset();
    deletion.mockReset();
  });
  it("QA-03: o botão Remover diz qual pergunta remove", async () => {
    await render(<TemplateFormScreen />);
    await fireEvent.press(
      screen.getByRole("button", { name: "Adicionar pergunta" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Adicionar pergunta" }),
    );
    expect(
      screen.getByRole("button", { name: "Remover pergunta 1" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Remover pergunta 2" }),
    ).toBeTruthy();
  });

  it("cria modelo com perguntas em ordem e opções só para escolha", async () => {
    create.mockResolvedValue({ id: "new" });
    await render(<TemplateFormScreen />);
    await fireEvent.changeText(screen.getByLabelText("Título *"), "Inicial");
    await fireEvent.press(
      screen.getByRole("button", { name: "Adicionar pergunta" }),
    );
    await fireEvent.changeText(
      screen.getByLabelText("Texto da pergunta *"),
      "Qual?",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar modelo" }),
    );
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        title: "Inicial",
        questions: [{ text: "Qual?", type: "Descriptive", required: false }],
      }),
    );
  });
  it("não salva modelo sem perguntas e mostra o aviso (PAC-08.3)", async () => {
    await render(<TemplateFormScreen />);
    await fireEvent.changeText(screen.getByLabelText("Título *"), "Inicial");
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar modelo" }),
    );
    const alert = await screen.findByText("Adicione pelo menos uma pergunta");
    expect(alert.props.accessibilityRole).toBe("alert");
    expect(create).not.toHaveBeenCalled();
  });
  it("mantém formulário e mostra erro de modelo com respostas", async () => {
    update.mockRejectedValue({ code: "TEMPLATE_HAS_RESPONSES" });
    await render(<TemplateFormScreen templateId="template-1" />);
    await waitFor(() =>
      expect(screen.getByLabelText("Texto da pergunta *").props.value).toBe(
        "Pergunta antiga",
      ),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar modelo" }),
    );
    await screen.findByText(
      "Este modelo já tem respostas e não pode ser alterado.",
    );
    expect(screen.getByLabelText("Título *").props.value).toBe("Original");
  });
  it("edita modelo enviando opções nos tipos de escolha", async () => {
    update.mockResolvedValue({ id: "template-1" });
    await render(<TemplateFormScreen templateId="template-1" />);
    await waitFor(() =>
      expect(screen.getByLabelText("Texto da pergunta *").props.value).toBe(
        "Pergunta antiga",
      ),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Tipo *" }));
    await fireEvent.press(
      await screen.findByRole("button", { name: "Múltipla escolha" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Adicionar opção" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Adicionar opção" }),
    );
    await fireEvent.changeText(screen.getByLabelText("Opção 1"), "Sim");
    await fireEvent.changeText(screen.getByLabelText("Opção 2"), "Não");
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar modelo" }),
    );
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith("template-1", {
        title: "Original",
        questions: [
          {
            text: "Pergunta antiga",
            type: "MultipleChoice",
            required: true,
            options: [{ text: "Sim" }, { text: "Não" }],
          },
        ],
      }),
    );
  });
  it("exige confirmação para excluir e mostra erro acionável", async () => {
    deletion.mockRejectedValue({ code: "TEMPLATE_HAS_RESPONSES" });
    await render(<TemplateFormScreen templateId="template-1" />);
    await waitFor(() =>
      expect(screen.getByLabelText("Texto da pergunta *").props.value).toBe(
        "Pergunta antiga",
      ),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir modelo" }),
    );
    expect(deletion).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
    await screen.findByText(
      "Este modelo já tem respostas e não pode ser alterado.",
    );
  });
});
