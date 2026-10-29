import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/anamnese";
import "@/mocks/handlers/anamnese-responses";
import { createAnamneseTemplate } from "@/api/endpoints/anamnese";
import {
  createAnamneseResponse,
  listAnamneseResponsesByStudent,
  updateAnamneseResponse,
  uploadAnamneseFile,
} from "@/api/endpoints/anamnese-responses";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        appEnvironment: "development",
        apiBaseUrl: "http://10.0.2.2:3000",
        useMocks: "true",
      },
    },
  },
}));

apiClient.defaults.adapter = mockAdapter;

async function makeTemplate() {
  return createAnamneseTemplate({
    title: "Modelo de teste",
    questions: [
      { text: "Descreva", type: "Descriptive", required: true },
      {
        text: "Escolha",
        type: "MultipleChoice",
        required: false,
        options: [{ text: "A" }, { text: "B" }],
      },
      { text: "Arquivo", type: "FileUpload", required: false },
    ],
  });
}

describe("PAC-06 apiClient e mocks", () => {
  it("lista as respostas completas do paciente", async () => {
    const list = await listAnamneseResponsesByStudent("student-1");
    expect(list.map((item) => item.id)).toContain("response-1");
    expect(list.every((item) => item.id !== "response-other")).toBe(true);
    expect(list[0].answers[0]).toHaveProperty("textValue");
  });

  it("valida as respostas na criação", async () => {
    const created = await makeTemplate();
    const [text, choice, file] = created.questions;
    const answer = {
      questionId: text.id,
      questionType: "Descriptive" as const,
      textValue: "x",
    };
    await expect(
      createAnamneseResponse(created.id, {
        studentId: "student-1",
        answers: [],
      }),
    ).rejects.toMatchObject({ status: 400, code: "MISSING_REQUIRED_ANSWER" });
    await expect(
      createAnamneseResponse(created.id, {
        studentId: "student-1",
        answers: [{ questionId: text.id, questionType: "Descriptive" }],
      }),
    ).rejects.toMatchObject({ code: "MISSING_TEXT_VALUE" });
    await expect(
      createAnamneseResponse(created.id, {
        studentId: "student-1",
        answers: [
          answer,
          { questionId: choice.id, questionType: "MultipleChoice" },
        ],
      }),
    ).rejects.toMatchObject({ code: "MISSING_SELECTED_OPTION" });
    await expect(
      createAnamneseResponse(created.id, {
        studentId: "student-1",
        answers: [
          answer,
          {
            questionId: choice.id,
            questionType: "MultipleChoice",
            selectedOptionId: "invalida",
          },
        ],
      }),
    ).rejects.toMatchObject({ code: "INVALID_OPTION_ID" });
    await expect(
      createAnamneseResponse(created.id, {
        studentId: "student-1",
        answers: [answer, { questionId: file.id, questionType: "FileUpload" }],
      }),
    ).rejects.toMatchObject({ code: "MISSING_FILE_URL" });
    await expect(
      createAnamneseResponse(created.id, {
        studentId: "nao-existe",
        answers: [answer],
      }),
    ).rejects.toMatchObject({ status: 404, code: "STUDENT_NOT_FOUND" });
    await expect(
      createAnamneseResponse("nao-existe", {
        studentId: "student-1",
        answers: [],
      }),
    ).rejects.toMatchObject({ status: 404, code: "TEMPLATE_NOT_FOUND" });
  });

  it("edita mantendo answeredAt e gravando updatedAt", async () => {
    const created = await makeTemplate();
    const [text, choice] = created.questions;
    const response = await createAnamneseResponse(created.id, {
      studentId: "student-1",
      answers: [
        { questionId: text.id, questionType: "Descriptive", textValue: "x" },
        {
          questionId: choice.id,
          questionType: "MultipleChoice",
          selectedOptionId: choice.options[1].id,
        },
      ],
    });
    expect(response.updatedAt).toBeUndefined();
    const updated = await updateAnamneseResponse(response.id, {
      answers: [
        { questionId: text.id, questionType: "Descriptive", textValue: "y" },
      ],
    });
    expect(updated.answeredAt).toBe(response.answeredAt);
    expect(updated.updatedAt).toBeDefined();
    expect(updated.answers).toHaveLength(1);
    const list = await listAnamneseResponsesByStudent("student-1");
    expect(
      list.find((item) => item.id === response.id)?.updatedAt,
    ).toBeDefined();
  });

  it("PUT de outro educador devolve 403 e de resposta inexistente 404", async () => {
    await expect(
      updateAnamneseResponse("response-other", { answers: [] }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      updateAnamneseResponse("nao-existe", { answers: [] }),
    ).rejects.toMatchObject({ status: 404, code: "RESPONSE_NOT_FOUND" });
  });

  it("envia o arquivo em multipart e devolve a URL", async () => {
    const url = await uploadAnamneseFile({
      uri: "file:///laudo.pdf",
      name: "laudo.pdf",
      mimeType: "application/pdf",
    });
    expect(url).toMatch(
      /^https:\/\/mock\.local\/anamnese\/mock-file-\d+\.\w+$/,
    );
  });
});
