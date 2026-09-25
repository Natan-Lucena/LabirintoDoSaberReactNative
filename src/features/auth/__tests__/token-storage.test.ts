import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AUTH_TOKEN_STORAGE_KEY,
  clearToken,
  getToken,
  saveToken,
} from "@/features/auth/token-storage";
import { secureStoreMock } from "@/test-utils/mocks";

describe("token-storage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // AC-302-01: token só é gravado via SecureStore.
  it("grava o token chamando expo-secure-store com a chave fixa", async () => {
    await saveToken("token-abc");

    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(
      AUTH_TOKEN_STORAGE_KEY,
      "token-abc",
    );
  });

  it("lê o token gravado anteriormente via SecureStore", async () => {
    await saveToken("token-abc");

    await expect(getToken()).resolves.toBe("token-abc");
  });

  it("retorna null quando não há token gravado", async () => {
    await expect(getToken()).resolves.toBeNull();
  });

  it("apaga o token via SecureStore", async () => {
    await saveToken("token-abc");

    await clearToken();

    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith(
      AUTH_TOKEN_STORAGE_KEY,
    );
    await expect(getToken()).resolves.toBeNull();
  });

  it("propaga erro do SecureStore ao ler o token", async () => {
    secureStoreMock.getItemAsync.mockRejectedValueOnce(
      new Error("secure store indisponível"),
    );

    await expect(getToken()).rejects.toThrow("secure store indisponível");
  });

  it("propaga erro do SecureStore ao gravar o token", async () => {
    secureStoreMock.setItemAsync.mockRejectedValueOnce(
      new Error("secure store indisponível"),
    );

    await expect(saveToken("token-abc")).rejects.toThrow(
      "secure store indisponível",
    );
  });

  it("propaga erro do SecureStore ao apagar o token", async () => {
    secureStoreMock.deleteItemAsync.mockRejectedValueOnce(
      new Error("secure store indisponível"),
    );

    await expect(clearToken()).rejects.toThrow("secure store indisponível");
  });
});
