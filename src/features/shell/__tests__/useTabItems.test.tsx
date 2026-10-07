import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react-native";

import { useTabItems } from "@/features/shell/useTabItems";

const routerPush = vi.fn();
let segments: string[] = ["(tabs)"];

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush }),
  useSegments: () => segments,
}));

// NAV-01: 4 abas do Figma Make — Início, Agenda, Pacientes, Recursos.
describe("useTabItems (AC-NAV-01-01/02)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    segments = ["(tabs)"];
  });

  it("returns the 4 tabs in the Figma order with the right labels and icons", async () => {
    const { result } = await renderHook(() => useTabItems());

    expect(result.current.items.map((item) => item.key)).toEqual([
      "home",
      "agenda",
      "patients",
      "resources",
    ]);
    expect(result.current.items.map((item) => item.label)).toEqual([
      "Início",
      "Agenda",
      "Pacientes",
      "Recursos",
    ]);
    expect(result.current.items.map((item) => item.icon)).toEqual([
      "home",
      "calendar",
      "users",
      "grid",
    ]);
  });

  it("resolves activeKey to home when the route segment is the tabs index", async () => {
    segments = ["(tabs)"];
    const { result } = await renderHook(() => useTabItems());
    expect(result.current.activeKey).toBe("home");
  });

  it("resolves activeKey from the current tab route segment", async () => {
    segments = ["(tabs)", "agenda"];
    const { result } = await renderHook(() => useTabItems());
    expect(result.current.activeKey).toBe("agenda");
  });

  it("navigates to the matching route when a tab item is pressed", async () => {
    const { result } = await renderHook(() => useTabItems());

    result.current.items[1]?.onPress();

    expect(routerPush).toHaveBeenCalledWith("/agenda");
  });

  it("navigates to the root route for the home tab", async () => {
    const { result } = await renderHook(() => useTabItems());

    result.current.items[0]?.onPress();

    expect(routerPush).toHaveBeenCalledWith("/");
  });

  // AC-NAV-01-02: /patients/[id] e /students/* mantêm a aba Pacientes ativa.
  it.each([
    ["students", "new"],
    ["students", "[id]"],
    ["patients", "[id]"],
  ])("maps /%s/%s to the patients tab", async (first, second) => {
    segments = [first, second];
    const { result } = await renderHook(() => useTabItems());
    expect(result.current.activeKey).toBe("patients");
  });

  // AC-NAV-01-02: /session/* mantém a aba Agenda ativa.
  it.each([
    ["session", "student"],
    ["session", "content"],
  ])("maps /%s/%s to the agenda tab", async (first, second) => {
    segments = [first, second];
    const { result } = await renderHook(() => useTabItems());
    expect(result.current.activeKey).toBe("agenda");
  });

  // AC-NAV-01-02: /plans (Recursos) — em /plans a aba Recursos fica ativa.
  it.each([
    ["(tabs)", "activities"],
    ["(tabs)", "reports"],
    ["content", "group"],
    ["plans", undefined],
  ])("maps /%s/%s to the resources tab", async (first, second) => {
    segments = second === undefined ? [first] : [first, second];
    const { result } = await renderHook(() => useTabItems());
    expect(result.current.activeKey).toBe("resources");
  });
});
