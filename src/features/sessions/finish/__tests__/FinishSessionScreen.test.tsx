import { beforeEach, describe, expect, it, vi } from "vitest";

import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { createQueryClient } from "@/api/query-client";
import { render } from "@/test-utils/render";
import type { TaskNotebookSession } from "@/api/types";
import { finishSession, listSessionsByStudent } from "@/api/endpoints/session";
import { ApiError } from "@/api/errors";
import { FinishSessionScreen } from "../FinishSessionScreen";

vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));
const replace = vi.fn();
vi.mock("expo-router", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/api/endpoints/session", () => ({
  finishSession: vi.fn(),
  listSessionsByStudent: vi.fn(),
}));

const awaitEvolution = vi.fn();

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
  useSessionFlowStore: () => ({ ...storeState, awaitEvolution }),
}));

const EVOLUTION_ROUTE = {
  pathname: "/evolution/[sessionId]",
  params: { sessionId: "session-1" },
};

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
  awaitEvolution.mockResolvedValue(undefined);
  vi.mocked(finishSession).mockResolvedValue(
    session({ finishedAt: "2026-10-07T12:30:00.000Z" }),
  );
  vi.mocked(listSessionsByStudent).mockResolvedValue([]);
});

describe("FinishSessionScreen — encerramento", () => {
  it("AC-SES-04-01: encerra a sessão uma única vez e segue para a Evolução (G-56)", async () => {
    await render(<FinishSessionScreen />);

    expect(screen.getByText("Leitura de hoje")).toBeTruthy();
    expect(screen.getByText(/Aluno Fictício/)).toBeTruthy();
    expect(screen.getByText(/2 questões/)).toBeTruthy();
    await waitFor(() => expect(finishSession).toHaveBeenCalledTimes(1));
    expect(finishSession).toHaveBeenCalledWith({ sessionId: "session-1" });
    await waitFor(() => expect(awaitEvolution).toHaveBeenCalledTimes(1));
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

    await waitFor(() => expect(awaitEvolution).toHaveBeenCalledTimes(1));
    expect(finishSession).toHaveBeenCalledTimes(1);
  });

  it("timeout no finish: reconcilia pela listagem; sem finishedAt, exige ação explícita", async () => {
    vi.mocked(finishSession).mockRejectedValue(
      new ApiError({ message: "timeout", isTimeout: true }),
    );
    vi.mocked(listSessionsByStudent).mockResolvedValue([session()]);
    await render(<FinishSessionScreen />);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Tentar novamente" }),
      ).toBeTruthy(),
    );
    expect(awaitEvolution).not.toHaveBeenCalled();
    expect(finishSession).toHaveBeenCalledTimes(1);

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" })),
    );
    await waitFor(() => expect(finishSession).toHaveBeenCalledTimes(2));
  });

  it("ao encerrar, invalida sessões, análise e atendimentos (AC-AGE-04-03)", async () => {
    const queryClient = createQueryClient();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    await render(<FinishSessionScreen />, { queryClient });

    await waitFor(() => expect(awaitEvolution).toHaveBeenCalledTimes(1));
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: ["task-notebook-session"],
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["student-analysis"] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["appointment"] });
  });

  it("sem sessão em andamento volta para o início", async () => {
    storeState.sessionId = null;
    storeState.step = "idle";
    await render(<FinishSessionScreen />);

    expect(replace).toHaveBeenCalledWith("/");
    expect(finishSession).not.toHaveBeenCalled();
  });
});

describe("FinishSessionScreen — sessão já encerrada (EVO-01)", () => {
  beforeEach(() => {
    storeState.step = "awaitingEvolution";
  });

  it("vai direto para a Evolução da sessão, sem chamar finish de novo nem mostrar a observação", async () => {
    await render(<FinishSessionScreen />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith(EVOLUTION_ROUTE));
    expect(finishSession).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Registro descritivo")).toBeNull();
    expect(screen.queryByRole("button", { name: "Pular" })).toBeNull();
  });
});
