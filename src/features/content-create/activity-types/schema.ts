// Valores do formulário, validação (zod) e conversões de/para `TaskContent`
// dos tipos novos de atividade (ATV-11). Tudo puro, sem rede nem React.
import { z } from "zod";

import type { TaskMediaFile } from "@/api/endpoints/task-upload-media";
import type { UpdateTaskInput } from "@/api/endpoints/task-update";
import type {
  PrintableContent,
  Task,
  TaskCategory,
  TaskContent,
  TaskTone,
} from "@/api/types";

export type ActivityType =
  "wordBuilder" | "colorMatch" | "memoryGame" | "printable";

export const ACTIVITY_TYPES: readonly ActivityType[] = [
  "wordBuilder",
  "colorMatch",
  "memoryGame",
  "printable",
];

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  wordBuilder: "Forme a palavra",
  colorMatch: "Associe as cores",
  memoryGame: "Memória visual",
  printable: "Imprimível",
};

export function isActivityType(value: unknown): value is ActivityType {
  return (ACTIVITY_TYPES as readonly unknown[]).includes(value);
}

export const MAX_PROMPT = 300;
const CATEGORIES: [TaskCategory, ...TaskCategory[]] = [
  "reading",
  "writing",
  "vocabulary",
  "comprehension",
];

/** Mídia de um campo: URL já enviada (edição) e/ou arquivo novo a enviar. */
export interface MediaValue {
  url?: string;
  file: TaskMediaFile | null;
}

export interface PairRow {
  key: string;
  id: string;
  word: string;
  colorHex: string;
}

export interface CardRow {
  key: string;
  id: string;
  label: string;
  image: MediaValue;
}

export interface ItemRow {
  key: string;
  id: string;
  text: string;
  image: MediaValue;
  /** Valor próprio vindo do servidor (D-16); vence o campo geral. */
  answerLines?: number;
}

export type PrintableLayout = PrintableContent["layout"];

export interface ActivityFormValues {
  prompt: string;
  category: TaskCategory | "";
  skills: string[];
  theme: string;
  tone: TaskTone | "";
  // wordBuilder
  word: string;
  distractors: string;
  hintImage: MediaValue;
  hintAudio: MediaValue;
  // colorMatch
  pairs: PairRow[];
  // memoryGame
  cards: CardRow[];
  // printable
  title: string;
  instructions: string;
  layout: PrintableLayout;
  items: ItemRow[];
  answerLines: string;
}

let keyCounter = 0;
export function newRowKey(): string {
  keyCounter += 1;
  return `row-${keyCounter}`;
}

export const emptyMedia = (): MediaValue => ({ file: null });
export const emptyPair = (): PairRow => ({
  key: newRowKey(),
  id: "",
  word: "",
  colorHex: "",
});
export const emptyCard = (): CardRow => ({
  key: newRowKey(),
  id: "",
  label: "",
  image: emptyMedia(),
});
export const emptyItem = (): ItemRow => ({
  key: newRowKey(),
  id: "",
  text: "",
  image: emptyMedia(),
});

export function defaultValues(): ActivityFormValues {
  return {
    prompt: "",
    category: "",
    skills: [],
    theme: "",
    tone: "",
    word: "",
    distractors: "",
    hintImage: emptyMedia(),
    hintAudio: emptyMedia(),
    pairs: [emptyPair(), emptyPair()],
    cards: [emptyCard(), emptyCard()],
    title: "",
    instructions: "",
    layout: "LIST",
    items: [emptyItem()],
    answerLines: "0",
  };
}

const hasMedia = (media: MediaValue): boolean =>
  Boolean(media.file || media.url);

/** "e i, O" -> ["E", "I", "O"] (maiúsculas, em português). */
export function parseDistractors(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.toLocaleUpperCase("pt-BR"));
}

