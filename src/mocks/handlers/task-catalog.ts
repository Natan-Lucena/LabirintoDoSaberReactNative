// Banco de atividades (API-07, leva 1; ESPECIFICACAO-BACKEND §2.4): catálogo,
// habilidades e recomendação. Contrato PROPOSTO, mock-first. Só leitura; estado
// em memória derivado de `MOCK_TASKS` (do educador) e da biblioteca fictícia.
import {
  taskFormat,
  taskSource,
  type ListTaskCatalogParams,
} from "@/api/endpoints/task-catalog";
import type {
  RecommendedTask,
  Task,
  TaskCategory,
  TaskSummary,
} from "@/api/types";
import { MOCK_STUDENTS } from "@/mocks/fixtures";
import {
  MOCK_LIBRARY_TASKS,
  MOCK_TASK_SKILLS,
} from "@/mocks/fixtures-task-catalog";
import { MOCK_TASKS } from "./content";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

const FORMATS = ["INTERACTIVE", "PRINTABLE"];
const SOURCES = ["EDUCATOR", "LIBRARY"];
const TYPES = [
  "multipleChoice",
  "multipleChoiceWithMedia",
  "wordBuilder",
  "colorMatch",
  "memoryGame",
  "printable",
];
const CATEGORIES: TaskCategory[] = [
  "reading",
  "writing",
  "vocabulary",
  "comprehension",
];

/** Sem acento nem maiúscula (AT-09). */
function fold(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function skillLabel(code: string): string {
  return MOCK_TASK_SKILLS.find((skill) => skill.code === code)?.label ?? code;
}

function titleOf(task: Task): string {
  switch (task.content?.kind) {
    case "printable":
      return task.content.title;
    case "wordBuilder":
      return task.content.word;
    case "colorMatch":
      return "Associe as cores";
    case "memoryGame":
      return "Memória visual";
    default:
      return task.prompt;
  }
}

function thumbnailOf(task: Task): string | undefined {
  const content = task.content;
  switch (content?.kind) {
    case "wordBuilder":
      return content.hintImageUrl;
    case "memoryGame":
      return content.cards.find((card) => card.imageUrl)?.imageUrl;
    case "printable":
      return content.items.find((item) => item.imageUrl)?.imageUrl;
    case undefined:
      return task.imageFile;
    default:
      return undefined;
  }
}

function toSummary(task: Task): TaskSummary {
  const thumbnailUrl = thumbnailOf(task);
  return {
    id: task.id,
    type: task.type,
    format: taskFormat(task),
    source: taskSource(task),
    category: task.category,
    title: titleOf(task),
    skills: (task.skills ?? []).map((code) => ({
      code,
      label: skillLabel(code),
    })),
    ...(task.theme ? { theme: task.theme } : {}),
    tone: task.tone ?? "mint",
    ...(thumbnailUrl ? { thumbnailUrl } : {}),
  };
}

/** Biblioteca primeiro, depois as do educador (estado vivo de `MOCK_TASKS`). */
export function allCatalogTasks(): Task[] {
  return [...MOCK_LIBRARY_TASKS, ...MOCK_TASKS];
}

function badRequest(): MockApiError {
  return new MockApiError(400, "Bad Request");
}

registerMockHandler({ method: "get", path: "/task/skills" }, () => ({
  status: 200,
  data: structuredClone(MOCK_TASK_SKILLS),
}));

registerMockHandler({ method: "get", path: "/task/catalog" }, ({ params }) => {
  const query = params as Partial<Record<keyof ListTaskCatalogParams, string>>;
  const { search, format, type, skill, category, source, limit, cursor } =
    query;

  if (format !== undefined && !FORMATS.includes(format)) throw badRequest();
  if (source !== undefined && !SOURCES.includes(source)) throw badRequest();
  if (type !== undefined && !TYPES.includes(type)) throw badRequest();
  if (category !== undefined && !CATEGORIES.includes(category as TaskCategory))
    throw badRequest();
  if (
    limit !== undefined &&
    (!/^\d+$/.test(limit) || Number(limit) < 1 || Number(limit) > 50)
  )
    throw badRequest();
  if (cursor !== undefined && !/^\d+$/.test(cursor))
    throw new MockApiError(400, "INVALID_CURSOR");

  const needle = search ? fold(search.trim()) : "";
  const filtered = allCatalogTasks().filter((task) => {
    const summary = toSummary(task);
    if (format && summary.format !== format) return false;
    if (type && task.type !== type) return false;
    if (source && summary.source !== source) return false;
    if (category && task.category !== category) return false;
    if (skill && !summary.skills.some(({ code }) => code === skill))
      return false;
    if (needle) {
      const haystack = [
        task.prompt,
        task.theme ?? "",
        summary.title,
        ...summary.skills.map(({ label }) => label),
      ]
        .map(fold)
        .join("\n");
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });

  const size = limit === undefined ? 20 : Number(limit);
  const start = cursor === undefined ? 0 : Number(cursor);
  const items = filtered.slice(start, start + size).map(toSummary);
  const nextCursor =
    start + size < filtered.length ? String(start + size) : undefined;

  return {
    status: 200,
    data: { items, ...(nextCursor === undefined ? {} : { nextCursor }) },
  };
});

registerMockHandler(
  { method: "get", path: "/task/recommended" },
  ({ params }) => {
    const { studentId } = params;
    if (!studentId) throw badRequest();
    const student = MOCK_STUDENTS.find(({ id }) => id === studentId);
    if (!student) throw new MockApiError(404, "STUDENT_NOT_FOUND");

    const topics = new Set((student.learningTopics ?? []).map(fold));
    const matchedSkills = MOCK_TASK_SKILLS.filter((skill) =>
      skill.learningTopics.some((topic) => topics.has(fold(topic))),
    );
    if (matchedSkills.length === 0) return { status: 200, data: [] };

    const items: RecommendedTask[] = [];
    for (const task of allCatalogTasks()) {
      if (taskFormat(task) === "PRINTABLE") continue;
      const match = matchedSkills.find((skill) =>
        (task.skills ?? []).includes(skill.code),
      );
      if (!match) continue;
      items.push({
        ...toSummary(task),
        reason: `${match.label} · dificuldade mapeada`,
      });
      if (items.length === 6) break;
    }

    return { status: 200, data: items };
  },
);

// POST /task/:id/duplicate (ATV-09): cópia do educador, com novo id.
registerMockHandler(
  { method: "post", path: "/task/:id/duplicate" },
  ({ params }) => {
    const original = allCatalogTasks().find(({ id }) => id === params.id);
    if (!original) throw new MockApiError(404, "TASK_NOT_FOUND");

    const copy: Task = {
      ...structuredClone(original),
      id: `copy-${Date.now().toString(36)}-${MOCK_TASKS.length}`,
      source: "EDUCATOR",
      createdAt: new Date().toISOString(),
    };
    MOCK_TASKS.push(copy);

    return { status: 201, data: copy };
  },
);

export const taskCatalogMockHandlersRegistered = true;
