import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";

export const MMKV_ENCRYPTION_KEY_STORAGE_KEY = "labirinto.mmkv.encryptionKey";

const KEY_BYTE_LENGTH = 32;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function getOrCreateEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(
    MMKV_ENCRYPTION_KEY_STORAGE_KEY,
  );
  if (existing) {
    return existing;
  }

  const randomBytes = await Crypto.getRandomBytesAsync(KEY_BYTE_LENGTH);
  const key = bytesToHex(randomBytes);
  await SecureStore.setItemAsync(MMKV_ENCRYPTION_KEY_STORAGE_KEY, key);
  return key;
}
