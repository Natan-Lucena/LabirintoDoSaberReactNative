import { createMMKV, type MMKV } from "react-native-mmkv";

import { subscribeAuthCleared } from "@/stores/auth";
import { getOrCreateEncryptionKey } from "@/storage/encryption-key";

const QUERY_KEY_PREFIX = "query:";
const SESSION_KEY_PREFIX = "session:";

const instances = new Map<string, MMKV>();

let activeEducatorId: string | null = null;

function storageId(educatorId: string): string {
  return `labirinto.${educatorId}`;
}

async function createInstance(educatorId: string): Promise<MMKV> {
  const encryptionKey = await getOrCreateEncryptionKey();
  return createMMKV({
    id: storageId(educatorId),
    encryptionKey,
    encryptionType: "AES-256",
  });
}

export async function getStorage(educatorId: string): Promise<MMKV> {
  const existing = instances.get(educatorId);
  if (existing) {
    return existing;
  }

  const instance = await createInstance(educatorId);
  instances.set(educatorId, instance);
  return instance;
}

export function getActiveEducatorId(): string | null {
  return activeEducatorId;
}

export async function activateEducator(educatorId: string): Promise<MMKV> {
  if (activeEducatorId !== null && activeEducatorId !== educatorId) {
    await clearAllForEducator(activeEducatorId);
  }

  activeEducatorId = educatorId;
  return getStorage(educatorId);
}

function clearByPrefix(storage: MMKV, prefix: string): void {
  for (const key of storage.getAllKeys()) {
    if (key.startsWith(prefix)) {
      storage.remove(key);
    }
  }
}

export async function clearQueryCache(educatorId: string): Promise<void> {
  const storage = await getStorage(educatorId);
  clearByPrefix(storage, QUERY_KEY_PREFIX);
}

export async function clearSessionFlow(educatorId: string): Promise<void> {
  const storage = await getStorage(educatorId);
  clearByPrefix(storage, SESSION_KEY_PREFIX);
}

export async function clearAllForEducator(educatorId: string): Promise<void> {
  const storage = await getStorage(educatorId);
  storage.clearAll();
}

export function connectStorageToAuth(): () => void {
  return subscribeAuthCleared(({ reason }) => {
    const educatorId = getActiveEducatorId();
    if (!educatorId) {
      return;
    }

    if (reason === "logout") {
      void clearAllForEducator(educatorId);
    } else if (reason === "sessionExpired") {
      void clearQueryCache(educatorId);
    }
  });
}
