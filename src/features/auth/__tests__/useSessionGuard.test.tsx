import { act } from "react";

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Text } from "react-native";

import { render } from "@/test-utils/render";
import { useAuthStore } from "@/stores/auth";
import { useSessionGuard } from "@/features/auth/useSessionGuard";

const routerReplace = vi.fn();
let pathname = "/";

vi.mock("expo-router", () => ({
  useRouter: () => ({ replace: routerReplace }),
  usePathname: () => pathname,
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
  });

  it("does not redirect while status is idle, regardless of the current path", async () => {
    setStatus("idle");
    pathname = "/(auth)/login";
    await render(<Probe />);
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when unauthenticated and already at the auth placeholder destination", async () => {
    setStatus("unauthenticated");
    pathname = "/";
    await render(<Probe />);
    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("redirects when unauthenticated and away from the auth placeholder destination", async () => {
    setStatus("unauthenticated");
    pathname = "/(auth)/login";
    await act(async () => {
      await render(<Probe />);
    });
    expect(routerReplace).toHaveBeenCalledTimes(1);
    expect(routerReplace).toHaveBeenCalledWith("/");
  });

  it("redirects when authenticated and away from the app placeholder destination", async () => {
    setStatus("authenticated");
    pathname = "/(auth)/login";
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
});