function parseAnswerLines(raw: string): number {
  const parsed = Number.parseInt(raw.trim(), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const commonShape = {
  prompt: z
    .string()
    .trim()
    .min(1, "Informe a instrução para a criança")
    .max(MAX_PROMPT, `Use até ${MAX_PROMPT} caracteres`),
  category: z.enum(CATEGORIES, { message: "Escolha a categoria" }),
  skills: z.array(z.string()).max(5, "Escolha até 5 habilidades"),
  theme: z.string().trim().max(60, "Use até 60 caracteres"),
};

const mediaSchema = z.custom<MediaValue>();

const schemas: Record<ActivityType, z.ZodType> = {
  wordBuilder: z
    .object({
      ...commonShape,
      word: z
        .string()
        .trim()
        .min(2, "A palavra precisa de pelo menos 2 letras")
        .max(12, "A palavra aceita até 12 letras")
        .regex(/^\p{L}+$/u, "Use apenas letras, sem números ou espaços"),
      distractors: z.string(),
      hintImage: mediaSchema,
      hintAudio: mediaSchema,
    })
    .superRefine((value, ctx) => {
      const letters = parseDistractors(value.distractors);
      if (letters.some((letter) => !/^\p{L}$/u.test(letter))) {
        ctx.addIssue({
          code: "custom",
          path: ["distractors"],
          message: "Digite uma letra por vez, separadas por espaço",
        });
      } else if (letters.length > 6) {
        ctx.addIssue({
          code: "custom",
          path: ["distractors"],
          message: "Use até 6 letras extras",
        });
      } else if (new Set(letters).size !== letters.length) {
        ctx.addIssue({
          code: "custom",
          path: ["distractors"],
          message: "Não repita letras extras",
        });
      }
    }),
  colorMatch: z.object({
    ...commonShape,
    pairs: z
      .array(
        z.object({
          word: z
            .string()
            .trim()
            .min(1, "Informe a palavra")
            .max(20, "Use até 20 caracteres"),
          colorHex: z
            .string()
            .refine((hex) => /^#[0-9A-Fa-f]{6}$/.test(hex), "Escolha uma cor"),
        }),
      )
      .min(2, "Use de 2 a 6 pares")
      .max(6, "Use de 2 a 6 pares"),
  }),
  memoryGame: z.object({
    ...commonShape,
    cards: z
      .array(
        z
          .object({
            label: z.string().trim().max(40, "Use até 40 caracteres"),
            image: mediaSchema,
          })
          .refine((card) => card.label.length > 0 || hasMedia(card.image), {
            message: "Informe o texto ou escolha uma imagem",
            path: ["label"],
          }),
      )
      .min(2, "Use de 2 a 8 cartas")
      .max(8, "Use de 2 a 8 cartas"),
  }),
  printable: z.object({
    ...commonShape,
    title: z
      .string()
      .trim()
      .min(1, "Informe o título")
      .max(80, "Use até 80 caracteres"),
    instructions: z
      .string()
      .trim()
      .min(1, "Informe as instruções")
      .max(500, "Use até 500 caracteres"),
    layout: z.enum(["LIST", "GRID", "SEQUENCE"]),
    answerLines: z.string().regex(/^[0-5]$/, "Use um número de 0 a 5"),
    items: z
      .array(
        z
          .object({
            text: z.string().trim().max(200, "Use até 200 caracteres"),
            image: mediaSchema,
          })
          .refine((item) => item.text.length > 0 || hasMedia(item.image), {
            message: "Informe o texto ou escolha uma imagem",
            path: ["text"],
          }),
      )
      .min(1, "Use de 1 a 20 itens")
      .max(20, "Use de 1 a 20 itens"),
  }),
};

/** Erros locais por caminho ("word", "pairs.2.word"...); vazio quando válido. */
export function validateActivity(
  type: ActivityType,
  values: ActivityFormValues,
): Record<string, string> {
  const result = schemas[type].safeParse(values);
  const errors: Record<string, string> = {};
  if (result.success) return errors;
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    errors[path] ??= issue.message;
  }
  return errors;
}

/** Próximo id livre do prefixo (`p1`, `p2`...), sem repetir os usados. */
function assignIds<T extends { id: string }>(rows: T[], prefix: string): T[] {
  const used = new Set(rows.map((row) => row.id).filter((id) => id !== ""));
  let next = 1;
  return rows.map((row) => {
    if (row.id !== "") return row;
    while (used.has(`${prefix}${next}`)) next += 1;
    const id = `${prefix}${next}`;
    used.add(id);
    return { ...row, id };
  });
}

/**
 * Monta o `content` do tipo. Espera a mídia já enviada (`url` preenchida);
 * `kind` sempre igual ao tipo (AC-ATV-11-01).
 */
export function buildContent(
  type: ActivityType,
  values: ActivityFormValues,
): TaskContent {
  switch (type) {
    case "wordBuilder": {
      const distractors = parseDistractors(values.distractors);
      return {
        kind: "wordBuilder",
        word: values.word.trim().toLocaleUpperCase("pt-BR"),
        ...(distractors.length > 0 ? { distractors } : {}),
        ...(values.hintImage.url ? { hintImageUrl: values.hintImage.url } : {}),
        ...(values.hintAudio.url ? { hintAudioUrl: values.hintAudio.url } : {}),
      };
    }
    case "colorMatch":
      return {
        kind: "colorMatch",
        pairs: assignIds(values.pairs, "p").map((pair) => ({
          id: pair.id,
          word: pair.word.trim(),
          colorHex: pair.colorHex.toUpperCase(),
        })),
      };
    case "memoryGame":
      return {
        kind: "memoryGame",
        cards: assignIds(values.cards, "c").map((card) => ({
          id: card.id,
          ...(card.label.trim() ? { label: card.label.trim() } : {}),
          ...(card.image.url ? { imageUrl: card.image.url } : {}),
        })),
      };
    case "printable": {
      const answerLines = parseAnswerLines(values.answerLines);
      return {
        kind: "printable",
        title: values.title.trim(),
        instructions: values.instructions.trim(),
        layout: values.layout,
        items: assignIds(values.items, "i").map((item) => ({
          id: item.id,
          ...(item.text.trim() ? { text: item.text.trim() } : {}),
          ...(item.image.url ? { imageUrl: item.image.url } : {}),
          ...((item.answerLines ?? answerLines) > 0
            ? { answerLines: item.answerLines ?? answerLines }
            : {}),
        })),
      };
    }
  }
}

/** Sobe cada mídia nova, uma por vez, e devolve os valores com as URLs. */
export async function resolveMedia(
  values: ActivityFormValues,
  upload: (file: TaskMediaFile) => Promise<string>,
): Promise<ActivityFormValues> {
  const resolve = async (media: MediaValue): Promise<MediaValue> =>
    media.file ? { url: await upload(media.file), file: null } : media;
  const hintImage = await resolve(values.hintImage);
  const hintAudio = await resolve(values.hintAudio);
  const cards: CardRow[] = [];
  for (const card of values.cards) {
    cards.push({ ...card, image: await resolve(card.image) });
  }
  const items: ItemRow[] = [];
  for (const item of values.items) {
    items.push({ ...item, image: await resolve(item.image) });
  }
  return { ...values, hintImage, hintAudio, cards, items };
}

export function hasPendingUploads(values: ActivityFormValues): boolean {
  return (
    Boolean(values.hintImage.file || values.hintAudio.file) ||
    values.cards.some((card) => card.image.file) ||
    values.items.some((item) => item.image.file)
  );
}

/** Edição: preenche o formulário com a atividade (ids preservados). */
export function contentToFormValues(task: Task): ActivityFormValues {
  const base: ActivityFormValues = {
    ...defaultValues(),
    prompt: task.prompt,
    category: task.category,
    skills: task.skills ?? [],
    theme: task.theme ?? "",
    tone: task.tone ?? "",
  };
  const content = task.content;
  if (!content) return base;
  switch (content.kind) {
    case "wordBuilder":
      return {
        ...base,
        word: content.word,
        distractors: (content.distractors ?? []).join(" "),
        hintImage: { url: content.hintImageUrl, file: null },
        hintAudio: { url: content.hintAudioUrl, file: null },
      };
    case "colorMatch":
      return {
        ...base,
        pairs: content.pairs.map((pair) => ({ ...pair, key: newRowKey() })),
      };
    case "memoryGame":
      return {
        ...base,
        cards: content.cards.map((card) => ({
          key: newRowKey(),
          id: card.id,
          label: card.label ?? "",
          image: { url: card.imageUrl, file: null },
        })),
      };
    case "printable": {
      // D-16: valores diferentes por item não podem ser achatados ao editar.
      const first = content.items[0]?.answerLines ?? 0;
      const differs = content.items.some(
        (item) => (item.answerLines ?? 0) !== first,
      );
      return {
        ...base,
        title: content.title,
        instructions: content.instructions,
        layout: content.layout,
        answerLines: String(content.items[0]?.answerLines ?? 0),
        items: content.items.map((item) => ({
          key: newRowKey(),
          id: item.id,
          text: item.text ?? "",
          image: { url: item.imageUrl, file: null },
          ...(differs ? { answerLines: item.answerLines ?? 0 } : {}),
        })),
      };
    }
  }
}

/** `PUT /task/update` só com o que mudou; nunca envia `type` (AC-ATV-11-03). */
export function buildUpdateInput(
  task: Task,
  type: ActivityType,
  values: ActivityFormValues,
): UpdateTaskInput {
  const input: UpdateTaskInput = { id: task.id };
  const prompt = values.prompt.trim();
  if (prompt !== task.prompt) input.prompt = prompt;
  if (values.category && values.category !== task.category) {
    input.category = values.category;
  }
  const initialContent = buildContent(type, contentToFormValues(task));
  const content = buildContent(type, values);
  if (JSON.stringify(content) !== JSON.stringify(initialContent)) {
    input.content = content;
  }
  if (values.skills.join("|") !== (task.skills ?? []).join("|")) {
    input.skills = values.skills;
  }
  const theme = values.theme.trim();
  // O contrato não prevê limpar o tema (1 a 60): vazio não conta como mudança.
  if (theme !== "" && theme !== (task.theme ?? "")) input.theme = theme;
  if (values.tone && values.tone !== task.tone) input.tone = values.tone;
  return input;
}

export function hasUpdateChanges(input: UpdateTaskInput): boolean {
  return Object.keys(input).some((key) => key !== "id");
}
