import { describe, expect, it } from "vitest";

import type { Task, TaskGroup, TaskNotebookWithGroups } from "@/api/types";
import {
  buildActivityItems,
  filterByKind,
  filterBySearch,
  paginate,
} from "@/features/activities/selectors";

const notebooks: TaskNotebookWithGroups[] = [
  {
    notebook: {
      id: "notebook-1",
      educator: "educator-1",
      tasks: ["task-1", "task-2"],
      category: "reading",
      description: "Sons e Letras",
      createdAt: "2026-01-01T12:00:00.000Z",
      taskGroupsIds: [],
    },
    taskGroups: [],
  },
];

const groups: TaskGroup[] = [
  {
    id: "group-1",
    name: "Alfabeto e sons",
    tasksIds: ["task-1", "task-2", "task-3"],
    educatorId: "educator-1",
    category: "reading",
  },
];

const tasks: Task[] = [
  {
    id: "task-1",
    category: "vocabulary",
    type: "multipleChoice",
    prompt: "O que significa 'veloz'?",
    alternatives: [
      { id: "alt-1", text: "Rápido", isCorrect: true },
      { id: "alt-2", text: "Devagar", isCorrect: false },
    ],
    createdAt: "2026-01-01T12:00:00.000Z",
  },
];

describe("buildActivityItems (AC-L-01)", () => {
  it("usa singular quando a contagem de tarefas/atividades é 1", () => {
    const singularNotebooks: TaskNotebookWithGroups[] = [
      {
        notebook: { ...notebooks[0].notebook, tasks: ["task-1"] },
        taskGroups: [],
      },
    ];
    const singularGroups: TaskGroup[] = [
      { ...groups[0], tasksIds: ["task-1"] },
    ];

    const items = buildActivityItems(singularNotebooks, singularGroups, []);

    expect(items[0].secondary).toBe("1 tarefa");
    expect(items[1].secondary).toBe("1 atividade");
  });


  it("mapeia cadernos, grupos e atividades com título e linha secundária derivados dos dados", () => {
    const items = buildActivityItems(notebooks, groups, tasks);

    expect(items).toEqual([
      {
        id: "notebook-1",
        kind: "notebook",
        title: "Sons e Letras",
        secondary: "2 tarefas",
        category: "reading",
      },
      {
        id: "group-1",
        kind: "group",
        title: "Alfabeto e sons",
        secondary: "3 atividades",
        category: "reading",
      },
      {
        id: "task-1",
        kind: "task",
        title: "O que significa 'veloz'?",
        secondary: "2 alternativas",
        category: "vocabulary",
      },
    ]);
  });
});

describe("filterByKind (AC-L-01)", () => {
  const items = buildActivityItems(notebooks, groups, tasks);

  it("Ver Tudo mostra todos os itens", () => {
    expect(filterByKind(items, "all")).toHaveLength(3);
  });

  it("filtra só o tipo selecionado", () => {
    expect(filterByKind(items, "notebook")).toEqual([items[0]]);
    expect(filterByKind(items, "group")).toEqual([items[1]]);
    expect(filterByKind(items, "task")).toEqual([items[2]]);
  });
});

describe("filterBySearch (AC-L-02)", () => {
  const items = buildActivityItems(notebooks, groups, tasks);

  it("filtra pelo título exibido, sem diferenciar acento nem maiúscula", () => {
    expect(filterBySearch(items, "sons e letras")).toEqual([items[0]]);
    expect(filterBySearch(items, "ALFABETO")).toEqual([items[1]]);
  });

  it("sem resultado retorna lista vazia", () => {
    expect(filterBySearch(items, "inexistente")).toEqual([]);
  });

  it("busca vazia retorna todos os itens", () => {
    expect(filterBySearch(items, "")).toEqual(items);
  });
});

describe("paginate (AC-L-03)", () => {
  it("pagina de 10 em 10 itens", () => {
    const manyItems = Array.from({ length: 25 }, (_, index) => ({
      id: `item-${index}`,
      kind: "task" as const,
      title: `Item ${index}`,
      secondary: "1 alternativas",
      category: "reading" as const,
    }));

    const firstPage = paginate(manyItems, 1);
    expect(firstPage.pageItems).toHaveLength(10);
    expect(firstPage.totalPages).toBe(3);

    const lastPage = paginate(manyItems, 3);
    expect(lastPage.pageItems).toHaveLength(5);
  });

  it("lista vazia mantém ao menos uma página", () => {
    expect(paginate([], 1).totalPages).toBe(1);
  });
});
