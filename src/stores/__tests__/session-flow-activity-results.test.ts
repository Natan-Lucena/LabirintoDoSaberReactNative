import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ActivityResult, Student, TaskNotebookSession } from "@/api/types";

// Mesmo mock local de `session-flow.test.ts` (API real usada por src/storage/mmkv.ts).
const EDUCATOR_A = "educator-a";

function mockedMmkvModule() {
  const stores = new Map<string, Map<string, unknown>>();

  function storeFor(educatorId: string) {
    let store = stores.get(educatorId);
    if (!store) {
      store = new Map<string, unknown>();
      stores.set(educatorId, store);
    }
    return store;
  }

  return {
    getActiveEducatorId: vi.fn(() => EDUCATOR_A),
    getStorage: vi.fn(async (educatorId: string) => {
      const store = storeFor(educatorId);
      return {
        set: (key: string, value: unknown) => {
          store.set(key, value);
        },
        getString: (key: string) => {
          const value = store.get(key);
          return typeof value === "string" ? value : undefined;
        },
        remove: (key: string) => store.delete(key),
        getAllKeys: () => Array.from(store.keys()),
        clearAll: () => store.clear(),
      };
    }),
    clearSessionFlow: vi.fn(async (educatorId: string) => {
      storeFor(educatorId).delete("session:flow");
    }),
  };
}

vi.mock("@/storage/mmkv", mockedMmkvModule);

const STUDENT: Student = {
  id: "student-1",
  name: "Ana",
  age: 8,
  gender: "female",
  zipcode: "00000-000",
  road: "Rua A",
  housenumber: "1",
  phonenumber: "0000-0000",
  learningTopics: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  educatorId: EDUCATOR_A,
  photoUrl: null,
  documents: [],
};

const CONTENT = {
  kind: "notebook" as const,
  id: "notebook-1",
  name: "Caderneta 1",
};

const INPUT = {
  sessionId: "session-9",
  taskId: "task-word-1",
  completed: true,
  correct: false,
  attempts: 2,
  errors: 1,
  durationMs: 4200,
};

function makeResult(taskId: string): ActivityResult {
  return {
    id: `result-${taskId}`,
    sessionId: "session-9",
    taskId,
    taskType: "wordBuilder",
    completed: true,
    correct: true,
    attempts: 1,
    errors: 0,
    durationMs: 1000,
    recordedAt: "2026-11-25T12:00:00.000Z",
  };
}

function serverSession(
  overrides: Partial<TaskNotebookSession> = {},
): TaskNotebookSession {
  return {
    id: "session-9",
    studentId: STUDENT.id,
    educatorId: EDUCATOR_A,
    name: "Sessão de outro aparelho",
    startedAt: "2026-11-25T10:00:00.000Z",
    taskNotebookId: "notebook-1",
    answers: [],
    ...overrides,
  };
}

async function loadStore() {
  return import("@/stores/session-flow");
}

async function toRunning() {
  const module = await loadStore();
  const store = module.useSessionFlowStore;
  await store.getState().selectStudent(STUDENT);
  await store.getState().configure({ name: "Sessão 1", content: CONTENT });
  await store.getState().requestStart();
  await store.getState().confirmStart("session-9");
  return module;
}

