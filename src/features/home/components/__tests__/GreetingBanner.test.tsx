import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../../test-utils/render";
import { GreetingBanner } from "../GreetingBanner";

// AC-602-01/03: saudação sem título, contagem singular/plural, estado vazio,
// botão Iniciar Sessão, emoji decorativo oculto do leitor de tela.
describe("AC-602-01 GreetingBanner", () => {
  it("mostra saudação com o nome do educador, sem título", async () => {
    await render(
      <GreetingBanner
        educatorName="Ana Paula"
        appointmentsTodayCount={1}
        onStartSession={vi.fn()}
      />,
    );
    expect(screen.getByText("Olá, Ana Paula! 👋")).toBeTruthy();
  });

  it("mostra contagem no singular para 1 agendamento", async () => {
    await render(
      <GreetingBanner
        educatorName="Ana"
        appointmentsTodayCount={1}
        onStartSession={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Você tem 1 sessão agendada para hoje"),
    ).toBeTruthy();
  });

  it("mostra contagem no plural para N agendamentos", async () => {
    await render(
      <GreetingBanner
        educatorName="Ana"
        appointmentsTodayCount={3}
        onStartSession={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Você tem 3 sessões agendadas para hoje"),
    ).toBeTruthy();
  });

  it("mostra Boas-vindas quando não há agendamentos hoje", async () => {
    await render(
      <GreetingBanner
        educatorName="Ana"
        appointmentsTodayCount={0}
        onStartSession={vi.fn()}
      />,
    );
    expect(screen.getByText("Boas-vindas!")).toBeTruthy();
    expect(screen.queryByText(/agendamento/)).toBeNull();
  });

  it("aciona onStartSession ao tocar Iniciar Sessão", async () => {
    const onStartSession = vi.fn();
    await render(
      <GreetingBanner
        educatorName="Ana"
        appointmentsTodayCount={0}
        onStartSession={onStartSession}
      />,
    );
    await fireEvent.press(screen.getByRole("button"));
    expect(onStartSession).toHaveBeenCalledTimes(1);
  });

  it("marca o texto da saudação como acessível e o emoji como decorativo", async () => {
    await render(
      <GreetingBanner
        educatorName="Ana"
        appointmentsTodayCount={0}
        onStartSession={vi.fn()}
      />,
    );
    const greeting = screen.getByText("Olá, Ana! 👋");
    expect(greeting.props.accessibilityLabel).toBe("Olá, Ana!");
  });
});
