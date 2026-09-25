import { describe, expect, it } from "vitest";

import { getApiBaseUrl, getUseMocks } from "@/config/env";

describe("getApiBaseUrl", () => {
  it("accepts an HTTP backend URL in development", () => {
    expect(
      getApiBaseUrl({
        environment: "development",
        apiBaseUrl: "http://10.0.2.2:3000",
      }),
    ).toBe("http://10.0.2.2:3000");
  });

  it.each([undefined, "", "not-a-url", "ftp://api.example.com"])(
    "rejects a missing or invalid API URL: %s",
    (apiBaseUrl) => {
      expect(() =>
        getApiBaseUrl({ environment: "development", apiBaseUrl }),
      ).toThrow(/API base URL/i);
    },
  );

  it.each(["homologation", "production"] as const)(
    "rejects HTTP in %s",
    (environment) => {
      expect(() =>
        getApiBaseUrl({
          environment,
          apiBaseUrl: "http://api.example.com",
        }),
      ).toThrow(/HTTPS/i);
    },
  );

  it.each(["homologation", "production"] as const)(
    "accepts HTTPS in %s",
    (environment) => {
      expect(
        getApiBaseUrl({
          environment,
          apiBaseUrl: "https://api.example.com",
        }),
      ).toBe("https://api.example.com");
    },
  );
});

describe("getUseMocks", () => {
  it("defaults to true in development when unset", () => {
    expect(getUseMocks({ environment: "development" })).toBe(true);
  });

  it.each(["homologation", "production"] as const)(
    "defaults to false in %s when unset",
    (environment) => {
      expect(getUseMocks({ environment })).toBe(false);
    },
  );

  it("honors an explicit true/false value outside production", () => {
    expect(
      getUseMocks({ environment: "development", useMocksRaw: "false" }),
    ).toBe(false);
    expect(
      getUseMocks({ environment: "homologation", useMocksRaw: "true" }),
    ).toBe(true);
    expect(
      getUseMocks({ environment: "homologation", useMocksRaw: "TRUE" }),
    ).toBe(true);
  });

  it("rejects an invalid value", () => {
    expect(() =>
      getUseMocks({ environment: "development", useMocksRaw: "maybe" }),
    ).toThrow(/EXPO_PUBLIC_USE_MOCKS/i);
  });

  it("rejects an explicit true in production", () => {
    expect(() =>
      getUseMocks({ environment: "production", useMocksRaw: "true" }),
    ).toThrow(/not allowed in production/i);
  });
});
