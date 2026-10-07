import type { Task, TaskCategory, TaskInput } from "@/api/types";
import { MOCK_EDUCATOR } from "@/mocks/fixtures";
import { MOCK_TASK_GROUPS, MOCK_TASKS } from "./content";
import { registerMockHandler } from "./registry";
import { MockApiError } from "./types";

let nextId = 1;

function isValidTask(task: TaskInput): boolean {
  return (
    task.type === "multipleChoice" &&
    task.prompt.trim().length > 0 &&
    task.alternatives.length >= 2 &&
    task.alternatives.filter((alternative) => alternative.isCorrect).length ===
      1
  );
}

registerMockHandler({ method: "post", path: "/task/batch" }, ({ body }) => {
  const input = body as Partial<{
    name: string;
    category: TaskCategory;
    tasks: TaskInput[];
  }>;
  if (!Array.isArray(input.tasks) || input.tasks.length === 0) {
    throw new MockApiError(400, "EMPTY_TASK_LIST");
  }
  if (
    !input.name?.trim() ||
    !input.category ||
    !input.tasks.every(isValidTask)
  ) {
    throw new MockApiError(400, "INVALID_TASK_DATA");
  }
  const taskIds = input.tasks.map((task) => {
    const id = `mock-ai-task-${nextId++}`;
    const persisted: Task = {
      ...task,
      id,
      createdAt: new Date().toISOString(),
      alternatives: task.alternatives.map((alternative, index) => ({
        ...alternative,
        id: `mock-ai-alt-${id}-${index}`,
      })),
    };
    MOCK_TASKS.push(persisted);
    return id;
  });
  const taskGroup = {
    id: `mock-ai-group-${nextId++}`,
    name: input.name.trim(),
    category: input.category,
    tasksIds: taskIds,
    educatorId: MOCK_EDUCATOR.id,
  };
  MOCK_TASK_GROUPS.push(taskGroup);
  return { status: 201, data: { taskGroup, taskIds } };
});

export const taskBatchMockHandlersRegistered = true;
