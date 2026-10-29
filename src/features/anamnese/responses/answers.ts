import type {
  AnamneseAnswerInput,
  AnamneseResponse,
  AnamneseUploadFile,
} from "@/api/endpoints/anamnese-responses";
import type { AnamneseTemplate } from "@/api/types";

export type TemplateQuestion = AnamneseTemplate["questions"][number];

export interface AnswerDraft {
  text: string;
  optionId: string | null;
  optionIds: string[];
  /** Arquivo escolhido que ainda não foi enviado. */
  file: AnamneseUploadFile | null;
  /** URL já enviada (upload feito agora ou resposta existente). */
  fileUrl: string | null;
}

export type Drafts = Record<string, AnswerDraft>;

export const REQUIRED_MESSAGE = "Resposta obrigatória";

export function emptyDraft(): AnswerDraft {
  return { text: "", optionId: null, optionIds: [], file: null, fileUrl: null };
}

export function sortedQuestions(
  template: AnamneseTemplate,
): TemplateQuestion[] {
  return [...template.questions].sort((a, b) => a.order - b.order);
}

export function draftsFromResponse(
  template: AnamneseTemplate,
  response?: AnamneseResponse,
): Drafts {
  const drafts: Drafts = {};
  for (const question of template.questions) {
    const answer = response?.answers.find(
      (item) => item.questionId === question.id,
    );
    drafts[question.id] = {
      text: answer?.textValue ?? "",
      optionId: answer?.selectedOptionId ?? null,
      optionIds: answer?.selectedOptionIds ?? [],
      file: null,
      fileUrl: answer?.fileUrl ?? null,
    };
  }
  return drafts;
}

function isAnswered(question: TemplateQuestion, draft: AnswerDraft): boolean {
  switch (question.type) {
    case "Descriptive":
      return draft.text.trim().length > 0;
    case "MultipleChoice":
      return draft.optionId !== null;
    case "Checkbox":
      return draft.optionIds.length > 0;
    case "FileUpload":
      return draft.file !== null || draft.fileUrl !== null;
  }
}

/** Mensagem por pergunta obrigatória sem resposta (chave: `questionId`). */
export function validateDrafts(
  template: AnamneseTemplate,
  drafts: Drafts,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const question of template.questions) {
    if (
      question.required &&
      !isAnswered(question, drafts[question.id] ?? emptyDraft())
    )
      errors[question.id] = REQUIRED_MESSAGE;
  }
  return errors;
}

/**
 * Lista completa de respostas, na ordem do modelo, só com o campo do tipo da
 * pergunta. Perguntas sem resposta ficam de fora. Para `FileUpload`, o upload
 * já deve ter preenchido `fileUrl`.
 */
export function buildAnswers(
  template: AnamneseTemplate,
  drafts: Drafts,
): AnamneseAnswerInput[] {
  const answers: AnamneseAnswerInput[] = [];
  for (const question of sortedQuestions(template)) {
    const draft = drafts[question.id] ?? emptyDraft();
    const base = { questionId: question.id, questionType: question.type };
    switch (question.type) {
      case "Descriptive":
        if (draft.text.trim())
          answers.push({ ...base, textValue: draft.text.trim() });
        break;
      case "MultipleChoice":
        if (draft.optionId)
          answers.push({ ...base, selectedOptionId: draft.optionId });
        break;
      case "Checkbox":
        if (draft.optionIds.length)
          answers.push({ ...base, selectedOptionIds: draft.optionIds });
        break;
      case "FileUpload":
        if (draft.fileUrl) answers.push({ ...base, fileUrl: draft.fileUrl });
        break;
    }
  }
  return answers;
}

/** Texto de leitura de uma resposta (somente leitura). */
export function describeAnswer(
  question: TemplateQuestion,
  answer?: AnamneseResponse["answers"][number],
): string {
  if (!answer) return "Sem resposta";
  switch (question.type) {
    case "Descriptive":
      return answer.textValue?.trim() || "Sem resposta";
    case "MultipleChoice":
      return (
        question.options.find((option) => option.id === answer.selectedOptionId)
          ?.text ?? "Sem resposta"
      );
    case "Checkbox": {
      const texts = (answer.selectedOptionIds ?? [])
        .map((id) => question.options.find((option) => option.id === id)?.text)
        .filter((text): text is string => !!text);
      return texts.length ? texts.join(", ") : "Sem resposta";
    }
    case "FileUpload":
      return answer.fileUrl ? "Arquivo enviado" : "Sem resposta";
  }
}

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  dateStyle: "short",
});

export function formatResponseDate(value: string): string {
  return dateFormat.format(new Date(value));
}
