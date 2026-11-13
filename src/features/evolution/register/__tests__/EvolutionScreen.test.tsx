import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Alert, BackHandler, type AlertButton } from "react-native";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createSessionEvolution,
  EvolutionApiError,
  evolutionQueryKeys,
  getEvolutionContext,
} from "@/api/endpoints/evolution";
import { createQueryClient } from "@/api/query-client";
import { ApiError } from "@/api/errors";
import type { EvolutionContext, SessionEvolution } from "@/api/types";
import {
  initialSessionFlowData,
  useSessionFlowStore,
} from "@/stores/session-flow";
import { render } from "@/test-utils/render";
import { EvolutionScreen } from "../EvolutionScreen";

const router = {
  replace: vi.fn(),
  push: vi.fn(),
  back: vi.fn(),
  canGoBack: vi.fn(() => true),
};
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

const focusEffects: (() => void)[] = [];

vi.mock("expo-router", () => ({
  useRouter: () => router,
  useNavigation: () => navigation,
  useFocusEffect: (effect: () => void) => {
    if (focusEffects.at(-1) !== effect) focusEffects.push(effect);
  },
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
vi.mock("@/storage/mmkv", () => ({
  getActiveEducatorId: vi.fn(() => "educator-1"),
  getStorage: vi.fn(),
  clearSessionFlow: vi.fn(),
}));
vi.mock("@/api/endpoints/evolution", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/api/endpoints/evolution")>()),
  getEvolutionContext: vi.fn(),
  createSessionEvolution: vi.fn(),
}));

const SESSION_ID = "session-1";
const HOME = "/";
const RECORDS_ROUTE = {
  pathname: "/patients/[id]/records",
  params: { id: "student-1" },
};
const RECORD_ROUTE = {
  pathname: "/evolution/record/[id]",
  params: { id: "evolution-9" },
};

const CONTEXT: EvolutionContext = {
  session: {
    id: SESSION_ID,
    studentId: "student-1",
    studentName: "Paciente Fictício",
    name: "Contagem com materiais",
    startedAt: "2026-10-27T13:00:00.000Z",
    finishedAt: "2026-10-27T13:50:00.000Z",
    durationMinutes: 50,
    answeredCount: 3,
    correctCount: 2,
  },
  plan: { id: "plan-1", type: "PE", title: "Contagem até 20" },
  suggestedCriteria: [
    {
      goalId: "goal-1",
      description: "Contar objetos até 10",
      successCriterion: "8 de 10 contagens corretas",
      goalStatus: "IN_PROGRESS",
    },
    {
      goalId: "goal-2",
      description: "Associar quantidade e numeral",
      goalStatus: "NOT_STARTED",
    },
  ],
};

function withoutPlan(): EvolutionContext {
  const { plan: _plan, ...rest } = CONTEXT;
  return { ...rest, suggestedCriteria: [] };
}

const SAVED: SessionEvolution = {
  id: "evolution-1",
  sessionId: SESSION_ID,
  studentId: "student-1",
  educatorId: "educator-1",
  sessionDate: "2026-10-27",
  criteria: [],
  descriptiveRecord: "Registro.",
  goalUpdates: [],
  createdAt: "2026-10-27T14:00:00.000Z",
  updatedAt: "2026-10-27T14:00:00.000Z",
};

const close = vi.fn();
const hydrate = vi.fn();

function button(name: string) {
  return screen.getByRole("button", { name });
}

async function renderLoaded(context: EvolutionContext = CONTEXT) {
  vi.mocked(getEvolutionContext).mockResolvedValue(context);
  await render(<EvolutionScreen sessionId={SESSION_ID} />);
  await screen.findByText("Evolução da sessão");
  await screen.findByLabelText("Registro descritivo");
}

async function choose(selectLabel: string, option: string) {
  await act(async () => fireEvent.press(screen.getByLabelText(selectLabel)));
  await act(async () => fireEvent.press(button(option)));
}

async function type(label: string, text: string) {
  await act(async () =>
    fireEvent.changeText(screen.getByLabelText(label), text),
  );
}

async function pressSave() {
  await act(async () =>
    fireEvent.press(button("Salvar e atualizar prontuário")),
  );
}

let alertSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.clearAllMocks();
  focusEffects.length = 0;
  // Há histórico (telas da sessão encerrada); sem `from`, mesmo assim vai à Início.
  router.canGoBack.mockReturnValue(true);
  navigation.addListener.mockImplementation(() => () => undefined);
  close.mockImplementation(async () => {
    useSessionFlowStore.setState({ step: "closed" });
  });
  hydrate.mockImplementation(async () => {
    useSessionFlowStore.setState({ ...initialSessionFlowData });
  });
  useSessionFlowStore.setState({
    ...initialSessionFlowData,
    step: "awaitingEvolution",
    educatorId: "educator-1",
    sessionId: SESSION_ID,
    close,
    hydrate,
  });
  vi.mocked(createSessionEvolution).mockResolvedValue(SAVED);
  alertSpy = vi.spyOn(Alert, "alert").mockImplementation(() => undefined);
});

