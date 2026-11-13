import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  getUnreadNotificationCount,
  listNotifications,
  notificationQueryKeys,
} from "@/api/endpoints/notifications";
import { mockAdapter } from "@/mocks/adapter";
import { resetMockNotificationState } from "@/mocks/handlers/notifications";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

describe("leitura das notificações pelo apiClient (API-05, leva 3)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockNotificationState();
  });

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockNotificationState();
  });

  it("monta chaves de query estáveis", () => {
    expect(notificationQueryKeys.unreadCount()).toEqual([
      "notifications",
      "unread-count",
    ]);
    expect(notificationQueryKeys.list()).toEqual(["notifications", "list", {}]);
    expect(notificationQueryKeys.list({ unreadOnly: true })).not.toEqual(
      notificationQueryKeys.list(),
    );
  });

  it("lista as notificações, a mais recente primeiro, com os quatro tipos", async () => {
    const page = await listNotifications();

    expect(page.items.length).toBe(5);
    expect(page.nextCursor).toBeUndefined();
    const dates = page.items.map((n) => n.createdAt);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(new Set(page.items.map((n) => n.kind))).toEqual(
      new Set([
        "APPOINTMENTS_TODAY",
        "EVOLUTION_PENDING",
        "PLAN_REVIEW_DUE",
        "SCALE_DRAFT_STALE",
      ]),
    );
  });

  it("pagina por cursor e filtra as não lidas", async () => {
    const first = await listNotifications({ limit: 2 });
    expect(first.items).toHaveLength(2);
    expect(first.nextCursor).toBe("2");

    const second = await listNotifications({ limit: 2, cursor: "2" });
    expect(second.items.map((n) => n.id)).not.toContain(first.items[0].id);

    const unread = await listNotifications({ unreadOnly: true });
    expect(unread.items.every((n) => !n.readAt)).toBe(true);
    expect(unread.items).toHaveLength(4);
  });

  it("rejeita limite e cursor inválidos com 400", async () => {
    await expect(listNotifications({ limit: 51 })).rejects.toMatchObject({
      status: 400,
    });
    await expect(listNotifications({ cursor: "abc" })).rejects.toMatchObject({
      status: 400,
    });
  });

  it("conta as não lidas", async () => {
    expect(await getUnreadNotificationCount()).toBe(4);
  });
});
