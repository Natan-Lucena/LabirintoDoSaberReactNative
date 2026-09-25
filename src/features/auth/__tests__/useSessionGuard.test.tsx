import { act } from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Text } from "react-native";

import { render } from "@/test-utils/render";
import { useAuthStore } from "@/stores/auth";
import { useSessionGuard } from "@/features/auth/useSessionGuard";

const routerReplace = vi.fn();
let pathname = "/";
let segments: string[] = ["(tabs)"];
let navigationKey: string | undefined = "root";

vi.mock("expo-router", () => ({
  useRouter: () => ({ replace: routerReplace }),
  usePathname: () => pathname,
  useSegments: () => segments,
  useRootNavigationState: () => ({ key: navigationKey }),
}));

function Probe() {
  useSessionGuard();
  return <Text>probe</Text>;
}

function setStatus(status: "idle" | "authenticated" | "unauthenticated") {
  useAuthStore.setState({ status });
}

describe("useSessionGuard (AC-402-01)", () => {
  beforeEach(() => {
    routerReplace.mockClear();
    navigationKey = "root";
    segments = ["(tabs)"];
  });

  it("does not redirect while status is idle, regardless of the current path", async () => {
    setStatus("idle");
    pathname = "/(auth)/login";
    await render(<Probe />);
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when unauthenticated and already at the auth destination", async () => {
    setStatus("unauthenticated");
    pathname = "/(auth)/login";
    segments = ["(auth)", "login"];
    await render(<Probe />);
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("redirects when unauthenticated and away from the auth destination", async () => {
    setStatus("unauthenticated");
    pathname = "/";
    await act(async () => {
      await render(<Probe />);
    });
    expect(routerReplace).toHaveBeenCalledTimes(1);
    expect(routerReplace).toHaveBeenCalledWith("/(auth)/login");
  });

  it("redirects when authenticated and away from the app placeholder destination", async () => {
    setStatus("authenticated");
    pathname = "/(auth)/login";
    segments = ["(auth)", "login"];
    await act(async () => {
      await render(<Probe />);
    });
    expect(routerReplace).toHaveBeenCalledTimes(1);
    expect(routerReplace).toHaveBeenCalledWith("/");
  });

  it("does not redirect when authenticated and already at the app placeholder destination", async () => {
    setStatus("authenticated");
    pathname = "/";
    await render(<Probe />);
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it.each([
    ["/session/student", ["session", "student"]],
    ["/appointments", ["(tabs)", "appointments"]],
    ["/shell/coming-soon", ["shell", "coming-soon"]],
  ])(
    "does not redirect an authenticated user within %s",
    async (currentPath, currentSegments) => {
      setStatus("authenticated");
      pathname = currentPath;
      segments = currentSegments;

      await render(<Probe />);

      expect(routerReplace).not.toHaveBeenCalled();
    },
  );

  it("redirects an authenticated user from the auth group to the app destination", async () => {
    setStatus("authenticated");
    pathname = "/(auth)/login";
    segments = ["(auth)", "login"];

    await act(async () => {
      await render(<Probe />);
    });

    expect(routerReplace).toHaveBeenCalledWith("/");
  });

  it.each([
    ["/", ["(tabs)"]],
    ["/session/student", ["session", "student"]],
  ])(
    "redirects an unauthenticated user from %s to login",
    async (currentPath, currentSegments) => {
      setStatus("unauthenticated");
      pathname = currentPath;
      segments = currentSegments;

      await act(async () => {
        await render(<Probe />);
      });

      expect(routerReplace).toHaveBeenCalledWith("/(auth)/login");
    },
  );

  it("does not redirect an unauthenticated user already in the auth group", async () => {
    setStatus("unauthenticated");
    pathname = "/(auth)/forgot-password";
    segments = ["(auth)", "forgot-password"];

    await render(<Probe />);

    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("does not redirect while the root navigator has not finished mounting (T-502)", async () => {
    setStatus("unauthenticated");
    pathname = "/(auth)/login";
    segments = ["(auth)", "login"];
    navigationKey = undefined;
    await act(async () => {
      await render(<Probe />);
    });
    expect(routerReplace).not.toHaveBeenCalled();
  });
});
