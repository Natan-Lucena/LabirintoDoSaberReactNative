import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { NotebookDetailScreen } from "../NotebookDetailScreen";

function createNoRetryQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

const routerBack = vi.fn();
const routerPush = vi.fn();
const listTaskNotebooks = vi.fn();
const deleteTaskNotebook = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack, push: routerPush }),
}));

vi.mock("@/api/endpoints/content", () => ({
  listTaskNotebooks: (...args: unknown[]) => listTaskNotebooks(...args),
}));

vi.mock("@/api/endpoints/task-notebook-delete", () => ({
  deleteTaskNotebook: (...args: unknown[]) => deleteTaskNotebook(...args),
}));

const notebooksData = [
  {
    notebook: {
      id: "notebook-1",
      educator: "educator-1",
      tasks: ["task-1", "task-2"],
      category: "reading" as const,
      description: "Sons e Letras",
      createdAt: "2026-01-01T12:00:00.000Z",
      taskGroupsIds: ["group-1"],
    },
    taskGroups: [
      {
        id: "group-1",
        name: "Alfabeto e sons",
        tasksIds: ["task-1", "task-2"],
        educatorId: "educator-1",
        category: "reading" as const,
      },
    ],
  },
];

describe("NotebookDetailScreen (D-04, D-05, D-06, D-08)", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerPush.mockClear();
    listTaskNotebooks.mockReset();
    deleteTaskNotebook.mockReset();
  });

  it("mostra descrição, categoria, contagem de tarefas e grupos do caderno", async () => {
    listTaskNotebooks.mockResolvedValue(notebooksData);
    await render(<NotebookDetailScreen notebookId="notebook-1" />);

    expect(await screen.findByText("Sons e Letras")).toBeTruthy();
    expect(screen.getByText("Leitura")).toBeTruthy();
    expect(screen.getByText("2 tarefas")).toBeTruthy();
    expect(screen.getByLabelText("Alfabeto e sons")).toBeTruthy();
    expect(screen.getByText("2 atividades")).toBeTruthy();
  });

  it("toca num grupo e navega para o detalhe do grupo", async () => {
    listTaskNotebooks.mockResolvedValue(notebooksData);
    await render(<NotebookDetailScreen notebookId="notebook-1" />);

    await screen.findByText("Sons e Letras");
    await fireEvent.press(screen.getByLabelText("Alfabeto e sons"));

    expect(routerPush).toHaveBeenCalledWith("/content/group/group-1");
  });

  it("sem grupos mostra estado vazio (D-04)", async () => {
    listTaskNotebooks.mockResolvedValue([
      { ...notebooksData[0], taskGroups: [] },
    ]);
    await render(<NotebookDetailScreen notebookId="notebook-1" />);

    expect(await screen.findByText("Nenhum grupo neste caderno")).toBeTruthy();
  });

  it("Editar Caderno abre Em breve (D-06)", async () => {
    listTaskNotebooks.mockResolvedValue(notebooksData);
    await render(<NotebookDetailScreen notebookId="notebook-1" />);

    await screen.findByText("Sons e Letras");
    await fireEvent.press(
      screen.getByRole("button", { name: "Editar Caderno" }),
    );

    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Editar Caderno" },
    });
  });

  it("excluir pede confirmação, chama o endpoint e volta (D-05)", async () => {
    listTaskNotebooks.mockResolvedValue(notebooksData);
    deleteTaskNotebook.mockResolvedValue(undefined);
    await render(<NotebookDetailScreen notebookId="notebook-1" />);

    await screen.findByText("Sons e Letras");
    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir Caderno" }),
    );

    expect(screen.getByText("Excluir Caderno?")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() =>
      expect(deleteTaskNotebook).toHaveBeenCalledWith("notebook-1"),
    );
    await waitFor(() => expect(routerBack).toHaveBeenCalledTimes(1));
  });

  it("cancelar a confirmação não chama o endpoint", async () => {
    listTaskNotebooks.mockResolvedValue(notebooksData);
    await render(<NotebookDetailScreen notebookId="notebook-1" />);

    await screen.findByText("Sons e Letras");
    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir Caderno" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByText("Excluir Caderno?")).toBeNull();
    expect(deleteTaskNotebook).not.toHaveBeenCalled();
  });

  it("erro ao excluir mostra mensagem sem reenvio automático", async () => {
    listTaskNotebooks.mockResolvedValue(notebooksData);
    deleteTaskNotebook.mockRejectedValue(new Error("falhou"));
    await render(<NotebookDetailScreen notebookId="notebook-1" />);

    await screen.findByText("Sons e Letras");
    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir Caderno" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));

    expect(
      await screen.findByText("Não foi possível excluir o caderno."),
    ).toBeTruthy();
    expect(deleteTaskNotebook).toHaveBeenCalledTimes(1);
    expect(routerBack).not.toHaveBeenCalled();
  });

  it("mostra carregamento", async () => {
    listTaskNotebooks.mockReturnValue(new Promise(() => undefined));
    await render(<NotebookDetailScreen notebookId="notebook-1" />);

    expect(screen.getByLabelText("Carregando caderno")).toBeTruthy();
  });

  it("mostra erro recuperável com nova tentativa", async () => {
    listTaskNotebooks.mockRejectedValue(new Error("falhou"));
    await render(<NotebookDetailScreen notebookId="notebook-1" />, {
      queryClient: createNoRetryQueryClient(),
    });

    await screen.findByRole("alert");
    listTaskNotebooks.mockResolvedValue(notebooksData);
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );

    expect(await screen.findByText("Sons e Letras")).toBeTruthy();
  });

  it("mostra 'Não encontrado' para id inexistente e volta", async () => {
    listTaskNotebooks.mockResolvedValue(notebooksData);
    await render(<NotebookDetailScreen notebookId="notebook-inexistente" />);

    expect(await screen.findByText("Não encontrado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(routerBack).toHaveBeenCalledTimes(1);
  });
});
