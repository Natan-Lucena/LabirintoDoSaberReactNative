import * as Crypto from "expo-crypto";
import { SQLiteStorage } from "expo-sqlite/kv-store";
import { gcm } from "@noble/ciphers/aes.js";
import {
  bytesToHex,
  bytesToUtf8,
  concatBytes,
  hexToBytes,
  utf8ToBytes,
} from "@noble/ciphers/utils.js";

import { subscribeAuthCleared } from "@/stores/auth";
import { getOrCreateEncryptionKey } from "@/storage/encryption-key";

const QUERY_KEY_PREFIX = "query:";
const SESSION_KEY_PREFIX = "session:";

// EXPO-01: o Expo Go não roda o módulo nativo do MMKV (react-native-mmkv +
// react-native-nitro-modules). O armazenamento passou a ser `expo-sqlite/kv-store`
// (síncrono, disponível no Expo Go), com criptografia AES-256-GCM feita em JS
// (`@noble/ciphers`) antes de cada gravação. Formato gravado por chave:
// hex(nonce de 12 bytes || ciphertext com a tag GCM anexada), tudo em hex
// (em vez de base64) para evitar depender de `btoa`/`atob`/`Buffer`, ausentes
// no Hermes: `@noble/ciphers/utils.js` já traz bytesToHex/hexToBytes prontos.
const GCM_NONCE_LENGTH = 12;

export interface KvStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
  getAllKeys(): string[];
  clearAll(): void;
}

const instances = new Map<string, KvStorage>();

let activeEducatorId: string | null = null;

function storageId(educatorId: string): string {
  return `labirinto.${educatorId}.db`;
}

function encryptValue(keyBytes: Uint8Array, plaintext: string): string {
  const nonce = Crypto.getRandomBytes(GCM_NONCE_LENGTH);
  const ciphertext = gcm(keyBytes, nonce).encrypt(utf8ToBytes(plaintext));
  return bytesToHex(concatBytes(nonce, ciphertext));
}

function decryptValue(keyBytes: Uint8Array, stored: string): string | null {
  try {
    const raw = hexToBytes(stored);
    if (raw.length <= GCM_NONCE_LENGTH) {
      return null;
    }
    const nonce = raw.subarray(0, GCM_NONCE_LENGTH);
    const ciphertext = raw.subarray(GCM_NONCE_LENGTH);
    const plaintext = gcm(keyBytes, nonce).decrypt(ciphertext);
    return bytesToUtf8(plaintext);
  } catch {
    // Chave trocada, dado corrompido ou formato inesperado: tratado como
    // ausente pelo chamador (ver EncryptedKvStorage.getString).
    return null;
  }
}

class EncryptedKvStorage implements KvStorage {
  constructor(
    private readonly db: SQLiteStorage,
    private readonly keyBytes: Uint8Array,
  ) {}

  getString(key: string): string | undefined {
    const raw = this.db.getItemSync(key);
    if (raw === null) {
      return undefined;
    }

    const plaintext = decryptValue(this.keyBytes, raw);
    if (plaintext === null) {
      // Valor indecifrável: tratado como ausente, sem derrubar o app; a
      // entrada é apagada para não insistir em tentar decifrá-la de novo.
      this.db.removeItemSync(key);
      return undefined;
    }

    return plaintext;
  }

  set(key: string, value: string): void {
    this.db.setItemSync(key, encryptValue(this.keyBytes, value));
  }

  remove(key: string): void {
    this.db.removeItemSync(key);
  }

  getAllKeys(): string[] {
    return this.db.getAllKeysSync();
  }

  clearAll(): void {
    this.db.clearSync();
  }
}

async function createInstance(educatorId: string): Promise<KvStorage> {
  const encryptionKeyHex = await getOrCreateEncryptionKey();
  const keyBytes = hexToBytes(encryptionKeyHex);
  const db = new SQLiteStorage(storageId(educatorId));
  return new EncryptedKvStorage(db, keyBytes);
}

export async function getStorage(educatorId: string): Promise<KvStorage> {
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

export async function activateEducator(educatorId: string): Promise<KvStorage> {
  if (activeEducatorId !== null && activeEducatorId !== educatorId) {
    await clearAllForEducator(activeEducatorId);
  }

  activeEducatorId = educatorId;
  return getStorage(educatorId);
}

function clearByPrefix(storage: KvStorage, prefix: string): void {
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
