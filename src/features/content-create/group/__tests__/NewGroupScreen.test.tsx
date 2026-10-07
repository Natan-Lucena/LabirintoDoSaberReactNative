import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { NewGroupScreen } from "../NewGroupScreen";

const routerBack = vi.fn();
const createTaskGroup = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({ back: routerBack }),
}));

vi.mock("@/api/endpoints/task-group-create", () => ({
  createTaskGroup: (...args: unknown[]) => createTaskGroup(...args),
}));
vi.mock("@/api/endpoints/task-group-update", () => ({
  updateTaskGroup: vi.fn(),
}));

vi.mock("@/api/endpoints/content", () => ({
  listTaskGroupsByEducator: () => Promise.resolve([]),
  listTasks: () =>
    Promise.resolve([
      {
        id: "task-1",
        category: "reading",
        type: "multipleChoice",
        prompt: "Qual palavra começa com A?",
        alternatives: [],
        createdAt: "2026-01-01T12:00:00.000Z",
      },
    ]),
}));

describe("NewGroupScreen", () => {
  beforeEach(() => {
    routerBack.mockClear();
    createTaskGroup.mockReset();
  });

  it("bloqueia a criação até informar nome e categoria", async () => {
    await render(<NewGroupScreen />);

    expect(
      screen.getByRole("button", { name: "Criar Grupo" }).props
        .accessibilityState.disabled,
    ).toBe(true);
  });

  it("envia nome e categoria e volta após criar o grupo", async () => {
    createTaskGroup.mockResolvedValue({ id: "group-new" });
    await render(<NewGroupScreen />);

    await fireEvent.changeText(
      screen.getByLabelText("Nome do Grupo *"),
      "Leitura inicial",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Categoria *" }));
    await fireEvent.press(
      await screen.findByRole("button", { name: "Leitura" }),
    );
    await fireEvent.press(
      await screen.findByRole("checkbox", {
        name: "Qual palavra começa com A?",
      }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Criar Grupo" }));

    await waitFor(() =>
      expect(createTaskGroup).toHaveBeenCalledWith({
        name: "Leitura inicial",
        category: "reading",
        tasksIds: ["task-1"],
      }),
    );
    expect(routerBack).toHaveBeenCalledOnce();
  });

  it("cancela sem salvar", async () => {
    await render(<NewGroupScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Cancelar" }));

    expect(routerBack).toHaveBeenCalledOnce();
    expect(createTaskGroup).not.toHaveBeenCalled();
  });
});
