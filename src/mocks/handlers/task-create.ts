import type { Task, TaskCategory, TaskType } from "@/api/types";
import { MOCK_TASKS } from "@/mocks/handlers/content";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const categories: TaskCategory[] = [
  "reading",
  "writing",
  "vocabulary",
  "comprehension",
];

interface RawAlternative {
  text?: unknown;
  isCorrect?: unknown;
}

let nextTaskId = 1;
let nextAlternativeId = 1;

/** O adaptador só faz JSON.parse de corpo string; FormData chega intacto. */
function readField(body: unknown, key: string): unknown {
  if (typeof FormData !== "undefined" && body instanceof FormData) {
    return body.get(key);
  }
  if (body && typeof body === "object") {
    return (body as Record<string, unknown>)[key];
  }
  return undefined;
}

function parseAlternatives(raw: unknown): RawAlternative[] | undefined {
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as RawAlternative[]) : undefined;
    } catch {
      return undefined;
    }
  }
  return Array.isArray(raw) ? (raw as RawAlternative[]) : undefined;
}

registerMockHandler({ method: "post", path: "/task/create" }, ({ body }) => {
  const category = readField(body, "category");
  const type = readField(body, "type");
  const prompt = readField(body, "prompt");
  const alternatives = parseAlternatives(readField(body, "alternatives"));

  const isValid =
    typeof category === "string" &&
    categories.includes(category as TaskCategory) &&
    typeof type === "string" &&
    typeof prompt === "string" &&
    prompt.trim().length >= 1 &&
    alternatives !== undefined &&
    alternatives.length >= 2 &&
    alternatives.every(
      (alt) =>
        typeof alt.text === "string" &&
        alt.text.trim().length > 0 &&
        typeof alt.isCorrect === "boolean",
    );

  if (!isValid || !alternatives) {
    throw new MockApiError(400, "INVALID_ALTERNATIVES_FORMAT");
  }

  const hasCorrectAlternative = alternatives.some(
    (alt) => alt.isCorrect === true,
  );
  if (!hasCorrectAlternative) {
    throw new MockApiError(500, "AT_LEAST_ONE_ALTERNATIVE_MUST_BE_CORRECT");
  }

  const task: Task = {
    id: `mock-task-${nextTaskId++}`,
    category: category as TaskCategory,
    type: type as TaskType,
    prompt: prompt.trim(),
    alternatives: alternatives.map((alt) => ({
      id: `mock-alt-${nextAlternativeId++}`,
      text: (alt.text as string).trim(),
      isCorrect: alt.isCorrect as boolean,
    })),
    createdAt: new Date().toISOString(),
  };
  MOCK_TASKS.push(task);

  return { status: 201, data: undefined };
});

export const taskCreateMockHandlersRegistered = true;
