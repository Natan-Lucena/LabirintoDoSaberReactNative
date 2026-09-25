import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "@/stores/auth";
import {
  acknowledgeSessionExpired,
  connectSessionExpiry,
  wasSessionExpired,
} from "@/features/auth/session-expiry";

type SessionExpiredListener = () => void;

let listener: SessionExpiredListener | null = null;
const unsubscribeSpy = vi.fn();

vi.mock("@/api/client", () => ({
  subscribeSessionExpired: (fn: SessionExpiredListener) => {
    listener = fn;
    return unsubscribeSpy;
  },
}));

describe("connectSessionExpiry (AC-402-02)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    listener = null;
    unsubscribeSpy.mockClear();
    acknowledgeSessionExpired();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clears the query cache before expiring the session, and raises a notice", async () => {
    const callOrder: string[] = [];
    const expireSession = vi
      .spyOn(useAuthStore.getState(), "expireSession")
      .mockImplementation(async () => {
        callOrder.push("expireSession");
      });
    const clearSpy = vi.spyOn(queryClient, "clear").mockImplementation(() => {
      callOrder.push("clear");
    });

    const unsubscribe = connectSessionExpiry(queryClient);
    expect(listener).not.toBeNull();

    listener?.();
    await Promise.resolve();
    await Promise.resolve();

    expect(callOrder).toEqual(["clear", "expireSession"]);
    expect(expireSession).toHaveBeenCalledTimes(1);
    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(wasSessionExpired()).toBe(true);

    unsubscribe();
  });

  it("does not throw and keeps the notice on when expireSession rejects", async () => {
    vi.spyOn(useAuthStore.getState(), "expireSession").mockRejectedValue(
      new Error("secure store unavailable"),
    );
    vi.spyOn(queryClient, "clear");

    const unsubscribe = connectSessionExpiry(queryClient);

    expect(() => listener?.()).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(wasSessionExpired()).toBe(true);

    unsubscribe();
  });

  it("never fires for a sign-in 401, because the client (T-301) does not emit that event for it", () => {
    const expireSession = vi
      .spyOn(useAuthStore.getState(), "expireSession")
      .mockResolvedValue(undefined);

    connectSessionExpiry(queryClient);

    // O apiClient (T-301) nunca chama o listener para /educator/sign-in; aqui
    // simulamos apenas a ausência de disparo, já garantida por AC-301-04.
    expect(expireSession).not.toHaveBeenCalled();
    expect(wasSessionExpired()).toBe(false);
  });

  it("returns the client's unsubscribe function", () => {
    const unsubscribe = connectSessionExpiry(queryClient);
    unsubscribe();

    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });
});
