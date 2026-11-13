import { QueryClient } from "@tanstack/react-query";
import { act, waitFor } from "@testing-library/react-native";
import { Alert, type AlertButton } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/api/client";
import {
  createSessionEvolution,
  evolutionQueryKeys,
  getEvolutionContext,
} from "@/api/endpoints/evolution";
import { createQueryClient } from "@/api/query-client";
import { mockAdapter } from "@/mocks/adapter";
import {
  MOCK_EVOLUTION_ID,
  MOCK_EVOLUTION_SESSION_PE,
  MOCK_FOREIGN_EVOLUTION_ID,
  resetMockEvolutionState,
} from "@/mocks/handlers/evolution";
import {
  initialSessionFlowData,
  useSessionFlowStore,
} from "@/stores/session-flow";
import { fireEvent, render, screen } from "@/test-utils/render";
import { EvolutionDetailScreen } from "../EvolutionDetailScreen";

const router = { push: vi.fn(), back: vi.fn(), replace: vi.fn() };

type BeforeRemoveListener = (event: {
  preventDefault: () => void;
  data: { action: object };
}) => void;
const navigation = {
  addListener: vi.fn(
    (_event: string, _listener: BeforeRemoveListener) => () => undefined,
  ),
  dispatch: vi.fn(),
};