describe("stores/session-flow: resultados de jogo (EVO-03)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("começa sem resultados de jogo confirmados nem pendentes", async () => {
    const { useSessionFlowStore, initialSessionFlowData } = await loadStore();

    expect(initialSessionFlowData.confirmedActivityResults).toEqual([]);
    expect(initialSessionFlowData.pendingActivityResults).toEqual([]);
    expect(useSessionFlowStore.getState().confirmedActivityResults).toEqual([]);
    expect(useSessionFlowStore.getState().pendingActivityResults).toEqual([]);
  });

  it("markActivityResultPending guarda o corpo e persiste, sem duplicar a mesma tarefa", async () => {
    const { useSessionFlowStore } = await toRunning();

    await useSessionFlowStore.getState().markActivityResultPending(INPUT);
    await useSessionFlowStore
      .getState()
      .markActivityResultPending({ ...INPUT, durationMs: 4300 });

    expect(useSessionFlowStore.getState().pendingActivityResults).toEqual([
      { ...INPUT, durationMs: 4300 },
    ]);

    await useSessionFlowStore.getState().hydrate(EDUCATOR_A);
    expect(useSessionFlowStore.getState().pendingActivityResults).toEqual([
      { ...INPUT, durationMs: 4300 },
    ]);
  });

  it("confirmActivityResult confirma a tarefa, limpa a pendência e avança o índice", async () => {
    const { useSessionFlowStore } = await toRunning();
    await useSessionFlowStore.getState().markActivityResultPending(INPUT);

    await useSessionFlowStore.getState().confirmActivityResult(INPUT.taskId);

    const state = useSessionFlowStore.getState();
    expect(state.confirmedActivityResults).toEqual([INPUT.taskId]);
    expect(state.pendingActivityResults).toEqual([]);
    expect(state.activityIndex).toBe(1);
    // G-65: o resultado do jogo não entra nas respostas de múltipla escolha.
    expect(state.confirmedAnswers).toEqual([]);
    expect(state.pendingAnswers).toEqual([]);

    await useSessionFlowStore.getState().hydrate(EDUCATOR_A);
    expect(useSessionFlowStore.getState().confirmedActivityResults).toEqual([
      INPUT.taskId,
    ]);
    expect(useSessionFlowStore.getState().activityIndex).toBe(1);
  });

  it("confirmActivityResult é idempotente para a mesma tarefa", async () => {
    const { useSessionFlowStore } = await toRunning();

    await useSessionFlowStore.getState().confirmActivityResult(INPUT.taskId);
    await useSessionFlowStore.getState().confirmActivityResult(INPUT.taskId);

    const state = useSessionFlowStore.getState();
    expect(state.confirmedActivityResults).toEqual([INPUT.taskId]);
    expect(state.activityIndex).toBe(1);
  });

  it("clearActivityResultPending remove só a pendência, sem confirmar", async () => {
    const { useSessionFlowStore } = await toRunning();
    await useSessionFlowStore.getState().markActivityResultPending(INPUT);

    await useSessionFlowStore
      .getState()
      .clearActivityResultPending(INPUT.taskId);

    const state = useSessionFlowStore.getState();
    expect(state.pendingActivityResults).toEqual([]);
    expect(state.confirmedActivityResults).toEqual([]);
    expect(state.activityIndex).toBe(0);
  });

  it("as ações de resultado só valem em running, com sessionId", async () => {
    const { useSessionFlowStore, SessionFlowInvalidTransitionError } =
      await loadStore();
    await useSessionFlowStore.getState().selectStudent(STUDENT);

    await expect(
      useSessionFlowStore.getState().markActivityResultPending(INPUT),
    ).rejects.toBeInstanceOf(SessionFlowInvalidTransitionError);
    await expect(
      useSessionFlowStore.getState().confirmActivityResult(INPUT.taskId),
    ).rejects.toBeInstanceOf(SessionFlowInvalidTransitionError);
    expect(useSessionFlowStore.getState().pendingActivityResults).toEqual([]);
    expect(useSessionFlowStore.getState().confirmedActivityResults).toEqual([]);
  });

  it("seedFromServerSession usa session.activityResults na retomada (RS-07)", async () => {
    const { useSessionFlowStore } = await loadStore();
    const answer = {
      taskId: "task-1",
      selectedAlternativeId: "alt-1",
      isCorrect: true,
      timeToAnswer: 1000,
      answeredAt: "2026-11-25T10:01:00.000Z",
    };

    await useSessionFlowStore.getState().seedFromServerSession({
      student: STUDENT,
      session: serverSession({
        answers: [answer],
        activityResults: [makeResult("task-word-1"), makeResult("task-c")],
      }),
      content: CONTENT,
    });

    const state = useSessionFlowStore.getState();
    expect(state.confirmedAnswers).toEqual([answer]);
    expect(state.confirmedActivityResults).toEqual(["task-word-1", "task-c"]);
    expect(state.pendingActivityResults).toEqual([]);
    expect(state.activityIndex).toBe(3);
  });

  it("seedFromServerSession tolera sessão sem activityResults (backend antigo)", async () => {
    const { useSessionFlowStore } = await loadStore();

    await useSessionFlowStore.getState().seedFromServerSession({
      student: STUDENT,
      session: serverSession(),
      content: CONTENT,
    });

    const state = useSessionFlowStore.getState();
    expect(state.confirmedActivityResults).toEqual([]);
    expect(state.activityIndex).toBe(0);
  });

  it("hydrate tolera fluxo salvo antes dos resultados de jogo", async () => {
    const { useSessionFlowStore } = await toRunning();
    const storage = await (
      await import("@/storage/mmkv")
    ).getStorage(EDUCATOR_A);
    const saved = JSON.parse(storage.getString("session:flow") as string);
    delete saved.confirmedActivityResults;
    delete saved.pendingActivityResults;
    storage.set("session:flow", JSON.stringify(saved));

    await useSessionFlowStore.getState().hydrate(EDUCATOR_A);

    expect(useSessionFlowStore.getState().step).toBe("running");
    expect(useSessionFlowStore.getState().confirmedActivityResults).toEqual([]);
    expect(useSessionFlowStore.getState().pendingActivityResults).toEqual([]);
  });
});
