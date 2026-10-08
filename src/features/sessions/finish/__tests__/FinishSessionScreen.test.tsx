import { beforeEach, describe, expect, it, vi } from "vitest";

import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { render } from "@/test-utils/render";
import type { TaskNotebookSession } from "@/api/types";
import {
  addSessionObservation,
  finishSession,
  listSessionsByStudent,
} from "@/api/endpoints/session";
import { ApiError } from "@/api/errors";
import { FinishSessionScreen } from "../FinishSessionScreen";

const replace = vi.fn();
vi.mock("expo-router", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/api/endpoints/session", () => ({
  finishSession: vi.fn(),
  addSessionObservation: vi.fn(),
  listSessionsByStudent: vi.fn(),
}));

const awaitObservation = vi.fn().mockResolvedValue(undefined);
const close = vi.fn().mockResolvedValue(undefined);
const hydrate = vi.fn().mockResolvedValue(undefined);

type StoreState = {
  step: string;
  sessionId: string | null;
  sessionName: string | null;
  educatorId: string | null;
  student: { id: string; name: string } | null;
  confirmedAnswers: unknown[];
  pendingAnswers: unknown[];
  conflictedAnswers: unknown[];
};

let storeState: StoreState;

vi.mock("@/stores/session-flow", () => ({
  useSessionFlowStore: () => ({
    ...storeState,
    awaitObservation,
    close,
    hydrate,
  }),
}));

function session(
  overrides: Partial<TaskNotebookSession> = {},
): TaskNotebookSession {
  return {
    id: "session-1",
    studentId: "student-1",
    educatorId: "educator-1",
    name: "Leitura de hoje",
    startedAt: "2026-10-07T12:00:00.000Z",
    answers: [],
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  storeState = {
    step: "finishing",
    sessionId: "session-1",
    sessionName: "Leitura de hoje",
    educatorId: "educator-1",
    student: { id: "student-1", name: "Aluno Fictício" },
    confirmedAnswers: [{}, {}],
    pendingAnswers: [],
    conflictedAnswers: [],
  };
  vi.mocked(finishSession).mockResolvedValue(
    session({ finishedAt: "2026-10-07T12:30:00.000Z" }),
  );
  vi.mocked(addSessionObservation).mockResolvedValue(
    session({ finishedAt: "2026-10-07T12:30:00.000Z", observation: "ok" }),
  );
  vi.mocked(listSessionsByStudent).mockResolvedValue([]);
});

describe("FinishSessionScreen — encerramento", () => {
  it("AC-SES-04-01: encerra a sessão uma única vez e segue para o registro", async () => {
    await render(<FinishSessionScreen />);

    await waitFor(() => expect(finishSession).toHaveBeenCalledTimes(1));
    expect(finishSession).toHaveBeenCalledWith({ sessionId: "session-1" });
    await waitFor(() => expect(awaitObservation).toHaveBeenCalledTimes(1));
  });

  it("não encerra enquanto houver respostas pendentes ou em conflito", async () => {
    storeState.pendingAnswers = [{ taskId: "task-1" }];
    await render(<FinishSessionScreen />);

    expect(finishSession).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/respostas pendentes/i)).toBeTruthy();
  });

  it("SESSION_ALREADY_FINISHED: confirma pela listagem e segue sem reenviar", async () => {
    vi.mocked(finishSession).mockRejectedValue(
      new ApiError({
        message: "SESSION_ALREADY_FINISHED",
        status: 400,
        code: "SESSION_ALREADY_FINISHED",
      }),
    );
    vi.mocked(listSessionsByStudent).mockResolvedValue([
      session({ finishedAt: "2026-10-07T12:30:00.000Z" }),
    ]);
    await render(<FinishSessionScreen />);

    await waitFor(() => expect(awaitObservation).toHaveBeenCalledTimes(1));
    expect(finishSession).toHaveBeenCalledTimes(1);
  });

  it("timeout no finish: reconcilia pela listagem; sem finishedAt, exige ação explícita", async () => {
    vi.mocked(finishSession).mockRejectedValue(
      new ApiError({ message: "timeout", isTimeout: true }),
    );
    vi.mocked(listSessionsByStudent).mockResolvedValue([session()]);
    await render(<FinishSessionScreen />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeTruthy(),
    );
    expect(awaitObservation).not.toHaveBeenCalled();
    expect(finishSession).toHaveBeenCalledTimes(1);

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" })),
    );
    await waitFor(() => expect(finishSession).toHaveBeenCalledTimes(2));
  });

  it("sem sessão em andamento volta para o início", async () => {
    storeState.sessionId = null;
    storeState.step = "idle";
    await render(<FinishSessionScreen />);

    expect(replace).toHaveBeenCalledWith("/");
    expect(finishSession).not.toHaveBeenCalled();
  });
});

