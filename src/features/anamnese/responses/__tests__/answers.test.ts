import { describe, expect, it } from "vitest";
import {
  buildAnswers,
  draftsFromResponse,
  emptyDraft,
  validateDrafts,
} from "../answers";
import { response, template } from "./fixtures";

describe("PAC-06 respostas por tipo", () => {
  it("AC-PAC-06-01 envia só o campo do tipo de cada pergunta", () => {
    const drafts = draftsFromResponse(template);
    drafts["q-text"] = { ...emptyDraft(), text: "  Estuda à tarde " };
    drafts["q-one"] = { ...emptyDraft(), optionId: "o-tarde", text: "lixo" };
    drafts["q-many"] = {
      ...emptyDraft(),
      optionIds: ["o-leitura", "o-escrita"],
      optionId: "o-manha",
    };
    drafts["q-file"] = {
      ...emptyDraft(),
      fileUrl: "https://mock.local/laudo.pdf",
      text: "lixo",
    };
    expect(buildAnswers(template, drafts)).toEqual([
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
        selectedOptionIds: ["o-leitura", "o-escrita"],
      },
      {
        questionId: "q-file",
        questionType: "FileUpload",
        fileUrl: "https://mock.local/laudo.pdf",
      },
    ]);
  });

  it("omite perguntas opcionais sem resposta", () => {
    const drafts = draftsFromResponse(template);
    drafts["q-text"] = { ...emptyDraft(), text: "Algo" };
    expect(buildAnswers(template, drafts)).toEqual([
      { questionId: "q-text", questionType: "Descriptive", textValue: "Algo" },
    ]);
  });

  it("preenche os rascunhos a partir de uma resposta existente", () => {
    const drafts = draftsFromResponse(template, response);
    expect(drafts["q-text"].text).toBe("À tarde");
    expect(drafts["q-many"].optionIds).toEqual(["o-leitura"]);
    expect(drafts["q-one"].optionId).toBeNull();
  });

  it("AC-PAC-06-03 acusa obrigatória vazia na pergunta", () => {
    const drafts = draftsFromResponse(template);
    drafts["q-text"] = { ...emptyDraft(), text: "   " };
    expect(validateDrafts(template, drafts)).toEqual({
      "q-text": "Resposta obrigatória",
    });
    drafts["q-text"] = { ...emptyDraft(), text: "ok" };
    expect(validateDrafts(template, drafts)).toEqual({});
  });
});
