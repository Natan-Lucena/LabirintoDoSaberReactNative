import { describe, expect, it } from "vitest";

import { getApiBaseUrl } from "@/config/env";

describe("getApiBaseUrl", () => {
  it("accepts an HTTP backend URL in development", () => {
    expect(
      getApiBaseUrl({
        environment: "development",
        apiBaseUrl: "http://10.0.2.2:3000",
      }),
    ).toBe("http://10.0.2.2:3000");
  });

  it.each([undefined, "", "not-a-url", "ftp://api.example.com"]) (
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
