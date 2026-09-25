import { Text } from "react-native";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { render, screen } from "@/test-utils/render";
import { useAuthStore } from "@/stores/auth";

const routerReplace = vi.fn();
let pathname = "/(auth)/login";
let navigationKey: string | undefined = "root";
let fontsLoaded = true;

vi.mock("expo-router", () => ({
  useRouter: () => ({ replace: routerReplace }),
  usePathname: () => pathname,
  useRootNavigationState: () => ({ key: navigationKey }),
  // Marca o Stack real (T-502: navegador sempre montado, BootGate só controla o splash).
  Stack: () => <Text>stack</Text>,
}));

vi.mock("@/theme/fonts", () => ({
  useAppFonts: () => ({ fontsLoaded, fontError: null }),
}));

vi.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: () => Promise.resolve(),
  hideAsync: () => Promise.resolve(),
}));

vi.mock("@/api/client", () => ({
  setTokenProvider: () => undefined,
  subscribeSessionExpired: () => () => undefined,
}));

vi.mock("@/storage/mmkv", () => ({
  connectStorageToAuth: () => () => undefined,
}));

// T-401: installApiMocks lê a config de ambiente real (fora do escopo deste
// teste de composição do root); mockado para um no-op, como os demais acima.
vi.mock("@/mocks/install", () => ({ installApiMocks: vi.fn() }));

const { default: RootLayout } = await import("../../../app/_layout");

describe("app/_layout root composition (AC-502-01, ajuste do navegador sempre montado)", () => {
  beforeEach(() => {
    routerReplace.mockClear();
    pathname = "/(auth)/login";
    navigationKey = "root";
    fontsLoaded = true;
    useAuthStore.setState({
      status: "idle",
      token: null,
      educatorId: null,
      hydrate: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("does not redirect when unauthenticated and already at the auth destination", async () => {
    useAuthStore.setState({ status: "unauthenticated" });

    await render(<RootLayout />);

    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("redirects to the app destination when authenticated", async () => {
    useAuthStore.setState({ status: "authenticated" });

    await render(<RootLayout />);

    expect(routerReplace).toHaveBeenCalledWith("/");
  });

  it("does not navigate while auth status is idle", async () => {
    useAuthStore.setState({ status: "idle" });

    await render(<RootLayout />);

    expect(routerReplace).not.toHaveBeenCalled();
  });

  it("keeps the navigator (Stack) mounted even while fonts are still loading", async () => {
    fontsLoaded = false;
    useAuthStore.setState({ status: "unauthenticated" });

    await render(<RootLayout />);

    expect(screen.getByText("stack")).toBeTruthy();
  });

  it("does not navigate before the root navigator finishes mounting, then navigates once it does", async () => {
    navigationKey = undefined;
    pathname = "/";
    useAuthStore.setState({ status: "unauthenticated" });

    const { rerender } = await render(<RootLayout />);
    expect(routerReplace).not.toHaveBeenCalled();

    navigationKey = "root";
    await rerender(<RootLayout />);

    expect(routerReplace).toHaveBeenCalledTimes(1);
    expect(routerReplace).toHaveBeenCalledWith("/(auth)/login");
  });
});
