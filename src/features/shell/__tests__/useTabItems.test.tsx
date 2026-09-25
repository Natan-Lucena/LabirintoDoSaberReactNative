import { Text } from "react-native";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { render } from "@/test-utils/render";
import { useTabItems } from "@/features/shell/useTabItems";

const routerPush = vi.fn();
let segments: string[] = ["(tabs)"];

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush }),
  useSegments: () => segments,
}));

let captured: ReturnType<typeof useTabItems> | undefined;

function Probe() {
  captured = useTabItems();
  return <Text>probe</Text>;
}

describe("useTabItems (AC-501-01)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    segments = ["(tabs)"];
    captured = undefined;
  });

  it("returns the 5 tabs in the design order with the right labels", async () => {
    await render(<Probe />);

    expect(captured?.items.map((item) => item.key)).toEqual([
      "home",
      "activities",
      "students",
      "agenda",
      "reports",
    ]);
    expect(captured?.items.map((item) => item.label)).toEqual([
      "Início",
      "Atividades",
      "Alunos",
      "Agenda",
      "Relatórios",
    ]);
  });

  it("resolves activeKey to home when the route segment is the tabs index", async () => {
    segments = ["(tabs)"];
    await render(<Probe />);
    expect(captured?.activeKey).toBe("home");
  });

  it("resolves activeKey from the current route segment", async () => {
    segments = ["(tabs)", "activities"];
    await render(<Probe />);
    expect(captured?.activeKey).toBe("activities");
  });

  it("navigates to the matching route when a tab item is pressed", async () => {
    await render(<Probe />);

    captured?.items[1]?.onPress();

    expect(routerPush).toHaveBeenCalledWith("/activities");
  });

  it("navigates to the root route for the home tab", async () => {
    await render(<Probe />);

    captured?.items[0]?.onPress();

    expect(routerPush).toHaveBeenCalledWith("/");
  });
});
