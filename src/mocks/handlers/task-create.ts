import type { Task, TaskCategory, TaskTone, TaskType } from "@/api/types";
import { MOCK_TASK_SKILLS } from "@/mocks/fixtures-task-catalog";
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

function readFileUri(
  raw: unknown,
  field: "image" | "audio",
): string | undefined {
  if (
    raw &&
    typeof raw === "object" &&
    "uri" in raw &&
    typeof raw.uri === "string"
  ) {
    return raw.uri;
  }
  // No ambiente de teste, FormData serializa o descritor nativo como string.
  // Basta preservar a existência do arquivo, pois o endpoint real recebe o binário.
  return raw === null || raw === undefined
    ? undefined
    : `mock://task-media/${field}`;
}

type FieldError = { field: string; message: string };

export const NEW_ACTIVITY_TYPES = [
  "wordBuilder",
  "colorMatch",
  "memoryGame",
  "printable",
] as const;
const tones: TaskTone[] = ["mint", "peach", "lavender", "yellow"];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUrl(value: unknown): boolean {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

function checkIds(
  list: Record<string, unknown>[],
  base: string,
  errors: FieldError[],
): void {
  const seen = new Set<string>();
  list.forEach((entry, index) => {
    const id = entry.id;
    if (typeof id !== "string" || id.length === 0 || seen.has(id)) {
      errors.push({ field: `${base}.${index}.id`, message: "Id inválido." });
    } else {
      seen.add(id);
    }
  });
}

/** Limites do §2.1 do contrato; `field` com o caminho completo. */
export function validateActivityContent(
  type: string,
  content: unknown,
): FieldError[] {
  if (!isObject(content)) {
    return [{ field: "content", message: "Conteúdo ausente ou inválido." }];
  }
  const errors: FieldError[] = [];
  if (content.kind !== type) {
    errors.push({
      field: "content.kind",
      message: "O kind deve ser igual ao type.",
    });
    return errors;
  }
  if (type === "wordBuilder") {
    const word = content.word;
    if (
      typeof word !== "string" ||
      !/^\p{L}{2,12}$/u.test(word) ||
      word !== word.toLocaleUpperCase("pt-BR")
    ) {
      errors.push({
        field: "content.word",
        message: "A palavra deve ter de 2 a 12 letras maiúsculas.",
      });
    }
    const distractors = content.distractors;
    if (distractors !== undefined) {
      const valid =
        Array.isArray(distractors) &&
        distractors.length <= 6 &&
        new Set(distractors).size === distractors.length &&
        distractors.every(
          (letter) =>
            typeof letter === "string" &&
            /^\p{L}$/u.test(letter) &&
            letter === letter.toLocaleUpperCase("pt-BR"),
        );
      if (!valid) {
        errors.push({
          field: "content.distractors",
          message: "Use até 6 letras maiúsculas diferentes.",
        });
      }
    }
    for (const key of ["hintImageUrl", "hintAudioUrl"]) {
      if (content[key] !== undefined && !isUrl(content[key])) {
        errors.push({ field: `content.${key}`, message: "URL inválida." });
      }
    }
  } else if (type === "colorMatch") {
    const pairs = content.pairs;
    if (!Array.isArray(pairs) || pairs.length < 2 || pairs.length > 6) {
      errors.push({
        field: "content.pairs",
        message: "Use de 2 a 6 pares.",
      });
    } else {
      checkIds(pairs.filter(isObject), "content.pairs", errors);
      pairs.forEach((pair, index) => {
        const entry = isObject(pair) ? pair : {};
        const word = entry.word;
        if (
          typeof word !== "string" ||
          word.trim().length < 1 ||
          word.length > 20
        ) {
          errors.push({
            field: `content.pairs.${index}.word`,
            message: "A palavra deve ter de 1 a 20 caracteres.",
          });
        }
        if (
          typeof entry.colorHex !== "string" ||
          !/^#[0-9A-Fa-f]{6}$/.test(entry.colorHex)
        ) {
          errors.push({
            field: `content.pairs.${index}.colorHex`,
            message: "Cor inválida.",
          });
        }
      });
    }
  } else if (type === "memoryGame") {
    const cards = content.cards;
    if (!Array.isArray(cards) || cards.length < 2 || cards.length > 8) {
      errors.push({
        field: "content.cards",
        message: "Use de 2 a 8 cartas.",
      });
    } else {
      checkIds(cards.filter(isObject), "content.cards", errors);
      cards.forEach((card, index) => {
        const entry = isObject(card) ? card : {};
        const hasLabel =
          typeof entry.label === "string" && entry.label.trim().length > 0;
        const hasImage = entry.imageUrl !== undefined;
        if (!hasLabel && !hasImage) {
          errors.push({
            field: `content.cards.${index}`,
            message: "A carta precisa de texto ou imagem.",
          });
        }
        if (hasLabel && (entry.label as string).length > 20) {
          errors.push({
            field: `content.cards.${index}.label`,
            message: "O texto da carta aceita até 20 caracteres.",
          });
        }
        if (hasImage && !isUrl(entry.imageUrl)) {
          errors.push({
            field: `content.cards.${index}.imageUrl`,
            message: "URL inválida.",
          });
        }
      });
    }
  } else if (type === "printable") {
    const title = content.title;
    if (
      typeof title !== "string" ||
      title.trim().length < 1 ||
      title.length > 80
    ) {
      errors.push({
        field: "content.title",
        message: "O título deve ter de 1 a 80 caracteres.",
      });
    }
    const instructions = content.instructions;
    if (
      typeof instructions !== "string" ||
      instructions.trim().length < 1 ||
      instructions.length > 500
    ) {
      errors.push({
        field: "content.instructions",
        message: "As instruções devem ter de 1 a 500 caracteres.",
      });
    }
    if (!["LIST", "GRID", "SEQUENCE"].includes(content.layout as string)) {
      errors.push({ field: "content.layout", message: "Disposição inválida." });
    }
    const items = content.items;
    if (!Array.isArray(items) || items.length < 1 || items.length > 20) {
      errors.push({
        field: "content.items",
        message: "Use de 1 a 20 itens.",
      });
    } else {
      checkIds(items.filter(isObject), "content.items", errors);
      items.forEach((item, index) => {
        const entry = isObject(item) ? item : {};
        const hasText =
          typeof entry.text === "string" && entry.text.trim().length > 0;
        if (!hasText && entry.imageUrl === undefined) {
          errors.push({
            field: `content.items.${index}`,
            message: "O item precisa de texto ou imagem.",
          });
        }
        if (hasText && (entry.text as string).length > 200) {
          errors.push({
            field: `content.items.${index}.text`,
            message: "O texto do item aceita até 200 caracteres.",
          });
        }
        if (entry.imageUrl !== undefined && !isUrl(entry.imageUrl)) {
          errors.push({
            field: `content.items.${index}.imageUrl`,
            message: "URL inválida.",
          });
        }
        const lines = entry.answerLines;
        if (
          lines !== undefined &&
          (typeof lines !== "number" ||
            !Number.isInteger(lines) ||
            lines < 0 ||
            lines > 5)
        ) {
          errors.push({
            field: `content.items.${index}.answerLines`,
            message: "Use de 0 a 5 linhas.",
          });
        }
      });
    }
  }
  return errors;
}

/** Códigos fora do catálogo = `400 INVALID_SKILL`; mais de 5 também. */
export function assertValidSkills(skills: unknown): void {
  if (skills === undefined) return;
  if (
    !Array.isArray(skills) ||
    skills.length > 5 ||
    !skills.every((code) =>
      MOCK_TASK_SKILLS.some((skill) => skill.code === code),
    )
  ) {
    throw new MockApiError(400, "INVALID_SKILL");
  }
}

function parseJson(raw: unknown): unknown {
  if (typeof raw !== "string") return raw ?? undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
}

function createNewTypeTask(body: unknown): Task {
  const category = readField(body, "category");
  const prompt = readField(body, "prompt");
  const type = readField(body, "type") as string;
  const theme = readField(body, "theme");
  const tone = readField(body, "tone");

  if (readField(body, "alternatives") != null) {
    throw new MockApiError(400, "ALTERNATIVES_NOT_ALLOWED");
  }
  const fieldErrors: FieldError[] = [];
  if (!categories.includes(category as TaskCategory)) {
    fieldErrors.push({ field: "category", message: "Categoria inválida." });
  }
  if (
    typeof prompt !== "string" ||
    prompt.trim().length < 1 ||
    prompt.length > 300
  ) {
    fieldErrors.push({
      field: "prompt",
      message: "O enunciado deve ter de 1 a 300 caracteres.",
    });
  }
  if (theme != null && (typeof theme !== "string" || theme.length > 60)) {
    fieldErrors.push({
      field: "theme",
      message: "Tema com até 60 caracteres.",
    });
  }
  if (tone != null && !tones.includes(tone as TaskTone)) {
    fieldErrors.push({ field: "tone", message: "Cor inválida." });
  }
  if (fieldErrors.length > 0) {
    throw new MockApiError(400, "Bad Request", undefined, fieldErrors);
  }

  const content = parseJson(readField(body, "content"));
  const contentErrors = validateActivityContent(type, content);
  if (contentErrors.length > 0) {
    throw new MockApiError(400, "INVALID_CONTENT", undefined, contentErrors);
  }
  const skills = parseJson(readField(body, "skills"));
  assertValidSkills(skills);

  const task: Task = {
    id: `mock-task-${nextTaskId++}`,
    category: category as TaskCategory,
    type: type as TaskType,
    prompt: (prompt as string).trim(),
    alternatives: [],
    createdAt: new Date().toISOString(),
    format: type === "printable" ? "PRINTABLE" : "INTERACTIVE",
    source: "EDUCATOR",
    skills: (skills as string[] | undefined) ?? [],
    tone: (tone as TaskTone | null) ?? "mint",
    ...(typeof theme === "string" && theme ? { theme } : {}),
    content: content as Task["content"],
  };
  MOCK_TASKS.push(task);
  return task;
}

registerMockHandler({ method: "post", path: "/task/create" }, ({ body }) => {
  const rawType = readField(body, "type");
  if ((NEW_ACTIVITY_TYPES as readonly unknown[]).includes(rawType)) {
    return { status: 201, data: createNewTypeTask(body) };
  }
  const category = readField(body, "category");
  const type = readField(body, "type");
  const prompt = readField(body, "prompt");
  const alternatives = parseAlternatives(readField(body, "alternatives"));
  const imageFile = readFileUri(readField(body, "imageFile"), "image");
  const audioFile = readFileUri(readField(body, "audioFile"), "audio");
  const hasMedia = Boolean(imageFile || audioFile);

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
    throw new MockApiError(400, "AT_LEAST_ONE_ALTERNATIVE_MUST_BE_CORRECT");
  }
  if (type === "multipleChoice" && hasMedia) {
    throw new MockApiError(400, "TEXT_TASK_CANNOT_HAVE_MEDIA");
  }
  if (type === "multipleChoiceWithMedia" && !hasMedia) {
    throw new MockApiError(400, "MEDIA_TASK_REQUIRES_IMAGE_OR_AUDIO");
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
    ...(imageFile ? { imageFile } : {}),
    ...(audioFile ? { audioFile } : {}),
  };
  MOCK_TASKS.push(task);

  return { status: 201, data: task };
});

export const taskCreateMockHandlersRegistered = true;
