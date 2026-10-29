import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { response, template } from "./fixtures";

const push = vi.fn();
const back = vi.fn();
const listResponses = vi.fn();
const create = vi.fn();
const update = vi.fn();
const upload = vi.fn();
const listTemplates = vi.fn();
const getDocument = vi.fn();

vi.mock("expo-router", () => ({ useRouter: () => ({ push, back }) }));
vi.mock("expo-document-picker", () => ({
  getDocumentAsync: (...args: unknown[]) => getDocument(...args),
}));
vi.mock("@/api/endpoints/anamnese", () => ({
  listAnamneseTemplates: () => listTemplates(),
}));
vi.mock("@/api/endpoints/anamnese-responses", () => ({
  MAX_ANAMNESE_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  listAnamneseResponsesByStudent: (...args: unknown[]) =>
    listResponses(...args),
  createAnamneseResponse: (...args: unknown[]) => create(...args),
  updateAnamneseResponse: (...args: unknown[]) => update(...args),
  uploadAnamneseFile: (...args: unknown[]) => upload(...args),
}));

const { AnamneseResponsesScreen } = await import("../AnamneseResponsesScreen");

describe("AnamneseResponsesScreen PAC-06", () => {
  beforeEach(() => {
    for (const mock of [
      push,
      back,
      listResponses,
      create,
      update,
      upload,
      listTemplates,
      getDocument,
    ])
      mock.mockReset();
    listTemplates.mockResolvedValue([template]);
    listResponses.mockResolvedValue([response]);
  });

  it("lista as respostas com o modelo e a data, e abre a leitura", async () => {
    await render(<AnamneseResponsesScreen patientId="student-1" />);
    await screen.findByText("Anamnese inicial");
    expect(screen.getByText("Respondida em 20/10/2026")).toBeTruthy();
    expect(listResponses).toHaveBeenCalledWith("student-1");
    await fireEvent.press(
      screen.getByRole("button", { name: "Anamnese inicial" }),
    );
    await screen.findByText("À tarde");
    expect(screen.getByText("Leitura")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Editar" })).toBeTruthy();
  });

  it("sem modelo mostra o estado vazio com Criar modelo", async () => {
    listTemplates.mockResolvedValue([]);
    listResponses.mockResolvedValue([]);
    await render(<AnamneseResponsesScreen patientId="student-1" />);
    await screen.findByText("Nenhuma anamnese registrada");
    await fireEvent.press(screen.getByRole("button", { name: "Criar modelo" }));
    expect(push).toHaveBeenCalledWith("/anamnese/templates/new");
  });

  it("AC-PAC-06-03 bloqueia o envio com obrigatória vazia", async () => {
    listResponses.mockResolvedValue([]);
    await render(<AnamneseResponsesScreen patientId="student-1" />);
    await fireEvent.press(
      await screen.findByRole("button", { name: "Nova anamnese" }),
    );
    await fireEvent.press(
      await screen.findByRole("button", { name: "Anamnese inicial" }),
    );
    await fireEvent.press(
      await screen.findByRole("button", { name: "Salvar anamnese" }),
    );
    await screen.findByText("Resposta obrigatória");
    expect(create).not.toHaveBeenCalled();
  });

  it("AC-PAC-06-02 faz o upload antes e envia a URL devolvida", async () => {
    listResponses.mockResolvedValue([]);
    getDocument.mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: "file:///laudo.pdf",
          name: "laudo.pdf",
          mimeType: "application/pdf",
          size: 2048,
        },
      ],
    });
    upload.mockResolvedValue("https://mock.local/anamnese/laudo.pdf");
    create.mockResolvedValue({ ...response, id: "novo" });
    await render(<AnamneseResponsesScreen patientId="student-1" />);
    await fireEvent.press(
      await screen.findByRole("button", { name: "Nova anamnese" }),
    );
    await fireEvent.press(
      await screen.findByRole("button", { name: "Anamnese inicial" }),
    );
    await fireEvent.changeText(
      await screen.findByLabelText("Rotina de estudos *"),
      "Estuda à tarde",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Turno" }));
    await fireEvent.press(screen.getByRole("button", { name: "Tarde" }));
    await fireEvent.press(screen.getByLabelText("Leitura"));
    await fireEvent.press(
      screen.getByRole("button", { name: "Escolher arquivo" }),
    );
    await screen.findByText("laudo.pdf");
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar anamnese" }),
    );
    await waitFor(() =>
      expect(create).toHaveBeenCalledWith("template-x", {
        studentId: "student-1",
        answers: [
          {
            questionId: "q-text",
            questionType: "Descriptive",
            textValue: "Estuda à tarde",
          },
          {
            questionId: "q-one",
            questionType: "MultipleChoice",
            selectedOptionId: "o-tarde",
          },
          {
            questionId: "q-many",
            questionType: "Checkbox",
            selectedOptionIds: ["o-leitura"],
          },
          {
            questionId: "q-file",
            questionType: "FileUpload",
            fileUrl: "https://mock.local/anamnese/laudo.pdf",
          },
        ],
      }),
    );
    expect(upload).toHaveBeenCalledWith({
      uri: "file:///laudo.pdf",
      name: "laudo.pdf",
      mimeType: "application/pdf",
      size: 2048,
    });
  });

  it("AC-PAC-06-04 edita enviando o PUT com a lista completa e mostra Editada em", async () => {
    update.mockResolvedValue({
      ...response,
      updatedAt: "2026-10-25T14:00:00.000Z",
    });
    await render(<AnamneseResponsesScreen patientId="student-1" />);
    await fireEvent.press(
      await screen.findByRole("button", { name: "Anamnese inicial" }),
    );
    await fireEvent.press(
      await screen.findByRole("button", { name: "Editar" }),
    );
    const field = await screen.findByLabelText("Rotina de estudos *");
    expect(field.props.value).toBe("À tarde");
    await fireEvent.changeText(field, "De manhã");
    listResponses.mockResolvedValue([
      {
        ...response,
        updatedAt: "2026-10-25T14:00:00.000Z",
        answers: [
          {
            questionId: "q-text",
            questionType: "Descriptive",
            textValue: "De manhã",
          },
        ],
      },
    ]);
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar anamnese" }),
    );
    await waitFor(() =>
      expect(update).toHaveBeenCalledWith("response-x", {
        answers: [
          {
            questionId: "q-text",
            questionType: "Descriptive",
            textValue: "De manhã",
          },
          {
            questionId: "q-many",
            questionType: "Checkbox",
            selectedOptionIds: ["o-leitura"],
          },
        ],
      }),
    );
    await screen.findByText("Respondida em 20/10/2026 · Editada em 25/10/2026");
  });

  it("mostra o erro da API na pergunta e mantém o formulário", async () => {
    listResponses.mockResolvedValue([]);
    create.mockRejectedValue({
      code: "MISSING_TEXT_VALUE",
      errors: [{ path: "answers.0.textValue", message: "obrigatório" }],
    });
    await render(<AnamneseResponsesScreen patientId="student-1" />);
    await fireEvent.press(
      await screen.findByRole("button", { name: "Nova anamnese" }),
    );
    await fireEvent.press(
      await screen.findByRole("button", { name: "Anamnese inicial" }),
    );
    await fireEvent.changeText(
      await screen.findByLabelText("Rotina de estudos *"),
      "Algo",
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Salvar anamnese" }),
    );
    await screen.findByText("Informe o texto da resposta");
    expect(screen.getByLabelText("Rotina de estudos *").props.value).toBe(
      "Algo",
    );
  });
});
