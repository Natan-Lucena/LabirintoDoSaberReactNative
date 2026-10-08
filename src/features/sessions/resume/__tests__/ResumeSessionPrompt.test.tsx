import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMe } from "@/api/endpoints/educator";
import { listSessionsByStudent } from "@/api/endpoints/session";
import type { Student, TaskNotebookSession } from "@/api/types";
import { activateEducator } from "@/storage/mmkv";
import { useAuthStore } from "@/stores/auth";
import {
  initialSessionFlowData,
  useSessionFlowStore,
  type SessionFlowData,
} from "@/stores/session-flow";
import { render } from "@/test-utils/render";
import { ResumeSessionPrompt } from "../ResumeSessionPrompt";

const replace = vi.fn();
vi.mock("expo-router", () => ({ useRouter: () => ({ replace }) }));
vi.mock("@/api/endpoints/educator", () => ({ getMe: vi.fn() }));
vi.mock("@/api/endpoints/session", () => ({ listSessionsByStudent: vi.fn() }));
vi.mock("@/storage/mmkv", () => ({ activateEducator: vi.fn() }));

const STUDENT = { id: "student-1", name: "Aluno Fictício" } as Student;

const hydrate = vi.fn();
const finish = vi.fn();
let persisted: Partial<SessionFlowData>;

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
  persisted = {
    step: "running",
    educatorId: "educator-1",
    student: STUDENT,
    sessionName: "Leitura de hoje",
    sessionId: "session-1",
    content: { kind: "notebook", id: "notebook-1", name: "Leitura" },
    confirmedAnswers: [],
    pendingAnswers: [],
    conflictedAnswers: [],
  };
  hydrate.mockImplementation(async () => {
    useSessionFlowStore.setState({ ...initialSessionFlowData, ...persisted });
  });
  finish.mockImplementation(async () => {
    useSessionFlowStore.setState({ step: "finishing" });
  });
  useSessionFlowStore.setState({
    ...initialSessionFlowData,
    hydrate,
    finish,
  });
  useAuthStore.setState({
    status: "authenticated",
    token: "token",
    educatorId: "educator-1",
  });
  vi.mocked(listSessionsByStudent).mockResolvedValue([session()]);
  vi.mocked(getMe).mockResolvedValue({
    id: "educator-9",
    name: "Educadora Fictícia",
    email: "educadora@labirinto.test",
  });
});

describe("ResumeSessionPrompt", () => {
  it("AC-SES-03-01: oferece Retomar e Encerrar agora quando há sessão aberta", async () => {
    await render(<ResumeSessionPrompt />);

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Retomar" })).toBeTruthy(),
    );
    expect(hydrate).toHaveBeenCalledWith("educator-1");
    expect(screen.getByText("Sessão em andamento")).toBeTruthy();
    expect(screen.getByText(/Leitura de hoje/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Encerrar agora" })).toBeTruthy();
  });

  it("não mostra nada quando não há fluxo salvo", async () => {
    persisted = { step: "idle" };
    await render(<ResumeSessionPrompt />);

    await waitFor(() => expect(hydrate).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Sessão em andamento")).toBeNull();
  });

  it("não hidrata sem usuário autenticado", async () => {
    useAuthStore.setState({ status: "unauthenticated", educatorId: null });
    await render(<ResumeSessionPrompt />);

    expect(hydrate).not.toHaveBeenCalled();
    expect(getMe).not.toHaveBeenCalled();
    expect(screen.queryByText("Sessão em andamento")).toBeNull();
  });

  it("após reabrir o app (educatorId desconhecido) resolve o educador antes de hidratar", async () => {
    useAuthStore.setState({ educatorId: null });
    persisted.educatorId = "educator-9";
    await render(<ResumeSessionPrompt />);

    await waitFor(() => expect(hydrate).toHaveBeenCalledWith("educator-9"));
    expect(getMe).toHaveBeenCalledTimes(1);
    expect(activateEducator).toHaveBeenCalledWith("educator-9");
    expect(useAuthStore.getState().educatorId).toBe("educator-9");
  });

  it("se não conseguir descobrir o educador, não oferece retomada nem falha", async () => {
    useAuthStore.setState({ educatorId: null });
    vi.mocked(getMe).mockRejectedValue(new Error("network"));
    await render(<ResumeSessionPrompt />);

    await waitFor(() => expect(getMe).toHaveBeenCalled());
    expect(hydrate).not.toHaveBeenCalled();
    expect(screen.queryByText("Sessão em andamento")).toBeNull();
  });

  it("Retomar volta ao player, que continua na primeira tarefa sem resposta", async () => {
    await render(<ResumeSessionPrompt />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Retomar" })).toBeTruthy(),
    );

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Retomar" })),
    );

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/session/player"));
    expect(finish).not.toHaveBeenCalled();
    expect(screen.queryByText("Sessão em andamento")).toBeNull();
  });

  it.each(["finishing", "awaitingObservation"] as const)(
    "Retomar com a sessão em %s abre o encerramento",
    async (step) => {
      persisted.step = step;
      await render(<ResumeSessionPrompt />);
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Retomar" })).toBeTruthy(),
      );

      await act(async () =>
        fireEvent.press(screen.getByRole("button", { name: "Retomar" })),
      );

      await waitFor(() =>
        expect(replace).toHaveBeenCalledWith("/session/finish"),
      );
    },
  );

  it("sessão já finalizada no servidor não volta ao player: segue para o encerramento", async () => {
    vi.mocked(listSessionsByStudent).mockResolvedValue([
      session({ finishedAt: "2026-10-07T12:30:00.000Z" }),
    ]);
    await render(<ResumeSessionPrompt />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Retomar" })).toBeTruthy(),
    );

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Retomar" })),
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/session/finish"),
    );
    expect(finish).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalledWith("/session/player");
  });

  it("Encerrar agora finaliza o fluxo e abre o encerramento", async () => {
    await render(<ResumeSessionPrompt />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Encerrar agora" })).toBeTruthy(),
    );

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Encerrar agora" })),
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith("/session/finish"),
    );
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it("Encerrar agora não encerra com respostas pendentes e avisa", async () => {
    persisted.pendingAnswers = [
      {
        taskId: "task-1",
        selectedAlternativeId: "alternative-1",
        isCorrect: true,
        timeToAnswer: 10,
        answeredAt: "2026-10-07T12:05:00.000Z",
      },
    ];
    await render(<ResumeSessionPrompt />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Encerrar agora" })).toBeTruthy(),
    );

    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Encerrar agora" })),
    );

    expect(finish).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeTruthy();
    expect(screen.getByText(/respostas pendentes/i)).toBeTruthy();
  });

  it("oferece a retomada uma única vez por abertura do app", async () => {
    const view = await render(<ResumeSessionPrompt />);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Retomar" })).toBeTruthy(),
    );
    await act(async () =>
      fireEvent.press(screen.getByRole("button", { name: "Retomar" })),
    );

    await view.rerender(<ResumeSessionPrompt />);

    expect(hydrate).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Sessão em andamento")).toBeNull();
  });
});
