import {
  AxiosError,
  AxiosHeaders,
  type AxiosAdapter,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  apiClient,
  setTokenProvider,
  subscribeSessionExpired,
} from "@/api/client";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        appEnvironment: "development",
        apiBaseUrl: "http://10.0.2.2:3000",
      },
    },
  },
}));

function setAdapter(handler: AxiosAdapter): void {
  apiClient.defaults.adapter = handler;
}

function createAxiosConfig(): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
}

afterEach(() => {
  setTokenProvider(() => null);
});

describe("apiClient", () => {
  it("uses the runtime API URL, an explicit timeout, and injects a token", async () => {
    let receivedConfig: AxiosRequestConfig | undefined;
    setTokenProvider(() => "jwt-token");
    setAdapter(async (config) => {
      receivedConfig = config;

      return {
        config,
        data: { ok: true },
        headers: {},
        status: 200,
        statusText: "OK",
      };
    });

    await apiClient.get("/student/");

    expect(apiClient.defaults.baseURL).toBe("http://10.0.2.2:3000");
    expect(apiClient.defaults.timeout).toBeGreaterThan(0);
    expect(receivedConfig?.headers?.Authorization).toBe("Bearer jwt-token");
  });

  it("does not add a token when the provider has none", async () => {
    let receivedConfig: AxiosRequestConfig | undefined;
    setAdapter(async (config) => {
      receivedConfig = config;

      return {
        config,
        data: {},
        headers: {},
        status: 200,
        statusText: "OK",
      };
    });

    await apiClient.post("/educator/sign-in", { email: "educator@example.com" });

    expect(receivedConfig?.headers?.Authorization).toBeUndefined();
  });

  it("emits one session-expired event for an authenticated 401", async () => {
    const onSessionExpired = vi.fn();
    const unsubscribe = subscribeSessionExpired(onSessionExpired);
    setTokenProvider(() => "expired-token");
    setAdapter(async (config) => {
      const axiosConfig = createAxiosConfig();
      throw new AxiosError("Unauthorized", undefined, config, undefined, {
        config: axiosConfig,
        data: { message: "Invalid or expired token" },
        headers: {},
        status: 401,
        statusText: "Unauthorized",
      });
    });

    await expect(apiClient.get("/student/")).rejects.toMatchObject({
      status: 401,
      code: "Invalid or expired token",
    });

    expect(onSessionExpired).toHaveBeenCalledOnce();
    unsubscribe();
  });

  it("does not emit session expiry for the exact sign-in route", async () => {
    const onSessionExpired = vi.fn();
    const unsubscribe = subscribeSessionExpired(onSessionExpired);
    setAdapter(async (config) => {
      const axiosConfig = createAxiosConfig();
      throw new AxiosError("Unauthorized", undefined, config, undefined, {
        config: axiosConfig,
        data: { message: "INVALID_CREDENTIALS" },
        headers: {},
        status: 401,
        statusText: "Unauthorized",
      });
    });

    await expect(apiClient.post("/educator/sign-in")).rejects.toMatchObject({
      status: 401,
      code: "INVALID_CREDENTIALS",
    });

    expect(onSessionExpired).not.toHaveBeenCalled();
    unsubscribe();
  });
});
