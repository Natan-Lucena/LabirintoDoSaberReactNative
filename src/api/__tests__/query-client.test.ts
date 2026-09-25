import { afterEach, describe, expect, it, vi } from "vitest";
import { onlineManager, QueryClient } from "@tanstack/react-query";

import { ApiError } from "@/api/errors";
import {
  createQueryClient,
  OfflineError,
  withOfflineGuard,
} from "@/api/query-client";

function readQueryRetry(client: QueryClient) {
  const retry = client.getDefaultOptions().queries?.retry;
  if (typeof retry !== "function") {
    throw new Error("expected queries.retry to be a function");
  }
  return retry as (failureCount: number, error: unknown) => boolean;
}

describe("createQueryClient", () => {
  it("returns a QueryClient instance", () => {
    expect(createQueryClient()).toBeInstanceOf(QueryClient);
  });

  it("AC-304-01: does not retry 4xx errors on reads", () => {
    const client = createQueryClient();
    const retry = readQueryRetry(client);
    const error = new ApiError({ message: "bad request", status: 400 });
    expect(retry(0, error)).toBe(false);
    expect(retry(1, error)).toBe(false);
  });

  it("AC-304-01: does not retry 499 (upper 4xx bound)", () => {
    const client = createQueryClient();
    const retry = readQueryRetry(client);
    const error = new ApiError({ message: "client error", status: 499 });
    expect(retry(0, error)).toBe(false);
  });

  it("AC-304-01: retries network errors on reads up to a limit", () => {
    const client = createQueryClient();
    const retry = readQueryRetry(client);
    const error = new ApiError({ message: "network", isNetworkError: true });
    expect(retry(0, error)).toBe(true);
    expect(retry(1, error)).toBe(true);
    expect(retry(2, error)).toBe(false);
  });

  it("AC-304-01: retries timeout errors on reads up to a limit", () => {
    const client = createQueryClient();
    const retry = readQueryRetry(client);
    const error = new ApiError({ message: "timeout", isTimeout: true });
    expect(retry(0, error)).toBe(true);
    expect(retry(2, error)).toBe(false);
  });

  it("AC-304-01: retries 5xx errors on reads up to a limit", () => {
    const client = createQueryClient();
    const retry = readQueryRetry(client);
    const error = new ApiError({ message: "server error", status: 500 });
    expect(retry(0, error)).toBe(true);
    expect(retry(2, error)).toBe(false);
  });

  it("AC-304-02: never retries mutations", () => {
    const client = createQueryClient();
    const retry = client.getDefaultOptions().mutations?.retry;
    expect(retry).toBe(false);
  });

  it("uses online network mode for queries (pause fetch while offline, keep cache)", () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().queries?.networkMode).toBe("online");
  });

  it("uses always network mode for mutations (no auto-pause/resume)", () => {
    const client = createQueryClient();
    expect(client.getDefaultOptions().mutations?.networkMode).toBe("always");
  });
});

describe("withOfflineGuard", () => {
  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it("rejects with OfflineError without calling the wrapped mutationFn when offline", async () => {
    onlineManager.setOnline(false);
    const inner = vi.fn(async () => "ok");
    const guarded = withOfflineGuard(inner);

    await expect(guarded(undefined)).rejects.toBeInstanceOf(OfflineError);
    expect(inner).not.toHaveBeenCalled();
  });

  it("calls the wrapped mutationFn when online", async () => {
    onlineManager.setOnline(true);
    const inner = vi.fn(async () => "ok");
    const guarded = withOfflineGuard(inner);

    await expect(guarded(undefined)).resolves.toBe("ok");
    expect(inner).toHaveBeenCalledTimes(1);
  });

  it("does not auto-invoke the mutationFn just because connectivity returns", async () => {
    onlineManager.setOnline(false);
    const inner = vi.fn(async () => "ok");
    const guarded = withOfflineGuard(inner);

    await expect(guarded(undefined)).rejects.toBeInstanceOf(OfflineError);
    onlineManager.setOnline(true);
    expect(inner).not.toHaveBeenCalled();
  });
});
