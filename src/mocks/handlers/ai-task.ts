import type { TaskCategory, TaskInput } from "@/api/types";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const categories: TaskCategory[] = [
  "reading",
  "writing",
  "vocabulary",
  "comprehension",
];

registerMockHandler(
  { method: "post", path: "/ai-task/generate" },
  ({ body }) => {
    const input = body as Partial<{
      targetAudience: string;
      instructions: string;
      quantity: number;
      category: TaskCategory;
    }>;
    if (
      !Number.isInteger(input.quantity) ||
      !input.quantity ||
      input.quantity < 1 ||
      input.quantity > 15
    ) {
      throw new MockApiError(400, "INVALID_QUANTITY");
    }
    const targetAudience = input.targetAudience?.trim();
    const instructions = input.instructions?.trim();
    if (
      !targetAudience ||
      !instructions ||
      !input.category ||
      !categories.includes(input.category)
    ) {
      throw new MockApiError(400, "Bad Request", "Bad Request");
    }
    if (instructions.includes("[AI_GENERATION_FAILED]")) {
      throw new MockApiError(500, "AI_GENERATION_FAILED");
    }
    const tasks: TaskInput[] = Array.from(
      { length: input.quantity },
      (_, index) => ({
        category: input.category as TaskCategory,
        type: "multipleChoice",
        prompt: `Atividade ${index + 1}: qual opção atende a ${targetAudience}?`,
        alternatives: [
          { text: "Resposta correta", isCorrect: true },
          { text: "Resposta alternativa", isCorrect: false },
        ],
      }),
    );
    return { status: 200, data: { tasks } };
  },
);

export const aiTaskMockHandlersRegistered = true;
