import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../../test-utils/render";
import { ScheduledSessionCard } from "../ScheduledSessionCard";

// AC-602-02: só campos aprovados em G-12 (aluno, horário sem "até", status).
describe("AC-602-02 ScheduledSessionCard", () => {
  it("mostra aluno, horário formatado e status, sem até", async () => {
    await render(
      <ScheduledSessionCard
        studentName="João Silva"
        scheduledAt={new Date("2026-09-25T14:30:00-03:00")}
        statusLabel="Agendada"
        onPress={vi.fn()}
      />,
    );
    expect(screen.getByText("João Silva")).toBeTruthy();
    expect(screen.getByText("14:30")).toBeTruthy();
    expect(screen.getByText("Agendada")).toBeTruthy();
    expect(screen.queryByText(/até/)).toBeNull();
  });

  it("aciona onPress ao tocar o card", async () => {
    const onPress = vi.fn();
    await render(
      <ScheduledSessionCard
        studentName="João"
        scheduledAt={new Date("2026-09-25T14:30:00-03:00")}
        statusLabel="Agendada"
        onPress={onPress}
      />,
    );
    await fireEvent.press(screen.getByRole("button"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
