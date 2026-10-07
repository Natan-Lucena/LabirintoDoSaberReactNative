import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { BottomNav, type BottomNavItem } from "../BottomNav";

const items: BottomNavItem[] = [
  { key: "home", label: "Início", icon: "home", onPress: vi.fn() },
  { key: "agenda", label: "Agenda", icon: "calendar", onPress: vi.fn() },
  { key: "patients", label: "Pacientes", icon: "users", onPress: vi.fn() },
  { key: "resources", label: "Recursos", icon: "grid", onPress: vi.fn() },
];

// AC-NAV-01-01: as 4 abas navegam com os ícones home, calendar, users e grid.
describe("BottomNav (NAV-01)", () => {
  it("renders the 4 Figma tabs with accessible tab role and labels", async () => {
    await render(<BottomNav items={items} activeKey="home" />);

    for (const item of items) {
      expect(screen.getByLabelText(item.label).props.accessibilityRole).toBe(
        "tab",
      );
    }
  });

  it("marks the active tab as selected and the others as not selected", async () => {
    await render(<BottomNav items={items} activeKey="patients" />);

    expect(
      screen.getByLabelText("Pacientes").props.accessibilityState?.selected,
    ).toBe(true);
    expect(
      screen.getByLabelText("Início").props.accessibilityState?.selected,
    ).toBe(false);
  });

  it("fires onPress of the tapped tab", async () => {
    await render(<BottomNav items={items} activeKey="home" />);
    await fireEvent.press(screen.getByLabelText("Agenda"));
    expect(items[1].onPress).toHaveBeenCalledTimes(1);
  });

  it("keeps labels to a single line (avoids clipping on Android)", async () => {
    await render(<BottomNav items={items} activeKey="home" />);
    expect(screen.getByText("Pacientes").props.numberOfLines).toBe(1);
  });
});
