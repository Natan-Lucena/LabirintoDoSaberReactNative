import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react-native";

import { useTabItems } from "@/features/shell/useTabItems";

const routerPush = vi.fn();
let segments: string[] = ["(tabs)"];

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush }),
  useSegments: () => segments,
}));

describe("useTabItems (AC-501-01)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    segments = ["(tabs)"];
  });

  // UX2: 4 abas (Figma "Home sem agenda") — Agenda fica para depois.
  it("returns the 4 tabs in the design order with the right labels", async () => {
    const { result } = await renderHook(() => useTabItems());

    expect(result.current.items.map((item) => item.key)).toEqual([
      "home",
      "activities",
      "students",
      "reports",
    ]);
    expect(result.current.items.map((item) => item.label)).toEqual([
      "Tela Inicial",
      "Atividades",
      "Alunos",
      "Relatórios",
    ]);
  });

  it("resolves activeKey to home when the route segment is the tabs index", async () => {
    segments = ["(tabs)"];
    const { result } = await renderHook(() => useTabItems());
    expect(result.current.activeKey).toBe("home");
  });

  it("resolves activeKey from the current route segment", async () => {
    segments = ["(tabs)", "activities"];
    const { result } = await renderHook(() => useTabItems());
    expect(result.current.activeKey).toBe("activities");
  });

  it("navigates to the matching route when a tab item is pressed", async () => {
    const { result } = await renderHook(() => useTabItems());

    result.current.items[1]?.onPress();

    expect(routerPush).toHaveBeenCalledWith("/activities");
  });

  it("navigates to the root route for the home tab", async () => {
    const { result } = await renderHook(() => useTabItems());

    result.current.items[0]?.onPress();

    expect(routerPush).toHaveBeenCalledWith("/");
  });
});
