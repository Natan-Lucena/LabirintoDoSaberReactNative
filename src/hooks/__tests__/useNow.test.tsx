import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect } from "react";
import { Text } from "react-native";
import { act } from "@testing-library/react-native";
import { render, screen } from "@/test-utils/render";
import { useNow } from "@/hooks/useNow";

// useFocusEffect do expo-router exige um navegador; aqui a tela está sempre em
// foco: o efeito roda na montagem e é limpo na desmontagem (blur).
vi.mock("expo-router", () => ({
  useFocusEffect: (effect: () => void | (() => void)) => {
    useEffect(effect, [effect]);
  },
}));

function Probe() {
  const now = useNow();
  return <Text>{now.toISOString()}</Text>;
}

describe("useNow (AC-FEC-05-02)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T12:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("começa no instante atual", async () => {
    await render(<Probe />);
    expect(screen.getByText("2026-04-02T12:00:00.000Z")).toBeTruthy();
  });

  it("avança a cada minuto com a tela aberta", async () => {
    await render(<Probe />);
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("2026-04-02T12:01:00.000Z")).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("2026-04-02T12:02:00.000Z")).toBeTruthy();
  });

  it("para de atualizar depois de desmontar", async () => {
    const view = await render(<Probe />);
    await view.unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
