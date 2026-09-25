import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Student, TaskNotebookSessionAnswer } from "@/api/types";

// Mesmo padrão do A-20 (src/storage/__tests__/mmkv.test.ts): mock local com a
// API real usada por src/storage/mmkv.ts, sem depender do preset vitest-native.
let activeEducatorId: string | null = "educator-a";

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
    getActiveEducatorId: vi.fn(() => activeEducatorId),
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

const EDUCATOR_A = "educator-a";
const EDUCATOR_B = "educator-b";

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
  educators: [EDUCATOR_A],
};

const CONTENT = {
  kind: "notebook" as const,
  id: "notebook-1",
  name: "Caderneta 1",
};

function makeAnswer(taskId: string): TaskNotebookSessionAnswer {
  return {
    taskId,
    selectedAlternativeId: "alt-1",
    isCorrect: true,
    timeToAnswer: 1000,
    answeredAt: "2026-01-01T00:00:00.000Z",
  };
}

async function loadStore() {
  const module = await import("@/stores/session-flow");
  return module;
}

describe("stores/session-flow", () => {
  beforeEach(() => {
    vi.resetModules();
    activeEducatorId = EDUCATOR_A;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // AC-701-01: cada transição válida persiste e reidrata o mesmo estado.
  it("percorre idle -> ... -> closed persistindo e reidratando a cada passo", async () => {
    const { useSessionFlowStore } = await loadStore();

    await useSessionFlowStore.getState().selectStudent(STUDENT);
    expect(useSessionFlowStore.getState().step).toBe("studentSelected");
    await useSessionFlowStore.getState().hydrate(EDUCATOR_A);
    expect(useSessionFlowStore.getState().step).toBe("studentSelected");
    expect(useSessionFlowStore.getState().student).toEqual(STUDENT);

    await useSessionFlowStore
      .getState()
      .configure({ name: "Sessão 1", content: CONTENT });
    expect(useSessionFlowStore.getState().step).toBe("configured");
    await useSessionFlowStore.getState().hydrate(EDUCATOR_A);
    expect(useSessionFlowStore.getState().sessionName).toBe("Sessão 1");
    expect(useSessionFlowStore.getState().content).toEqual(CONTENT);

    await useSessionFlowStore.getState().requestStart();
    expect(useSessionFlowStore.getState().step).toBe("starting");
    expect(useSessionFlowStore.getState().startRequestedAt).not.toBeNull();
    await useSessionFlowStore.getState().hydrate(EDUCATOR_A);
    expect(useSessionFlowStore.getState().step).toBe("starting");

    await useSessionFlowStore.getState().confirmStart("session-1");
    expect(useSessionFlowStore.getState().step).toBe("running");
    expect(useSessionFlowStore.getState().sessionId).toBe("session-1");
    await useSessionFlowStore.getState().hydrate(EDUCATOR_A);
    expect(useSessionFlowStore.getState().sessionId).toBe("session-1");

    const answer = makeAnswer("task-1");
    await useSessionFlowStore.getState().confirmAnswer(answer);
    expect(useSessionFlowStore.getState().confirmedAnswers).toEqual([answer]);
    expect(useSessionFlowStore.getState().activityIndex).toBe(1);
    await useSessionFlowStore.getState().hydrate(EDUCATOR_A);
    expect(useSessionFlowStore.getState().confirmedAnswers).toEqual([answer]);

    await useSessionFlowStore.getState().finish();
    expect(useSessionFlowStore.getState().step).toBe("finishing");

    await useSessionFlowStore.getState().awaitObservation();
    expect(useSessionFlowStore.getState().step).toBe("awaitingObservation");

    await useSessionFlowStore.getState().close();
    expect(useSessionFlowStore.getState().step).toBe("closed");
    await useSessionFlowStore.getState().hydrate(EDUCATOR_A);
    expect(useSessionFlowStore.getState().step).toBe("idle");
  });

  // AC-701-01: caminho alternativo starting -> startUncertain -> running (G-08).
  it("reconcilia startUncertain para running adotando o sessionId", async () => {
    const { useSessionFlowStore } = await loadStore();
    await useSessionFlowStore.getState().selectStudent(STUDENT);
    await useSessionFlowStore
      .getState()
      .configure({ name: "Sessão 1", content: CONTENT });
    await useSessionFlowStore.getState().requestStart();

    await useSessionFlowStore.getState().markStartUncertain();
    expect(useSessionFlowStore.getState().step).toBe("startUncertain");

    await useSessionFlowStore.getState().confirmStart("session-reconciliada");
    expect(useSessionFlowStore.getState().step).toBe("running");
    expect(useSessionFlowStore.getState().sessionId).toBe(
      "session-reconciliada",
    );
  });

  // AC-701-01: starting -> error e startUncertain -> error.
  it("failStart leva a error a partir de starting e de startUncertain", async () => {
    const { useSessionFlowStore } = await loadStore();
    await useSessionFlowStore.getState().selectStudent(STUDENT);
    await useSessionFlowStore
      .getState()
      .configure({ name: "Sessão 1", content: CONTENT });
    await useSessionFlowStore.getState().requestStart();
    await useSessionFlowStore.getState().markStartUncertain();

    await useSessionFlowStore
      .getState()
      .failStart("conflito: múltiplas sessões");
    expect(useSessionFlowStore.getState().step).toBe("error");
    expect(useSessionFlowStore.getState().errorReason).toBe(
      "conflito: múltiplas sessões",
    );
  });

  // AC-701-02: transições inválidas são rejeitadas sem alterar o estado.
  it("rejeita confirmAnswer fora de running (ex.: sem sessionId)", async () => {
    const { useSessionFlowStore, SessionFlowInvalidTransitionError } =
      await loadStore();
    await useSessionFlowStore.getState().selectStudent(STUDENT);
    await useSessionFlowStore
      .getState()
      .configure({ name: "Sessão 1", content: CONTENT });

    const before = useSessionFlowStore.getState();

    await expect(
      useSessionFlowStore.getState().confirmAnswer(makeAnswer("task-1")),
    ).rejects.toThrow(SessionFlowInvalidTransitionError);

    expect(useSessionFlowStore.getState().step).toBe(before.step);
    expect(useSessionFlowStore.getState().sessionId).toBeNull();
    expect(useSessionFlowStore.getState().confirmedAnswers).toEqual([]);
  });

  it("rejeita configure em idle", async () => {
    const { useSessionFlowStore, SessionFlowInvalidTransitionError } =
      await loadStore();

    await expect(
      useSessionFlowStore
        .getState()
        .configure({ name: "Sessão 1", content: CONTENT }),
    ).rejects.toThrow(SessionFlowInvalidTransitionError);
    expect(useSessionFlowStore.getState().step).toBe("idle");
  });

  it("rejeita finish fora de running", async () => {
    const { useSessionFlowStore, SessionFlowInvalidTransitionError } =
      await loadStore();
    await useSessionFlowStore.getState().selectStudent(STUDENT);

    await expect(useSessionFlowStore.getState().finish()).rejects.toThrow(
      SessionFlowInvalidTransitionError,
    );
    expect(useSessionFlowStore.getState().step).toBe("studentSelected");
  });

  it("rejeita discard sem confirmed em running", async () => {
    const { useSessionFlowStore, SessionFlowInvalidTransitionError } =
      await loadStore();
    await useSessionFlowStore.getState().selectStudent(STUDENT);
    await useSessionFlowStore
      .getState()
      .configure({ name: "Sessão 1", content: CONTENT });
    await useSessionFlowStore.getState().requestStart();
    await useSessionFlowStore.getState().confirmStart("session-1");

    await expect(
      useSessionFlowStore.getState().discard({ confirmed: false }),
    ).rejects.toThrow(SessionFlowInvalidTransitionError);
    expect(useSessionFlowStore.getState().step).toBe("running");
    expect(useSessionFlowStore.getState().sessionId).toBe("session-1");
  });

  // AC-701-03: cancelar antes do start limpa; depois do start exige confirmed.
  it("cancel() limpa o fluxo em studentSelected e configured", async () => {
    const { useSessionFlowStore, initialSessionFlowData } = await loadStore();
    await useSessionFlowStore.getState().selectStudent(STUDENT);

    await useSessionFlowStore.getState().cancel();

    expect(useSessionFlowStore.getState()).toMatchObject(
      initialSessionFlowData,
    );
  });

  it("discard({ confirmed: true }) limpa o fluxo depois do start", async () => {
    const { useSessionFlowStore, initialSessionFlowData } = await loadStore();
    await useSessionFlowStore.getState().selectStudent(STUDENT);
    await useSessionFlowStore
      .getState()
      .configure({ name: "Sessão 1", content: CONTENT });
    await useSessionFlowStore.getState().requestStart();
    await useSessionFlowStore.getState().confirmStart("session-1");

    await useSessionFlowStore.getState().discard({ confirmed: true });

    expect(useSessionFlowStore.getState()).toMatchObject(
      initialSessionFlowData,
    );
  });

  // Condição do orquestrador para a decisão (1) do vermelho: "session:flow"
  // deve ficar dentro do espaço que a T-303 trata como fluxo de sessão (mesmo
  // prefixo que clearSessionFlow apaga e clearQueryCache preserva), sem
  // alterar src/storage/**. Usa o mmkv.ts real (não o mock acima) com
  // react-native-mmkv/encryption-key mockados localmente, como em
  // src/storage/__tests__/mmkv.test.ts (A-20).
  describe("integração com o espaço de chaves da T-303 (sem alterar src/storage/**)", () => {
    afterEach(() => {
      // Restaura o mock padrão de "@/storage/mmkv" para os demais testes do
      // arquivo, desfazendo o vi.doUnmock usado nesta suíte.
      vi.doMock("@/storage/mmkv", mockedMmkvModule);
    });

    async function loadRealMmkvIntegration() {
      vi.doUnmock("@/storage/mmkv");
      vi.doMock("@/storage/encryption-key", () => ({
        getOrCreateEncryptionKey: vi.fn(async () => "a".repeat(32)),
      }));
      vi.doMock("react-native-mmkv", () => ({
        createMMKV: (config: { id: string }) => {
          const store = new Map<string, unknown>();
          return {
            id: config.id,
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
        },
      }));
      vi.resetModules();
      const sessionFlow = await import("@/stores/session-flow");
      const mmkv = await import("@/storage/mmkv");
      return { sessionFlow, mmkv };
    }

    it("clearQueryCache (sessionExpired) preserva session:flow", async () => {
      const { sessionFlow, mmkv } = await loadRealMmkvIntegration();
      const storage = await mmkv.getStorage(EDUCATOR_A);
      storage.set(sessionFlow.SESSION_FLOW_STORAGE_KEY, "rascunho-do-fluxo");
      storage.set("query:student:1", "dado");

      await mmkv.clearQueryCache(EDUCATOR_A);

      expect(storage.getString(sessionFlow.SESSION_FLOW_STORAGE_KEY)).toBe(
        "rascunho-do-fluxo",
      );
      expect(storage.getString("query:student:1")).toBeUndefined();
    });

    it("clearSessionFlow e clearAllForEducator (logout) removem session:flow", async () => {
      const { sessionFlow, mmkv } = await loadRealMmkvIntegration();
      const storage = await mmkv.getStorage(EDUCATOR_A);
      storage.set(sessionFlow.SESSION_FLOW_STORAGE_KEY, "rascunho-do-fluxo");

      await mmkv.clearSessionFlow(EDUCATOR_A);
      expect(
        storage.getString(sessionFlow.SESSION_FLOW_STORAGE_KEY),
      ).toBeUndefined();

      storage.set(sessionFlow.SESSION_FLOW_STORAGE_KEY, "rascunho-do-fluxo-2");
      await mmkv.clearAllForEducator(EDUCATOR_A);
      expect(
        storage.getString(sessionFlow.SESSION_FLOW_STORAGE_KEY),
      ).toBeUndefined();
    });
  });

  // AC-701-04: fluxo reidratado com educatorId diferente do logado é descartado.
  it("hydrate com educatorId diferente do logado mantém idle e não expõe o fluxo", async () => {
    const { useSessionFlowStore } = await loadStore();
    await useSessionFlowStore.getState().selectStudent(STUDENT);
    await useSessionFlowStore
      .getState()
      .configure({ name: "Sessão do educador A", content: CONTENT });

    // Simula reabertura do app com outro educador logado.
    await useSessionFlowStore.getState().hydrate(EDUCATOR_B);

    expect(useSessionFlowStore.getState().step).toBe("idle");
    expect(useSessionFlowStore.getState().student).toBeNull();
    expect(useSessionFlowStore.getState().sessionName).toBeNull();
  });
});
