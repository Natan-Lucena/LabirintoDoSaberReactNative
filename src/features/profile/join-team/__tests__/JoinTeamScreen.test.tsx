import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import { resetMockClinicState } from "@/mocks/handlers/clinic";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";
import { fireEvent, render, screen } from "@/test-utils/render";

const replace = vi.fn();
vi.mock("expo-router", () => ({
  useRouter: () => ({ replace, push: vi.fn(), back: vi.fn() }),
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { JoinTeamScreen } = await import("../JoinTeamScreen");

async function enterCode(code: string) {
  await fireEvent.changeText(screen.getByLabelText("Código do convite"), code);
  await fireEvent.press(screen.getByRole("button", { name: "Continuar" }));
}

describe("JoinTeamScreen (EQP-03)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    replace.mockReset();
  });
  afterEach(() => {
    resetMockClinicState();
    resetMockTeamScenario();
  });

  it("mostra a prévia e entra na equipe", async () => {
    await render(<JoinTeamScreen />);

    await enterCode("km4w-9rtd");
    expect(await screen.findByText(/Administrador\(a\)/)).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Entrar na equipe" }),
    );

    await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/team"));
  });

  it("conta que já está numa equipe vê ALREADY_IN_CLINIC (AC-EQP-03-02)", async () => {
    await render(<JoinTeamScreen />);

    await enterCode("AB3K7MPQ");
    await screen.findByRole("button", { name: "Entrar na equipe" });
    setMockTeamScenario("admin");
    await fireEvent.press(
      screen.getByRole("button", { name: "Entrar na equipe" }),
    );

    expect(
      await screen.findByText(
        "Você já faz parte de uma equipe. Saia dela antes de entrar em outra.",
      ),
    ).toBeTruthy();
    expect(replace).not.toHaveBeenCalled();
  });
});
