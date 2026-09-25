import type { Task, TaskGroup } from "@/api/types";
import { MOCK_EDUCATOR, MOCK_TASK_NOTEBOOKS } from "@/mocks/fixtures";
import { registerMockHandler } from "./registry";

registerMockHandler({ method: "get", path: "/task-notebook/" }, () => {
  return { status: 200, data: MOCK_TASK_NOTEBOOKS };
});

// G-06 ainda não documenta o vínculo conteúdo ↔ sessão (G-29: mock
// provisório). Dados fictícios locais a este arquivo.
export const MOCK_TASK_GROUPS: TaskGroup[] = [
  {
    id: "group-1",
    name: "Alfabeto e sons",
    tasksIds: ["task-1", "task-2"],
    educatorId: MOCK_EDUCATOR.id,
    category: "reading",
  },
  {
    id: "group-2",
    name: "Vocabulário do dia a dia",
    tasksIds: ["task-3"],
    educatorId: MOCK_EDUCATOR.id,
    category: "vocabulary",
  },
  {
    id: "group-3",
    name: "Produção de texto guiada",
    tasksIds: ["task-4", "task-5", "task-6"],
    educatorId: MOCK_EDUCATOR.id,
    category: "writing",
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: "task-1",
    category: "reading",
    type: "multipleChoice",
    prompt: "Qual palavra começa com a letra A?",
    alternatives: [
      { id: "alt-1", text: "Abelha", isCorrect: true },
      { id: "alt-2", text: "Bola", isCorrect: false },
    ],
    createdAt: "2026-01-01T12:00:00.000Z",
  },
  {
    id: "task-2",
    category: "comprehension",
    type: "multipleChoice",
    prompt: "O que a personagem fez ao acordar?",
    alternatives: [
      { id: "alt-3", text: "Foi à escola", isCorrect: true },
      { id: "alt-4", text: "Dormiu de novo", isCorrect: false },
    ],
    createdAt: "2026-01-01T12:00:00.000Z",
  },
  {
    id: "task-3",
    category: "vocabulary",
    type: "multipleChoice",
    prompt: "O que significa a palavra 'veloz'?",
    alternatives: [
      { id: "alt-5", text: "Rápido", isCorrect: true },
      { id: "alt-6", text: "Devagar", isCorrect: false },
    ],
    createdAt: "2026-01-01T12:00:00.000Z",
  },
];

registerMockHandler(
  { method: "get", path: "/task-group/list-by-educator" },
  () => {
    return { status: 200, data: MOCK_TASK_GROUPS };
  },
);

registerMockHandler({ method: "get", path: "/task/" }, () => {
  return { status: 200, data: MOCK_TASKS };
});

export const contentMockHandlersRegistered = true;
