import { afterEach, describe, expect, it, vi } from "vitest";

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

describe("installApiMocks (G-29)", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("installs the mock adapter when EXPO_PUBLIC_USE_MOCKS defaults to true in development", async () => {
    const { apiClient } = await import("@/api/client");
    const { installApiMocks } = await import("@/mocks/install");
    const { mockAdapter } = await import("@/mocks/adapter");

    apiClient.defaults.adapter = undefined;
    installApiMocks();

    expect(apiClient.defaults.adapter).toBe(mockAdapter);
  });

  it("does not install the adapter when the flag is false", async () => {
    vi.doMock("expo-constants", () => ({
      default: {
        expoConfig: {
          extra: {
            appEnvironment: "development",
            apiBaseUrl: "http://10.0.2.2:3000",
            useMocks: "false",
          },
        },
      },
    }));

    const { apiClient } = await import("@/api/client");
    const { installApiMocks } = await import("@/mocks/install");

    apiClient.defaults.adapter = undefined;
    installApiMocks();

    expect(apiClient.defaults.adapter).toBeUndefined();
  });
});
