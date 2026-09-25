import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { EmptyState } from "../index";

describe("EmptyState", () => {
  it("renderiza título e mensagem", async () => {
    await render(
      <EmptyState title="Nada por aqui" message="Sem agendamentos" />,
    );
    expect(screen.getByRole("header")).toBeTruthy();
    expect(screen.getByText("Sem agendamentos")).toBeTruthy();
  });

  it("não renderiza ação quando não fornecida", async () => {
    await render(<EmptyState title="Nada por aqui" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("chama onActionPress ao tocar na ação", async () => {
    const onActionPress = vi.fn();
    await render(
      <EmptyState
        title="Nada por aqui"
        actionLabel="Criar agendamento"
        onActionPress={onActionPress}
      />,
    );
    await fireEvent.press(screen.getByRole("button"));
    expect(onActionPress).toHaveBeenCalledTimes(1);
  });
});
