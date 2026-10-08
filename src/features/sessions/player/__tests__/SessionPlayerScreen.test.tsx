import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { createQueryClient } from "@/api/query-client";
import { getTaskById, listTaskNotebooks } from "@/api/endpoints/content";
import { answerSession } from "@/api/endpoints/session";
import { render } from "@/test-utils/render";
import { SessionPlayerScreen } from "../SessionPlayerScreen";

const replace = vi.fn();
vi.mock("expo-router", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/api/endpoints/content", () => ({
  getTaskById: vi.fn(),
  listTaskNotebooks: vi.fn(),
  listTaskGroupsByEducator: vi.fn(),
}));
vi.mock("@/api/endpoints/session", () => ({ answerSession: vi.fn() }));
vi.mock("@/components/media/AudioPlayer", () => ({
  AudioPlayer: () => null,
}));

const confirmAnswer = vi.fn().mockResolvedValue(undefined);
const markAnswerPending = vi.fn().mockResolvedValue(undefined);
const markAnswerConflict = vi.fn().mockResolvedValue(undefined);
const finish = vi.fn().mockResolvedValue(undefined);

let storeState: {
  content: {
    kind: "notebook" | "group" | "task";
    id: string;
    name: string;
  } | null;
  sessionId: string | null;
  activityIndex: number;
  confirmedAnswers: unknown[];
} = {
  content: { kind: "notebook", id: "notebook-1", name: "Leitura" },
  sessionId: "session-1",
  activityIndex: 0,
  confirmedAnswers: [],
};

vi.mock("@/stores/session-flow", () => ({
  useSessionFlowStore: () => ({
    ...storeState,
    confirmAnswer,
    markAnswerPending,
    markAnswerConflict,
    finish,
  }),
}));

function renderPlayer() {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return render(<SessionPlayerScreen />, { queryClient });
}

beforeEach(() => {
  vi.clearAllMocks();
  storeState = {
    content: { kind: "notebook", id: "notebook-1", name: "Leitura" },
    sessionId: "session-1",
    activityIndex: 0,
    confirmedAnswers: [],
  };
  vi.mocked(listTaskNotebooks).mockResolvedValue([
    {
      notebook: {
        id: "notebook-1",
        educator: "educator-1",
        tasks: ["task-1"],
        category: "reading",
        description: "Leitura",
        createdAt: "2026-10-07T12:00:00.000Z",
        taskGroupsIds: [],
      },
      taskGroups: [],
    },
  ]);
  vi.mocked(getTaskById).mockResolvedValue({
    id: "task-1",
    category: "reading",
    type: "multipleChoice",
    prompt: "Escolha uma letra",
    alternatives: [
      { id: "alternative-1", text: "A", isCorrect: true },
      { id: "alternative-2", text: "B", isCorrect: false },
    ],
    createdAt: "2026-10-07T12:00:00.000Z",
  });
  vi.mocked(answerSession).mockResolvedValue({
    id: "session-1",
    studentId: "student-1",
    educatorId: "educator-1",
    name: "Sessão",
    startedAt: "2026-10-07T12:00:00.000Z",
    answers: [],
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("SessionPlayerScreen", () => {
  it("AC-SES-02-01: envia uma resposta uma única vez e mostra confirmação neutra", async () => {
    await renderPlayer();
    await waitFor(() =>
      expect(screen.getByText("Escolha uma letra")).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "A" }));
      fireEvent.press(screen.getByRole("button", { name: "A" }));
    });

    await waitFor(() => expect(answerSession).toHaveBeenCalledTimes(1));
    expect(confirmAnswer).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Resposta registrada")).toBeTruthy();
    expect(screen.queryByText("Correta")).toBeNull();

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Próxima" })),
    );
    expect(finish).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Encerrar sessão" },
    });
  });

  it("AC-SES-02-03: falha de rede fica pendente e só reenvia por ação manual", async () => {
    vi.mocked(answerSession).mockRejectedValueOnce(
      Object.assign(new Error("offline"), { isAxiosError: true }),
    );
    await renderPlayer();
    await waitFor(() =>
      expect(screen.getByText("Escolha uma letra")).toBeTruthy(),
    );

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "A" })),
    );

    await waitFor(() => expect(markAnswerPending).toHaveBeenCalledTimes(1));
    expect(
      screen.getByRole("button", { name: "Tentar reenviar" }),
    ).toBeTruthy();
    expect(answerSession).toHaveBeenCalledTimes(1);
  });

  it("AC-SES-02-02: TASK_ALREADY_ANSWERED trata a tarefa como já respondida com mensagem neutra", async () => {
    vi.mocked(answerSession).mockRejectedValueOnce(
      Object.assign(new Error("TASK_ALREADY_ANSWERED"), {
        isAxiosError: true,
        response: { status: 400, data: { message: "TASK_ALREADY_ANSWERED" } },
      }),
    );
    await renderPlayer();
    await waitFor(() =>
      expect(screen.getByText("Escolha uma letra")).toBeTruthy(),
    );

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "A" })),
    );

    await waitFor(() => expect(markAnswerConflict).toHaveBeenCalledTimes(1));
    expect(markAnswerPending).not.toHaveBeenCalled();
    expect(screen.getByText("Resposta registrada")).toBeTruthy();
    expect(screen.queryByText("Correta")).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Tentar reenviar" }),
    ).toBeNull();
  });

  it("exibe o estado de carregamento das atividades", async () => {
    let resolveNotebooks: (
      value: Awaited<ReturnType<typeof listTaskNotebooks>>,
    ) => void = () => {};
    vi.mocked(listTaskNotebooks).mockReturnValue(
      new Promise((resolve) => {
        resolveNotebooks = resolve;
      }),
    );
    await renderPlayer();
    expect(screen.getByText("Carregando atividades...")).toBeTruthy();
    await act(async () => resolveNotebooks([]));
  });

  it("exibe erro ao carregar atividades com opção de tentar novamente", async () => {
    vi.mocked(listTaskNotebooks).mockRejectedValue(new Error("falhou"));
    await renderPlayer();
    await waitFor(() =>
      expect(
        screen.getByText("Não foi possível carregar as atividades."),
      ).toBeTruthy(),
    );
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeTruthy();
  });

  it("encerra a sessão quando todas as tarefas já estão confirmadas ao abrir", async () => {
    storeState = {
      content: { kind: "notebook", id: "notebook-1", name: "Leitura" },
      sessionId: "session-1",
      activityIndex: 0,
      confirmedAnswers: [
        {
          taskId: "task-1",
          selectedAlternativeId: "alternative-1",
          isCorrect: true,
          timeToAnswer: 100,
          answeredAt: "2026-10-07T12:00:00.000Z",
        },
      ],
    };
    await renderPlayer();
    await waitFor(() =>
      expect(
        screen.getByText("Não há atividades pendentes nesta sessão."),
      ).toBeTruthy(),
    );

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Encerrar sessão" })),
    );
    expect(finish).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Encerrar sessão" },
    });
  });

  it("volta para /session/student quando não há sessão na store", async () => {
    storeState = {
      content: null,
      sessionId: null,
      activityIndex: 0,
      confirmedAnswers: [],
    };
    await renderPlayer();
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/session/student"),
    );
  });
});
