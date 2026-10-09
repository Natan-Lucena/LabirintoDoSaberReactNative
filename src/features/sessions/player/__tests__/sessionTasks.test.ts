import { describe, expect, it, vi } from "vitest";

import {
  getTaskById,
  listTaskGroupsByEducator,
  listTaskNotebooks,
} from "@/api/endpoints/content";
import type { SessionFlowContent } from "@/stores/session-flow";
import { resolveSessionTasks } from "../sessionTasks";

vi.mock("@/api/endpoints/content", () => ({
  getTaskById: vi.fn(),
  listTaskGroupsByEducator: vi.fn(),
  listTaskNotebooks: vi.fn(),
}));

const TASK = {
  id: "task-1",
  category: "reading" as const,
  type: "multipleChoice" as const,
  prompt: "Qual palavra começa com A?",
  alternatives: [],
  createdAt: "2026-10-07T12:00:00.000Z",
};

describe("resolveSessionTasks", () => {
  it("G-06: preserva a ordem das tarefas do caderno provisoriamente", async () => {
    const content: SessionFlowContent = {
      kind: "notebook",
      id: "notebook-1",
      name: "Leitura",
    };
    vi.mocked(listTaskNotebooks).mockResolvedValue([
      {
        notebook: {
          id: "notebook-1",
          educator: "educator-1",
          tasks: ["task-2", "task-1"],
          category: "reading",
          description: "Leitura",
          createdAt: "2026-10-07T12:00:00.000Z",
          taskGroupsIds: [],
        },
        taskGroups: [],
      },
    ]);
    vi.mocked(getTaskById).mockImplementation(async (id) => ({ ...TASK, id }));

    await expect(resolveSessionTasks(content)).resolves.toMatchObject([
      { id: "task-2" },
      { id: "task-1" },
    ]);
  });

  it("resolve grupo e tarefa individual pelas APIs existentes", async () => {
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([
      {
        id: "group-1",
        name: "Grupo",
        tasksIds: ["task-1"],
        educatorId: "educator-1",
        category: "reading",
      },
    ]);
    vi.mocked(getTaskById).mockResolvedValue(TASK);

    await expect(
      resolveSessionTasks({ kind: "group", id: "group-1", name: "Grupo" }),
    ).resolves.toEqual([TASK]);
    await expect(
      resolveSessionTasks({ kind: "task", id: "task-1", name: "Tarefa" }),
    ).resolves.toEqual([TASK]);
  });
});
