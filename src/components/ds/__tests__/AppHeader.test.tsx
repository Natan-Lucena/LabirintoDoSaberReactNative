import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { AppHeader } from "../AppHeader";

// AC-NAV-02-01/02: voltar com rótulo "Voltar" e router.back(); sino com
// rótulo "Notificações".
describe("AppHeader (NAV-02)", () => {
  it("renders title and eyebrow as accessible header", async () => {
    await render(
      <AppHeader title="Início" subtitle="Terça-feira, 6 de outubro" />,
    );

    const header = screen.getByRole("header");
    expect(header.props.children).toBe("Início");
    expect(screen.getByText("Terça-feira, 6 de outubro")).toBeTruthy();
  });

  it("shows the bell button on tab screens and fires onBellPress", async () => {
    const onBellPress = vi.fn();
    await render(<AppHeader title="Início" onBellPress={onBellPress} />);

    const bell = screen.getByLabelText("Notificações");
    expect(bell.props.accessibilityRole).toBe("button");
    await fireEvent.press(bell);
    expect(onBellPress).toHaveBeenCalledTimes(1);
  });

  it("does not show the bell when there is no onBellPress", async () => {
    await render(<AppHeader title="Início" />);
    expect(screen.queryByLabelText("Notificações")).toBeNull();
  });

  it("shows the back button on internal screens and fires onBack", async () => {
    const onBack = vi.fn();
    await render(<AppHeader title="Ficha do paciente" onBack={onBack} />);

    const back = screen.getByLabelText("Voltar");
    expect(back.props.accessibilityRole).toBe("button");
    await fireEvent.press(back);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("does not show the bell on internal screens (back present)", async () => {
    await render(
      <AppHeader
        title="Ficha do paciente"
        onBack={vi.fn()}
        onBellPress={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Notificações")).toBeNull();
  });
});
