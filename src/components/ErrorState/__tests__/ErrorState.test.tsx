import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { ErrorState } from "../index";
import * as ds from "../../ds";

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

  it("DS-06: usa DsButton (ds) como variante secondary e chama onRetry", async () => {
    const dsButtonSpy = vi.spyOn(ds, "DsButton");
    const onRetry = vi.fn();

    await render(<ErrorState message="Falha ao carregar" onRetry={onRetry} />);

    expect(dsButtonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Tentar novamente",
        variant: "secondary",
      }),
      undefined,
    );

    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(onRetry).toHaveBeenCalledTimes(1);

    dsButtonSpy.mockRestore();
  });
});
