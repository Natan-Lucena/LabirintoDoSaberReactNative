import type { AnamneseResponse } from "@/api/endpoints/anamnese-responses";
import type { AnamneseTemplate } from "@/api/types";

export const template: AnamneseTemplate = {
  id: "template-x",
  educatorId: "educator-1",
  title: "Anamnese inicial",
  questions: [
    {
      id: "q-text",
      text: "Rotina de estudos",
      type: "Descriptive",
      required: true,
      order: 1,
      options: [],
    },
    {
      id: "q-one",
      text: "Turno",
      type: "MultipleChoice",
      required: false,
      order: 2,
      options: [
        { id: "o-manha", text: "Manhã" },
        { id: "o-tarde", text: "Tarde" },
      ],
    },
    {
      id: "q-many",
      text: "Dificuldades",
      type: "Checkbox",
      required: false,
      order: 3,
      options: [
        { id: "o-leitura", text: "Leitura" },
        { id: "o-escrita", text: "Escrita" },
      ],
    },
    {
      id: "q-file",
      text: "Laudo",
      type: "FileUpload",
      required: false,
      order: 4,
      options: [],
    },
  ],
  createdAt: "2026-09-20T12:00:00.000Z",
};

export const response: AnamneseResponse = {
  id: "response-x",
  templateId: template.id,
  educatorId: "educator-1",
  studentId: "student-1",
  answers: [
    { questionId: "q-text", questionType: "Descriptive", textValue: "À tarde" },
    {
      questionId: "q-many",
      questionType: "Checkbox",
      selectedOptionIds: ["o-leitura"],
    },
  ],
  answeredAt: "2026-10-20T14:00:00.000Z",
};
