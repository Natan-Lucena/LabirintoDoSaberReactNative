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

const { default: TabsLayout } = await import("../_layout");

// NAV-01/NAV-02: casca nova (BottomNav + AppHeader) composta no layout das abas.
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

  it("shows the header bell that opens the Notificações coming-soon screen", async () => {
    await render(<TabsLayout />);

    await fireEvent.press(screen.getByLabelText("Notificações"));

    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Notificações" },
    });
  });
});
