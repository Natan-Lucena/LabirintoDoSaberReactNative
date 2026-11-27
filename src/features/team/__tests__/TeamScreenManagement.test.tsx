import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/educator";
import "@/mocks/handlers/educator-update";
import { MOCK_EDUCATOR, MOCK_TOKEN } from "@/mocks/fixtures";
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

describe("TeamScreen: permissões por papel (EQP-02)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    setMockSession(MOCK_TOKEN);
    resetMockClinicState();
    resetMockTeamScenario();
  });
  afterEach(() => {
    clearMockSession();
    resetMockClinicState();
    resetMockTeamScenario();
  });

  it("PROFESSIONAL só vê a lista e Sair da equipe (AC-EQP-02-01)", async () => {
    setMockTeamScenario("professional");
    await render(<TeamScreen />);

    expect(
      await screen.findByRole("button", { name: "Sair da equipe" }),
    ).toBeTruthy();
    expect(screen.getByText("Profissionais ativos · 3")).toBeTruthy();
    expect(screen.queryByText("Convide um profissional")).toBeNull();
    expect(screen.queryByText("Renomear")).toBeNull();
    expect(screen.queryByText("Convites ativos")).toBeNull();
    expect(screen.queryByText("Gerenciar")).toBeNull();
  });

  it("ADMIN renomeia, revoga convite, muda papel e remove membro", async () => {
    setMockTeamScenario("admin");
    await render(<TeamScreen />);

    // Renomear
    await fireEvent.press(await screen.findByText("Renomear"));
    await fireEvent.changeText(
      screen.getByLabelText("Nome da clínica"),
      "Clínica Teste 2",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Salvar" }));
    expect(await screen.findByText("Nome atualizado")).toBeTruthy();
    expect(screen.getByText("Clínica Teste 2")).toBeTruthy();

    // Revogar convite
    expect(await screen.findByText("Convites ativos")).toBeTruthy();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Revogar o convite KM4W9RTD" }),
    );
    expect(screen.getByText("Revogar o convite KM4W9RTD?")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Revogar" }));
    expect(await screen.findByText("Convite revogado")).toBeTruthy();
    expect(screen.queryByText("KM4W9RTD")).toBeNull();

    // Mudar papel
    await fireEvent.press(
      screen.getByRole("button", { name: "Gerenciar Profissional Teste Dois" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Tornar administrador(a)" }),
    );
    expect(
      screen.getByText(
        "Mudar o papel de Profissional Teste Dois para Administrador(a)?",
      ),
    ).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Papel atualizado")).toBeTruthy();

    // Remover
    await fireEvent.press(
      screen.getByRole("button", { name: "Gerenciar Profissional Teste Três" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Remover da equipe" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Membro removido")).toBeTruthy();
    expect(await screen.findByText("Profissionais ativos · 2")).toBeTruthy();
  });

  it("409 LAST_ADMIN mostra a mensagem e a lista não muda (AC-EQP-02-03)", async () => {
    setMockTeamScenario("admin");
    // Força o servidor a avaliar o último ADMIN: troca o alvo pelo próprio educador.
    const forwarding: typeof mockAdapter = (config) => {
      if (config.method === "put" && config.url?.includes("/clinic/members/")) {
        return mockAdapter({
          ...config,
          url: `/clinic/members/${MOCK_EDUCATOR.id}`,
          data: JSON.stringify({ role: "PROFESSIONAL" }),
        });
      }
      return mockAdapter(config);
    };
    apiClient.defaults.adapter = forwarding;
    await render(<TeamScreen />);

    await fireEvent.press(
      await screen.findByRole("button", {
        name: "Gerenciar Profissional Teste Dois",
      }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Tornar administrador(a)" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Confirmar" }));

    expect(
      await screen.findByText(
        "A equipe precisa de pelo menos um administrador(a). Promova outra pessoa antes.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Profissionais ativos · 3")).toBeTruthy();
  });

  it("Sair da equipe volta ao estado sem equipe", async () => {
    setMockTeamScenario("professional");
    await render(<TeamScreen />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Sair da equipe" }),
    );
    expect(screen.getByText(/^Sair da equipe Clínica/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Sair" }));

    expect(await screen.findByText("Você saiu da equipe")).toBeTruthy();
    expect(
      await screen.findByRole("button", { name: "Criar equipe" }),
    ).toBeTruthy();
  });
});
