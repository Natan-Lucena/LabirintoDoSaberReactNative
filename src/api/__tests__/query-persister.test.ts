import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";

import { getStorage, clearQueryCache } from "@/storage/mmkv";
import {
  createQueryPersister,
  persistQueryClient,
} from "@/api/query-persister";

// Chave fixa de 32 bytes (64 chars hex), no mesmo formato produzido por
// getOrCreateEncryptionKey (encryption-key.ts). `expo-sqlite/kv-store` é
// mockado globalmente em memória por vitest.setup.ts (EXPO-01).
vi.mock("@/storage/encryption-key", () => ({
  getOrCreateEncryptionKey: vi.fn(async () => "b2".repeat(32)),
}));

describe("query-persister", () => {
  const educatorId = "educator-1";

  beforeEach(async () => {
    const storage = await getStorage(educatorId);
    storage.clearAll();
  });

  it("persists the query cache under a query:-prefixed key in the educator's MMKV", async () => {
    const client = new QueryClient();
    client.setQueryData(["student", "1"], { id: "1", name: "Ana" });

    const unsubscribe = await persistQueryClient(client, educatorId);
    await vi.waitFor(async () => {
      const storage = await getStorage(educatorId);
      const keys = storage
        .getAllKeys()
        .filter((key) => key.startsWith("query:"));
      expect(keys.length).toBeGreaterThan(0);
    });

    unsubscribe();
  });

  it("restores persisted cache into a new QueryClient", async () => {
    const firstClient = new QueryClient();
    firstClient.setQueryData(["student", "1"], { id: "1", name: "Ana" });
    const unsubscribeFirst = await persistQueryClient(firstClient, educatorId);
    await vi.waitFor(async () => {
      const storage = await getStorage(educatorId);
      expect(storage.getAllKeys().some((k) => k.startsWith("query:"))).toBe(
        true,
      );
    });
    unsubscribeFirst();

    const persister = await createQueryPersister(educatorId);
    const restored = await persister.restoreClient();
    expect(restored).toBeDefined();
  });

  it("does not persist mutations, so none are resumed after restoring the cache", async () => {
    const client = new QueryClient();
    client.setQueryData(["student", "1"], { id: "1", name: "Ana" });

    const mutationCache = client.getMutationCache();
    mutationCache.build(client, {
      mutationFn: async () => "ok",
    });

    const unsubscribe = await persistQueryClient(client, educatorId);
    await vi.waitFor(async () => {
      const storage = await getStorage(educatorId);
      expect(storage.getAllKeys().some((k) => k.startsWith("query:"))).toBe(
        true,
      );
    });
    unsubscribe();

    const persister = await createQueryPersister(educatorId);
    const restored = await persister.restoreClient();
    const restoredMutations = (
      restored as { clientState?: { mutations?: unknown[] } }
    )?.clientState?.mutations;
    expect(restoredMutations ?? []).toHaveLength(0);
  });

  it("clearQueryCache removes the persisted cache", async () => {
    const client = new QueryClient();
    client.setQueryData(["student", "1"], { id: "1", name: "Ana" });
    const unsubscribe = await persistQueryClient(client, educatorId);
    await vi.waitFor(async () => {
      const storage = await getStorage(educatorId);
      expect(storage.getAllKeys().some((k) => k.startsWith("query:"))).toBe(
        true,
      );
    });
    unsubscribe();

    await clearQueryCache(educatorId);

    const storage = await getStorage(educatorId);
    expect(
      storage.getAllKeys().filter((k) => k.startsWith("query:")),
    ).toHaveLength(0);
  });
});
