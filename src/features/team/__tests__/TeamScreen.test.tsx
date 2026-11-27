import { Share } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/educator";
import "@/mocks/handlers/educator-update";
import { MOCK_TOKEN } from "@/mocks/fixtures";
import { resetMockClinicState } from "@/mocks/handlers/clinic";
import { clearMockSession, setMockSession } from "@/mocks/mock-auth-state";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";
import { fireEvent, render, screen } from "@/test-utils/render";

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("@/hooks/useOnline", () => ({ useOnline: () => true }));

const { TeamScreen } = await import("../TeamScreen");

describe("TeamScreen (EQP-01)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    setMockSession(MOCK_TOKEN);
    resetMockClinicState();
    resetMockTeamScenario();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    clearMockSession();
    resetMockClinicState();
    resetMockTeamScenario();
  });

  it("sem equipe (404 NOT_IN_CLINIC) mostra Criar equipe, não o erro (AC-EQP-01-02)", async () => {
    await render(<TeamScreen />);

    expect(
      await screen.findByRole("button", { name: "Criar equipe" }),
    ).toBeTruthy();
    expect(
      screen.queryByText("Não foi possível carregar a equipe."),
    ).toBeNull();
  });

  it("valida o nome e cria a equipe", async () => {
    await render(<TeamScreen />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Criar equipe" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Criar" }));
    expect(screen.getByText("Informe entre 2 e 80 caracteres.")).toBeTruthy();

    await fireEvent.changeText(
      screen.getByLabelText("Nome da clínica"),
      "Clínica Teste",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Criar" }));

    expect(await screen.findByText("Profissionais ativos · 1")).toBeTruthy();
    expect(screen.getByText("Clínica Teste")).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: "Compartilhar convite" }),
    ).toBeTruthy();
  });

  it("ADMIN lista a equipe e compartilha o convite com a mensagem do servidor (AC-EQP-01-01)", async () => {
    setMockTeamScenario("admin");
    const share = vi
      .spyOn(Share, "share")
      .mockResolvedValue({ action: "sharedAction" });
    await render(<TeamScreen />);

    expect(await screen.findByText("Profissionais ativos · 3")).toBeTruthy();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Compartilhar convite" }),
    );

    expect(await screen.findByText(/^Vale até \d{2}\/\d{2}$/)).toBeTruthy();
    expect(share).toHaveBeenCalledTimes(1);
    const message = share.mock.calls[0][0].message as string;
    expect(message).toMatch(/^Use o código [A-Z2-9]{8} para entrar na equipe/);

    await fireEvent.press(
      screen.getByRole("button", { name: "Compartilhar de novo" }),
    );
    expect(share).toHaveBeenCalledTimes(2);
    expect(share.mock.calls[1][0].message).toBe(message);
  });

  it("PROFESSIONAL não vê o cartão de convite (AC-EQP-01-03)", async () => {
    setMockTeamScenario("professional");
    await render(<TeamScreen />);

    expect(await screen.findByText("Profissionais ativos · 3")).toBeTruthy();
    expect(screen.queryByText("Convide um profissional")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Compartilhar convite" }),
    ).toBeNull();
  });
});
