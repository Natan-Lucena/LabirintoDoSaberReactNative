import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import * as pushApi from "@/api/endpoints/push";
import { mockAdapter } from "@/mocks/adapter";
import { getMockPushTokens, resetMockPushState } from "@/mocks/handlers/push";
import "@/mocks/install";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const savedToken = vi.hoisted(() => ({ value: null as string | null }));
const notifications = vi.hoisted(() => ({
  module: null as unknown,
}));

vi.mock("../tokenStore", () => ({
  getSavedPushToken: async () => savedToken.value,
  savePushToken: async (token: string) => {
    savedToken.value = token;
  },
  clearSavedPushToken: async () => {
    savedToken.value = null;
  },
  wasPrompted: async () => false,
  markPrompted: async () => undefined,
}));
vi.mock("../support", () => ({
  PUSH_CHANNEL_ID: "lembretes",
  isPushSupported: () => notifications.module !== null,
  loadNotifications: () => notifications.module,
  getEasProjectId: () => "projeto-teste",
}));

const { registerForPush } = await import("../registerForPush");
const { unregisterPushOnLogout } = await import("../unregisterOnLogout");

const TOKEN = "ExponentPushToken[abc123]";
const originalAdapter = apiClient.defaults.adapter;

function fakeNotifications(permission: { granted: boolean; request: boolean }) {
  return {
    AndroidImportance: { DEFAULT: 3 },
    setNotificationChannelAsync: vi.fn(async () => null),
    getPermissionsAsync: vi.fn(async () => ({
      granted: permission.granted,
      canAskAgain: true,
    })),
    requestPermissionsAsync: vi.fn(async () => ({
      granted: permission.request,
    })),
    getExpoPushTokenAsync: vi.fn(async () => ({ data: TOKEN })),
  };
}

describe("push (NOT-02)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockPushState();
    savedToken.value = null;
    notifications.module = null;
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockPushState();
    vi.useRealTimers();
  });

  describe("rotas pelo apiClient", () => {
    it("registra o token e repetir faz upsert", async () => {
      await pushApi.registerPushToken({ token: TOKEN, platform: "android" });
      await pushApi.registerPushToken({ token: TOKEN, platform: "android" });
      expect(getMockPushTokens()).toEqual([TOKEN]);
    });

    it("recusa token em formato inválido (INVALID_PUSH_TOKEN)", async () => {
      await expect(
        pushApi.registerPushToken({ token: "lixo", platform: "android" }),
      ).rejects.toMatchObject({ code: "INVALID_PUSH_TOKEN" });
    });

    it("DELETE com corpo apaga e é idempotente", async () => {
      await pushApi.registerPushToken({ token: TOKEN, platform: "android" });
      await pushApi.unregisterPushToken(TOKEN);
      await pushApi.unregisterPushToken(TOKEN);
      expect(getMockPushTokens()).toEqual([]);
    });

    it("PUT parcial mantém as outras chaves e corpo vazio dá 400", async () => {
      const saved = await pushApi.updateNotificationPreferences({
        kinds: { EVOLUTION_PENDING: false },
      });
      expect(saved.pushEnabled).toBe(true);
      expect(saved.kinds.EVOLUTION_PENDING).toBe(false);
      expect(saved.kinds.PLAN_REVIEW_DUE).toBe(true);
      expect((await pushApi.getNotificationPreferences()).kinds).toEqual(
        saved.kinds,
      );
      await expect(pushApi.updateNotificationPreferences({})).rejects.toThrow();
    });
  });

  describe("registerForPush (AC-NOT-02-01)", () => {
    it("Expo Go (sem módulo): nenhuma chamada a push-token", async () => {
      const spy = vi.spyOn(pushApi, "registerPushToken");
      expect(await registerForPush({ ask: true })).toBe("unsupported");
      expect(spy).not.toHaveBeenCalled();
    });

    it("permissão negada: nada é enviado", async () => {
      notifications.module = fakeNotifications({
        granted: false,
        request: false,
      });
      expect(await registerForPush({ ask: true })).toBe("denied");
      expect(getMockPushTokens()).toEqual([]);
    });

    it("sem pedir (ask: false) e sem permissão: nada é enviado", async () => {
      const fake = fakeNotifications({ granted: false, request: true });
      notifications.module = fake;
      expect(await registerForPush({ ask: false })).toBe("denied");
      expect(fake.requestPermissionsAsync).not.toHaveBeenCalled();
      expect(getMockPushTokens()).toEqual([]);
    });

    it("concedida: cria o canal, registra e guarda o token", async () => {
      const fake = fakeNotifications({ granted: false, request: true });
      notifications.module = fake;
      expect(await registerForPush({ ask: true })).toBe("registered");
      expect(fake.setNotificationChannelAsync).toHaveBeenCalled();
      expect(getMockPushTokens()).toEqual([TOKEN]);
      expect(savedToken.value).toBe(TOKEN);
    });
  });

  describe("unregisterPushOnLogout (AC-NOT-02-02)", () => {
    it("apaga o token no servidor e localmente", async () => {
      await pushApi.registerPushToken({ token: TOKEN, platform: "android" });
      savedToken.value = TOKEN;
      await unregisterPushOnLogout();
      expect(getMockPushTokens()).toEqual([]);
      expect(savedToken.value).toBeNull();
    });

    it("sem token guardado não chama a API", async () => {
      const spy = vi.spyOn(pushApi, "unregisterPushToken");
      await unregisterPushOnLogout();
      expect(spy).not.toHaveBeenCalled();
    });

    it("falha do servidor não impede a saída", async () => {
      savedToken.value = TOKEN;
      vi.spyOn(pushApi, "unregisterPushToken").mockRejectedValueOnce(
        new Error("falhou"),
      );
      await expect(unregisterPushOnLogout()).resolves.toBeUndefined();
    });

    it("demora acima de 5 s é abandonada", async () => {
      vi.useFakeTimers();
      savedToken.value = TOKEN;
      vi.spyOn(pushApi, "unregisterPushToken").mockReturnValueOnce(
        new Promise(() => undefined),
      );
      const done = unregisterPushOnLogout();
      await vi.advanceTimersByTimeAsync(5001);
      await expect(done).resolves.toBeUndefined();
    });
  });
});
