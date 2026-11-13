import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import { resetMockNotificationState } from "@/mocks/handlers/notifications";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush, back: vi.fn() }),
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { NotificationsScreen } = await import("../NotificationsScreen");
const { createQueryClient } = await import("@/api/query-client");
const originalAdapter = apiClient.defaults.adapter;

describe("NotificationsScreen (NOT-01)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    resetMockNotificationState();
    routerPush.mockClear();
  });
  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
    resetMockNotificationState();
  });

  it("lê e abre o destino ao tocar (AC-NOT-01-02)", async () => {
    const queryClient = createQueryClient();
    await render(<NotificationsScreen />, { queryClient });

    await fireEvent.press(await screen.findByText("Revisão de plano"));

    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/plans/[id]",
      params: { id: "mock-plan-1" },
    });
    await vi.waitFor(async () => {
      const count = await apiClient.get("/notification/unread-count");
      expect(count.data.count).toBe(3);
    });
  });

  it("marca todas como lidas e zera o contador (AC-NOT-01-03)", async () => {
    const queryClient = createQueryClient();
    await render(<NotificationsScreen />, { queryClient });

    await fireEvent.press(await screen.findByText("Marcar todas como lidas"));

    await vi.waitFor(async () => {
      const count = await apiClient.get("/notification/unread-count");
      expect(count.data.count).toBe(0);
    });
  });
});
