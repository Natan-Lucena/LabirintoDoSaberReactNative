import { Text } from "react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "@/test-utils/render";
import { useAuthStore } from "@/stores/auth";

const hideAsync = vi.fn().mockResolvedValue(undefined);
const preventAutoHideAsync = vi.fn().mockResolvedValue(undefined);

vi.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: () => preventAutoHideAsync(),
  hideAsync: () => hideAsync(),
}));

const useAppFontsMock = vi.fn();

vi.mock("@/theme/fonts", () => ({
  useAppFonts: () => useAppFontsMock(),
}));

// Importado após os mocks acima, pois BootGate chama preventAutoHideAsync no módulo.
const { BootGate } = await import("@/app-shell/BootGate");

function setStatus(status: "idle" | "authenticated" | "unauthenticated") {
  useAuthStore.setState({ status });
}

describe("BootGate (AC-502-02)", () => {
  beforeEach(() => {
    hideAsync.mockClear();
    useAppFontsMock.mockReset();
  });

  it("keeps rendering the navigator (Stack) while fonts/auth are not ready, but does not hide the splash yet", async () => {
    useAppFontsMock.mockReturnValue({ fontsLoaded: false, fontError: null });
    setStatus("idle");

    await render(
      <BootGate>
        <Text>stack</Text>
      </BootGate>,
    );

    expect(screen.getByText("stack")).toBeTruthy();
    expect(hideAsync).not.toHaveBeenCalled();
  });

  it("hides the splash once fonts and hydration finish, without unmounting the navigator", async () => {
    useAppFontsMock.mockReturnValue({ fontsLoaded: true, fontError: null });
    setStatus("unauthenticated");

    await render(
      <BootGate>
        <Text>stack</Text>
      </BootGate>,
    );

    expect(screen.getByText("stack")).toBeTruthy();
    expect(hideAsync).toHaveBeenCalledTimes(1);
  });

  it("does not block boot on a font loading failure (fallback)", async () => {
    useAppFontsMock.mockReturnValue({
      fontsLoaded: false,
      fontError: new Error("font failed"),
    });
    setStatus("authenticated");

    await render(
      <BootGate>
        <Text>stack</Text>
      </BootGate>,
    );

    expect(screen.getByText("stack")).toBeTruthy();
    expect(hideAsync).toHaveBeenCalledTimes(1);
  });
});
