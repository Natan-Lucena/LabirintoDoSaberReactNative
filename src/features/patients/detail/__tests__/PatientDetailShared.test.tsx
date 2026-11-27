import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { MOCK_TOKEN } from "@/mocks/fixtures";
import { MOCK_SHARED_STUDENT_ID } from "@/mocks/fixtures-e5";
import { mockAdapter } from "@/mocks/adapter";
import { clearMockSession, setMockSession } from "@/mocks/mock-auth-state";
import { resetMockShareState } from "@/mocks/mock-share-state";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";
import { fireEvent, render, screen } from "@/test-utils/render";
import "@/mocks/install";

const routerReplace = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: routerReplace }),
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { PatientDetailScreen } = await import("../PatientDetailScreen");

describe("PatientDetailScreen com paciente compartilhado (EQP-04)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    setMockSession(MOCK_TOKEN);
    resetMockShareState();
    resetMockTeamScenario();
    setMockTeamScenario("professional");
    routerReplace.mockClear();
  });
  afterEach(() => {
    clearMockSession();
    resetMockShareState();
    resetMockTeamScenario();
  });

  it("mostra o selo e esconde 'Editar' para a colega (AC-EQP-04-02)", async () => {
    await render(<PatientDetailScreen patientId={MOCK_SHARED_STUDENT_ID} />);

    expect(
      await screen.findByText("Compartilhado por Profissional Teste Dois"),
    ).toBeTruthy();
    expect(await screen.findByText("Dificuldades mapeadas")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
  });

  it("o dono mantém 'Editar' e não vê o selo", async () => {
    await render(<PatientDetailScreen patientId="student-1" />);

    expect(await screen.findByRole("button", { name: "Editar" })).toBeTruthy();
    expect(screen.queryByText(/Compartilhado por/)).toBeNull();
  });

  it("403 numa leitura da ficha mostra o aviso de acesso perdido (AC-EQP-04-03)", async () => {
    const defaultAdapter = mockAdapter;
    apiClient.defaults.adapter = async (config) => {
      if (config.url?.includes("/task-notebook-session/student/")) {
        return defaultAdapter({
          ...config,
          url: "/student/mock-student-foreign/shares",
        });
      }
      return defaultAdapter(config);
    };
    await render(<PatientDetailScreen patientId={MOCK_SHARED_STUDENT_ID} />);

    expect(
      await screen.findByText("Você não acompanha mais este paciente."),
    ).toBeTruthy();
    await fireEvent.press(
      screen.getByRole("button", { name: "Voltar para a lista" }),
    );
    expect(routerReplace).toHaveBeenCalledWith("/(tabs)/patients");
  });
});
