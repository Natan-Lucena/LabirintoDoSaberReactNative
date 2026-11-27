import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";

const mocks = vi.hoisted(() => ({
  notifications: null as Record<string, unknown> | null,
  responseListener: null as ((r: unknown) => void) | null,
  openPushData: vi.fn(async () => undefined),
  wasPrompted: vi.fn(async () => false),
}));

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
const router = vi.hoisted(() => ({ push: () => undefined }));
vi.mock("expo-router", () => ({ useRouter: () => router }));
vi.mock("../openPush", () => ({ openPushData: mocks.openPushData }));
vi.mock("../registerForPush", () => ({
  getPushPermission: async () => "undetermined",
  registerForPush: vi.fn(async () => "registered"),
}));
vi.mock("../support", () => ({
  loadNotifications: () => mocks.notifications,
}));
vi.mock("../tokenStore", () => ({
  wasPrompted: mocks.wasPrompted,
  markPrompted: async () => undefined,
}));

const { usePushRegistration } = await import("../usePushRegistration");

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  );
}

describe("usePushRegistration (NOT-02)", () => {
  beforeEach(() => {
    mocks.responseListener = null;
    mocks.wasPrompted.mockClear();
    mocks.openPushData.mockClear();
    const remove = { remove: vi.fn() };
    mocks.notifications = {
      setNotificationHandler: vi.fn(),
      getLastNotificationResponseAsync: vi.fn(async () => null),
      clearLastNotificationResponseAsync: vi.fn(async () => undefined),
      addNotificationReceivedListener: vi.fn(() => remove),
      addPushTokenListener: vi.fn(() => remove),
      addNotificationResponseReceivedListener: vi.fn(
        (cb: (r: unknown) => void) => {
          mocks.responseListener = cb;
          return remove;
        },
      ),
    };
    useAuthStore.setState({ educatorId: null });
  });

  it("espera o educador ser ativado antes de decidir o diálogo", async () => {
    const { result } = await renderHook(() => usePushRegistration(), {
      wrapper,
    });
    await act(async () => {});
    expect(mocks.wasPrompted).not.toHaveBeenCalled();
    expect(result.current.promptVisible).toBe(false);

    await act(async () => {
      useAuthStore.setState({ educatorId: "edu-1" });
    });
    await waitFor(() => expect(result.current.promptVisible).toBe(true));
    expect(mocks.wasPrompted).toHaveBeenCalledTimes(1);
  });

  it("limpa a última resposta depois de abrir o toque", async () => {
    useAuthStore.setState({ educatorId: "edu-1" });
    await renderHook(() => usePushRegistration(), { wrapper });
    await waitFor(() => expect(mocks.responseListener).not.toBeNull());
    await act(async () => {
      mocks.responseListener?.({
        notification: { request: { content: { data: {} } } },
      });
    });
    const clear = mocks.notifications
      ?.clearLastNotificationResponseAsync as ReturnType<typeof vi.fn>;
    await waitFor(() => expect(clear).toHaveBeenCalled());
    expect(mocks.openPushData).toHaveBeenCalled();
  });
});
