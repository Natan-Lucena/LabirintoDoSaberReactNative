import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { createSessionEvolution } from "@/api/endpoints/evolution";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_EVOLUTION_SESSION_FREE,
  MOCK_EVOLUTION_SESSION_PE,
  resetMockEvolutionState,
} from "@/mocks/handlers/evolution";
import "@/mocks/handlers/student";
import { MOCK_FOREIGN_STUDENT_ID } from "@/mocks/handlers/plans";
import { fireEvent, render, screen } from "@/test-utils/render";
import { PatientRecordsScreen } from "../PatientRecordsScreen";

const router = { push: vi.fn(), back: vi.fn(), replace: vi.fn() };

vi.mock("expo-router", () => ({
  useRouter: () => router,
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;

beforeEach(() => {
  vi.clearAllMocks();
  apiClient.defaults.adapter = mockAdapter;
  resetMockEvolutionState();
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  resetMockEvolutionState();
});

describe("PatientRecordsScreen (EVO-02)", () => {
  it("AC-EVO-02-01: a evolução salva aparece no prontuário, com data, critérios e trecho", async () => {
    const saved = await createSessionEvolution({
      sessionId: MOCK_EVOLUTION_SESSION_PE,
      criteria: [
        { description: "Contar até 10", result: "ACHIEVED" },
        { description: "Associar numeral", result: "PARTIAL" },
      ],
      descriptiveRecord: "Participou bem da atividade.",
    });

    await render(<PatientRecordsScreen patientId="student-2" />);

    expect(await screen.findByText("27/10/2026")).toBeTruthy();
    expect(screen.getByText("1 de 2 critérios atingidos")).toBeTruthy();
    expect(screen.getByText("Participou bem da atividade.")).toBeTruthy();
    expect(await screen.findByText("Caio Mendes")).toBeTruthy();

    await fireEvent.press(
      screen.getByRole("button", { name: "Evolução de 27/10/2026" }),
    );
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/evolution/record/[id]",
      params: { id: saved.id },
    });
  });

  it("mostra o estado vazio quando o paciente não tem evolução", async () => {
    await render(<PatientRecordsScreen patientId="student-3" />);

    expect(
      await screen.findByText(
        "Nenhuma evolução registrada para este paciente.",
      ),
    ).toBeTruthy();
    expect(MOCK_EVOLUTION_SESSION_FREE).toBeTruthy();
  });

  it("mostra o carregamento enquanto a lista não chega", async () => {
    apiClient.defaults.adapter = () => new Promise(() => undefined);
    await render(<PatientRecordsScreen patientId="student-2" />);

    expect(screen.getByText("Carregando o prontuário...")).toBeTruthy();
  });

  it("mostra o erro, com nova tentativa", async () => {
    await render(<PatientRecordsScreen patientId={MOCK_FOREIGN_STUDENT_ID} />);

    expect(
      await screen.findByText("Não foi possível carregar o prontuário."),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeTruthy();
  });
});
