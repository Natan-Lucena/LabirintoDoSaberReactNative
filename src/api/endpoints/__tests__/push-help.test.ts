import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { helpQueryKeys, listHelpTutorials } from "@/api/endpoints/help";
import {
  NOTIFICATION_KINDS,
  getNotificationPreferences,
  pushQueryKeys,
} from "@/api/endpoints/push";
import { setMockHelpScenario } from "@/mocks/handlers/help";
import {
  resetMockPushState,
  setMockNotificationPreferences,
} from "@/mocks/handlers/push";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/install";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("push e ajuda pelo apiClient (API-07, leva 4)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockPushState();
    setMockHelpScenario("default");
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockPushState();
    setMockHelpScenario("default");
  });

  it("monta chaves de query", () => {
    expect(pushQueryKeys.preferences).toEqual(["notifications", "preferences"]);
    expect(helpQueryKeys.tutorials).toEqual(["help", "tutorials"]);
  });

  describe("GET /notification/preferences", () => {
    it("devolve os padrões, com as quatro chaves ligadas", async () => {
      const preferences = await getNotificationPreferences();

      expect(preferences.pushEnabled).toBe(true);
      expect(Object.keys(preferences.kinds).sort()).toEqual(
        [...NOTIFICATION_KINDS].sort(),
      );
      expect(Object.values(preferences.kinds).every(Boolean)).toBe(true);
    });

    it("reflete preferências já salvas", async () => {
      const current = await getNotificationPreferences();
      setMockNotificationPreferences({
        pushEnabled: false,
        kinds: { ...current.kinds, EVOLUTION_PENDING: false },
      });

      const preferences = await getNotificationPreferences();

      expect(preferences.pushEnabled).toBe(false);
      expect(preferences.kinds.EVOLUTION_PENDING).toBe(false);
      expect(preferences.kinds.PLAN_REVIEW_DUE).toBe(true);
    });
  });

  describe("GET /help/tutorials", () => {
    it("vem por order crescente, com no máximo um destaque e passos quando não há vídeo (BK-4-09)", async () => {
      const tutorials = await listHelpTutorials();

      expect(tutorials.length).toBeGreaterThan(0);
      const orders = tutorials.map((tutorial) => tutorial.order);
      expect([...orders].sort((a, b) => a - b)).toEqual(orders);
      expect(tutorials.filter((tutorial) => tutorial.featured)).toHaveLength(1);
      for (const tutorial of tutorials) {
        expect(tutorial.durationSeconds).toBeGreaterThan(0);
        expect(tutorial.title.length).toBeLessThanOrEqual(80);
        expect(tutorial.description.length).toBeLessThanOrEqual(200);
        if (!tutorial.videoUrl) {
          expect(tutorial.steps?.length).toBeGreaterThan(0);
        }
      }
    });

    it("lista vazia é válida", async () => {
      setMockHelpScenario("empty");

      await expect(listHelpTutorials()).resolves.toEqual([]);
    });
  });
});
