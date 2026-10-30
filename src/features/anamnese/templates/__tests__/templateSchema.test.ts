import { describe, expect, it } from "vitest";
import { templateSchema, toTemplateInput } from "../templateSchema";

const question = {
  text: "Pergunta",
  type: "Descriptive" as const,
  required: false,
  options: [] as string[],
};
const base = { title: "Inicial", description: "", questions: [question] };

describe("PAC-08 validação e corpo", () => {
  it("exige pelo menos uma pergunta (PAC-08.3)", () => {
    const result = templateSchema.safeParse({ ...base, questions: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(
        "Adicione pelo menos uma pergunta",
      );
    }
    expect(templateSchema.safeParse(base).success).toBe(true);
  });
  it("limita título e descrição", () => {
    expect(templateSchema.safeParse({ ...base, title: "" }).success).toBe(
      false,
    );
    expect(
      templateSchema.safeParse({ ...base, title: "x".repeat(201) }).success,
    ).toBe(false);
    expect(
      templateSchema.safeParse({ ...base, description: "x".repeat(1001) })
        .success,
    ).toBe(false);
  });
  it("exige duas opções preenchidas nos tipos de escolha", () => {
    for (const type of ["MultipleChoice", "Checkbox"]) {
      expect(
        templateSchema.safeParse({
          ...base,
          questions: [
            { text: "Pergunta", type, required: true, options: ["Uma"] },
          ],
        }).success,
      ).toBe(false);
      expect(
        templateSchema.safeParse({
          ...base,
          questions: [
            { text: "Pergunta", type, required: true, options: ["Uma", ""] },
          ],
        }).success,
      ).toBe(false);
    }
  });
  it("envia opções só para tipos de escolha e preserva ordem", () => {
    const values = templateSchema.parse({
      ...base,
      questions: [
        { text: "Texto", type: "Descriptive", required: true, options: [] },
        {
          text: "Escolha",
          type: "Checkbox",
          required: false,
          options: ["A", "B"],
        },
      ],
    });
    expect(toTemplateInput(values)).toEqual({
      title: "Inicial",
      questions: [
        { text: "Texto", type: "Descriptive", required: true },
        {
          text: "Escolha",
          type: "Checkbox",
          required: false,
          options: [{ text: "A" }, { text: "B" }],
        },
      ],
    });
  });
});
