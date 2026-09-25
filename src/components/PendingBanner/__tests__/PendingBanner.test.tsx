import { AccessibilityInfo } from "react-native";
import { describe, expect, it, vi } from "vitest";

import { render, screen, waitFor } from "../../../test-utils/render";
import { PendingBanner } from "../index";

// AC-205-02: PendingBanner é anunciado ao aparecer.
describe("AC-205-02 PendingBanner", () => {
  it("expõe papel alert", async () => {
    await render(
      <PendingBanner message="Sem conexão — mostrando dados salvos" />,
    );
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("anuncia a mensagem uma única vez ao aparecer", async () => {
    const announce = vi.spyOn(AccessibilityInfo, "announceForAccessibility");
    await render(<PendingBanner message="Envio pendente" />);
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith("Envio pendente");
  });

  it("anuncia novamente quando a mensagem muda", async () => {
    const announce = vi.spyOn(AccessibilityInfo, "announceForAccessibility");
    const { rerender } = await render(
      <PendingBanner message="Envio pendente" />,
    );
    rerender(<PendingBanner message="Sem conexão" />);
    await waitFor(() => {
      expect(announce).toHaveBeenCalledTimes(2);
    });
    expect(announce).toHaveBeenLastCalledWith("Sem conexão");
  });
});
