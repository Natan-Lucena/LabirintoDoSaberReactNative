import type {
  AnamneseAnswerInput,
  AnamneseResponse,
  CreateAnamneseResponseInput,
  UpdateAnamneseResponseInput,
} from "@/api/endpoints/anamnese-responses";
import type { AnamneseTemplate } from "@/api/types";
import { MOCK_EDUCATOR, MOCK_STUDENTS } from "@/mocks/fixtures";
import { MOCK_ANAMNESE_TEMPLATES } from "./anamnese";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

export const MOCK_ANAMNESE_RESPONSES: AnamneseResponse[] = [
  {
    id: "response-1",
    templateId: "template-1",
    educatorId: MOCK_EDUCATOR.id,
    studentId: "student-1",
    answers: [
      {
        questionId: "question-1",
        questionType: "Descriptive",
        textValue: "Estuda à tarde, com apoio da mãe.",
      },
    ],
    answeredAt: "2026-10-20T14:00:00.000Z",
  },
  {
    // Resposta de outro educador: PUT 403 UNAUTHORIZED; GET por id 401 (D4).
    id: "response-other",
    templateId: "template-1",
    educatorId: "other-educator",
    studentId: "student-1",
    answers: [],
    answeredAt: "2026-10-21T14:00:00.000Z",
  },
];

function findTemplate(id: string): AnamneseTemplate {
  const template = MOCK_ANAMNESE_TEMPLATES.find((item) => item.id === id);
  if (!template) throw new MockApiError(404, "TEMPLATE_NOT_FOUND");
  return template;
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isUrl(value: unknown): boolean {
  if (typeof value !== "string") return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Mesmas validações para a criação e a edição (BACKEND-ENTREGUE §6). */
function validateAnswers(
  template: AnamneseTemplate,
  answers: unknown,
): AnamneseAnswerInput[] {
  if (!Array.isArray(answers)) throw new MockApiError(400, "INVALID_ANSWERS");
  const list = answers as AnamneseAnswerInput[];
  for (const answer of list) {
    const question = template.questions.find(
      (item) => item.id === answer?.questionId,
    );
    if (!question || answer.questionType !== question.type)
      throw new MockApiError(400, "INVALID_QUESTION_ID");
    switch (question.type) {
      case "Descriptive":
        if (!isString(answer.textValue) || !answer.textValue.trim())
          throw new MockApiError(400, "MISSING_TEXT_VALUE");
        break;
      case "MultipleChoice":
        if (!isString(answer.selectedOptionId))
          throw new MockApiError(400, "MISSING_SELECTED_OPTION");
        if (!question.options.some((o) => o.id === answer.selectedOptionId))
          throw new MockApiError(400, "INVALID_OPTION_ID");
        break;
      case "Checkbox":
        if (!answer.selectedOptionIds?.length)
          throw new MockApiError(400, "MISSING_SELECTED_OPTIONS");
        if (
          answer.selectedOptionIds.some(
            (id) => !question.options.some((o) => o.id === id),
          )
        )
          throw new MockApiError(400, "INVALID_OPTION_ID");
        break;
      case "FileUpload":
        if (!isUrl(answer.fileUrl))
          throw new MockApiError(400, "MISSING_FILE_URL");
        break;
    }
  }
  for (const question of template.questions) {
    if (
      question.required &&
      !list.some((answer) => answer.questionId === question.id)
    )
      throw new MockApiError(400, "MISSING_REQUIRED_ANSWER");
  }
  return list;
}

function findResponse(id: string): AnamneseResponse {
  const response = MOCK_ANAMNESE_RESPONSES.find((item) => item.id === id);
  if (!response) throw new MockApiError(404, "RESPONSE_NOT_FOUND");
  return response;
}

registerMockHandler(
  { method: "get", path: "/anamnese/responses/student/:studentId" },
  ({ params }) => ({
    status: 200,
    data: MOCK_ANAMNESE_RESPONSES.filter(
      (item) =>
        item.studentId === params.studentId &&
        item.educatorId === MOCK_EDUCATOR.id,
    ),
  }),
);

registerMockHandler(
  { method: "get", path: "/anamnese/responses/:responseId" },
  ({ params }) => {
    const response = findResponse(params.responseId);
    // D4: outro educador recebe 401 (não 403) nesta rota.
    if (response.educatorId !== MOCK_EDUCATOR.id)
      throw new MockApiError(401, "Unauthorized");
    return { status: 200, data: response };
  },
);

registerMockHandler(
  { method: "post", path: "/anamnese/templates/:templateId/responses" },
  ({ params, body }) => {
    const template = findTemplate(params.templateId);
    const input = body as CreateAnamneseResponseInput;
    if (!input || !isString(input.studentId))
      throw new MockApiError(400, "INVALID_RESPONSE_DATA");
    if (!MOCK_STUDENTS.some((student) => student.id === input.studentId))
      throw new MockApiError(404, "STUDENT_NOT_FOUND");
    const answers = validateAnswers(template, input.answers);
    const response: AnamneseResponse = {
      id: `mock-response-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      templateId: template.id,
      educatorId: MOCK_EDUCATOR.id,
      studentId: input.studentId,
      answers,
      answeredAt: new Date().toISOString(),
    };
    MOCK_ANAMNESE_RESPONSES.push(response);
    return { status: 200, data: response };
  },
);

registerMockHandler(
  { method: "put", path: "/anamnese/responses/:responseId" },
  ({ params, body }) => {
    const response = findResponse(params.responseId);
    if (response.educatorId !== MOCK_EDUCATOR.id)
      throw new MockApiError(403, "UNAUTHORIZED");
    const input = body as UpdateAnamneseResponseInput;
    response.answers = validateAnswers(
      findTemplate(response.templateId),
      input?.answers,
    );
    response.updatedAt = new Date().toISOString();
    return { status: 200, data: response };
  },
);

let nextFileId = 1;

registerMockHandler(
  { method: "post", path: "/anamnese/responses/upload-file" },
  ({ body }) => {
    const file =
      typeof FormData !== "undefined" && body instanceof FormData
        ? body.get("file")
        : (body as Record<string, unknown> | undefined)?.file;
    if (!file) throw new MockApiError(400, "FILE_REQUIRED");
    const name = (file as { name?: unknown }).name;
    const extension =
      typeof name === "string" && name.includes(".")
        ? name.split(".").pop()
        : "bin";
    return {
      status: 200,
      data: {
        url: `https://mock.local/anamnese/mock-file-${nextFileId++}.${extension}`,
      },
    };
  },
);

export const anamneseResponsesMockHandlersRegistered = true;
