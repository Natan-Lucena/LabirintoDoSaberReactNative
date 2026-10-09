import type { AnamneseTemplate } from "@/api/types";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";

export const MOCK_ANAMNESE_TEMPLATES: AnamneseTemplate[] = [
  {
    id: "template-1",
    educatorId: MOCK_EDUCATOR.id,
    title: "Anamnese inicial",
    description: "Histórico de desenvolvimento e rotina escolar",
    questions: [
      {
        id: "question-1",
        text: "Como é a rotina de estudos em casa?",
        type: "Descriptive",
        required: true,
        order: 1,
        options: [],
      },
    ],
    createdAt: "2026-09-20T12:00:00.000Z",
  },
  {
    id: "template-2",
    educatorId: MOCK_EDUCATOR.id,
    title: "Anamnese de acompanhamento",
    questions: [],
    createdAt: "2026-09-25T12:00:00.000Z",
  },
];

registerMockHandler({ method: "get", path: "/anamnese/templates/" }, () => ({
  status: 200,
  data: MOCK_ANAMNESE_TEMPLATES,
}));
