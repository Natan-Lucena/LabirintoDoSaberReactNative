import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { createQueryClient } from "@/api/query-client";
import { getTaskById, listTaskNotebooks } from "@/api/endpoints/content";
import { answerSession, submitActivityResult } from "@/api/endpoints/session";
import type { ActivityResult, Task } from "@/api/types";
import { render } from "@/test-utils/render";
import { SessionPlayerScreen } from "../SessionPlayerScreen";

const replace = vi.fn();
vi.mock("expo-router", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/api/endpoints/content", () => ({
  getTaskById: vi.fn(),
  listTaskNotebooks: vi.fn(),
  listTaskGroupsByEducator: vi.fn(),
}));
vi.mock("@/api/endpoints/session", () => ({
  answerSession: vi.fn(),
  submitActivityResult: vi.fn(),
}));
vi.mock("@/components/media/AudioPlayer", () => ({
  AudioPlayer: () => null,
}));

const confirmAnswer = vi.fn().mockResolvedValue(undefined);
const markAnswerPending = vi.fn().mockResolvedValue(undefined);
const markAnswerConflict = vi.fn().mockResolvedValue(undefined);
const confirmActivityResult = vi.fn().mockResolvedValue(undefined);
const markActivityResultPending = vi.fn().mockResolvedValue(undefined);
const clearActivityResultPending = vi.fn().mockResolvedValue(undefined);
const finish = vi.fn().mockResolvedValue(undefined);

interface StoreState {
  content: { kind: "notebook" | "group" | "task"; id: string; name: string };
  sessionId: string;
  activityIndex: number;
  confirmedAnswers: unknown[];
  confirmedActivityResults: string[];
  pendingActivityResults: unknown[];
}

let storeState: StoreState;

vi.mock("@/stores/session-flow", () => ({
  useSessionFlowStore: () => ({
    ...storeState,
    confirmAnswer,
    markAnswerPending,
    markAnswerConflict,
    confirmActivityResult,
    markActivityResultPending,
    clearActivityResultPending,
    finish,
  }),
}));

const WORD_TASK: Task = {
  id: "task-word",
  category: "writing",
  type: "wordBuilder",
  prompt: "Forme a palavra",
  alternatives: [],
  createdAt: "2026-11-25T12:00:00.000Z",
  format: "INTERACTIVE",
  content: { kind: "wordBuilder", word: "AB" },
};

const QUIZ_TASK: Task = {
  id: "task-quiz",
  category: "reading",
  type: "multipleChoice",
  prompt: "Escolha uma letra",
  alternatives: [
    { id: "alternative-1", text: "A", isCorrect: true },
    { id: "alternative-2", text: "B", isCorrect: false },
  ],
  createdAt: "2026-11-25T12:00:00.000Z",
};

const PRINTABLE_TASK: Task = {
  id: "task-print",
  category: "writing",
  type: "printable",
  prompt: "Complete a frase",
  alternatives: [],
  createdAt: "2026-11-25T12:00:00.000Z",
  format: "PRINTABLE",
  content: {
    kind: "printable",
    title: "Complete a frase",
    instructions: "Escreva a palavra.",
    layout: "LIST",
    items: [{ id: "i1", text: "O ___ é azul." }],
  },
};

const TASKS: Record<string, Task> = {
  [WORD_TASK.id]: WORD_TASK,
  [QUIZ_TASK.id]: QUIZ_TASK,
  [PRINTABLE_TASK.id]: PRINTABLE_TASK,
};

const REGISTERED: ActivityResult = {
  id: "result-1",
  sessionId: "session-1",
  taskId: "task-word",
  taskType: "wordBuilder",
  completed: true,
  correct: true,
  attempts: 1,
  errors: 0,
  durationMs: 1000,
  recordedAt: "2026-11-25T12:01:00.000Z",
};

const NETWORK_MESSAGE =
  "Não foi possível confirmar o resultado. Tente reenviar quando a conexão voltar.";
const GENERIC_MESSAGE =
  "Não foi possível registrar o resultado. Tente reenviar.";