afterEach(() => {
  alertSpy.mockRestore();
});

describe("EvolutionScreen — contexto (AC-EVO-01-01)", () => {
  it("mostra paciente e data, o PE da sessão e os critérios sugeridos do servidor", async () => {
    await renderLoaded();

    expect(getEvolutionContext).toHaveBeenCalledWith(SESSION_ID);
    expect(screen.getByText("Paciente Fictício · 27/10/2026")).toBeTruthy();
    expect(screen.getByText("PE · Contagem até 20")).toBeTruthy();
    expect(screen.getByText("50 min · 2 critérios mensuráveis")).toBeTruthy();
    expect(screen.getByText("Critérios da sessão")).toBeTruthy();
    expect(screen.getAllByText("Contar objetos até 10").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByText("Critério de sucesso: 8 de 10 contagens corretas"),
    ).toBeTruthy();
    expect(
      screen.getAllByText("Associar quantidade e numeral").length,
    ).toBeGreaterThan(0);
    expect(screen.queryByText("Sessão sem PE")).toBeNull();
    expect(screen.queryByRole("button", { name: "Criar PE" })).toBeNull();
  });

  it("sem PE: aviso com 'Criar PE' para o paciente e a data, e só o registro descritivo", async () => {
    await renderLoaded(withoutPlan());

    expect(screen.getByText("Sessão sem PE")).toBeTruthy();
    expect(screen.queryByText("Critérios da sessão")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Incluir critério livre" }),
    ).toBeNull();
    expect(screen.queryByText("Atualizar prontuário")).toBeNull();

    await act(async () => fireEvent.press(button("Criar PE")));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/plans/new",
      params: { studentId: "student-1", type: "PE", sessionDate: "2026-10-27" },
    });
  });

  it("sem PE, salvar envia só o registro descritivo", async () => {
    await renderLoaded(withoutPlan());

    await type("Registro descritivo", "Sessão tranquila.");
    await pressSave();

    await waitFor(() =>
      expect(createSessionEvolution).toHaveBeenCalledTimes(1),
    );
    expect(vi.mocked(createSessionEvolution).mock.calls[0]![0]).toEqual({
      sessionId: SESSION_ID,
      criteria: [],
      descriptiveRecord: "Sessão tranquila.",
    });
  });

  it.each([
    [
      "SESSION_NOT_FINISHED",
      409,
      "Esta sessão ainda não foi encerrada. Encerre a sessão antes de registrar a evolução.",
    ],
    [
      "SESSION_NOT_FOUND",
      404,
      "Sessão não encontrada. Ela pode ter sido removida.",
    ],
    ["UNAUTHORIZED", 403, "Você não tem acesso a esta sessão."],
  ])(
    "erro %s ao carregar aparece em português, sem nova tentativa, e sair libera o fluxo",
    async (code, status, message) => {
      vi.mocked(getEvolutionContext).mockRejectedValue(
        new ApiError({ message: code, status, code }),
      );
      await render(<EvolutionScreen sessionId={SESSION_ID} />);

      expect(await screen.findByText(message)).toBeTruthy();
      expect(screen.queryByText(code)).toBeNull();
      expect(
        screen.queryByRole("button", { name: "Tentar novamente" }),
      ).toBeNull();
      await act(async () => fireEvent.press(button("Voltar ao início")));
      expect(router.replace).toHaveBeenCalledWith(HOME);
      // Sem isso, Início → encerramento → Evolução → erro viraria um ciclo.
      await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
      expect(useSessionFlowStore.getState().step).toBe("idle");
    },
  );

  it("erro sem saída: o voltar do cabeçalho e o do Android também liberam o fluxo", async () => {
    type BackListener = Parameters<typeof BackHandler.addEventListener>[1];
    const handlers: BackListener[] = [];
    const spy = vi
      .spyOn(BackHandler, "addEventListener")
      .mockImplementation((_event, handler) => {
        handlers.push(handler);
        return { remove: vi.fn() };
      });
    vi.mocked(getEvolutionContext).mockRejectedValue(
      new ApiError({
        message: "SESSION_NOT_FOUND",
        status: 404,
        code: "SESSION_NOT_FOUND",
      }),
    );
    await render(<EvolutionScreen sessionId={SESSION_ID} />);
    await screen.findByText(
      "Sessão não encontrada. Ela pode ter sido removida.",
    );

    let handled: boolean | null | undefined;
    await act(async () => {
      handled = handlers.at(-1)!({} as Parameters<BackListener>[0]);
    });
    expect(handled).toBe(true);
    expect(router.replace).toHaveBeenCalledWith(HOME);
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    spy.mockRestore();
  });

  it.each([
    ["rede", new ApiError({ message: "net", isNetworkError: true })],
    ["tempo esgotado", new ApiError({ message: "timeout", isTimeout: true })],
    [
      "5xx",
      new ApiError({ message: "INTERNAL", status: 500, code: "INTERNAL" }),
    ],
  ])(
    "erro de %s ao carregar oferece nova tentativa e sair mantém o fluxo para retomar",
    async (_kind, error) => {
      vi.mocked(getEvolutionContext).mockRejectedValue(error);
      await render(<EvolutionScreen sessionId={SESSION_ID} />);

      expect(
        await screen.findByRole("button", { name: "Tentar novamente" }),
      ).toBeTruthy();
      await act(async () => fireEvent.press(button("Voltar ao início")));

      expect(router.replace).toHaveBeenCalledWith(HOME);
      expect(close).not.toHaveBeenCalled();
      expect(useSessionFlowStore.getState().step).toBe("awaitingEvolution");
    },
  );

  it("ao voltar para a tela (ex.: depois de 'Criar PE'), busca o contexto de novo e passa a mostrar o PE, mantendo o registro", async () => {
    await renderLoaded(withoutPlan());
    await type("Registro descritivo", "Escrito antes do PE.");
    vi.mocked(getEvolutionContext).mockResolvedValue(CONTEXT);

    // O primeiro foco é a carga inicial; não busca duas vezes.
    await act(async () => focusEffects.at(-1)!());
    expect(getEvolutionContext).toHaveBeenCalledTimes(1);
    await act(async () => focusEffects.at(-1)!());

    expect(await screen.findByText("PE · Contagem até 20")).toBeTruthy();
    expect(getEvolutionContext).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Sessão sem PE")).toBeNull();
    expect(screen.getByText("Critérios da sessão")).toBeTruthy();
    expect(screen.getByLabelText("Resultado do critério 1")).toBeTruthy();
    expect(screen.getByLabelText("Registro descritivo").props.value).toBe(
      "Escrito antes do PE.",
    );
  });

  it("falha de rede ao carregar oferece nova tentativa explícita", async () => {
    vi.mocked(getEvolutionContext)
      .mockRejectedValueOnce(
        new ApiError({ message: "net", isNetworkError: true }),
      )
      .mockResolvedValueOnce(CONTEXT);
    await render(<EvolutionScreen sessionId={SESSION_ID} />);

    await act(async () =>
      fireEvent.press(
        await screen.findByRole("button", { name: "Tentar novamente" }),
      ),
    );

    expect(await screen.findByText("PE · Contagem até 20")).toBeTruthy();
    expect(getEvolutionContext).toHaveBeenCalledTimes(2);
  });
});

