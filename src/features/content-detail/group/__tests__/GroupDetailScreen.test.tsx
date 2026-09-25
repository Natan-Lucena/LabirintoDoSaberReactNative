import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Task, TaskGroup } from "@/api/types";
import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import type { UseGroupDetailDataResult } from "@/features/content-detail/group/useGroupDetailData";

const routerPush = vi.fn();
const routerBack = vi.fn();
const deleteTaskGroup = vi.fn();

let groupDetail: UseGroupDetailDataResult;

vi.mock("@/features/content-detail/group/useGroupDetailData", () => ({
  useGroupDetailData: () => groupDetail,
}));
vi.mock("@/api/endpoints/task-group-delete", () => ({
  deleteTaskGroup: (id: string) => deleteTaskGroup(id),
}));
vi.mock("expo-router", () => ({
  useRouter: () => ({ push: routerPush, back: routerBack }),
}));
vi.mock("@/config/env", () => ({
  getRuntimeApiBaseUrl: () => "http://mock.local",
}));

const { GroupDetailScreen } =
  await import("@/features/content-detail/group/GroupDetailScreen");

const group: TaskGroup = {
  id: "group-1",
  name: "Alfabeto e sons",
  tasksIds: ["task-1", "task-2"],
  educatorId: "educator-1",
  category: "reading",
};

const tasks: Task[] = [
  {
    id: "task-1",
    category: "reading",
    type: "multipleChoice",
    prompt: "Qual palavra começa com a letra A?",
    alternatives: [
      { id: "alt-1", text: "Abelha", isCorrect: true },
      { id: "alt-2", text: "Bola", isCorrect: false },
    ],
    createdAt: "2026-01-01T12:00:00.000Z",
  },
];

function setGroupDetail(
  overrides: Partial<UseGroupDetailDataResult> = {},
): void {
  groupDetail = {
    group,
    tasks,
    isPending: false,
    isError: false,
    isNotFound: false,
    refetch: vi.fn(),
    ...overrides,
  };
}

describe("GroupDetailScreen (AC-01..AC-04, D-03, D-05, D-06, D-08)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    routerBack.mockClear();
    deleteTaskGroup.mockReset();
    setGroupDetail();
  });

  it("mostra nome, categoria e atividades do grupo", async () => {
    await render(<GroupDetailScreen groupId="group-1" />);

    expect(screen.getByText("Alfabeto e sons")).toBeTruthy();
    expect(screen.getByText("Leitura")).toBeTruthy();
    expect(screen.getByText("Qual palavra começa com a letra A?")).toBeTruthy();
    expect(screen.getByText("2 alternativas")).toBeTruthy();
  });

  it("mostra estado vazio sem atividades", async () => {
    setGroupDetail({ tasks: [] });
    await render(<GroupDetailScreen groupId="group-1" />);

    expect(screen.getByText("Sem atividades")).toBeTruthy();
  });

  it("toca numa atividade e navega para o detalhe dela", async () => {
    await render(<GroupDetailScreen groupId="group-1" />);

    await fireEvent.press(
      screen.getByText("Qual palavra começa com a letra A?"),
    );

    expect(routerPush).toHaveBeenCalledWith("/content/task/task-1");
  });

  it("mostra carregamento", async () => {
    setGroupDetail({ isPending: true, group: undefined, tasks: [] });
    await render(<GroupDetailScreen groupId="group-1" />);

    expect(screen.getByLabelText("Carregando grupo")).toBeTruthy();
  });

  it("mostra erro recuperável com nova tentativa", async () => {
    const refetch = vi.fn();
    setGroupDetail({
      isError: true,
      group: undefined,
      tasks: [],
      refetch,
    });
    await render(<GroupDetailScreen groupId="group-1" />);

    await screen.findByRole("alert");
    await fireEvent.press(
      screen.getByRole("button", { name: "Tentar novamente" }),
    );
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("mostra 'Não encontrado' para id inexistente e volta (D-08)", async () => {
    setGroupDetail({ isNotFound: true, group: undefined, tasks: [] });
    await render(<GroupDetailScreen groupId="grupo-inexistente" />);

    expect(screen.getByText("Não encontrado")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Voltar" }));
    expect(routerBack).toHaveBeenCalledTimes(1);
  });

  it("abre 'Em breve' ao tocar em Editar Grupo (D-06)", async () => {
    await render(<GroupDetailScreen groupId="group-1" />);

    await fireEvent.press(screen.getByRole("button", { name: "Editar Grupo" }));

    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Editar Grupo" },
    });
  });

  it("exclui com confirmação e volta (D-05, AC-03)", async () => {
    deleteTaskGroup.mockResolvedValue(undefined);
    await render(<GroupDetailScreen groupId="group-1" />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir Grupo" }),
    );
    expect(screen.getByText("Excluir Alfabeto e sons?")).toBeTruthy();

    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByText("Excluir Alfabeto e sons?")).toBeNull();
    expect(deleteTaskGroup).not.toHaveBeenCalled();

    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir Grupo" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() =>
      expect(deleteTaskGroup).toHaveBeenCalledWith("group-1"),
    );
    await waitFor(() => expect(routerBack).toHaveBeenCalledTimes(1));
  });

  it("mostra erro de exclusão sem reenvio automático (AC-03)", async () => {
    deleteTaskGroup.mockRejectedValue(
      new Error("Não foi possível excluir o grupo."),
    );
    await render(<GroupDetailScreen groupId="group-1" />);

    await fireEvent.press(
      screen.getByRole("button", { name: "Excluir Grupo" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Excluir" }));

    await screen.findByText("Não foi possível excluir o grupo.");
    expect(deleteTaskGroup).toHaveBeenCalledTimes(1);
    expect(routerBack).not.toHaveBeenCalled();
  });
});