describe("FinishSessionScreen — registro descritivo", () => {
  beforeEach(() => {
    storeState.step = "awaitingObservation";
  });

  it("mostra o resumo da sessão e não chama finish de novo", async () => {
    await render(<FinishSessionScreen />);

    expect(screen.getByText("Leitura de hoje")).toBeTruthy();
    expect(screen.getByText(/Aluno Fictício/)).toBeTruthy();
    expect(screen.getByText(/2 questões/)).toBeTruthy();
    expect(finishSession).not.toHaveBeenCalled();
  });

  it("AC-SES-04-02: salvar envia a observação uma vez e abre o relatório", async () => {
    await render(<FinishSessionScreen />);

    await fireEvent.changeText(
      screen.getByLabelText("Registro descritivo"),
      "  Boa participação.  ",
    );
    await act(async () => {
      fireEvent.press(
        screen.getByRole("button", { name: "Salvar e atualizar prontuário" }),
      );
      fireEvent.press(
        screen.getByRole("button", { name: "Salvar e atualizar prontuário" }),
      );
    });

    await waitFor(() => expect(addSessionObservation).toHaveBeenCalledTimes(1));
    expect(addSessionObservation).toHaveBeenCalledWith({
      sessionId: "session-1",
      observation: "Boa participação.",
    });
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(hydrate).toHaveBeenCalledWith("educator-1");
    expect(replace).toHaveBeenCalledWith("/reports/session/session-1");
  });

  it("não permite salvar com o registro vazio", async () => {
    await render(<FinishSessionScreen />);

    const save = screen.getByRole("button", {
      name: "Salvar e atualizar prontuário",
    });
    expect(save.props.accessibilityState?.disabled).toBe(true);
    await act(async () => fireEvent.press(save));
    expect(addSessionObservation).not.toHaveBeenCalled();
  });

  it("Pular fecha o fluxo sem enviar observação e abre o relatório", async () => {
    await render(<FinishSessionScreen />);

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Pular" })),
    );

    expect(addSessionObservation).not.toHaveBeenCalled();
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(replace).toHaveBeenCalledWith("/reports/session/session-1");
  });

  it("falha ao salvar mostra o erro, mantém o texto e não reenvia sozinho", async () => {
    vi.mocked(addSessionObservation).mockRejectedValue(
      new ApiError({
        message: "INTERNAL_ERROR",
        status: 500,
        code: "INTERNAL_ERROR",
      }),
    );
    await render(<FinishSessionScreen />);

    await fireEvent.changeText(screen.getByLabelText("Registro descritivo"), "Texto");
    await act(async () =>
      fireEvent.press(
        screen.getByRole("button", { name: "Salvar e atualizar prontuário" }),
      ),
    );

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(addSessionObservation).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Registro descritivo").props.value).toBe(
      "Texto",
    );
  });

  it("timeout ao salvar: se a listagem já tem a observação, conclui sem reenviar", async () => {
    vi.mocked(addSessionObservation).mockRejectedValue(
      new ApiError({ message: "network", isNetworkError: true }),
    );
    vi.mocked(listSessionsByStudent).mockResolvedValue([
      session({
        finishedAt: "2026-10-07T12:30:00.000Z",
        observation: "Texto",
      }),
    ]);
    await render(<FinishSessionScreen />);

    await fireEvent.changeText(screen.getByLabelText("Registro descritivo"), "Texto");
    await act(async () =>
      fireEvent.press(
        screen.getByRole("button", { name: "Salvar e atualizar prontuário" }),
      ),
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/reports/session/session-1"),
    );
    expect(addSessionObservation).toHaveBeenCalledTimes(1);
  });
});