describe("EvolutionScreen — salvar (AC-EVO-01-02)", () => {
  it("envia critérios, registro e goalUpdates uma única vez, com o botão desabilitado durante o envio", async () => {
    let resolveSave: (value: SessionEvolution) => void = () => undefined;
    vi.mocked(createSessionEvolution).mockImplementation(
      () =>
        new Promise<SessionEvolution>((resolve) => {
          resolveSave = resolve;
        }),
    );
    await renderLoaded();

    await choose("Resultado do critério 1", "Atingido");
    await type("Tentativas do critério 1", "10");
    await type("Acertos do critério 1", "8");
    expect(screen.getByText("8 de 10 tentativas")).toBeTruthy();
    await type("Nota do critério 1", "Contou sem ajuda.");
    await choose("Estado da meta: Contar objetos até 10", "Atingida");
    await act(async () => fireEvent.press(button("Remover critério 2")));
    expect(screen.getByText("50 min · 1 critério mensurável")).toBeTruthy();
    await act(async () => fireEvent.press(button("Incluir critério livre")));
    await type("Descrição do critério 2", "Esperar a vez");
    await choose("Resultado do critério 2", "Parcial");
    await type("Registro descritivo", "Participou com interesse.");

    await act(async () => {
      fireEvent.press(button("Salvar e atualizar prontuário"));
      fireEvent.press(button("Salvar e atualizar prontuário"));
    });

    await waitFor(() =>
      expect(createSessionEvolution).toHaveBeenCalledTimes(1),
    );
    expect(
      button("Salvar e atualizar prontuário").props.accessibilityState
        ?.disabled,
    ).toBe(true);
    await pressSave();
    expect(createSessionEvolution).toHaveBeenCalledTimes(1);
    expect(vi.mocked(createSessionEvolution).mock.calls[0]![0]).toEqual({
      sessionId: SESSION_ID,
      planId: "plan-1",
      criteria: [
        {
          goalId: "goal-1",
          description: "Contar objetos até 10",
          successCriterion: "8 de 10 contagens corretas",
          attempts: 10,
          successes: 8,
          result: "ACHIEVED",
          note: "Contou sem ajuda.",
        },
        { description: "Esperar a vez", result: "PARTIAL" },
      ],
      descriptiveRecord: "Participou com interesse.",
      goalUpdates: [{ goalId: "goal-1", status: "ACHIEVED" }],
    });

    await act(async () => resolveSave(SAVED));

    expect(await screen.findByText("Evolução registrada")).toBeTruthy();
    expect(createSessionEvolution).toHaveBeenCalledTimes(1);
  });

  it("depois de salvar, limpa o fluxo da sessão e oferece 'Ver prontuário' e 'Voltar ao início'", async () => {
    await renderLoaded();
    await type("Registro descritivo", "Registro.");
    await pressSave();

    expect(await screen.findByText("Evolução registrada")).toBeTruthy();
    expect(close).toHaveBeenCalledTimes(1);
    expect(hydrate).toHaveBeenCalledWith("educator-1");
    expect(useSessionFlowStore.getState().step).toBe("idle");

    await act(async () => fireEvent.press(button("Ver prontuário")));
    expect(router.replace).toHaveBeenCalledWith(RECORDS_ROUTE);
    await act(async () => fireEvent.press(button("Voltar ao início")));
    expect(router.replace).toHaveBeenCalledWith(HOME);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("AC-EVO-02-03: ao salvar, invalida todas as consultas da evolução (pendentes, prontuário, ficha)", async () => {
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    vi.mocked(getEvolutionContext).mockResolvedValue(CONTEXT);
    await render(<EvolutionScreen sessionId={SESSION_ID} />, { queryClient });
    await screen.findByLabelText("Registro descritivo");
    await type("Registro descritivo", "Registro.");
    await pressSave();

    expect(await screen.findByText("Evolução registrada")).toBeTruthy();
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: evolutionQueryKeys.all,
    });
  });

  it("não mexe no fluxo de outra sessão", async () => {
    useSessionFlowStore.setState({ sessionId: "outra-sessao" });
    await renderLoaded();
    await type("Registro descritivo", "Registro.");
    await pressSave();

    expect(await screen.findByText("Evolução registrada")).toBeTruthy();
    expect(close).not.toHaveBeenCalled();
  });

  it("exige o registro descritivo antes de enviar", async () => {
    await renderLoaded();
    await pressSave();

    expect(
      await screen.findByText("Escreva o registro descritivo."),
    ).toBeTruthy();
    expect(createSessionEvolution).not.toHaveBeenCalled();
  });

  it("AC-EVO-01-03: acertos maiores que as tentativas bloqueiam o envio", async () => {
    await renderLoaded();
    await type("Tentativas do critério 1", "5");
    await type("Acertos do critério 1", "6");
    await type("Registro descritivo", "Registro.");
    await pressSave();

    expect(
      await screen.findByText("Os acertos não podem passar das tentativas."),
    ).toBeTruthy();
    expect(createSessionEvolution).not.toHaveBeenCalled();
  });

  it("erros do envio por code em português, mantendo o que foi escrito e sem reenviar", async () => {
    vi.mocked(createSessionEvolution).mockRejectedValue(
      new ApiError({
        message: "SESSION_NOT_FINISHED",
        status: 409,
        code: "SESSION_NOT_FINISHED",
      }),
    );
    await renderLoaded();
    await type("Registro descritivo", "Registro.");
    await pressSave();

    expect(
      await screen.findByText(
        "Esta sessão ainda não foi encerrada. Encerre a sessão antes de registrar a evolução.",
      ),
    ).toBeTruthy();
    expect(createSessionEvolution).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Registro descritivo").props.value).toBe(
      "Registro.",
    );
    expect(close).not.toHaveBeenCalled();
  });
});

