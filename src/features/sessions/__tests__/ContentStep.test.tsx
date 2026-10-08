import { describe, expect, it, vi } from "vitest";

import { act } from "@testing-library/react-native";

import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { createQueryClient } from "@/api/query-client";
import {
  listTaskGroupsByEducator,
  listTaskNotebooks,
  listTasks,
} from "@/api/endpoints/content";
import { startSession } from "@/api/endpoints/session";
import type { TaskGroup, TaskNotebookWithGroups } from "@/api/types";
import { ContentStep, normalizeForSearch } from "../ContentStep";

const push = vi.fn();
const back = vi.fn();
vi.mock("expo-router", () => ({
  useRouter: () => ({ push, back }),
}));

vi.mock("@/api/endpoints/content", () => ({
  listTaskNotebooks: vi.fn(),
  listTaskGroupsByEducator: vi.fn(),
  listTasks: vi.fn(),
}));

vi.mock("@/api/endpoints/session", () => ({
  listSessionsByStudent: vi.fn(),
  startSession: vi.fn(),
}));

const configure = vi.fn().mockResolvedValue(undefined);
const requestStart = vi.fn().mockResolvedValue(undefined);
const confirmStart = vi.fn().mockResolvedValue(undefined);
const markStartUncertain = vi.fn().mockResolvedValue(undefined);
const failStart = vi.fn().mockResolvedValue(undefined);
const discard = vi.fn().mockResolvedValue(undefined);
const selectStudent = vi.fn().mockResolvedValue(undefined);
const mockStudent = { id: "student-1", name: "Ana Souza" };
let mockSessionName: string | null = null;
let mockContent: {
  kind: "notebook" | "group" | "task";
  id: string;
  name: string;
} | null = null;
vi.mock("@/stores/session-flow", () => ({
  useSessionFlowStore: () => ({
    configure,
    requestStart,
    confirmStart,
    markStartUncertain,
    failStart,
    discard,
    selectStudent,
    student: mockStudent,
    sessionName: mockSessionName,
    content: mockContent,
  }),
}));

const NOTEBOOK: TaskNotebookWithGroups = {
  notebook: {
    id: "notebook-1",
    educator: "e1",
    tasks: ["t1", "t2"],
    category: "reading",
    description: "Cores e formas",
    createdAt: "2026-01-01T00:00:00.000Z",
    taskGroupsIds: [],
  },
  taskGroups: [],
};

const NOTEBOOK2: TaskNotebookWithGroups = {
  notebook: {
    id: "notebook-2",
    educator: "e1",
    tasks: [],
    category: "writing",
    description: "Palavras do dia",
    createdAt: "2026-01-01T00:00:00.000Z",
    taskGroupsIds: [],
  },
  taskGroups: [],
};

const GROUP: TaskGroup = {
  id: "group-1",
  name: "Alfabeto e sons",
  tasksIds: ["t1"],
  educatorId: "e1",
  category: "reading",
};

function renderContentStep() {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return render(<ContentStep />, { queryClient });
}

describe("normalizeForSearch", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(normalizeForSearch("Início")).toBe(normalizeForSearch("inicio"));
  });
});

