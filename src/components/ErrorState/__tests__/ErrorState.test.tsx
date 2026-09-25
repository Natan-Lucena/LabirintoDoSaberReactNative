import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { ErrorState } from "../index";

// AC-205-01: ErrorState oferece "Tentar novamente" que chama o callback.
describe("AC-205-01 ErrorState", () => {
  it("anuncia a mensagem de erro", async () => {
    await render(<ErrorState message="Falha ao carregar" onRetry={vi.fn()} />);
    const alert = screen.getByRole("alert");
    expect(alert.props.accessibilityLiveRegion).toBe("polite");
  });

  it("chama onRetry ao tocar em Tentar novamente", async () => {
    const onRetry = vi.fn();
    await render(<ErrorState message="Falha ao carregar" onRetry={onRetry} />);
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("aceita rótulo de retry customizado", async () => {
    const onRetry = vi.fn();
    await render(
      <ErrorState
        message="Falha ao carregar"
        onRetry={onRetry}
        retryLabel="Recarregar"
      />,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Recarregar" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
