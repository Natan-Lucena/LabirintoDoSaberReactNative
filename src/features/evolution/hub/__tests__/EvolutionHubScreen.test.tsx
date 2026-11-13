import { QueryClient } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  createSessionEvolution,
  evolutionQueryKeys,
} from "@/api/endpoints/evolution";
import { createQueryClient } from "@/api/query-client";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_EVOLUTION_ID,
  MOCK_EVOLUTION_SESSION_RECENT,
  resetMockEvolutionState,
} from "@/mocks/handlers/evolution";
import { fireEvent, render, screen } from "@/test-utils/render";
import { EvolutionHubScreen } from "../EvolutionHubScreen";

const router = { push: vi.fn(), back: vi.fn(), replace: vi.fn() };

vi.mock("expo-router", () => ({
  useRouter: () => router,
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;
let queryClient: QueryClient;

beforeEach(() => {
  vi.clearAllMocks();
  apiClient.defaults.adapter = mockAdapter;
  resetMockEvolutionState();
  queryClient = createQueryClient();
});

afterEach(() => {
  apiClient.defaults.adapter = originalAdapter;
  resetMockEvolutionState();
});

describe("EvolutionHubScreen (EVO-02)", () => {
  it("lista as sessões sem evolução e as evoluções recentes de todos os pacientes", async () => {
    await render(<EvolutionHubScreen />, { queryClient });

    expect(await screen.findByText("Sessões sem evolução")).toBeTruthy();
    expect(screen.getByText("Evoluções recentes")).toBeTruthy();
    expect(
      await screen.findByRole("button", {
        name: /Registrar evolução de .*Sessão de ontem/,
      }),
    ).toBeTruthy();
    expect(await screen.findByText("Lia Monteiro · 03/10/2026")).toBeTruthy();
    expect(screen.getByText("1 de 2 critérios atingidos")).toBeTruthy();
  });

  it("toque numa sessão pendente abre o registro da evolução; toque numa evolução abre o detalhe", async () => {
    await render(<EvolutionHubScreen />, { queryClient });

    await fireEvent.press(
      await screen.findByRole("button", {
        name: /Registrar evolução de .*Sessão de ontem/,
      }),
    );
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/evolution/[sessionId]",
      params: { sessionId: MOCK_EVOLUTION_SESSION_RECENT, from: "hub" },
    });

    await fireEvent.press(
      await screen.findByRole("button", {
        name: "Evolução de Lia Monteiro · 03/10/2026",
      }),
    );
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/evolution/record/[id]",
      params: { id: MOCK_EVOLUTION_ID },
    });
  });

  it("AC-EVO-02-03: depois de registrada, a sessão some das pendentes e a evolução vai ao topo", async () => {
    await render(<EvolutionHubScreen />, { queryClient });
    const pendingButton = () =>
      screen.queryByRole("button", {
        name: /Registrar evolução de .*Sessão de ontem/,
      });
    expect(
      await screen.findByLabelText(/Registrar evolução de .*ontem/),
    ).toBeTruthy();
    expect(pendingButton()).toBeTruthy();

    await createSessionEvolution({
      sessionId: MOCK_EVOLUTION_SESSION_RECENT,
      criteria: [],
      descriptiveRecord: "Sessão tranquila.",
    });
    // Mesma invalidação que a Evolução (EVO-01) faz ao salvar.
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: evolutionQueryKeys.all });
    });

    await waitFor(() => expect(pendingButton()).toBeNull());
    const cards = screen
      .getAllByRole("button")
      .filter((node) =>
        String(node.props.accessibilityLabel).startsWith("Evolução de "),
      );
    expect(cards[0]?.props.accessibilityLabel).toMatch(
      /· \d{2}\/\d{2}\/\d{4}$/,
    );
    expect(cards).toHaveLength(2);
  });
});