describe("EvolutionScreen — sair sem salvar (AC-EVO-01-04)", () => {
  function lastAlertButtons(): AlertButton[] {
    return (alertSpy.mock.calls.at(-1)?.[2] ?? []) as AlertButton[];
  }

  it("voltar com alteração não salva pede confirmação e só sai ao confirmar", async () => {
    await renderLoaded();
    await type("Registro descritivo", "Rascunho.");

    await act(async () => fireEvent.press(button("Voltar")));

    expect(alertSpy).toHaveBeenCalledWith(
      "Sair sem salvar a evolução?",
      "As alterações não salvas serão perdidas.",
      expect.any(Array),
    );
    expect(router.replace).not.toHaveBeenCalled();

    const cancel = lastAlertButtons().find(
      (item) => item.text === "Continuar editando",
    );
    expect(cancel?.style).toBe("cancel");
    const discard = lastAlertButtons().find(
      (item) => item.text === "Sair sem salvar",
    );
    await act(async () => discard?.onPress?.());

    expect(router.replace).toHaveBeenCalledWith(HOME);
    expect(createSessionEvolution).not.toHaveBeenCalled();
  });

  it("o Voltar do Android segue a mesma regra", async () => {
    type BackListener = Parameters<typeof BackHandler.addEventListener>[1];
    const handlers: BackListener[] = [];
    const spy = vi
      .spyOn(BackHandler, "addEventListener")
      .mockImplementation((_event, handler) => {
        handlers.push(handler);
        return { remove: vi.fn() };
      });
    await renderLoaded();
    await type("Registro descritivo", "Rascunho.");

    let handled: boolean | null | undefined;
    await act(async () => {
      handled = handlers.at(-1)!({} as Parameters<BackListener>[0]);
    });

    expect(handled).toBe(true);
    expect(alertSpy).toHaveBeenCalledWith(
      "Sair sem salvar a evolução?",
      expect.any(String),
      expect.any(Array),
    );
    expect(router.replace).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("gestos que removem a tela também pedem confirmação", async () => {
    await renderLoaded();
    await type("Registro descritivo", "Rascunho.");

    const listener = navigation.addListener.mock.calls
      .filter(([event]) => event === "beforeRemove")
      .at(-1)?.[1];
    const preventDefault = vi.fn();
    await act(async () =>
      listener?.({ preventDefault, data: { action: { type: "GO_BACK" } } }),
    );

    expect(preventDefault).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith(
      "Sair sem salvar a evolução?",
      expect.any(String),
      expect.any(Array),
    );
    expect(navigation.dispatch).not.toHaveBeenCalled();

    // Confirmado, refaz a navegação original (não força a Início) e libera o fluxo.
    const buttons = (alertSpy.mock.calls.at(-1)?.[2] ?? []) as AlertButton[];
    await act(async () =>
      buttons.find((item) => item.text === "Sair sem salvar")?.onPress?.(),
    );
    expect(navigation.dispatch).toHaveBeenCalledWith({ type: "GO_BACK" });
    expect(router.replace).not.toHaveBeenCalled();
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });

  it("sem alteração, voltar sai direto e libera o fluxo da sessão", async () => {
    await renderLoaded();

    await act(async () => fireEvent.press(button("Voltar")));

    expect(alertSpy).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith(HOME);
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });

  it("remover um critério sugerido também conta como alteração", async () => {
    await renderLoaded();
    await act(async () => fireEvent.press(button("Remover critério 1")));

    await act(async () => fireEvent.press(button("Voltar")));

    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });
});

describe("EvolutionScreen — saída quando aberta pelo hub (from=hub)", () => {
  const renderFromHub = async () => {
    vi.mocked(getEvolutionContext).mockResolvedValue(CONTEXT);
    await render(<EvolutionScreen sessionId={SESSION_ID} from="hub" />);
    await screen.findByLabelText("Registro descritivo");
  };

  it("voltar sem alterações volta à tela de origem e libera o fluxo da sessão", async () => {
    await renderFromHub();
    await act(async () => fireEvent.press(screen.getByLabelText("Voltar")));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });

  it("descartar as alterações volta à tela de origem", async () => {
    await renderFromHub();
    await type("Registro descritivo", "Rascunho.");
    await act(async () => fireEvent.press(screen.getByLabelText("Voltar")));
    const discard = alertSpy.mock.calls[0]![2]!.find(
      (item: AlertButton) => item.text === "Sair sem salvar",
    );
    await act(async () => discard?.onPress?.());

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("sair de um erro de carregamento volta à tela de origem", async () => {
    vi.mocked(getEvolutionContext).mockRejectedValue(
      new ApiError({ message: "x", status: 404, code: "SESSION_NOT_FOUND" }),
    );
    await render(<EvolutionScreen sessionId={SESSION_ID} from="hub" />);
    await act(async () =>
      fireEvent.press(
        await screen.findByRole("button", { name: "Voltar ao início" }),
      ),
    );

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });

  it("sem histórico, mesmo com from=hub, vai à Início", async () => {
    router.canGoBack.mockReturnValue(false);
    await renderFromHub();
    await act(async () => fireEvent.press(screen.getByLabelText("Voltar")));

    expect(router.replace).toHaveBeenCalledWith(HOME);
    expect(router.back).not.toHaveBeenCalled();
  });
});

describe("EvolutionScreen — evolução já existente (AC-EVO-01-06)", () => {
  it("409 EVOLUTION_ALREADY_EXISTS leva ao registro existente sem duplicar", async () => {
    vi.mocked(createSessionEvolution).mockRejectedValue(
      new EvolutionApiError({
        message: "EVOLUTION_ALREADY_EXISTS",
        status: 409,
        code: "EVOLUTION_ALREADY_EXISTS",
        evolutionId: "evolution-9",
      }),
    );
    await renderLoaded();
    await type("Registro descritivo", "Registro.");
    await pressSave();

    expect(await screen.findByText("Evolução já registrada")).toBeTruthy();
    expect(screen.getByText(/nada foi duplicado/)).toBeTruthy();
    expect(createSessionEvolution).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);

    await act(async () => fireEvent.press(button("Ver evolução registrada")));
    expect(router.replace).toHaveBeenCalledWith(RECORD_ROUTE);
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it("contexto com existingEvolutionId não abre o formulário", async () => {
    vi.mocked(getEvolutionContext).mockResolvedValue({
      ...CONTEXT,
      existingEvolutionId: "evolution-9",
    });
    await render(<EvolutionScreen sessionId={SESSION_ID} />);

    expect(await screen.findByText("Evolução já registrada")).toBeTruthy();
    expect(screen.queryByLabelText("Registro descritivo")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Salvar e atualizar prontuário" }),
    ).toBeNull();
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
  });
});