vi.mock("expo-router", () => ({
  useRouter: () => router,
  useNavigation: () => navigation,
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const originalAdapter = apiClient.defaults.adapter;
let queryClient: QueryClient;
let alertSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  navigation.addListener.mockImplementation(() => () => undefined);
  apiClient.defaults.adapter = mockAdapter;
  resetMockEvolutionState();
  queryClient = createQueryClient();
  alertSpy = vi.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
  apiClient.defaults.adapter = originalAdapter;
  resetMockEvolutionState();
});

function button(name: string) {
  return screen.getByRole("button", { name });
}

async function openEdit() {
  await render(<EvolutionDetailScreen evolutionId={MOCK_EVOLUTION_ID} />, {
    queryClient,
  });
  await screen.findByText("Participou com interesse e pediu para continuar.");
  await fireEvent.press(button("Editar"));
  await screen.findByText("Editar evolução");
}

describe("EvolutionDetailScreen (EVO-02)", () => {
  it("mostra critérios, registro e sugestão da evolução", async () => {
    await render(<EvolutionDetailScreen evolutionId={MOCK_EVOLUTION_ID} />, {
      queryClient,
    });

    expect(await screen.findByText("03/10/2026")).toBeTruthy();
    expect(screen.getByText("1 de 2 critérios atingidos")).toBeTruthy();
    expect(
      screen.getByText("Escrever frases com letra maiúscula"),
    ).toBeTruthy();
    expect(screen.getByText("Atingido")).toBeTruthy();
    expect(screen.getByText("8 de 10 tentativas")).toBeTruthy();
    expect(screen.getByText("Lembrou da maiúscula sem ajuda.")).toBeTruthy();
    expect(screen.getByText("Parcial")).toBeTruthy();
    expect(
      screen.getByText("Participou com interesse e pediu para continuar."),
    ).toBeTruthy();
    expect(
      screen.getByText("Retomar a leitura de frases curtas com apoio visual."),
    ).toBeTruthy();
  });

  it("mostra o erro sem tentar de novo quando a evolução é de outro educador", async () => {
    await render(
      <EvolutionDetailScreen evolutionId={MOCK_FOREIGN_EVOLUTION_ID} />,
      { queryClient },
    );

    expect(
      await screen.findByText("Você não tem acesso a esta evolução."),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Editar" })).toBeNull();
  });

  it("'Editar' reabre o formulário preenchido com critérios e registro", async () => {
    await openEdit();

    expect(screen.getByLabelText("Registro descritivo").props.value).toBe(
      "Participou com interesse e pediu para continuar.",
    );
    expect(screen.getByLabelText("Tentativas do critério 1").props.value).toBe(
      "10",
    );
    expect(screen.getByLabelText("Acertos do critério 1").props.value).toBe(
      "8",
    );
    expect(screen.getByLabelText("Nota do critério 1").props.value).toBe(
      "Lembrou da maiúscula sem ajuda.",
    );
    expect(screen.getByLabelText("Descrição do critério 2").props.value).toBe(
      "Manter a atenção na leitura",
    );
  });

  it("AC-EVO-02-02: salvar envia a lista COMPLETA de critérios e reflete no detalhe", async () => {
    const put = vi.spyOn(apiClient, "put");
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    useSessionFlowStore.setState({
      ...initialSessionFlowData,
      step: "awaitingEvolution",
      sessionId: "outra-sessao",
    });
    await openEdit();

    await act(async () =>
      fireEvent.changeText(
        screen.getByLabelText("Registro descritivo"),
        "Registro corrigido.",
      ),
    );
    await act(async () => fireEvent.press(button("Salvar alterações")));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith(
      `/session-evolution/${MOCK_EVOLUTION_ID}`,
      {
        criteria: [
          {
            description: "Escrever frases com letra maiúscula",
            attempts: 10,
            successes: 8,
            result: "ACHIEVED",
            note: "Lembrou da maiúscula sem ajuda.",
          },
          {
            description: "Manter a atenção na leitura",
            result: "PARTIAL",
          },
        ],
        descriptiveRecord: "Registro corrigido.",
        // A evolução do mock já tem sugestão; o texto segue no PUT.
        nextSessionSuggestion:
          "Retomar a leitura de frases curtas com apoio visual.",
      },
    );
    // Volta ao detalhe, já com o registro novo.
    expect(await screen.findByText("Registro corrigido.")).toBeTruthy();
    expect(screen.queryByText("Editar evolução")).toBeNull();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: evolutionQueryKeys.all,
    });
    // Editar não mexe no fluxo de sessão.
    expect(useSessionFlowStore.getState().step).toBe("awaitingEvolution");
    expect(useSessionFlowStore.getState().sessionId).toBe("outra-sessao");
  });

  it("remover um critério envia a lista sem ele", async () => {
    const put = vi.spyOn(apiClient, "put");
    await openEdit();

    await act(async () => fireEvent.press(button("Remover critério 2")));
    await act(async () => fireEvent.press(button("Salvar alterações")));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    const body = put.mock.calls[0]?.[1] as { criteria: unknown[] };
    expect(body.criteria).toHaveLength(1);
    expect(await screen.findByText("1 de 1 critério atingido")).toBeTruthy();
  });

  it("valida antes de enviar: acertos acima das tentativas não chamam a API", async () => {
    const put = vi.spyOn(apiClient, "put");
    await openEdit();

    await act(async () =>
      fireEvent.changeText(
        screen.getByLabelText("Acertos do critério 1"),
        "11",
      ),
    );
    await act(async () => fireEvent.press(button("Salvar alterações")));

    expect(
      await screen.findByText("Os acertos não podem passar das tentativas."),
    ).toBeTruthy();
    expect(put).not.toHaveBeenCalled();
  });

  it("falha no PUT mostra o erro, mantém o formulário e não repete sozinho", async () => {
    const put = vi
      .spyOn(apiClient, "put")
      .mockRejectedValue(new Error("falha"));
    await openEdit();

    await act(async () =>
      fireEvent.changeText(
        screen.getByLabelText("Registro descritivo"),
        "Outro registro.",
      ),
    );
    await act(async () => fireEvent.press(button("Salvar alterações")));

    expect(
      await screen.findByText(
        "Não foi possível salvar a evolução. Tente novamente.",
      ),
    ).toBeTruthy();
    expect(put).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Registro descritivo").props.value).toBe(
      "Outro registro.",
    );
  });

  it("cancelar sem alterações volta ao detalhe; com alterações pede confirmação", async () => {
    await openEdit();
    await act(async () => fireEvent.press(button("Cancelar")));
    expect(
      await screen.findByText(
        "Retomar a leitura de frases curtas com apoio visual.",
      ),
    ).toBeTruthy();
    expect(alertSpy).not.toHaveBeenCalled();

    await fireEvent.press(button("Editar"));
    await act(async () =>
      fireEvent.changeText(
        screen.getByLabelText("Registro descritivo"),
        "Mudou.",
      ),
    );
    await act(async () => fireEvent.press(button("Cancelar")));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Editar evolução")).toBeTruthy();
  });
});

