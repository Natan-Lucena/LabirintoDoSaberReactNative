import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/install";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { openNotificationTarget } = await import("../openTarget");
const { openPushData } = await import("../push/openPush");
const { createQueryClient } = await import("@/api/query-client");
const originalAdapter = apiClient.defaults.adapter;

describe("openNotificationTarget (AC-NOT-02-03)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it("dá o mesmo destino para cada tipo", async () => {
    const push = vi.fn();
    await openNotificationTarget(
      { push },
      { type: "AGENDA_DAY", id: "2026-11-12" },
    );
    await openNotificationTarget({ push }, { type: "PLAN", id: "mock-plan-1" });
    expect(push).toHaveBeenNthCalledWith(1, "/(tabs)/agenda");
    expect(push).toHaveBeenNthCalledWith(2, {
      pathname: "/plans/[id]",
      params: { id: "mock-plan-1" },
    });
  });

  it("push sem target abre a lista; com target usa a mesma regra", async () => {
    const push = vi.fn();
    const client = createQueryClient();
    await openPushData({ push }, client, { notificationIds: ["a", "b"] });
    expect(push).toHaveBeenLastCalledWith("/notifications");

    await openPushData({ push }, client, {
      notificationIds: ["mock-notification-3"],
      target: { type: "PLAN", id: "mock-plan-1" },
    });
    expect(push).toHaveBeenLastCalledWith({
      pathname: "/plans/[id]",
      params: { id: "mock-plan-1" },
    });
  });

  it("destino indisponível cai na lista", async () => {
    const push = vi.fn();
    await openPushData({ push }, createQueryClient(), {
      notificationIds: [],
      target: { type: "SCALE_APPLICATION", id: "nao-existe" },
    });
    expect(push).toHaveBeenLastCalledWith("/notifications");
  });
});
