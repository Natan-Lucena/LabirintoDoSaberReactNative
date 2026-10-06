import { act } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { Toast } from "../Toast";

// AC-DS-05-02: o `Toast` some em 2,2 s e é anunciado ao leitor de tela.
describe("AC-DS-05 Toast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("anuncia a mensagem ao aparecer", async () => {
    const announce = vi
      .spyOn(AccessibilityInfo, "announceForAccessibility")
      .mockImplementation(() => {});

    await render(<Toast message="Salvo com sucesso" onHide={vi.fn()} />);

    expect(announce).toHaveBeenCalledWith("Salvo com sucesso");
  });

  it("chama onHide sozinho após 2,2 s", async () => {
    const onHide = vi.fn();
    await render(<Toast message="Salvo com sucesso" onHide={onHide} />);

    expect(onHide).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(2200);
    });

    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("não renderiza nada sem mensagem", async () => {
    await render(<Toast message={null} onHide={vi.fn()} />);
    expect(screen.queryByText("Salvo com sucesso")).toBeNull();
  });
});
