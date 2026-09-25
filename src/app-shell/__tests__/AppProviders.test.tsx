import { act } from "react";
import { Text } from "react-native";
import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test-utils/render";
import { useAuthStore } from "@/stores/auth";

const setTokenProvider = vi.fn();

vi.mock("@/api/client", () => ({
  setTokenProvider: (...args: unknown[]) => setTokenProvider(...args),
  subscribeSessionExpired: () => () => undefined,
}));

const connectStorageToAuth = vi.fn(() => vi.fn());

vi.mock("@/storage/mmkv", () => ({
  connectStorageToAuth: () => connectStorageToAuth(),
}));

const connectSessionExpiry = vi.fn((_client: QueryClient) => vi.fn());

vi.mock("@/features/auth/session-expiry", () => ({
  connectSessionExpiry: (client: QueryClient) => connectSessionExpiry(client),
}));

const { AppProviders } = await import("@/app-shell/AppProviders");

describe("AppProviders (AC-502-01, AC-502-03, wiring único)", () => {
  beforeEach(() => {
    setTokenProvider.mockClear();
    connectStorageToAuth.mockClear();
    connectSessionExpiry.mockClear();
    useAuthStore.setState({
      status: "idle",
      token: null,
      educatorId: null,
      hydrate: vi.fn().mockResolvedValue(undefined),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("wires the token provider, storage listener and hydration exactly once on mount", async () => {
    const hydrate = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ hydrate });

    await render(
      <AppProviders>
        <Text>app</Text>
      </AppProviders>,
    );

    expect(setTokenProvider).toHaveBeenCalledTimes(1);
    expect(connectStorageToAuth).toHaveBeenCalledTimes(1);
    expect(connectSessionExpiry).toHaveBeenCalledTimes(1);
    expect(connectSessionExpiry.mock.calls[0][0]).toBeInstanceOf(QueryClient);
    expect(hydrate).toHaveBeenCalledTimes(1);
    expect(screen.getByText("app")).toBeTruthy();
  });

  it("undoes the storage and session-expiry subscriptions on unmount", async () => {
    const unsubscribeStorage = vi.fn();
    const unsubscribeSessionExpiry = vi.fn();
    connectStorageToAuth.mockReturnValue(unsubscribeStorage);
    connectSessionExpiry.mockReturnValue(unsubscribeSessionExpiry);

    const { unmount } = await render(
      <AppProviders>
        <Text>app</Text>
      </AppProviders>,
    );

    act(() => {
      unmount();
    });

    expect(unsubscribeStorage).toHaveBeenCalledTimes(1);
    expect(unsubscribeSessionExpiry).toHaveBeenCalledTimes(1);
  });
});
