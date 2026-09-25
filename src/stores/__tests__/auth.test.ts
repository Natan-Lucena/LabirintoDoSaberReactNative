import { afterEach, describe, expect, it, vi } from "vitest";

import { subscribeAuthCleared, useAuthStore } from "@/stores/auth";
import { secureStoreMock } from "@/test-utils/mocks";

describe("auth store", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useAuthStore.setState({ status: "idle", token: null, educatorId: null });
  });

  // AC-302-01: token só vai para SecureStore (aqui verificado indiretamente
  // via login, que deve delegar a gravação ao token-storage/SecureStore).
  it("login grava o token via SecureStore e autentica o estado", async () => {
    await useAuthStore.getState().login("token-abc");

    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(
      expect.any(String),
      "token-abc",
    );
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().token).toBe("token-abc");
  });

  // AC-302-02: logout apaga o token e notifica assinantes.
  it("logout apaga o token via SecureStore e limpa o estado", async () => {
    await useAuthStore.getState().login("token-abc");

    await useAuthStore.getState().logout();

    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().educatorId).toBeNull();
  });

  it("logout notifica os assinantes do evento de limpeza com reason logout", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAuthCleared(listener);

    await useAuthStore.getState().login("token-abc");
    await useAuthStore.getState().logout();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ reason: "logout" });

    unsubscribe();
  });

  it("assinante cancelado não é mais notificado no logout seguinte", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAuthCleared(listener);
    unsubscribe();

    await useAuthStore.getState().login("token-abc");
    await useAuthStore.getState().logout();

    expect(listener).not.toHaveBeenCalled();
  });

  // G-04: expireSession (401) distingue-se do logout explícito pelo reason.
  it("expireSession apaga o token via SecureStore e limpa o estado", async () => {
    await useAuthStore.getState().login("token-abc");

    await useAuthStore.getState().expireSession();

    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().educatorId).toBeNull();
  });

  it("expireSession notifica os assinantes do evento de limpeza com reason sessionExpired", async () => {
    const listener = vi.fn();
    const unsubscribe = subscribeAuthCleared(listener);

    await useAuthStore.getState().login("token-abc");
    await useAuthStore.getState().expireSession();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ reason: "sessionExpired" });

    unsubscribe();
  });

  it("expireSession propaga erro quando o SecureStore falha ao apagar", async () => {
    await useAuthStore.getState().login("token-abc");
    secureStoreMock.deleteItemAsync.mockRejectedValueOnce(
      new Error("secure store indisponível"),
    );

    await expect(useAuthStore.getState().expireSession()).rejects.toThrow(
      "secure store indisponível",
    );
  });

  // AC-302-03: reidratação restaura estado autenticado sem chamada de rede.
  it("hydrate restaura o estado autenticado quando há token no SecureStore", async () => {
    await useAuthStore.getState().login("token-abc");
    useAuthStore.setState({ status: "idle", token: null, educatorId: null });

    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().token).toBe("token-abc");
  });

  it("hydrate define estado não autenticado quando não há token gravado", async () => {
    await useAuthStore.getState().hydrate();

    expect(useAuthStore.getState().status).toBe("unauthenticated");
    expect(useAuthStore.getState().token).toBeNull();
  });

  it("hydrate não realiza nenhuma chamada de rede", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await useAuthStore.getState().hydrate();

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("login propaga erro quando o SecureStore falha ao gravar", async () => {
    secureStoreMock.setItemAsync.mockRejectedValueOnce(
      new Error("secure store indisponível"),
    );

    await expect(useAuthStore.getState().login("token-abc")).rejects.toThrow(
      "secure store indisponível",
    );
    expect(useAuthStore.getState().status).not.toBe("authenticated");
  });

  it("logout propaga erro quando o SecureStore falha ao apagar", async () => {
    await useAuthStore.getState().login("token-abc");
    secureStoreMock.deleteItemAsync.mockRejectedValueOnce(
      new Error("secure store indisponível"),
    );

    await expect(useAuthStore.getState().logout()).rejects.toThrow(
      "secure store indisponível",
    );
  });
});
