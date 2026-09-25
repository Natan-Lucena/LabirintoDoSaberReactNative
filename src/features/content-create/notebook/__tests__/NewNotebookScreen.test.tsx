import { beforeEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen, waitFor } from "@/test-utils/render";
import { NewNotebookScreen } from "../NewNotebookScreen";

const routerBack = vi.fn();
const routerPush = vi.fn();
const routerReplace = vi.fn();
const createTaskNotebook = vi.fn();

vi.mock("expo-router", () => ({
  useRouter: () => ({
    back: routerBack,
    push: routerPush,
    replace: routerReplace,
  }),
}));

vi.mock("@/api/endpoints/content", () => ({
  listTaskGroupsByEducator: () =>
    Promise.resolve([
      {
        id: "group-1",
        name: "Alfabeto e sons",
        tasksIds: ["task-1", "task-2"],
        educatorId: "educator-1",
        category: "reading",
      },
    ]),
}));

vi.mock("@/api/endpoints/task-notebook-create", () => ({
  createTaskNotebook: (...args: unknown[]) => createTaskNotebook(...args),
}));

describe("NewNotebookScreen", () => {
  beforeEach(() => {
    routerBack.mockClear();
    routerPush.mockClear();
    routerReplace.mockClear();
    createTaskNotebook.mockReset();
  });

  it("bloqueia a criação até selecionar categoria e grupo com atividades", async () => {
    await render(<NewNotebookScreen />);

    expect(
      screen.getByRole("button", { name: "Criar Caderno" }).props
        .accessibilityState.disabled,
    ).toBe(true);
    expect(screen.getByText(/selecione ao menos um grupo/i)).toBeTruthy();
  });

  it("envia a união das tarefas e navega para atividades", async () => {
    createTaskNotebook.mockResolvedValue({ id: "notebook-new" });
    await render(<NewNotebookScreen />);

    await fireEvent.changeText(
      screen.getByLabelText("Nome do Caderno *"),
      "Meu caderno",
    );
    await fireEvent.press(screen.getByRole("button", { name: "Leitura" }));
    await fireEvent.press(
      screen.getByRole("button", { name: /Alfabeto e sons/i }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Criar Caderno" }),
    );

    await waitFor(() =>
      expect(createTaskNotebook).toHaveBeenCalledWith({
        description: "Meu caderno",
        category: "reading",
        tasks: ["task-1", "task-2"],
        taskGroupsIds: ["group-1"],
      }),
    );
    expect(routerReplace).toHaveBeenCalledWith("/(tabs)/activities");
  });
});