function setNotebook(taskIds: string[]) {
  vi.mocked(listTaskNotebooks).mockResolvedValue([
    {
      notebook: {
        id: "notebook-1",
        educator: "educator-1",
        tasks: taskIds,
        category: "reading",
        description: "Leitura",
        createdAt: "2026-11-25T12:00:00.000Z",
        taskGroupsIds: [],
      },
      taskGroups: [],
    },
  ]);
}

function apiFailure(status: number, code: string) {
  return Object.assign(new Error(code), {
    isAxiosError: true,
    response: { status, data: { message: code } },
  });
}

function networkFailure() {
  return Object.assign(new Error("offline"), { isAxiosError: true });
}

function renderPlayer() {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return render(<SessionPlayerScreen />, { queryClient });
}

async function press(name: string) {
  await act(async () => fireEvent.press(screen.getByRole("button", { name })));
}

async function openGame() {
  await renderPlayer();
  await waitFor(() => expect(screen.getByText("Forme a palavra")).toBeTruthy());
}

/** Monta "AB" sem erros: o jogo reporta o resultado antes de `onSolved`. */
async function playWordCorrectly() {
  await press("Letra A");
  await press("Letra B");
}

beforeEach(() => {
  vi.clearAllMocks();
  storeState = {
    content: { kind: "notebook", id: "notebook-1", name: "Leitura" },
    sessionId: "session-1",
    activityIndex: 0,
    confirmedAnswers: [],
    confirmedActivityResults: [],
    pendingActivityResults: [],
  };
  setNotebook([WORD_TASK.id, QUIZ_TASK.id]);
  vi.mocked(getTaskById).mockImplementation(async (id: string) => TASKS[id]!);
  vi.mocked(submitActivityResult).mockResolvedValue(REGISTERED);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SessionPlayerScreen: jogo na sessão (EVO-03)", () => {
  it("AC-EVO-03-01: renderiza o jogo, envia o resultado uma vez e libera a Próxima", async () => {
    await openGame();
    expect(screen.getByText("Atividade 1 de 2")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Próxima" })).toBeNull();

    await playWordCorrectly();

    await waitFor(() => expect(submitActivityResult).toHaveBeenCalledTimes(1));
    expect(submitActivityResult).toHaveBeenCalledWith({
      sessionId: "session-1",
      taskId: "task-word",
      completed: true,
      correct: true,
      attempts: 1,
      errors: 0,
      durationMs: expect.any(Number),
    });
    expect(confirmActivityResult).toHaveBeenCalledTimes(1);
    expect(confirmActivityResult).toHaveBeenCalledWith("task-word");
    expect(screen.getByText("Resultado registrado")).toBeTruthy();
    // G-65: nada de acerto automático nem de resposta de múltipla escolha.
    expect(answerSession).not.toHaveBeenCalled();
    expect(confirmAnswer).not.toHaveBeenCalled();
    expect(screen.queryByText("Correta")).toBeNull();

    await press("Próxima");
    expect(screen.getByText("Atividade 2 de 2")).toBeTruthy();
    expect(screen.getByText("Escolha uma letra")).toBeTruthy();
    expect(submitActivityResult).toHaveBeenCalledTimes(1);
  });

  it("envia os erros do jogo no resultado", async () => {
    await openGame();

    await press("Letra B");
    await press("Letra A");
    await press("Tentar novamente");
    await playWordCorrectly();

    await waitFor(() => expect(submitActivityResult).toHaveBeenCalledTimes(1));
    expect(submitActivityResult).toHaveBeenCalledWith(
      expect.objectContaining({ correct: false, errors: 1, attempts: 2 }),
    );
  });

  it("o quiz do mesmo caderno segue o fluxo de resposta, sem enviar resultado de jogo", async () => {
    setNotebook([QUIZ_TASK.id, WORD_TASK.id]);
    vi.mocked(answerSession).mockResolvedValue({} as never);
    await renderPlayer();
    await waitFor(() =>
      expect(screen.getByText("Escolha uma letra")).toBeTruthy(),
    );

    await press("A");
    await waitFor(() => expect(answerSession).toHaveBeenCalledTimes(1));
    await press("Próxima");

    expect(screen.getByText("Forme a palavra")).toBeTruthy();
    expect(submitActivityResult).not.toHaveBeenCalled();
  });

  it("AC-EVO-03-01: falha de rede mostra 'Tentar reenviar', sem reenvio automático", async () => {
    vi.mocked(submitActivityResult).mockRejectedValueOnce(networkFailure());
    await openGame();

    await playWordCorrectly();

    await waitFor(() => expect(markActivityResultPending).toHaveBeenCalled());
    expect(markActivityResultPending).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: "session-1", taskId: "task-word" }),
    );
    expect(screen.getByText(NETWORK_MESSAGE)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Tentar reenviar" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Próxima" })).toBeNull();
    expect(confirmActivityResult).not.toHaveBeenCalled();
    expect(submitActivityResult).toHaveBeenCalledTimes(1);

    // O reenvio é manual e usa o mesmo corpo.
    const firstBody = vi.mocked(submitActivityResult).mock.calls[0]![0];
    await press("Tentar reenviar");

    await waitFor(() => expect(confirmActivityResult).toHaveBeenCalledTimes(1));
    expect(submitActivityResult).toHaveBeenCalledTimes(2);
    expect(vi.mocked(submitActivityResult).mock.calls[1]![0]).toEqual(
      firstBody,
    );
    expect(screen.getByText("Resultado registrado")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Tentar reenviar" }),
    ).toBeNull();
  });

  it("timeout também fica pendente com a mensagem de conexão", async () => {
    vi.mocked(submitActivityResult).mockRejectedValueOnce(
      Object.assign(new Error("timeout"), {
        isAxiosError: true,
        code: "ECONNABORTED",
      }),
    );
    await openGame();

    await playWordCorrectly();

    await waitFor(() => expect(screen.getByText(NETWORK_MESSAGE)).toBeTruthy());
    expect(markActivityResultPending).toHaveBeenCalledTimes(1);
  });

  it("falha repetida no reenvio mantém uma única pendência e o botão", async () => {
    vi.mocked(submitActivityResult)
      .mockRejectedValueOnce(networkFailure())
      .mockRejectedValueOnce(networkFailure());
    await openGame();
    await playWordCorrectly();
    await waitFor(() => expect(markActivityResultPending).toHaveBeenCalled());

    await press("Tentar reenviar");

    await waitFor(() => expect(submitActivityResult).toHaveBeenCalledTimes(2));
    expect(screen.getByText(NETWORK_MESSAGE)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Tentar reenviar" }),
    ).toBeTruthy();
    expect(confirmActivityResult).not.toHaveBeenCalled();
  });

  it("erro 5xx fica pendente com a mensagem genérica", async () => {
    vi.mocked(submitActivityResult).mockRejectedValueOnce(
      apiFailure(500, "INTERNAL_ERROR"),
    );
    await openGame();

    await playWordCorrectly();

    await waitFor(() => expect(screen.getByText(GENERIC_MESSAGE)).toBeTruthy());
    expect(markActivityResultPending).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Tentar reenviar" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Próxima" })).toBeNull();
  });

  it("AC-EVO-03-05: RESULT_ALREADY_EXISTS conta como registrado", async () => {
    vi.mocked(submitActivityResult).mockRejectedValueOnce(
      apiFailure(409, "RESULT_ALREADY_EXISTS"),
    );
    await openGame();

    await playWordCorrectly();

    await waitFor(() => expect(confirmActivityResult).toHaveBeenCalledTimes(1));
    expect(confirmActivityResult).toHaveBeenCalledWith("task-word");
    expect(markActivityResultPending).not.toHaveBeenCalled();
    expect(screen.getByText("Resultado registrado")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Tentar reenviar" }),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Próxima" })).toBeTruthy();
  });

  it("TASK_NOT_IN_NOTEBOOK não fica pendente e libera a Próxima", async () => {
    vi.mocked(submitActivityResult).mockRejectedValueOnce(
      apiFailure(400, "TASK_NOT_IN_NOTEBOOK"),
    );
    await openGame();

    await playWordCorrectly();

    await waitFor(() =>
      expect(
        screen.getByText("Esta atividade não faz parte do caderno da sessão."),
      ).toBeTruthy(),
    );
    expect(markActivityResultPending).not.toHaveBeenCalled();
    expect(confirmActivityResult).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Tentar reenviar" }),
    ).toBeNull();
    await press("Próxima");
    expect(screen.getByText("Atividade 2 de 2")).toBeTruthy();
  });

  it.each([
    ["USE_ANSWER_ROUTE", "Esta atividade não pode ser registrada como jogo."],
    [
      "PRINTABLE_NOT_PLAYABLE",
      "Atividades imprimíveis não entram em cadernos, grupos ou sessões.",
    ],
  ])(
    "%s mostra a mensagem do servidor, sem pendência, e libera a Próxima",
    async (code, message) => {
      vi.mocked(submitActivityResult).mockRejectedValueOnce(
        apiFailure(400, code),
      );
      await openGame();

      await playWordCorrectly();

      await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
      expect(markActivityResultPending).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("button", { name: "Tentar reenviar" }),
      ).toBeNull();
      expect(screen.getByRole("button", { name: "Próxima" })).toBeTruthy();
    },
  );

  it.each([
    [403, "UNAUTHORIZED", "Você não tem acesso a este item."],
    [404, "TASK_NOT_FOUND", "Esta atividade não está mais disponível."],
    [404, "STUDENT_NOT_FOUND", "Esta atividade não está mais disponível."],
  ])(
    "%i %s é definitivo: sem pendência persistida e libera a Próxima",
    async (status, code, message) => {
      vi.mocked(submitActivityResult).mockRejectedValueOnce(
        apiFailure(status, code),
      );
      await openGame();

      await playWordCorrectly();

      await waitFor(() => expect(screen.getByText(message)).toBeTruthy());
      expect(markActivityResultPending).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("button", { name: "Tentar reenviar" }),
      ).toBeNull();
      expect(screen.getByRole("button", { name: "Próxima" })).toBeTruthy();
    },
  );

  it("SESSION_ALREADY_FINISHED leva ao encerramento sem registrar", async () => {
    vi.mocked(submitActivityResult).mockRejectedValueOnce(
      apiFailure(409, "SESSION_ALREADY_FINISHED"),
    );
    await openGame();

    await playWordCorrectly();

    await waitFor(() =>
      expect(
        screen.getByText(
          "A sessão já foi encerrada; o resultado não foi registrado.",
        ),
      ).toBeTruthy(),
    );
    expect(markActivityResultPending).not.toHaveBeenCalled();
    expect(confirmActivityResult).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Tentar reenviar" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Próxima" })).toBeNull();

    await press("Ir para o encerramento");
    expect(finish).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/session/finish");
  });

  it("SESSION_NOT_FOUND segue o erro genérico, sem pendência persistida", async () => {
    vi.mocked(submitActivityResult).mockRejectedValueOnce(
      apiFailure(404, "SESSION_NOT_FOUND"),
    );
    await openGame();

    await playWordCorrectly();

    await waitFor(() => expect(screen.getByText(GENERIC_MESSAGE)).toBeTruthy());
    expect(markActivityResultPending).not.toHaveBeenCalled();
    expect(confirmActivityResult).not.toHaveBeenCalled();
  });

  it("um erro recusado no reenvio limpa a pendência guardada", async () => {
    vi.mocked(submitActivityResult)
      .mockRejectedValueOnce(networkFailure())
      .mockRejectedValueOnce(apiFailure(400, "TASK_NOT_IN_NOTEBOOK"));
    await openGame();
    await playWordCorrectly();
    await waitFor(() => expect(markActivityResultPending).toHaveBeenCalled());

    await press("Tentar reenviar");

    await waitFor(() =>
      expect(clearActivityResultPending).toHaveBeenCalledWith("task-word"),
    );
    expect(screen.getByRole("button", { name: "Próxima" })).toBeTruthy();
  });

  it("AC-EVO-03-04: a retomada pula o jogo com resultado confirmado", async () => {
    storeState = {
      ...storeState,
      activityIndex: 1,
      confirmedActivityResults: ["task-word"],
    };

    await renderPlayer();

    await waitFor(() =>
      expect(screen.getByText("Escolha uma letra")).toBeTruthy(),
    );
    expect(screen.getByText("Atividade 2 de 2")).toBeTruthy();
    expect(screen.queryByText("Forme a palavra")).toBeNull();
    expect(submitActivityResult).not.toHaveBeenCalled();
  });

  it("a retomada considera juntas as respostas e os resultados confirmados", async () => {
    setNotebook([WORD_TASK.id, QUIZ_TASK.id, "task-quiz-2"]);
    TASKS["task-quiz-2"] = {
      ...QUIZ_TASK,
      id: "task-quiz-2",
      prompt: "Terceira",
    };
    storeState = {
      ...storeState,
      activityIndex: 2,
      confirmedActivityResults: ["task-word"],
      confirmedAnswers: [
        {
          taskId: "task-quiz",
          selectedAlternativeId: "alternative-1",
          isCorrect: true,
          timeToAnswer: 2,
          answeredAt: "2026-11-25T12:01:00.000Z",
        },
      ],
    };

    await renderPlayer();

    await waitFor(() => expect(screen.getByText("Terceira")).toBeTruthy());
    expect(screen.getByText("Atividade 3 de 3")).toBeTruthy();
    delete TASKS["task-quiz-2"];
  });

  it("AC-EVO-03-04: pendência na retomada mostra o jogo como terminado, com 'Tentar reenviar'", async () => {
    const pending = {
      sessionId: "session-1",
      taskId: "task-word",
      completed: true,
      correct: false,
      attempts: 2,
      errors: 1,
      durationMs: 5000,
    };
    storeState = { ...storeState, pendingActivityResults: [pending] };

    await renderPlayer();

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Tentar reenviar" }),
      ).toBeTruthy(),
    );
    expect(screen.getByText(NETWORK_MESSAGE)).toBeTruthy();
    // Não pede para jogar de novo.
    expect(screen.queryByRole("button", { name: "Letra A" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Próxima" })).toBeNull();
    expect(submitActivityResult).not.toHaveBeenCalled();

    await press("Tentar reenviar");

    await waitFor(() => expect(submitActivityResult).toHaveBeenCalledTimes(1));
    expect(submitActivityResult).toHaveBeenCalledWith(pending);
    await waitFor(() =>
      expect(confirmActivityResult).toHaveBeenCalledWith("task-word"),
    );
    expect(screen.getByText("Resultado registrado")).toBeTruthy();
  });

  it("tipo imprimível vira 'Tipo de atividade indisponível' e 'Pular' avança sem registro", async () => {
    setNotebook([PRINTABLE_TASK.id, QUIZ_TASK.id]);
    await renderPlayer();

    await waitFor(() =>
      expect(screen.getByText("Tipo de atividade indisponível")).toBeTruthy(),
    );
    expect(screen.queryByRole("button", { name: "Próxima" })).toBeNull();

    await press("Pular");

    expect(screen.getByText("Atividade 2 de 2")).toBeTruthy();
    expect(screen.getByText("Escolha uma letra")).toBeTruthy();
    expect(submitActivityResult).not.toHaveBeenCalled();
    expect(answerSession).not.toHaveBeenCalled();
  });

  it("'Pular' na última atividade encerra a sessão", async () => {
    setNotebook([PRINTABLE_TASK.id]);
    await renderPlayer();
    await waitFor(() =>
      expect(screen.getByText("Tipo de atividade indisponível")).toBeTruthy(),
    );

    await press("Pular");

    expect(finish).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/session/finish");
  });

  it("o jogo na última posição oferece 'Encerrar sessão' depois do registro", async () => {
    setNotebook([WORD_TASK.id]);
    await openGame();

    await playWordCorrectly();
    await waitFor(() => expect(confirmActivityResult).toHaveBeenCalled());

    await press("Encerrar sessão");
    expect(finish).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith("/session/finish");
  });

  it("jogo com conteúdo incompleto libera 'Pular' e não envia resultado", async () => {
    TASKS["task-word"] = { ...WORD_TASK, content: undefined };
    try {
      await renderPlayer();
      await waitFor(() =>
        expect(
          screen.getByText("Esta atividade está incompleta."),
        ).toBeTruthy(),
      );
      await press("Pular");
      expect(screen.getByText("Atividade 2 de 2")).toBeTruthy();
      expect(submitActivityResult).not.toHaveBeenCalled();
    } finally {
      TASKS["task-word"] = WORD_TASK;
    }
  });
});
