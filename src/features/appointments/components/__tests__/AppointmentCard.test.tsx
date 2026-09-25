import { describe, expect, it, vi } from "vitest";
import { StyleSheet } from "react-native";

import { fireEvent, render, screen } from "../../../../test-utils/render";
import { color } from "../../../../theme";
import { AppointmentCard } from "../AppointmentCard";

// AC-902-02: horário, status em texto, aluno, observação e callbacks de ação.
describe("AC-902-02 AppointmentCard", () => {
  function renderCard(
    overrides: Partial<Parameters<typeof AppointmentCard>[0]> = {},
  ) {
    const handlers = {
      onEdit: vi.fn(),
      onReschedule: vi.fn(),
      onDelete: vi.fn(),
      onPlan: vi.fn(),
    };
    return {
      handlers,
      renderResult: render(
        <AppointmentCard
          time="09:00"
          status="PENDING"
          studentName="Maria Silva"
          observation="Trouxe o material"
          {...handlers}
          {...overrides}
        />,
      ),
    };
  }

  it("mostra horário, aluno e observação", async () => {
    const { renderResult } = renderCard();
    await renderResult;
    expect(screen.getByText("09:00")).toBeTruthy();
    expect(screen.getByText("Maria Silva")).toBeTruthy();
    expect(screen.getByText("Trouxe o material")).toBeTruthy();
  });

  it("omite a linha de observação quando ausente", async () => {
    const { renderResult } = renderCard({ observation: undefined });
    await renderResult;
    expect(screen.queryByText("Trouxe o material")).toBeNull();
  });

  it.each([
    ["PENDING", "Agendada"],
    ["COMPLETED", "Realizada"],
    ["CANCELLED", "Cancelada"],
  ] as const)("status %s mostra texto %s", async (status, expectedText) => {
    const { renderResult } = renderCard({ status });
    await renderResult;
    expect(screen.getByText(expectedText)).toBeTruthy();
  });

  it("chama onEdit ao pressionar Editar, sem chamar as outras ações", async () => {
    const { handlers, renderResult } = renderCard();
    await renderResult;
    await fireEvent.press(screen.getByRole("button", { name: "Editar" }));
    expect(handlers.onEdit).toHaveBeenCalledTimes(1);
    expect(handlers.onReschedule).not.toHaveBeenCalled();
    expect(handlers.onDelete).not.toHaveBeenCalled();
    expect(handlers.onPlan).not.toHaveBeenCalled();
  });

  it("chama onReschedule ao pressionar Remarcar", async () => {
    const { handlers, renderResult } = renderCard();
    await renderResult;
    await fireEvent.press(screen.getByRole("button", { name: "Remarcar" }));
    expect(handlers.onReschedule).toHaveBeenCalledTimes(1);
    expect(handlers.onEdit).not.toHaveBeenCalled();
  });

  it("chama onDelete ao pressionar Excluir", async () => {
    const { handlers, renderResult } = renderCard();
    await renderResult;
    await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));
    expect(handlers.onDelete).toHaveBeenCalledTimes(1);
  });

  it('chama onPlan ao pressionar "Montar Plano da Sessão"', async () => {
    const { handlers, renderResult } = renderCard();
    await renderResult;
    await fireEvent.press(
      screen.getByRole("button", { name: "Montar Plano da Sessão" }),
    );
    expect(handlers.onPlan).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["PENDING", "Agendada"],
    ["COMPLETED", "Realizada"],
  ] as const)(
    "status %s nunca usa color.success como cor do texto '%s' (decorativo, G-12/DESIGN §4)",
    async (status, statusText) => {
      const { renderResult } = renderCard({ status });
      await renderResult;
      const flat = StyleSheet.flatten(screen.getByText(statusText).props.style);
      expect(flat?.color).not.toBe(color.success);
    },
  );
});
