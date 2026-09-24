import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { ApiError, normalizeApiError } from "@/api/errors";

const axiosConfig = {
  headers: new AxiosHeaders(),
} as InternalAxiosRequestConfig;

describe("normalizeApiError", () => {
  it("preserves the HTTP status, server message, and field errors", () => {
    const error = new AxiosError("Request failed", undefined, undefined, undefined, {
      config: axiosConfig,
      data: {
        message: "Validation error",
        errors: [{ path: "email", message: "Invalid email" }],
      },
      headers: {},
      status: 400,
      statusText: "Bad Request",
    });

    const normalized = normalizeApiError(error);

    expect(normalized).toBeInstanceOf(ApiError);
    expect(normalized.status).toBe(400);
    expect(normalized.code).toBe("Validation error");
    expect(normalized.message).toBe("Validation error");
    expect(normalized.errors).toEqual([
      { path: "email", message: "Invalid email" },
    ]);
    expect(normalized.isNetworkError).toBe(false);
    expect(normalized.isTimeout).toBe(false);
  });

  it.each([
    [500, "TASK_NOT_FOUND"],
    [400, "NOT_FOUND"],
  ])("keeps %i %s distinguishable", (status, message) => {
    const error = new AxiosError("Request failed", undefined, undefined, undefined, {
      config: axiosConfig,
      data: { message },
      headers: {},
      status,
      statusText: "Error",
    });

    const normalized = normalizeApiError(error);

    expect(normalized.status).toBe(status);
    expect(normalized.code).toBe(message);
  });

  it("identifies a timeout without treating it as a network failure", () => {
    const normalized = normalizeApiError(
      new AxiosError("timeout", "ECONNABORTED"),
    );

    expect(normalized.status).toBeUndefined();
    expect(normalized.isTimeout).toBe(true);
    expect(normalized.isNetworkError).toBe(false);
  });

  it("identifies a response-less network failure without treating it as a timeout", () => {
    const normalized = normalizeApiError(
      new AxiosError("Network Error", "ERR_NETWORK"),
    );

    expect(normalized.status).toBeUndefined();
    expect(normalized.isNetworkError).toBe(true);
    expect(normalized.isTimeout).toBe(false);
  });
});
