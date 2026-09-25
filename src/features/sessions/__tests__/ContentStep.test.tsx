import { afterEach, describe, expect, it, vi } from "vitest";

import { act } from "@testing-library/react-native";

import { render, screen, fireEvent, waitFor } from "@/test-utils/render";
import { createQueryClient } from "@/api/query-client";
import {
  listTaskGroupsByEducator,
  listTaskNotebooks,
  listTasks,
} from "@/api/endpoints/content";
import type { Task, TaskGroup, TaskNotebookWithGroups } from "@/api/types";
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

const configure = vi.fn().mockResolvedValue(undefined);
let mockSessionName: string | null = null;
let mockContent: {
  kind: "notebook" | "group" | "task";
  id: string;
  name: string;
} | null = null;
vi.mock("@/stores/session-flow", () => ({
  useSessionFlowStore: () => ({
    configure,
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

const TASK: Task = {
  id: "task-1",
  category: "vocabulary",
  type: "multipleChoice",
  prompt: "O que significa veloz?",
  alternatives: [],
  createdAt: "2026-01-01T00:00:00.000Z",
};

function renderContentStep() {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return render(<ContentStep />, { queryClient });
}

afterEach(async () => {
  await waitFor(() => {});
});

describe("normalizeForSearch", () => {
  it("ignora acentos e maiúsculas", () => {
    expect(normalizeForSearch("Início")).toBe(normalizeForSearch("inicio"));
  });
});

describe("ContentStep", () => {
  it("AC-703-01: nome vazio mostra erro acessível e desabilita avançar após tentativa", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);

    await renderContentStep();

    const nextButton = screen.getByRole("button", {
      name: "Iniciar Sessão Agora",
    });
    fireEvent(screen.getByLabelText("Nome da sessão"), "blur");

    await waitFor(() =>
      expect(
        screen.getByText("Informe um nome com até 100 caracteres."),
      ).toBeTruthy(),
    );
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("AC-703-02: trocar chip troca a fonte de dados consultada", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([GROUP]);
    vi.mocked(listTasks).mockResolvedValue([TASK]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );
    expect(listTaskGroupsByEducator).not.toHaveBeenCalled();

    fireEvent.press(screen.getByRole("button", { name: "Grupos" }));

    await waitFor(() =>
      expect(screen.getByText("Alfabeto e sons")).toBeTruthy(),
    );
    expect(listTaskGroupsByEducator).toHaveBeenCalledTimes(1);
  });

  it("AC-703-03: card mostra description/name/prompt e tags por chip", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );
    expect(screen.getByText("2 tarefas")).toBeTruthy();
    expect(screen.getByText("Leitura")).toBeTruthy();
  });

  it("AC-703-04: Iniciar Sessão Agora habilita só com nome e conteúdo, grava no store e navega", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);

    const view = await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );

    await act(async () => {
      fireEvent.press(screen.getByRole("button", { name: "Cores e formas" }));
    });
    await act(async () => {
      fireEvent.changeText(
        screen.getByLabelText("Nome da sessão"),
        "Sessão de teste",
      );
    });

    const nextButton = screen.getByRole("button", {
      name: "Iniciar Sessão Agora",
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

    expect(push).toHaveBeenCalledWith("/session/player");
    void view;
  });

  it("AC-703-04/07: Voltar não cancela o fluxo, só sai preservando o aluno", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);

    await renderContentStep();

    fireEvent.press(screen.getByRole("button", { name: "Voltar" }));

    expect(back).toHaveBeenCalledTimes(1);
  });

  it("AC-703-05: Ver Tudo abre a tela Em breve", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);

    await renderContentStep();

    fireEvent.press(screen.getByRole("link", { name: "Ver Tudo" }));

    expect(push).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Conteúdo" },
    });
  });

  it("AC-703-06: busca filtra por description ignorando acento/maiúscula e mantém texto ao trocar chip", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK, NOTEBOOK2]);
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([GROUP]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByPlaceholderText("Buscar caderno por nome..."),
      "PALAVRAS",
    );

    await waitFor(() =>
      expect(screen.queryByText("Cores e formas")).toBeNull(),
    );
    expect(screen.getByText("Palavras do dia")).toBeTruthy();

    fireEvent.press(screen.getByRole("button", { name: "Grupos" }));

    await waitFor(() =>
      expect(
        screen.getByPlaceholderText("Buscar caderno por nome...").props.value,
      ).toBe("PALAVRAS"),
    );
    expect(screen.queryByText("Alfabeto e sons")).toBeNull();
  });

  it("busca sem resultado mostra estado vazio", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([NOTEBOOK]);

    await renderContentStep();

    await waitFor(() =>
      expect(screen.getByText("Cores e formas")).toBeTruthy(),
    );

    fireEvent.changeText(
      screen.getByPlaceholderText("Buscar caderno por nome..."),
      "zzz",
    );

    await waitFor(() =>
      expect(screen.getByText("Nenhum conteúdo encontrado")).toBeTruthy(),
    );
  });

  it("mostra LoadingState enquanto busca", async () => {
    vi.mocked(listTaskNotebooks).mockReturnValue(new Promise(() => {}));

    await renderContentStep();

    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  it("mostra ErrorState com retry", async () => {
    vi.mocked(listTaskNotebooks).mockRejectedValue(new Error("network"));

    await renderContentStep();

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
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
      name: "Iniciar Sessão Agora",
    });
    expect(nextButton.props.accessibilityState).toMatchObject({
      disabled: false,
    });

    mockSessionName = null;
    mockContent = null;
  });

  // FX4: tela 05 não tinha AppHeader nem padding horizontal (conteúdo
  // encostado nas bordas). Alinha ao padrão das demais telas (t-203, t-702).
  it("FX4: usa AppHeader e padding horizontal como a Home", async () => {
    vi.mocked(listTaskNotebooks).mockResolvedValue([]);
    vi.mocked(listTaskGroupsByEducator).mockResolvedValue([]);
    vi.mocked(listTasks).mockResolvedValue([]);

    await renderContentStep();

    expect(screen.getByLabelText("Abrir menu")).toBeTruthy();
    expect(screen.getByLabelText("Abrir perfil")).toBeTruthy();

    const content = screen.getByTestId("screen-content");
    const flatStyle = [content.props.style]
      .flat(Infinity)
      .reduce((acc, style) => ({ ...acc, ...style }), {});
    expect(flatStyle.paddingHorizontal ?? flatStyle.padding).toBe(16);
  });
});
