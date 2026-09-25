import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/storage/encryption-key", () => ({
  getOrCreateEncryptionKey: vi.fn(async () => "a".repeat(32)),
}));

// O preset "mmkv" de vitest-native expõe `delete()` em vez de `remove()`
// (diverge do tipo `MMKV` real de react-native-mmkv, que só existe em
// runtime nativo). Este mock local replica a API real usada por
// src/storage/mmkv.ts para os testes ficarem determinísticos.
vi.mock("react-native-mmkv", () => ({
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

const EDUCATOR_A = "educator-a";
const EDUCATOR_B = "educator-b";

async function loadModules() {
  const encryptionKey = await import("@/storage/encryption-key");
  const mmkv = await import("@/storage/mmkv");
  const auth = await import("@/stores/auth");
  return { encryptionKey, mmkv, auth };
}

describe("storage/mmkv", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cria a instância usando a chave de encryption-key.ts (AC-303-01)", async () => {
    const { encryptionKey, mmkv } = await loadModules();

    await mmkv.getStorage(EDUCATOR_A);

    expect(encryptionKey.getOrCreateEncryptionKey).toHaveBeenCalled();
  });

  it("logout limpa cache de queries e sessão do educador atual (AC-303-02)", async () => {
    const { mmkv } = await loadModules();
    const storage = await mmkv.getStorage(EDUCATOR_A);
    storage.set("query:student:1", "dado");
    storage.set("session:notebook-1", "rascunho");

    await mmkv.clearAllForEducator(EDUCATOR_A);

    expect(storage.getString("query:student:1")).toBeUndefined();
    expect(storage.getString("session:notebook-1")).toBeUndefined();
  });

  it("sessionExpired limpa só o cache de queries e preserva a sessão (AC-303-02)", async () => {
    const { mmkv } = await loadModules();
    const storage = await mmkv.getStorage(EDUCATOR_A);
    storage.set("query:student:1", "dado");
    storage.set("session:notebook-1", "rascunho");

    await mmkv.clearQueryCache(EDUCATOR_A);

    expect(storage.getString("query:student:1")).toBeUndefined();
    expect(storage.getString("session:notebook-1")).toBe("rascunho");
  });

  it("clearSessionFlow apaga só as chaves de sessão", async () => {
    const { mmkv } = await loadModules();
    const storage = await mmkv.getStorage(EDUCATOR_A);
    storage.set("query:student:1", "dado");
    storage.set("session:notebook-1", "rascunho");

    await mmkv.clearSessionFlow(EDUCATOR_A);

    expect(storage.getString("query:student:1")).toBe("dado");
    expect(storage.getString("session:notebook-1")).toBeUndefined();
  });

  it("troca de educador apaga tudo do anterior antes de expor o novo (AC-303-04)", async () => {
    const { mmkv } = await loadModules();
    const storageA = await mmkv.getStorage(EDUCATOR_A);
    storageA.set("query:student:1", "dado-do-a");
    await mmkv.activateEducator(EDUCATOR_A);

    await mmkv.activateEducator(EDUCATOR_B);
    const storageB = await mmkv.getStorage(EDUCATOR_B);

    expect(mmkv.getActiveEducatorId()).toBe(EDUCATOR_B);
    expect(storageB.getString("query:student:1")).toBeUndefined();
    expect(storageA.getString("query:student:1")).toBeUndefined();
  });

  it("ativar o mesmo educador já ativo não apaga nada", async () => {
    const { mmkv } = await loadModules();
    await mmkv.activateEducator(EDUCATOR_A);
    const storage = await mmkv.getStorage(EDUCATOR_A);
    storage.set("query:student:1", "dado");

    await mmkv.activateEducator(EDUCATOR_A);

    expect(storage.getString("query:student:1")).toBe("dado");
  });

  it("propaga erro de getOrCreateEncryptionKey", async () => {
    const { encryptionKey, mmkv } = await loadModules();
    vi.mocked(encryptionKey.getOrCreateEncryptionKey).mockRejectedValueOnce(
      new Error("chave ausente"),
    );

    await expect(mmkv.getStorage(EDUCATOR_A)).rejects.toThrow("chave ausente");
  });

  it("connectStorageToAuth: logout limpa tudo do educador ativo", async () => {
    const { mmkv, auth } = await loadModules();
    await mmkv.activateEducator(EDUCATOR_A);
    const storage = await mmkv.getStorage(EDUCATOR_A);
    storage.set("query:student:1", "dado");
    storage.set("session:notebook-1", "rascunho");

    const listeners: ((e: { reason: "logout" | "sessionExpired" }) => void)[] =
      [];
    vi.spyOn(auth, "subscribeAuthCleared").mockImplementation((listener) => {
      listeners.push(listener);
      return () => {};
    });
    mmkv.connectStorageToAuth();
    listeners[0]?.({ reason: "logout" });
    await Promise.resolve();
    await Promise.resolve();

    expect(storage.getString("query:student:1")).toBeUndefined();
    expect(storage.getString("session:notebook-1")).toBeUndefined();
  });

  it("connectStorageToAuth: sessionExpired preserva a sessão do educador ativo", async () => {
    const { mmkv, auth } = await loadModules();
    await mmkv.activateEducator(EDUCATOR_A);
    const storage = await mmkv.getStorage(EDUCATOR_A);
    storage.set("query:student:1", "dado");
    storage.set("session:notebook-1", "rascunho");

    const listeners: ((e: { reason: "logout" | "sessionExpired" }) => void)[] =
      [];
    vi.spyOn(auth, "subscribeAuthCleared").mockImplementation((listener) => {
      listeners.push(listener);
      return () => {};
    });
    mmkv.connectStorageToAuth();
    listeners[0]?.({ reason: "sessionExpired" });
    await Promise.resolve();
    await Promise.resolve();

    expect(storage.getString("query:student:1")).toBeUndefined();
    expect(storage.getString("session:notebook-1")).toBe("rascunho");
  });

  it("connectStorageToAuth: unsubscribe interrompe a limpeza automática", async () => {
    const { mmkv, auth } = await loadModules();
    await mmkv.activateEducator(EDUCATOR_A);
    const storage = await mmkv.getStorage(EDUCATOR_A);
    storage.set("query:student:1", "dado");

    const unsubscribeSpy = vi.fn();
    const listeners: ((e: { reason: "logout" | "sessionExpired" }) => void)[] =
      [];
    vi.spyOn(auth, "subscribeAuthCleared").mockImplementation((listener) => {
      listeners.push(listener);
      return unsubscribeSpy;
    });
    const unsubscribe = mmkv.connectStorageToAuth();
    unsubscribe();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
