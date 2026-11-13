import type { ReactElement, ReactNode } from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
let segments: string[] = ["(tabs)"];

interface FakeTabsProps {
  tabBar: () => ReactNode;
  screenOptions: {
    header: (args: { options: { title?: string } }) => ReactNode;
  };
}

function FakeTabs({ tabBar, screenOptions }: FakeTabsProps): ReactElement {
  return (
    <>
      {screenOptions.header({ options: { title: "Início" } })}
      {tabBar()}
    </>
  );
}
FakeTabs.Screen = function FakeTabsScreen(): ReactElement | null {
  return null;
};

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush }),
  useSegments: () => segments,
  Tabs: FakeTabs,
}));

vi.mock("@/features/notifications/useNotifications", () => ({
  useUnreadNotificationCount: () => ({ data: 3 }),
}));

const { default: TabsLayout } = await import("../../../../app/(tabs)/_layout");

// NAV-01/NAV-02: casca nova (BottomNav + AppHeader) composta no layout das abas.
// Movido para fora de app/ (regra do projeto: testes nunca dentro de app/,
// o Expo Router trataria o arquivo como rota).
describe("app/(tabs)/_layout (NAV-01, NAV-02)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    segments = ["(tabs)"];
  });

  it("renders the 4 new Figma tabs in the bottom nav", async () => {
    await render(<TabsLayout />);

    expect(screen.getByLabelText("Início").props.accessibilityRole).toBe("tab");
    expect(screen.getByLabelText("Agenda").props.accessibilityRole).toBe("tab");
    expect(screen.getByLabelText("Pacientes").props.accessibilityRole).toBe(
      "tab",
    );
    expect(screen.getByLabelText("Recursos").props.accessibilityRole).toBe(
      "tab",
    );
  });

  it("shows the unread count on the bell (AC-NOT-01-01) and opens the notifications screen", async () => {
    await render(<TabsLayout />);

    await fireEvent.press(
      await screen.findByLabelText("3 notificações não lidas"),
    );

    expect(routerPush).toHaveBeenCalledWith("/notifications");
  });
});
