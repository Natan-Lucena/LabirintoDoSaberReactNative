import { AxiosHeaders, isAxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it } from "vitest";

import "@/mocks/handlers/educator";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_EDUCATOR,
  MOCK_NETWORK_ERROR_EMAIL,
  MOCK_TOKEN,
  MOCK_VALID_CREDENTIALS,
} from "@/mocks/fixtures";
import { clearMockSession } from "@/mocks/mock-auth-state";

function buildConfig(
  overrides: Partial<InternalAxiosRequestConfig>,
): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
    baseURL: "http://mock.local",
    ...overrides,
  } as InternalAxiosRequestConfig;
}

describe("mockAdapter (AC-401-02, AC-401-03, AC-401-04)", () => {
  beforeEach(() => {
    clearMockSession();
  });

  it("resolves sign-in with a fake token for valid credentials", async () => {
    const response = await mockAdapter(
      buildConfig({
        method: "post",
        url: "/educator/sign-in",
        data: MOCK_VALID_CREDENTIALS,
      }),
    );

    expect(response.status).toBe(200);
    expect(response.data).toEqual({ token: MOCK_TOKEN });
  });

  it("rejects sign-in with 401 INVALID_CREDENTIALS for an unknown email", async () => {
    await expect(
      mockAdapter(
        buildConfig({
          method: "post",
          url: "/educator/sign-in",
          data: { email: "outro@example.com", password: "x" },
        }),
      ),
    ).rejects.toSatisfy((error: unknown) => {
      return isAxiosError(error) && error.response?.status === 401;
    });
  });

  it("rejects sign-in with a network error (no response) for the reserved email", async () => {
    await expect(
      mockAdapter(
        buildConfig({
          method: "post",
          url: "/educator/sign-in",
          data: { email: MOCK_NETWORK_ERROR_EMAIL, password: "x" },
        }),
      ),
    ).rejects.toSatisfy((error: unknown) => {
      return isAxiosError(error) && error.response === undefined;
    });
  });

  it("returns the mock educator for GET /educator/me after a mocked sign-in", async () => {
    await mockAdapter(
      buildConfig({
        method: "post",
        url: "/educator/sign-in",
        data: MOCK_VALID_CREDENTIALS,
      }),
    );

    const response = await mockAdapter(
      buildConfig({ method: "get", url: "/educator/me" }),
    );

    expect(response.data).toEqual(MOCK_EDUCATOR);
  });

  it("rejects GET /educator/me with 401 without a prior mocked sign-in", async () => {
    await expect(
      mockAdapter(buildConfig({ method: "get", url: "/educator/me" })),
    ).rejects.toSatisfy((error: unknown) => {
      return isAxiosError(error) && error.response?.status === 401;
    });
  });

  it("rejects an unregistered route with 404 MOCK_ROUTE_NOT_FOUND", async () => {
    await expect(
      mockAdapter(buildConfig({ method: "get", url: "/unknown/route" })),
    ).rejects.toSatisfy((error: unknown) => {
      return isAxiosError(error) && error.response?.status === 404;
    });
  });
});
