import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../../test-utils/render";
import { MiniCalendar } from "../MiniCalendar";

// AC-902-01: navegação, seleção, pontos e rótulos acessíveis do calendário.
describe("AC-902-01 MiniCalendar", () => {
  const baseProps = {
    year: 2026,
    month: 3, // abril, 0-indexado
    selectedDayKey: "2026-04-02",
    appointmentCounts: { "2026-04-02": 3, "2026-04-10": 1 },
  };

  it("chama onChangeMonth com o mês seguinte ao pressionar ›", async () => {
    const onChangeMonth = vi.fn();
    await render(
      <MiniCalendar
        {...baseProps}
        onSelectDate={vi.fn()}
        onChangeMonth={onChangeMonth}
      />,
    );
    await fireEvent.press(
      screen.getByRole("button", { name: /próximo mês|next/i }),
    );
    expect(onChangeMonth).toHaveBeenCalledWith(2026, 4);
  });

  it("chama onChangeMonth com o mês anterior ao pressionar ‹, cruzando o ano", async () => {
    const onChangeMonth = vi.fn();
    await render(
      <MiniCalendar
        year={2026}
        month={0}
        selectedDayKey="2026-01-02"
        appointmentCounts={{}}
        onSelectDate={vi.fn()}
        onChangeMonth={onChangeMonth}
      />,
    );
    await fireEvent.press(
      screen.getByRole("button", { name: /mês anterior|previous/i }),
    );
    expect(onChangeMonth).toHaveBeenCalledWith(2025, 11);
  });

  it("chama onSelectDate com a dayKey do dia tocado", async () => {
    const onSelectDate = vi.fn();
    await render(
      <MiniCalendar
        {...baseProps}
        onSelectDate={onSelectDate}
        onChangeMonth={vi.fn()}
      />,
    );
    await fireEvent.press(screen.getByLabelText(/2 de abril.*3 agendamentos/i));
    expect(onSelectDate).toHaveBeenCalledWith("2026-04-02");
  });

  it("expõe rótulo acessível com a contagem de agendamentos do dia", async () => {
    await render(
      <MiniCalendar
        {...baseProps}
        onSelectDate={vi.fn()}
        onChangeMonth={vi.fn()}
      />,
    );
    expect(screen.getByLabelText(/2 de abril.*3 agendamentos/i)).toBeTruthy();
  });

  it("dia sem agendamento não menciona contagem no rótulo acessível", async () => {
    await render(
      <MiniCalendar
        {...baseProps}
        onSelectDate={vi.fn()}
        onChangeMonth={vi.fn()}
      />,
    );
    const dayFive = screen.getByLabelText(/^5 de abril$/i);
    expect(dayFive).toBeTruthy();
  });

  it("dia selecionado reflete accessibilityState.selected", async () => {
    await render(
      <MiniCalendar
        {...baseProps}
        onSelectDate={vi.fn()}
        onChangeMonth={vi.fn()}
      />,
    );
    const selectedDay = screen.getByLabelText(/2 de abril.*3 agendamentos/i);
    expect(selectedDay.props.accessibilityState).toMatchObject({
      selected: true,
    });
  });
});
