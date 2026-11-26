import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react-native";

import { apiClient } from "@/api/client";
import { createAppointment } from "@/api/endpoints/appointment";
import { MOCK_TOKEN } from "@/mocks/fixtures";
import {
  MOCK_ARCHIVED_STUDENT_ID,
  MOCK_SHARED_STUDENT_ID,
} from "@/mocks/fixtures-e5";
import { mockAdapter } from "@/mocks/adapter";
import { clearMockSession, setMockSession } from "@/mocks/mock-auth-state";
import { resetMockStudentStatusState } from "@/mocks/mock-student-status-state";
import {
  resetMockTeamScenario,
  setMockTeamScenario,
} from "@/mocks/mock-team-state";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import "@/mocks/install";

const routerReplace = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: routerReplace }),
  useFocusEffect: () => undefined,
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { PatientDetailScreen } =
  await import("@/features/patients/detail/PatientDetailScreen");
const { PatientsListScreen } =
  await import("@/features/patients/list/PatientsListScreen");

/** Corpos enviados a `PUT /student/:id/status`. */
let statusBodies: unknown[] = [];

function recordStatusCalls(): void {
  apiClient.defaults.adapter = async (config) => {
    if (config.method === "put" && config.url?.endsWith("/status")) {
      statusBodies.push(
        typeof config.data === "string" ? JSON.parse(config.data) : config.data,
      );
    }
    return mockAdapter(config);
  };
}

describe("Arquivar e reativar paciente (PAC-11)", () => {
  beforeEach(() => {
    recordStatusCalls();
    statusBodies = [];
    setMockSession(MOCK_TOKEN);
    resetMockStudentStatusState();
    resetMockTeamScenario();
    routerReplace.mockClear();
  });
  afterEach(() => {
    cleanup();
    clearMockSession();
    resetMockStudentStatusState();
    resetMockTeamScenario();
  });

  it("sem atendimentos futuros: confirma uma vez, arquiva e mostra a ficha arquivada (AC-PAC-11-03)", async () => {
    await render(<PatientDetailScreen patientId="student-5" />);

    expect(await screen.findByText("Iniciar sessão")).toBeTruthy();
    await fireEvent.press(
      await screen.findByRole("button", { name: "Arquivar paciente" }),
    );
    expect(await screen.findByText("Arquivar Maya Freitas?")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Arquivar" }));

    expect(await screen.findByText("Paciente arquivado")).toBeTruthy();
    expect(
      await screen.findByText(/Arquivado em \d{2}\/\d{2}\/\d{4}/),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Reativar paciente" }),
    ).toBeTruthy();
    expect(screen.queryByText("Iniciar sessão")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Arquivar paciente" }),
    ).toBeNull();
    expect(statusBodies).toEqual([{ status: "ARCHIVED" }]);

    // Planos e avaliações: sem as ações de criar.
    await fireEvent.press(screen.getByRole("tab", { name: "Planos" }));
    await screen.findByText("PDI vigente").catch(() => undefined);
    expect(screen.queryByText("Criar novo plano")).toBeNull();
    expect(screen.queryByText("Criar PDI")).toBeNull();
    await fireEvent.press(screen.getByRole("tab", { name: "Avaliações" }));
    expect(screen.queryByText("Nova avaliação")).toBeNull();
  });

  it("com atendimento futuro: mostra o count e só cancela depois do segundo toque (AC-PAC-11-01)", async () => {
    await createAppointment({
      studentId: "student-4",
      scheduledAt: "2032-07-10T13:00:00.000Z",
    });
    await render(<PatientDetailScreen patientId="student-4" />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Arquivar paciente" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Arquivar" }));

    expect(
      await screen.findByText(
        "Theo Barros tem 1 atendimento futuro. Ao arquivar, eles serão cancelados.",
      ),
    ).toBeTruthy();
    // Primeira tentativa nunca cancela.
    expect(statusBodies).toEqual([{ status: "ARCHIVED" }]);

    // "Manter" fecha sem enviar nada.
    await fireEvent.press(screen.getByRole("button", { name: "Manter" }));
    expect(statusBodies).toHaveLength(1);
    expect(screen.queryByText(/Ao arquivar, eles serão cancelados/)).toBeNull();

    await fireEvent.press(
      screen.getByRole("button", { name: "Arquivar paciente" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Arquivar" }));
    await fireEvent.press(
      await screen.findByRole("button", {
        name: "Cancelar atendimentos e arquivar",
      }),
    );

    expect(await screen.findByText("Paciente arquivado")).toBeTruthy();
    expect(statusBodies.at(-1)).toEqual({
      status: "ARCHIVED",
      cancelFutureAppointments: true,
    });
  });

  it("reativa na ficha arquivada (AC-PAC-11-02)", async () => {
    await render(<PatientDetailScreen patientId={MOCK_ARCHIVED_STUDENT_ID} />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Reativar paciente" }),
    );

    expect(await screen.findByText("Paciente reativado")).toBeTruthy();
    expect(statusBodies).toEqual([{ status: "ACTIVE" }]);
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Reativar paciente" }),
      ).toBeNull(),
    );
    expect(
      screen.getByRole("button", { name: "Arquivar paciente" }),
    ).toBeTruthy();
  });

  it("a colega não vê 'Arquivar paciente' (AC-PAC-11-04)", async () => {
    setMockTeamScenario("professional");
    await render(<PatientDetailScreen patientId={MOCK_SHARED_STUDENT_ID} />);

    expect(await screen.findByText("Dificuldades mapeadas")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Arquivar paciente" }),
    ).toBeNull();
  });

  it("a lista: o arquivado sai de 'Todos' e aparece em 'Arquivados' (AC-PAC-11-02)", async () => {
    await render(<PatientsListScreen />);

    expect(await screen.findByText("5 pacientes ativos")).toBeTruthy();
    expect(screen.queryByText("Paciente Teste Arquivado")).toBeNull();

    await fireEvent.press(screen.getByRole("button", { name: "Arquivados" }));
    expect(await screen.findByText("Paciente Teste Arquivado")).toBeTruthy();
    expect(screen.getByText(/Arquivado em \d{2}\/\d{2}/)).toBeTruthy();
    expect(screen.queryByText(/Próximo atendimento/)).toBeNull();
  });

  it("a lista 'Arquivados' vazia mostra a mensagem própria", async () => {
    // Reativado: ninguém arquivado.
    const { updateStudentStatus } =
      await import("@/api/endpoints/student-status");
    await updateStudentStatus(MOCK_ARCHIVED_STUDENT_ID, { status: "ACTIVE" });
    await render(<PatientsListScreen />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Arquivados" }),
    );
    expect(await screen.findByText("Nenhum paciente arquivado")).toBeTruthy();
  });
});
