import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import type { Student } from "@/api/types";
import { MOCK_STUDENTS, MOCK_TOKEN } from "@/mocks/fixtures";
import { MOCK_SHARED_STUDENT } from "@/mocks/fixtures-e5";
import { mockAdapter } from "@/mocks/adapter";
import { clearMockSession, setMockSession } from "@/mocks/mock-auth-state";
import { resetMockShareState } from "@/mocks/mock-share-state";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";
import { fireEvent, render, screen } from "@/test-utils/render";
import "@/mocks/install";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { WhoFollowsSection } = await import("../WhoFollowsSection");

const ownPatient: Student = { ...MOCK_STUDENTS[1], access: "OWNER" };

describe("WhoFollowsSection (EQP-04)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    setMockSession(MOCK_TOKEN);
    resetMockShareState();
    resetMockTeamScenario();
    setMockTeamScenario("admin");
  });
  afterEach(() => {
    clearMockSession();
    resetMockShareState();
    resetMockTeamScenario();
  });

  it("o dono compartilha com um colega e remove o acesso (AC-EQP-04-01)", async () => {
    const onToast = vi.fn();
    await render(<WhoFollowsSection patient={ownPatient} onToast={onToast} />);

    expect(
      await screen.findByText("Só você acompanha este paciente."),
    ).toBeTruthy();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Compartilhar" }),
    );
    await fireEvent.press(
      await screen.findByRole("button", {
        name: "Compartilhar com Profissional Teste Três",
      }),
    );
    expect(
      screen.getByText(
        /^Compartilhar Caio Mendes com Profissional Teste Três\?/,
      ),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getAllByRole("button", { name: "Compartilhar" }).at(-1)!,
    );

    expect(await screen.findByText("Profissional Teste Três")).toBeTruthy();
    expect(onToast).toHaveBeenCalledWith("Paciente compartilhado");

    await fireEvent.press(
      screen.getByRole("button", { name: /^Remover acesso de / }),
    );
    await fireEvent.press(
      screen.getAllByRole("button", { name: /^Remover acesso$/ })[0],
    );

    expect(
      await screen.findByText("Só você acompanha este paciente."),
    ).toBeTruthy();
    expect(onToast).toHaveBeenCalledWith("Acesso removido");
  });

  it("a colega vê o dono e a lista, sem ações (AC-EQP-04-01)", async () => {
    await render(
      <WhoFollowsSection patient={MOCK_SHARED_STUDENT} onToast={vi.fn()} />,
    );

    expect(await screen.findByText("Profissional Teste Dois")).toBeTruthy();
    expect(await screen.findByText("Você")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Compartilhar" })).toBeNull();
    expect(
      screen.queryByRole("button", { name: /^Remover acesso/ }),
    ).toBeNull();
  });

  it("sem equipe, orienta a entrar numa equipe", async () => {
    setMockTeamScenario("none");
    await render(<WhoFollowsSection patient={ownPatient} onToast={vi.fn()} />);

    expect(
      await screen.findByText(
        "Entre numa equipe para compartilhar este paciente.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Compartilhar" })).toBeNull();
  });
});
