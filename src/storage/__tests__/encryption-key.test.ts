import { describe, expect, it, vi } from "vitest";

import * as Crypto from "expo-crypto";

import { secureStoreMock } from "@/test-utils/mocks";
import { getOrCreateEncryptionKey } from "@/storage/encryption-key";

vi.mock("expo-crypto", () => ({
  getRandomBytesAsync: vi.fn(async (byteCount: number) =>
    new Uint8Array(byteCount).fill(7),
  ),
}));

describe("getOrCreateEncryptionKey", () => {
  it("gera uma chave de 32 bytes com o gerador criptográfico e grava no SecureStore (AC-303-01)", async () => {
    const key = await getOrCreateEncryptionKey();

    expect(Crypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
    expect(typeof key).toBe("string");
    expect(key.length).toBe(64); // 32 bytes em hex
    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(
      "labirinto.mmkv.encryptionKey",
      key,
    );
  });

  it("reaproveita a chave existente sem gerar/gravar de novo", async () => {
    const first = await getOrCreateEncryptionKey();
    vi.mocked(Crypto.getRandomBytesAsync).mockClear();
    secureStoreMock.setItemAsync.mockClear();

    const second = await getOrCreateEncryptionKey();

    expect(second).toBe(first);
    expect(Crypto.getRandomBytesAsync).not.toHaveBeenCalled();
    expect(secureStoreMock.setItemAsync).not.toHaveBeenCalled();
  });

  it("propaga erro de leitura do SecureStore", async () => {
    vi.spyOn(secureStoreMock, "getItemAsync").mockRejectedValueOnce(
      new Error("read failed"),
    );

    await expect(getOrCreateEncryptionKey()).rejects.toThrow("read failed");
  });

  it("propaga erro de gravação do SecureStore", async () => {
    vi.spyOn(secureStoreMock, "setItemAsync").mockRejectedValueOnce(
      new Error("write failed"),
    );

    await expect(getOrCreateEncryptionKey()).rejects.toThrow("write failed");
  });

  it("falha se o gerador criptográfico não estiver disponível, sem cair para Math.random", async () => {
    vi.mocked(Crypto.getRandomBytesAsync).mockRejectedValueOnce(
      new Error("crypto indisponível"),
    );

    await expect(getOrCreateEncryptionKey()).rejects.toThrow(
      "crypto indisponível",
    );
  });
});
