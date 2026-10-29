import type { AnamneseTemplate } from "@/api/types";
import type {
  CreateAnamneseTemplateInput,
  UpdateAnamneseTemplateInput,
} from "@/api/endpoints/anamnese";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import { MockApiError } from "./types";
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
  data: [...MOCK_ANAMNESE_TEMPLATES],
}));

function findTemplate(id: string): AnamneseTemplate {
  const template = MOCK_ANAMNESE_TEMPLATES.find((item) => item.id === id);
  if (!template) throw new MockApiError(404, "TEMPLATE_NOT_FOUND");
  return template;
}

function ensureEditable(id: string): void {
  // Cenário acionável para testes de bloqueio de modelos que já têm respostas.
  if (id === "has-responses")
    throw new MockApiError(400, "TEMPLATE_HAS_RESPONSES");
}

function validateInput(input: UpdateAnamneseTemplateInput): void {
  if (
    input.title !== undefined &&
    (typeof input.title !== "string" ||
      !input.title.trim() ||
      input.title.length > 200)
  )
    throw new MockApiError(400, "INVALID_TEMPLATE_DATA");
  if (
    input.description !== undefined &&
    (typeof input.description !== "string" || input.description.length > 1000)
  )
    throw new MockApiError(400, "INVALID_TEMPLATE_DATA");
  if (input.questions !== undefined) {
    if (
      !Array.isArray(input.questions) ||
      input.questions.some(
        (question) =>
          !question.text?.trim() ||
          !["Descriptive", "MultipleChoice", "Checkbox", "FileUpload"].includes(
            question.type,
          ) ||
          typeof question.required !== "boolean" ||
          (["MultipleChoice", "Checkbox"].includes(question.type) &&
            (!Array.isArray(question.options) ||
              question.options.length < 2 ||
              question.options.some((option) => !option.text?.trim()))),
      )
    )
      throw new MockApiError(400, "INVALID_TEMPLATE_DATA");
  }
}

function normalizeQuestions(
  input: CreateAnamneseTemplateInput["questions"],
): AnamneseTemplate["questions"] {
  return input.map((question, index) => ({
    id: `mock-question-${Date.now()}-${index}`,
    text: question.text,
    type: question.type,
    required: question.required,
    order: index + 1,
    options: (question.options ?? []).map((option, optionIndex) => ({
      id: `mock-option-${Date.now()}-${index}-${optionIndex}`,
      text: option.text,
    })),
  }));
}

registerMockHandler(
  { method: "get", path: "/anamnese/templates/:templateId" },
  ({ params }) => ({ status: 200, data: findTemplate(params.templateId) }),
);
registerMockHandler(
  { method: "post", path: "/anamnese/templates/" },
  ({ body }) => {
    const input = body as CreateAnamneseTemplateInput;
    if (
      !input ||
      typeof input.title !== "string" ||
      !Array.isArray(input.questions)
    )
      throw new MockApiError(400, "INVALID_TEMPLATE_DATA");
    validateInput(input);
    const template: AnamneseTemplate = {
      id: `mock-template-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      educatorId: MOCK_EDUCATOR.id,
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      questions: normalizeQuestions(input.questions),
      createdAt: new Date().toISOString(),
    };
    MOCK_ANAMNESE_TEMPLATES.push(template);
    return { status: 201, data: template };
  },
);
registerMockHandler(
  { method: "put", path: "/anamnese/templates/:templateId" },
  ({ params, body }) => {
    ensureEditable(params.templateId);
    const template = findTemplate(params.templateId);
    const input = body as UpdateAnamneseTemplateInput;
    if (!input) throw new MockApiError(400, "INVALID_TEMPLATE_DATA");
    validateInput(input);
    Object.assign(template, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.questions !== undefined
        ? { questions: normalizeQuestions(input.questions) }
        : {}),
    });
    return { status: 200, data: template };
  },
);
registerMockHandler(
  { method: "delete", path: "/anamnese/templates/:templateId" },
  ({ params }) => {
    ensureEditable(params.templateId);
    const template = findTemplate(params.templateId);
    MOCK_ANAMNESE_TEMPLATES.splice(
      MOCK_ANAMNESE_TEMPLATES.indexOf(template),
      1,
    );
    return { status: 200, data: null };
  },
);