describe("EvolutionDetailScreen — edição (metas do PE e saída da pilha)", () => {
  async function openPlanEvolution() {
    const context = await getEvolutionContext(MOCK_EVOLUTION_SESSION_PE);
    const goal = context.suggestedCriteria[0]!;
    const saved = await createSessionEvolution({
      sessionId: MOCK_EVOLUTION_SESSION_PE,
      planId: context.plan!.id,
      criteria: [
        {
          goalId: goal.goalId,
          description: goal.description,
          result: "PARTIAL",
        },
      ],
      descriptiveRecord: "Primeiro registro.",
    });
    await render(<EvolutionDetailScreen evolutionId={saved.id} />, {
      queryClient,
    });
    await screen.findByText("Primeiro registro.");
    await fireEvent.press(button("Editar"));
    await screen.findByText("Editar evolução");
    return { goal, saved };
  }

  it("mostra o estado atual da meta e envia goalUpdates só da meta alterada", async () => {
    const put = vi.spyOn(apiClient, "put");
    const { goal, saved } = await openPlanEvolution();

    const select = await screen.findByLabelText(
      `Estado da meta: ${goal.description}`,
    );
    expect(select).toBeTruthy();
    expect(screen.getByText("Em andamento")).toBeTruthy();

    await act(async () => fireEvent.press(select));
    await act(async () => fireEvent.press(button("Atingida")));
    await act(async () => fireEvent.press(button("Salvar alterações")));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put).toHaveBeenCalledWith(
      `/session-evolution/${saved.id}`,
      expect.objectContaining({
        goalUpdates: [{ goalId: goal.goalId, status: "ACHIEVED" }],
      }),
    );
    expect(await screen.findByText("Metas atualizadas")).toBeTruthy();
  });

  it("sem mudar o estado das metas, o PUT não leva goalUpdates", async () => {
    const put = vi.spyOn(apiClient, "put");
    await openPlanEvolution();
    await screen.findByText("Atualizar prontuário");

    await act(async () =>
      fireEvent.changeText(
        screen.getByLabelText("Registro descritivo"),
        "Registro ajustado.",
      ),
    );
    await act(async () => fireEvent.press(button("Salvar alterações")));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0]?.[1]).not.toHaveProperty("goalUpdates");
  });

  it("beforeRemove: com alterações não salvas a saída da pilha pede confirmação", async () => {
    await openEdit();
    const listener = navigation.addListener.mock.calls.at(-1)![1];
    const preventDefault = vi.fn();
    const action = { type: "POP" };

    // Sem alterações, a saída segue.
    listener({ preventDefault, data: { action } });
    expect(preventDefault).not.toHaveBeenCalled();

    await act(async () =>
      fireEvent.changeText(
        screen.getByLabelText("Registro descritivo"),
        "Mudou.",
      ),
    );
    const dirtyListener = navigation.addListener.mock.calls.at(-1)![1];
    await act(async () => dirtyListener({ preventDefault, data: { action } }));
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(navigation.dispatch).not.toHaveBeenCalled();

    const buttons = alertSpy.mock.calls[0]![2] as AlertButton[];
    await act(async () =>
      buttons.find((item) => item.text === "Descartar")?.onPress?.(),
    );
    expect(navigation.dispatch).toHaveBeenCalledWith(action);
  });
});