describe("ContentStep", () => {
  it("AC-703-01: nome vazio mostra erro acessível e desabilita início após tentativa", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);

    await renderContentStep();

    const nextButton = screen.getByRole("button", {
      name: "Iniciar sessão",
    });
    fireEvent(screen.getByLabelText("Nome da sessão"), "blur");

    await waitFor(() =>
      expect(
        screen.getByText("Informe um nome com 1 a 100 caracteres."),
      ).toBeTruthy(),
    );
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("mostra os cadernos disponíveis", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );
    expect(
      screen.getByRole("checkbox", { name: "Cores e formas" }),
    ).toBeTruthy();
  });

  it("AC-SES-01-01: inicia sessão, confirma no store e abre o player", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(startSession).mockResolvedValue({
      id: "session-1",
      studentId: "student-1",
      educatorId: "e1",
      name: "Sessão de teste",
      startedAt: "2026-10-07T10:00:00.000Z",
      answers: [],
    });

    const view = await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("checkbox", { name: "Cores e formas" }));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText("Nome da sessão"),
        "Sessão de teste",
      );
    });

    const nextButton = screen.getByRole("button", {
      name: "Iniciar sessão",
    });
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: false,
    });

    await act(async () => {
      fireEvent.press(nextButton);
    });
    await waitFor(() =>
      expect(configure).toHaveBeenCalledWith({
        name: "Sessão de teste",
        content: {
          kind: "notebook",
          id: "notebook-1",
          name: "Cores e formas",
        },
      }),
    );

    await waitFor(() => expect(requestStart).toHaveBeenCalledTimes(1));
    expect(startSession).toHaveBeenCalledWith({
      studentId: "student-1",
      name: "Sessão de teste",
    });
    expect(confirmStart).toHaveBeenCalledWith("session-1");
    expect(push).toHaveBeenCalledWith("/session/player");
    void view;
  });

  it("AC-703-04/07: Voltar não cancela o fluxo, só sai preservando o aluno", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);

    await renderContentStep();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(back).toHaveBeenCalledTimes(1);
  });

  it("AC-SES-01-03: erro de início mostra mensagem e não reenvia automaticamente", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(startSession).mockRejectedValue(new Error("Validation error"));

    await renderContentStep();
    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );
    await act(async () => {
      fireEvent.press(screen.getByRole("checkbox", { name: "Cores e formas" }));
      fireEvent.changeText(
        screen.getByLabelText("Nome da sessão"),
        "Sessão de teste",
      );
    });
    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Iniciar sessão" }));
    });

    await waitFor(() =>
      expect(screen.getByText("Validation error")).toBeTruthy(),
    );
    expect(startSession).toHaveBeenCalledTimes(1);
  });

  it("busca filtra por descrição ignorando acento e maiúscula", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK, NOTEBOOK2]);
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([GROUP]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByPlaceholderText("Buscar caderno"),
      "PALAVRAS",
    );

    await waitFor(() =>
      expect(screen.queryByText("Cores e formas")).toBeNull(),
    );
    expect(screen.getByText("Palavras do dia")).toBeTruthy();
  });

  it("busca sem resultado mostra estado vazio", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );

    fireEvent.changeText(screen.getByPlaceholderText("Buscar caderno"), "zzz");

    await waitFor(() =>
      expect(screen.getByText("Nenhum caderno encontrado.")).toBeTruthy(),
    );
  });

  it("mostra LoadingState enquanto busca", async () => {
    vi.mocked(listTaskNotebooks).mockReturnValue(new Promise(() => {}));

    await renderContentStep();

    expect(screen.getByText("Carregando cadernos")).toBeTruthy();
  });

  it("mostra ErrorState com retry", async () => {
    vi.mocked(listTaskNotebooks).mockRejectedValue(new Error("network"));

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Tentar novamente")).toBeTruthy(),
    );
    expect(screen.getByText("Tentar novamente")).toBeTruthy();
  });

  it("AC-703-07: reidrata seleção e nome já salvos no store", async () => {
    mockSessionName = "Sessão salva";
    mockContent = {
      kind: "notebook",
      id: "notebook-1",
      name: "Cores e formas",
    };
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );
    expect(screen.getByLabelText("Nome da sessão").props.value).toBe(
      "Sessão salva",
    );

    const nextButton = screen.getByRole("button", {
      name: "Iniciar sessão",
    });
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: false,
    });

    mockSessionName = null;
    mockContent = null;
  });

  it("usa cabeçalho novo com voltar", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([]);
    vi.mocked(listTasks).mockResolvedValue([]);

    await renderContentStep();

    expect(screen.getByRole("button", { name: "Voltar" })).toBeTruthy();
  });
});
