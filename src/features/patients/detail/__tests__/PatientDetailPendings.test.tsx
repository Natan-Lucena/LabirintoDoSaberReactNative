import { QueryClient } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import { MOCK_TOKEN } from "@/mocks/fixtures";
import { mockAdapter } from "@/mocks/adapter";
import { clearMockSession, setMockSession } from "@/mocks/mock-auth-state";
import { fireEvent, render, screen } from "@/test-utils/render";
import "@/mocks/install";

const routerPush = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush, back: vi.fn(), replace: vi.fn() }),
  useFocusEffect: () => undefined,
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { PatientDetailScreen } = await import("../PatientDetailScreen");

describe("PatientDetailScreen: Pendências (PAC-10)", () => {
  beforeEach(() => {
    apiClient.defaults.adapter = mockAdapter;
    setMockSession(MOCK_TOKEN);
    routerPush.mockClear();
  });
  afterEach(() => {
    clearMockSession();
  });

  it("mostra as pendências do servidor e abre o destino de cada uma (AC-PAC-10-03)", async () => {
    await render(<PatientDetailScreen patientId="student-1" />);

    expect(await screen.findByText("Pendências")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Registrar evolução" }),
    ).toBeNull();

    await fireEvent.press(
      screen.getByRole("button", { name: "Evolução pendente" }),
    );
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/evolution/[sessionId]",
      params: { sessionId: "mock-session-1", from: "entry" },
    });

    await fireEvent.press(
      screen.getByRole("button", { name: "Revisão do plano vencida" }),
    );
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/plans/[id]",
      params: { id: "mock-plan-1" },
    });
  });

  it("sem anamnese, abre a anamnese do paciente", async () => {
    await render(<PatientDetailScreen patientId="student-4" />);

    await fireEvent.press(
      await screen.findByRole("button", { name: "Anamnese não preenchida" }),
    );
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/patients/[id]/anamnese",
      params: { id: "student-4" },
    });
  });

  it("falha do overview: a seção some e o bloco Registrar evolução continua", async () => {
    apiClient.defaults.adapter = async (config) => {
      if (config.url?.includes("/student/overview")) {
        return Promise.reject(
          Object.assign(new Error("falha"), { isAxiosError: true }),
        );
      }
      if (config.url?.includes("/session-evolution/pending")) {
        return {
          status: 200,
          statusText: "OK",
          headers: {},
          config,
          data: [
            {
              sessionId: "session-7",
              studentId: "student-1",
              studentName: "Paciente Teste",
              sessionName: "Leitura",
              finishedAt: "2026-11-20T10:00:00.000Z",
            },
          ],
        };
      }
      return mockAdapter(config);
    };
    await render(<PatientDetailScreen patientId="student-1" />, {
      queryClient: new QueryClient({
        defaultOptions: { queries: { retry: false } },
      }),
    });

    expect(
      await screen.findByRole("button", { name: "Registrar evolução" }),
    ).toBeTruthy();
    expect(screen.queryByText("Pendências")).toBeNull();
  });
});
