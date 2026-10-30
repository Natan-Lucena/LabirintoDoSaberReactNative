import { z } from "zod";
import type { CreateAnamneseTemplateInput } from "@/api/endpoints/anamnese";

const questionSchema = z
  .object({
    text: z.string().trim().min(1, "Informe a pergunta"),
    type: z.enum(["Descriptive", "MultipleChoice", "Checkbox", "FileUpload"]),
    required: z.boolean(),
    options: z.array(z.string()),
  })
  .superRefine((question, ctx) => {
    if (question.type === "MultipleChoice" || question.type === "Checkbox") {
      if (
        question.options.length < 2 ||
        question.options.some((option) => !option.trim())
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["options"],
          message: "Informe pelo menos duas opções",
        });
      }
    }
  });

export const templateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Informe o título")
    .max(200, "O título deve ter até 200 caracteres"),
  description: z
    .string()
    .trim()
    .max(1000, "A descrição deve ter até 1000 caracteres"),
  questions: z.array(questionSchema).min(1, "Adicione pelo menos uma pergunta"),
});

export type TemplateFormValues = z.infer<typeof templateSchema>;

export function toTemplateInput(
  values: TemplateFormValues,
): CreateAnamneseTemplateInput {
  return {
    title: values.title.trim(),
    ...(values.description.trim()
      ? { description: values.description.trim() }
      : {}),
    questions: values.questions.map((question) => ({
      text: question.text.trim(),
      type: question.type,
      required: question.required,
      ...(question.type === "MultipleChoice" || question.type === "Checkbox"
        ? { options: question.options.map((text) => ({ text: text.trim() })) }
        : {}),
    })),
  };
}
